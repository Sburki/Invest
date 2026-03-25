create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  notify_email text,
  email_alerts_enabled boolean not null default false,
  risk_profile text not null default 'balanced',
  investment_horizon text not null default 'long',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique(user_id, symbol)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  alert_type text not null,
  threshold numeric,
  is_active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alerts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  alert_type text not null,
  threshold numeric,
  actual_value numeric,
  message text not null,
  delivered_at timestamptz,
  delivery_provider text,
  delivery_message_id text,
  triggered_at timestamptz not null default now()
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  sector text not null,
  price numeric,
  day_change numeric,
  quality_score int not null default 0,
  momentum_score int not null default 0,
  valuation_score int not null default 0,
  stability_score int not null default 0,
  growth_score int not null default 0,
  total_score int not null default 0,
  risk_level text not null default 'medium',
  thesis text not null,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table watchlists enable row level security;
alter table alerts enable row level security;
alter table alert_events enable row level security;
alter table opportunities enable row level security;

create policy "profiles_select_own" on profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
for update using (auth.uid() = id);

create policy "watchlists_select_own" on watchlists
for select using (auth.uid() = user_id);

create policy "watchlists_insert_own" on watchlists
for insert with check (auth.uid() = user_id);

create policy "watchlists_delete_own" on watchlists
for delete using (auth.uid() = user_id);

create policy "alerts_select_own" on alerts
for select using (auth.uid() = user_id);

create policy "alerts_insert_own" on alerts
for insert with check (auth.uid() = user_id);

create policy "alerts_delete_own" on alerts
for delete using (auth.uid() = user_id);

create policy "alert_events_select_own" on alert_events
for select using (auth.uid() = user_id);

create policy "opportunities_read_authenticated" on opportunities
for select using (auth.role() = 'authenticated');
