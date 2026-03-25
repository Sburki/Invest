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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.symbol || !body.alert_type) {
    return NextResponse.json({ error: 'symbol und alert_type sind erforderlich.' }, { status: 400 });
  }

  await ensureProfile(user.id, user.email ?? null);
  const supabase = createAdminClient();
  const { error } = await supabase.from('alerts').insert({
    user_id: user.id,
    symbol: String(body.symbol).toUpperCase(),
    alert_type: String(body.alert_type),
    threshold: typeof body.threshold === 'number' ? body.threshold : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ items: data ?? [] });
}
