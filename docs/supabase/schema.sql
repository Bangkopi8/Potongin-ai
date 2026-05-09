-- Potongin AI
-- Supabase schema preparation only.
-- This file is documentation-first and is not wired into the app or backend yet.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  display_name text,
  role text not null default 'regular' check (role in ('regular', 'business', 'admin')),
  credits integer not null default 2 check (credits >= 0),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile records prepared for future Supabase Auth and role-based access.';

comment on column public.profiles.credits is
  'Local MVP starts each user with 2 credits. Real credit syncing will be added later.';

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  original_image_temp_url text,
  generated_image_temp_url text,
  generated_image_saved_url text,
  hairstyle_name text,
  instruction_card jsonb,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  is_saved boolean not null default false,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Temporary image URLs are meant for short-lived staging only.
-- `original_image_temp_url` and `generated_image_temp_url` should later point to expiring assets
-- so abandoned uploads and previews can be cleaned up safely.
comment on table public.ai_generations is
  'Stores generated hairstyle sessions, preview lifecycle metadata, and future barber instruction payloads.';

comment on column public.ai_generations.original_image_temp_url is
  'Temporary source image URL. Intended for short-lived storage and future cleanup jobs.';

comment on column public.ai_generations.generated_image_temp_url is
  'Temporary generated preview URL shown before the user explicitly saves a result.';

-- The saved image URL stays empty until the user intentionally keeps a generated result.
comment on column public.ai_generations.generated_image_saved_url is
  'Longer-lived saved image URL populated only when the user chooses to keep a generated look.';

comment on column public.ai_generations.instruction_card is
  'Future structured barber instruction payload, for example cut notes, style hints, and consultation references.';

comment on column public.ai_generations.status is
  'pending=queued or in progress, success=ready for display, failed=unsuccessful run.';

comment on column public.ai_generations.is_saved is
  'True only after a generated look has been explicitly saved by the user.';

comment on column public.ai_generations.expires_at is
  'Future expiration time for temporary generation assets.';

comment on column public.ai_generations.deleted_at is
  'Soft-delete marker for saved generations that should no longer appear in history.';

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  amount numeric not null check (amount >= 0),
  credits_added integer not null check (credits_added >= 0),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  payment_gateway_ref text,
  created_at timestamptz not null default now()
);

comment on table public.transactions is
  'Future payment and credit top-up records. Not wired to any gateway yet.';

-- Product rule: credit deduction for AI generation should happen only after a successful generation.
-- Purchase top-ups belong in this table, while generation usage can later be logged in service logic or a dedicated ledger.
comment on column public.transactions.status is
  'pending=awaiting confirmation, success=credits can be applied, failed=no credits applied.';

create table if not exists public.explore_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  source_type text not null check (source_type in ('curated', 'barbershop', 'sponsored')),
  cta_type text not null check (cta_type in ('try_this_look', 'view_barber', 'claim_promo')),
  face_shape_match text,
  image_url text not null,
  style_prompt_ref text,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.explore_collections is
  'Curated and partner-fed discovery content used to power Explore cards and future promotions.';

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id),
  name text not null,
  location text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

comment on table public.barbershops is
  'Business records for barbershop discovery, verification, and future owner-managed listings.';

comment on column public.barbershops.owner_id is
  'Assigned only after a barbershop claim has been reviewed and approved.';

create table if not exists public.barbershop_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  barbershop_id uuid not null references public.barbershops (id),
  contact_name text not null,
  phone_number text not null,
  proof_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Approval workflow note:
-- when a claim is approved in the future admin flow, the related `barbershops.owner_id`
-- should be assigned to the approved claimant profile.
comment on table public.barbershop_claims is
  'Ownership claim requests submitted by business users for later review and owner assignment.';

comment on column public.barbershop_claims.reviewed_at is
  'Timestamp for future admin review decisions.';

create index if not exists idx_ai_generations_user_id
  on public.ai_generations (user_id);

create index if not exists idx_transactions_user_id
  on public.transactions (user_id);

create index if not exists idx_barbershops_owner_id
  on public.barbershops (owner_id);

create index if not exists idx_barbershop_claims_user_id
  on public.barbershop_claims (user_id);

create index if not exists idx_barbershop_claims_barbershop_id
  on public.barbershop_claims (barbershop_id);

create index if not exists idx_explore_collections_active_category
  on public.explore_collections (is_active, category);

commit;
