# Supabase Preparation

This folder prepares the database and future access model for Potongin AI without connecting the app or backend to Supabase yet.

Prepared artifacts:

- schema draft: [schema.sql](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\supabase\schema.sql)
- RLS draft: [rls_policies.sql](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\supabase\rls_policies.sql)
- storage plan: [storage_policy.md](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\supabase\storage_policy.md)
- integration plan: [integration_plan.md](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\supabase\integration_plan.md)

Current status:

- Schema prepared
- RLS draft prepared
- Storage plan prepared
- Integration plan prepared
- No mobile or backend code is connected to Supabase yet

## Table purpose

`profiles`
- Stores app-level user data that can later pair with Supabase Auth users.
- Holds display information, role, and credit balance.

`ai_generations`
- Stores each hairstyle generation attempt and its lifecycle.
- Separates temporary image URLs from a saved image URL so preview assets and intentionally saved assets can be handled differently later.
- Keeps future instruction-card JSON alongside generation status and save state.

`transactions`
- Prepares for future credit top-ups and payment tracking.
- Keeps amount, credits added, and gateway references without wiring any payment provider yet.

`explore_collections`
- Stores curated, partner, or sponsored Explore cards.
- Supports CTA routing such as trying a look, viewing a barber, or future promo claims.

`barbershops`
- Stores business listing records that can later belong to verified owners.
- Keeps a simple verification status for business onboarding flow preparation.

`barbershop_claims`
- Stores claim submissions from business users who want to manage a barbershop listing.
- Prepares the later review step that assigns `barbershops.owner_id` when a claim is approved.

## PRD mapping

This schema matches the current mocked MVP direction in these ways:

- Free user credits are represented on `profiles.credits`, matching the current mocked credit behavior.
- AI sessions and saved results are represented on `ai_generations`, which maps to the mocked Try AI flow and local history concept.
- Future top-ups are represented on `transactions`, even though payment is intentionally not connected yet.
- Explore feed content is represented on `explore_collections`, matching the current mocked Explore cards.
- Business discovery and ownership flows are represented on `barbershops` and `barbershop_claims`, matching the mocked barbershop and claim endpoints.

## Important design notes

- Temporary image lifecycle:
  `original_image_temp_url` and `generated_image_temp_url` are for short-lived assets only. The schema leaves room for later cleanup jobs and expiry handling through `expires_at`.

- Saved generation logic:
  `generated_image_saved_url` stays nullable until the user explicitly saves a generation. `is_saved` is the fast flag for saved-state checks.

- Credit rule:
  Product logic should deduct a credit only after a successful generation. The current mobile mock already follows this rule, and the future backend/Supabase integration should preserve it.

- Claim approval rule:
  Approving a `barbershop_claims` record should later assign the related `barbershops.owner_id` to the approved profile.

## Intentionally not implemented yet

- No Supabase SDK or client usage in mobile or backend code
- No Supabase Auth integration
- No applied row-level security policies in a real project
- No created storage buckets or signed URL logic in code
- No payment gateway integration
- No AI provider integration
- No triggers, cron cleanup jobs, or admin moderation tools
- No migration runner or automated database deployment

## Next future step

Turn these drafts into reviewed migrations and a backend service layer later, then connect Supabase Auth, storage access, and the mocked mobile/backend flows to real persisted data.
