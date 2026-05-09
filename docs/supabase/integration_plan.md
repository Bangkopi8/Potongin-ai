# Supabase Integration Plan

Supabase infrastructure is prepared on the backend behind a `USE_SUPABASE` gate, but mock mode remains the default. No mobile Supabase integration, real auth flow, real persistence, storage upload, or production Supabase endpoint behavior is active yet.

## Current status

- Schema draft prepared in [schema.sql](./schema.sql)
- RLS draft prepared in [rls_policies.sql](./rls_policies.sql)
- Storage bucket plan prepared in [storage_policy.md](./storage_policy.md)
- Backend Supabase SDK is installed in the backend only
- Backend Supabase client wrapper exists and is gated behind `USE_SUPABASE`
- Backend auth boundary exists and currently uses a mock current user in local mode
- Backend repository layer prepared for `profiles`, `ai_generations`, `explore_collections`, `barbershops`, and `transactions`
- `USE_SUPABASE=false` keeps mock repositories as the default implementation
- Read-only Supabase repository methods are prepared for `profiles.getProfileById` and `explore_collections.listActiveExploreCollections`
- Real Supabase execution is not required in local mock mode
- `GET /api/explore/feed` now reads through the repository layer while preserving the same response contract
- `GET /api/business/profile` now reads through the repository layer while preserving the same response contract
- Mobile has no Supabase SDK or integration
- Mobile app still uses mocked local state and mocked backend endpoints
- Backend still uses mocked contract endpoints only
- The photo upload boundary is now prepared for a backend-only storage gate via `PHOTO_STORAGE_MODE`
- `PHOTO_STORAGE_MODE=mock` keeps the current local/mock confirm-photo flow active by default
- `PHOTO_STORAGE_MODE=supabase` is reserved for backend-only temp upload to `original-temp`
- Confirm-upload remains backward-compatible and does not require real AI, auth, payment, or persistence

## Migration order

1. Create managed Supabase migrations from the draft SQL.
2. Enable the base tables and indexes from `schema.sql`.
3. Create storage buckets and lifecycle conventions from `storage_policy.md`.
4. Apply and review the draft RLS policies from `rls_policies.sql`.
5. Add profile creation flow tied to Supabase Auth user creation.
6. Connect backend service-role access for trusted write paths.
7. Replace Supabase repository stubs with real database writes and reads.
8. Replace local-only mobile credit/history state with backend-backed state.

## Auth to profile mapping

Recommended mapping:

- `auth.users.id` should equal `profiles.id`
- The application should treat `profiles` as the app-facing extension of the Auth identity

Recommended creation flow later:

- A new Auth user signs up
- A trusted trigger or backend service creates a matching `profiles` row with the same UUID
- Default values such as `role = 'regular'` and `credits = 2` are applied at profile creation

Why this mapping:

- It keeps RLS policies simple because `auth.uid()` can be compared directly to `profiles.id`
- It avoids maintaining a second identity link field when the user and profile are conceptually the same actor

## Backend service layer adoption order

Recommended order for real backend integration later:

1. `profiles`
   - create/get/update current profile
   - sync default credits

2. `ai_generations`
   - create generation rows
   - update status transitions
   - store temp and saved image URLs
   - support saved history queries

3. `explore_collections`
   - replace mocked feed with DB-driven Explore content

4. `barbershops` and `barbershop_claims`
   - connect claim submission
   - support verified owner reads and updates

5. `transactions`
   - connect future credit top-ups and reconciliation

This order keeps the highest-value user flow first while leaving payments and business moderation until later.

## Repository layer status

Current backend preparation:

- route handlers read and write through repository abstractions
- user-context routes now flow through a current-user middleware boundary
- user-context routes now consume `req.currentUser` supplied by that boundary
- `GET /api/explore/feed` now resolves data through `repositories.exploreCollections.listActiveExploreCollections()`
- `GET /api/business/profile` now resolves data through `repositories.barbershops.getBusinessProfile()`
- mock repositories are still the default data source
- Supabase repositories now support read-only methods for `profiles` and `explore_collections`
- the Explore feed read path is ready to switch to Supabase only when `USE_SUPABASE=true`
- the Business Profile read path stays auth-free for now and continues using mock current-user behavior until real ownership/auth is implemented
- real Supabase JWT verification is still a TODO stub behind the auth boundary
- in local mode, the mock current user remains the default identity source for user-context routes
- Supabase write paths are still stubs that preserve mock behavior while validating the gated setup

Future implementation task:

- add real Supabase write queries and mutations for profile credits, AI generation lifecycle, claims, and transactions
- keep route contracts unchanged while switching persistence behind the repository layer

## Environment variables needed later

Backend:

- `USE_SUPABASE`
- `PHOTO_STORAGE_MODE`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- optional later storage settings such as:
  - `SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET`
  - `SUPABASE_STORAGE_GENERATED_TEMP_BUCKET`
  - `SUPABASE_STORAGE_GENERATED_SAVED_BUCKET`

Mobile:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Notes:

- `USE_SUPABASE` should stay `false` during mock-only local development.
- `PHOTO_STORAGE_MODE` should stay `mock` during mock-only local development.
- Backend trusted writes should use the service role key, not the anon key.
- Mobile should never receive the service role key.

## What remains mocked for now

- Backend endpoint persistence and reads
- Mobile credit state
- Mobile saved history state
- AI analysis and generate endpoints
- Explore feed content
- Barbershop claim persistence
- Transactions and top-ups
- Auth sessions and user identity
- Storage uploads and cleanup

## Risks and TODOs before real connection

- RLS still needs real policy review with admin and service-role flows.
- Auth onboarding needs a decision between DB trigger vs backend-driven profile creation.
- Storage cleanup requires a trusted scheduled job for temp buckets.
- Credit deduction must remain atomic with successful generation completion.
- AI provider callback or job orchestration may require server-side state transitions that bypass end-user RLS.
- Saved image lifecycle needs a clear rule for delete, archive, and URL invalidation.
- Explore curation and sponsored content likely need admin tooling later.
- Business verification and claim review need an explicit admin moderation flow later.
- Route behavior in mock mode must remain unchanged while read-only Supabase adoption expands.
- Real Supabase write repository methods are still pending.

## Practical next step

Next practical step: continue repository-backed route adoption and then implement real Supabase repository methods gradually, starting with read-only paths, while preserving mock-mode behavior.
