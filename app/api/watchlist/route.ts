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
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await request.json();
  if (!symbol || typeof symbol !== 'string') {
    return NextResponse.json({ error: 'Symbol fehlt.' }, { status: 400 });
  }

  await ensureProfile(user.id, user.email ?? null);
  const supabase = createAdminClient();
  const { error } = await supabase.from('watchlists').upsert(
    {
      user_id: user.id,
      symbol: symbol.toUpperCase(),
    },
    { onConflict: 'user_id,symbol' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ items: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await request.json();
  if (!symbol || typeof symbol !== 'string') {
    return NextResponse.json({ error: 'Symbol fehlt.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', user.id)
    .eq('symbol', symbol.toUpperCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ items: data ?? [] });
}
