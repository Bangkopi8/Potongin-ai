-- Supabase Persistence Foundation (Batch E1)
-- Demo-only schema for:
-- 1. language preference
-- 2. saved look history
--
-- Mobile env values expected by this batch:
-- EXPO_PUBLIC_USE_SUPABASE=true
-- EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
-- EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
--
-- This is intentionally simple and uses anon-friendly demo policies.
-- Do not reuse these open policies for a production auth setup.

create extension if not exists pgcrypto;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  demo_user_key text not null unique,
  language text not null check (language in ('id', 'en')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  demo_user_key text not null,
  style_name text not null,
  hair_color text,
  preview_image text,
  original_image text,
  barber_card jsonb,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_saved_looks_demo_user_key
  on public.saved_looks (demo_user_key);

create index if not exists idx_saved_looks_created_at
  on public.saved_looks (created_at desc);

alter table public.user_preferences enable row level security;
alter table public.saved_looks enable row level security;

drop policy if exists "demo_user_preferences_select" on public.user_preferences;
create policy "demo_user_preferences_select"
  on public.user_preferences
  for select
  to anon
  using (true);

drop policy if exists "demo_user_preferences_insert" on public.user_preferences;
create policy "demo_user_preferences_insert"
  on public.user_preferences
  for insert
  to anon
  with check (true);

drop policy if exists "demo_user_preferences_update" on public.user_preferences;
create policy "demo_user_preferences_update"
  on public.user_preferences
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "demo_saved_looks_select" on public.saved_looks;
create policy "demo_saved_looks_select"
  on public.saved_looks
  for select
  to anon
  using (true);

drop policy if exists "demo_saved_looks_insert" on public.saved_looks;
create policy "demo_saved_looks_insert"
  on public.saved_looks
  for insert
  to anon
  with check (true);

drop policy if exists "demo_saved_looks_delete" on public.saved_looks;
create policy "demo_saved_looks_delete"
  on public.saved_looks
  for delete
  to anon
  using (true);
