# Public Beta Discovery Layer v1 QA Checklist

Use this checklist to verify Batch 1 on top of the frozen Mock MVP baseline.

## Frozen Beta Backend State

- Batch 1 Discovery Layer passed
- Batch 2 Photo Upload / Storage Boundary passed
- Batch 3A Backend Profile Read passed
- Batch 3B Backend In-Memory History passed
- Batch 3C sync polish is intentionally skipped
- Batch 4A Product Data Foundation passed
- Profile is backend-readable
- Credits still deduct locally and on-device only
- History uses backend in-memory store with local fallback
- Backend history resets on backend restart by design
- Supabase writes are inactive
- No real auth
- No payment
- No real AI
- No permanent backend persistence
- Local and mobile fallback must remain intact

## Batch 4A Data Foundation Notes

- haircut styles now use a richer local metadata model for future Explore, recommendation, and AI try-on work
- hair colors now use a richer local metadata model with structured undertone, maintenance, and boldness fields
- Custom Hair Lab defaults and parameter schema exist locally only
- image URLs remain placeholders for now
- no backend behavior changed for this batch

## Setup

### Backend

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm run dev
```

### Mobile

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
cmd /c npm start
```

### Mobile env example

Use a reachable LAN IP on a real device:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.18.6:4000
```

## Discovery QA Steps

### Home

1. Open the app and land on `Home`.
2. Confirm free credits are still visible.
3. Confirm these major sections render:
   - Continue Your Look
   - Trending in Indonesia
   - Trending Globally
   - Popular Men’s Haircuts
   - Popular Women’s Haircuts
   - Hair Color Ideas
   - Low Maintenance Looks
   - Professional Looks
   - Bold Transformations
   - Korean/Japanese Inspired
   - Barber Tips
4. Confirm the `Custom Your Own Hair` beta placeholder entry is visible.

Expected result:

- Home feels like a discovery-first product surface
- cards open detail or Try AI where appropriate

### Explore

1. Open `Explore`.
2. Confirm all filters/tabs render:
   - Men
   - Women
   - Unisex
   - Colors
   - Trending
   - Low Maintenance
   - Professional
   - Bold
3. Switch across several tabs.

Expected result:

- Explore updates without breaking
- style and color cards show:
  - name
  - category
  - maintenance badge
  - risk badge
  - region trend badge
  - short description
  - View Detail
  - Try This Look or Try This Color

### Detail view

1. Open a haircut detail.
2. Confirm it shows:
   - placeholder visual block
   - description
   - tags and metadata
   - face shape fit
   - hair type fit
   - barber instruction
3. Open a hair color detail.
4. Confirm it shows:
   - color swatch block
   - tone
   - maintenance
   - skin tone fit placeholder tags
   - description
5. Open a barber tip detail.

Expected result:

- detail view opens and closes cleanly
- Try This Look or Try With This Color routes into Try AI

### Try AI with discovery inspiration

1. From Home or Explore, tap `Try This Look` or `Try This Color`.
2. Confirm Try AI receives the selected inspiration.
3. Select or capture a photo.
4. Confirm the photo.
5. Tap `Analyze My Look`.

Expected result:

- Analyze My Look stays gated by confirmed photo
- analysis succeeds
- recommendation groups appear:
  - Paling Cocok
  - Alternatif Aman
  - Lebih Berani
  - Recommended Hair Colors

### Preview, save, and history

1. Tap `Preview This Style`.
2. Confirm preview still succeeds with the existing beta flow.
3. Confirm credit decreases only after successful preview.
4. Tap `Save Look`.
5. Open `Profile`.
6. Confirm saved history shows the look.
7. Delete the history item.

Expected result:

- preview, save, and delete still work
- Profile still shows local beta history only

### Custom Your Own Hair

1. Open the `Custom Your Own Hair` placeholder.
2. Confirm men and women control previews are visible.
3. Confirm it is clearly marked as coming soon / beta.

Expected result:

- no preview generation is connected from this screen
- no backend persistence is used

## What Still Remains Mocked

- confirmed photo upload is still a lightweight backend stub
- analysis is still mocked
- preview generation is still mocked
- backend beta profile read is available, backend beta history is memory-only, and credits are still local-only
- no real Supabase Storage
- no real backend persistence
- no payment
- no real auth
- no real AI generation

## Next Recommended Phase

Prioritize public-beta product features before real persistence:

1. haircut style database expansion
2. custom hair lab
3. recommendation logic
4. hair color options
5. UI polish
6. timeline and home content
7. public QA checklist
