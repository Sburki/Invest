import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard-client';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profile';

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  await ensureProfile(user.id, user.email ?? null);

  const supabase = createAdminClient();

  const [{ data: opportunities }, { data: watchlist }, { data: alerts }, { data: events }, { data: profile }] = await Promise.all([
    supabase.from('opportunities').select('*').order('total_score', { ascending: false }),
    supabase.from('watchlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('alert_events').select('*').eq('user_id', user.id).order('triggered_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('email, notify_email, email_alerts_enabled').eq('id', user.id).single(),
  ]);

  const latestUpdatedAt = opportunities?.[0]?.updated_at
    ? new Date(opportunities[0].updated_at).toLocaleString('de-CH')
    : 'noch kein Refresh gelaufen';

  return (
    <DashboardClient
      email={user.email ?? ''}
      initialOpportunities={opportunities ?? []}
      initialWatchlist={watchlist ?? []}
      initialAlerts={alerts ?? []}
      initialAlertEvents={events ?? []}
      notificationSettings={profile ?? { email: user.email ?? '', notify_email: user.email ?? '', email_alerts_enabled: false }}
      lastUpdatedLabel={latestUpdatedAt}
    />
  );
}
