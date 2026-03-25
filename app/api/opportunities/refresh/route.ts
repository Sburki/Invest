import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMarketUniverse } from '@/lib/market-data';
import { scoreAsset } from '@/lib/scoring';
import { evaluateAlerts } from '@/lib/alerts';
import { sendAlertEmail } from '@/lib/notifications';
import type { AlertItem, Opportunity } from '@/lib/types';

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const bearer = request.headers.get('authorization');
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : request.headers.get('x-cron-secret');
  return token === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const universe = await getMarketUniverse();
  const scored: Opportunity[] = universe.map((asset) => ({
    id: crypto.randomUUID(),
    ...scoreAsset(asset),
    updated_at: new Date().toISOString(),
  }));

  const { error: opportunitiesError } = await supabase.from('opportunities').upsert(scored, { onConflict: 'symbol' });
  if (opportunitiesError) {
    return NextResponse.json({ error: opportunitiesError.message }, { status: 500 });
  }

  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_active', true);

  if (alertsError) {
    return NextResponse.json({ error: alertsError.message }, { status: 500 });
  }

  const triggeredEvents = evaluateAlerts((alerts ?? []) as AlertItem[], scored);
  let deliveryCount = 0;

  if (triggeredEvents.length > 0) {
    const { data: insertedEvents, error: eventInsertError } = await supabase
      .from('alert_events')
      .insert(triggeredEvents)
      .select('*');

    if (eventInsertError) {
      return NextResponse.json({ error: eventInsertError.message }, { status: 500 });
    }

    const alertIds = [...new Set(triggeredEvents.map((item) => item.alert_id))];
    const { error: alertUpdateError } = await supabase
      .from('alerts')
      .update({ last_triggered_at: new Date().toISOString() })
      .in('id', alertIds);

    if (alertUpdateError) {
      return NextResponse.json({ error: alertUpdateError.message }, { status: 500 });
    }

    const userIds = [...new Set(triggeredEvents.map((item) => item.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, notify_email, email_alerts_enabled')
      .in('id', userIds);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const byUser = new Map<string, typeof insertedEvents>();
    for (const event of insertedEvents ?? []) {
      const current = byUser.get(event.user_id) ?? [];
      current.push(event);
      byUser.set(event.user_id, current);
    }

    for (const profile of profiles ?? []) {
      if (!profile.email_alerts_enabled) continue;
      const targetEmail = profile.notify_email || profile.email;
      if (!targetEmail) continue;
      const userEvents = byUser.get(profile.id) ?? [];
      if (userEvents.length === 0) continue;

      const delivery = await sendAlertEmail({
        to: targetEmail,
        subject: `Investment Alerts: ${userEvents.length} neue Trigger`,
        events: userEvents,
      });

      if (delivery.ok) {
        deliveryCount += userEvents.length;
        const eventIds = userEvents.map((event) => event.id);
        await supabase
          .from('alert_events')
          .update({
            delivered_at: new Date().toISOString(),
            delivery_provider: delivery.provider,
            delivery_message_id: delivery.providerMessageId ?? null,
          })
          .in('id', eventIds);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    count: scored.length,
    provider: process.env.MARKET_DATA_PROVIDER ?? 'mock',
    triggeredAlerts: triggeredEvents.length,
    deliveredAlerts: deliveryCount,
  });
}
