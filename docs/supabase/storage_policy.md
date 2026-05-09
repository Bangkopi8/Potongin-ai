# Supabase Storage Bucket Plan

This document defines the planned bucket structure for Potongin AI before any storage integration is added to mobile or backend code.

Current implementation status:

- storage is still gated and backend-only
- `PHOTO_STORAGE_MODE=mock` remains the default
- `PHOTO_STORAGE_MODE=supabase` is the future-safe switch for the original photo temp bucket only
- mobile still talks only to the backend upload boundary and never receives Supabase service credentials

## Buckets

`original-temp`
- Purpose: short-lived uploads of the user's original reference photo before analysis or generation completes.
- Lifetime: temporary only.
- Recommended access: private bucket.
- Access method later: signed upload URL plus signed read URL for tightly scoped backend or session-driven access.

`generated-temp`
- Purpose: short-lived generated previews returned after a successful AI generation but before the user explicitly saves one.
- Lifetime: temporary only.
- Recommended access: private bucket.
- Access method later: signed read URLs for previews, with short expiry windows.

`generated-saved`
- Purpose: persistent generated images that the user intentionally saves into their history.
- Lifetime: persistent until the user deletes the saved result or an admin cleanup rule explicitly removes it.
- Recommended access: private by default.
- Access method later: signed read URLs for the owner. Public sharing can be added later with an explicit share model instead of making the bucket public by default.

## Lifecycle expectations

### Temporary original photos

- Original user photos should not remain indefinitely.
- Objects in `original-temp` should auto-expire after a short window, for example 1 to 24 hours depending on processing needs.
- The database field `ai_generations.original_image_temp_url` should point only to temporary assets.

### Temporary generated previews

- Preview images in `generated-temp` should auto-expire after a short window if the user does not save them.
- The database field `ai_generations.generated_image_temp_url` should reference these short-lived assets.
- When a user saves a generation, the chosen output should be copied or moved into `generated-saved`, and `ai_generations.generated_image_saved_url` should be filled.

### Saved generated images

- Images in `generated-saved` should remain available until the user deletes them or a later retention policy says otherwise.
- `ai_generations.is_saved = true` should align with a durable asset in `generated-saved`.
- A future delete action should clear or soft-delete the DB record and remove or archive the saved object.

## Access recommendations

- `original-temp`: private
- `generated-temp`: private
- `generated-saved`: private by default

Reasoning:
- Original photos are sensitive user content and should never be public by default.
- Temp previews should stay private because they represent unfinished or not-yet-kept outputs.
- Saved generations are still user-owned media and should default to private unless the product later adds explicit sharing.

## Suggested object path structure

Use deterministic, owner-scoped paths later, for example:

- `original-temp/{user_id}/{generation_id}/original.jpg`
- `generated-temp/{user_id}/{generation_id}/preview-001.jpg`
- `generated-saved/{user_id}/{generation_id}/saved-001.jpg`

This keeps cleanup and ownership checks straightforward.

## Future cleanup job requirement

Temporary buckets will require a cleanup mechanism later. The schema and storage plan assume a future scheduled job that:

- deletes expired objects from `original-temp`
- deletes expired objects from `generated-temp`
- clears or marks stale DB rows when temporary assets are gone

This cleanup job is not implemented yet. It can later be done with:

- a Supabase scheduled function
- a backend cron job
- or another trusted worker process

## Not implemented yet

- No storage buckets are created yet
- No signed URL generation is wired yet
- No cleanup job exists yet
- No direct upload flow exists yet
- No user-facing sharing model exists yet
