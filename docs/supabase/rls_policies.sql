-- Potongin AI
-- Draft Row Level Security policies for future Supabase integration.
-- This file is planning-only and should be reviewed before production use.
--
-- Core assumption:
--   profiles.id will match auth.users.id
--   so auth.uid() can be used directly against profile-linked records.
--
-- TODO:
--   Admin handling is intentionally deferred. Future policies or helper functions
--   should account for profiles.role = 'admin' without weakening baseline user safety.

begin;

alter table public.profiles enable row level security;
alter table public.ai_generations enable row level security;
alter table public.transactions enable row level security;
alter table public.barbershops enable row level security;
alter table public.barbershop_claims enable row level security;
alter table public.explore_collections enable row level security;

-- profiles
-- Users can read and update only their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Optional future signup flow:
-- A service role, trigger, or controlled backend path should create profile rows.
-- End users are not granted direct insert/delete access here yet.

-- ai_generations
-- Users can create and read their own AI generation records.
drop policy if exists "ai_generations_select_own" on public.ai_generations;
create policy "ai_generations_select_own"
  on public.ai_generations
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "ai_generations_insert_own" on public.ai_generations;
create policy "ai_generations_insert_own"
  on public.ai_generations
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Optional owner update policy for future save/delete metadata.
-- Service role will still be needed for provider callbacks, status transitions,
-- and any writes that should bypass end-user restrictions.
drop policy if exists "ai_generations_update_own" on public.ai_generations;
create policy "ai_generations_update_own"
  on public.ai_generations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- transactions
-- Users can read only their own transaction history.
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

-- No direct insert/update/delete for users.
-- Payment confirmation and credit issuance should be handled by trusted backend/service-role flows.

-- barbershops
-- Verified business owners can read and update only their own verified listing.
drop policy if exists "barbershops_select_verified_owner" on public.barbershops;
create policy "barbershops_select_verified_owner"
  on public.barbershops
  for select
  to authenticated
  using (owner_id = auth.uid() and status = 'verified');

drop policy if exists "barbershops_update_verified_owner" on public.barbershops;
create policy "barbershops_update_verified_owner"
  on public.barbershops
  for update
  to authenticated
  using (owner_id = auth.uid() and status = 'verified')
  with check (owner_id = auth.uid() and status = 'verified');

-- TODO:
-- If public barbershop profile pages are later required, add a separate public read policy
-- with careful field review instead of widening owner-only access.

-- barbershop_claims
-- Users can create and read claim records for themselves.
drop policy if exists "barbershop_claims_select_own" on public.barbershop_claims;
create policy "barbershop_claims_select_own"
  on public.barbershop_claims
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "barbershop_claims_insert_own" on public.barbershop_claims;
create policy "barbershop_claims_insert_own"
  on public.barbershop_claims
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- No end-user update/delete access by default.
-- Review status changes and owner assignment should happen through trusted admin/backend paths later.

-- explore_collections
-- Publicly readable when active, because Explore is a discovery surface.
drop policy if exists "explore_collections_public_read_active" on public.explore_collections;
create policy "explore_collections_public_read_active"
  on public.explore_collections
  for select
  to anon, authenticated
  using (is_active = true);

-- No direct client-side writes for explore content.
-- Curation, sponsorship, and moderation should remain in trusted backend/admin flows later.

commit;
