import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profile';

async function getAuthedUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureProfile(user.id, user.email ?? null);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('email, notify_email, email_alerts_enabled')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const notifyEmail = typeof body.notify_email === 'string' ? body.notify_email.trim() : user.email ?? null;
  const emailAlertsEnabled = Boolean(body.email_alerts_enabled);

  await ensureProfile(user.id, user.email ?? null);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      notify_email: notifyEmail,
      email_alerts_enabled: emailAlertsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from('profiles')
    .select('email, notify_email, email_alerts_enabled')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ item: data });
}
