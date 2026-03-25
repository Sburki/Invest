import { createAdminClient } from '@/lib/supabase/admin';

export async function ensureProfile(userId: string, email: string | null) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email,
      notify_email: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(error.message);
  }
}
