# Potongin AI Docs

## Mock MVP Baseline Freeze

- the current mock MVP baseline has been validated on Expo Go
- QA checklist location: [docs/QA_MOCK_MVP_CHECKLIST.md](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\QA_MOCK_MVP_CHECKLIST.md)
- the backend remains mock-contract based
- the mobile app currently uses local and mock state
- no real Supabase, auth, payment, storage, or AI integration is active
- the next implementation step should choose only one real integration boundary at a time

## Frozen Beta Backend State

- Batch 1 Discovery Layer passed
- Batch 2 Photo Upload / Storage Boundary passed
- Batch 3A Backend Profile Read passed
- Batch 3B Backend In-Memory History passed
- Batch 3C sync polish is intentionally skipped
- Profile is backend-readable
- Credits still deduct locally and on-device only
- History uses a backend in-memory store with local fallback
- Backend history resets on backend restart by design
- Supabase writes are inactive
- No real auth
- No payment
- No real AI
- No permanent backend persistence
- Local and mobile fallback must remain intact

## Run the backend

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm run dev
```

Production-style start:

```powershell
cmd /c npm start
```

Backend env note:

- `USE_SUPABASE=false` is the default mode.
- `PHOTO_STORAGE_MODE=mock` is the default mode for photo confirmation uploads.
- Backend Supabase client infrastructure is prepared, but current endpoints still run on mocked behavior.
- A backend auth boundary is prepared.
- Local and mock mode attach a mock current user on protected routes.
- User-context routes now consume `req.currentUser` instead of relying on route-local mock identity assumptions.
- Real Supabase JWT verification is not implemented yet.
- A backend repository layer now sits underneath the mock routes.
- Mock repositories remain the default source of data.
- Read-only Supabase repository methods are prepared for Explore collections and Profiles, but writes are still not active.
- `GET /api/explore/feed` now reads through the repository layer, while `USE_SUPABASE=false` still serves the same mocked curated feed by default.
- Future work will replace the mock current user with a Supabase-authenticated user once real auth is added.
- Real Supabase credentials are not required unless `USE_SUPABASE=true` is enabled later.
- Real Supabase storage credentials are not required unless `PHOTO_STORAGE_MODE=supabase` is enabled later.

## Run backend tests

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm test
```

## Run the mobile app

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
cmd /c npm start
```

## API base URL

- Backend default: `http://localhost:4000`
- Mobile env key: `EXPO_PUBLIC_API_BASE_URL`
- Mobile example: `http://localhost:4000`
- For Expo Web on the same machine, `http://localhost:4000` is fine.
- For Android emulator or a physical device, replace `localhost` with a reachable host such as `http://10.0.2.2:4000` or your LAN IP.

### Mobile API base URL setup

1. In [mobile/.env.example](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile\.env.example), copy the example value into your local Expo env file.
2. Set `EXPO_PUBLIC_API_BASE_URL` to the backend host you want the app to call.
3. Restart Expo after changing the env value.

The mobile API config lives in [mobile/src/config/api.js](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile\src\config\api.js).

## Current Mock MVP Flow

- local image selection is real through Expo ImagePicker
- confirmed photo upload goes to a backend-only upload boundary
- the upload boundary runs in `mock` mode by default and can be switched to backend-only Supabase storage later
- mocked analysis and generate calls consume the confirmed `photoSessionId`
- local credits are still mocked in memory
- saved history now prefers a backend in-memory beta route when available, with local fallback still preserved
- the app now attempts to read a backend beta profile from `GET /api/profile/me`
- the app also attempts to read backend in-memory beta history from `GET /api/history`
- credits still remain local on-device
- storage, real auth, payments, and real AI are not implemented yet

## Public Beta Discovery Layer v1

- the mobile app now includes a curated discovery catalog for haircut styles, hair colors, barber tips, and home feed sections
- Home is now a discovery-first surface with multiple editorial sections instead of only a quick CTA
- Explore now supports public beta filters for Men, Women, Unisex, Colors, Trending, Low Maintenance, Professional, and Bold
- detail views are available for haircut styles, hair colors, and barber tips
- Try AI now shows rule-based recommendation groups after analysis completes
- Custom Your Own Hair is available as a serious Coming Soon beta placeholder only
- confirmed photo upload, analysis, preview, credits, and history still remain mocked or local-only under the hood

## Batch 4A Product Data Foundation

- the mobile app now includes a richer local haircut style database foundation with future-ready metadata for men, women, and unisex looks
- the mobile app now includes a richer local hair color system with structured tone, undertone, maintenance, and workplace-safety fields
- a local Custom Hair Lab schema and default parameter set now exist for future configurator work
- all Batch 4A data remains local/mock only
- no real AI, no Supabase persistence, no auth, no payment, and no backend behavior changes were added in this batch
- example and model image URLs are placeholder-only for now
- future batches can wire Explore, Style Detail, recommendation logic, and Custom Hair Lab more deeply to this richer data foundation

## Batch 3A Beta Profile Read

- the backend now exposes `GET /api/profile/me` for a minimal beta profile
- this route is mock-current-user based and does not require auth, payment, or Supabase writes
- backend profile credits are read-only for this phase
- preview generation still deducts credits locally on the device
- saved history still remains local/mobile-side for now

## Batch 3B Beta History Read And Save

- the backend now exposes `GET /api/history`, `POST /api/history`, and `DELETE /api/history/:id`
- saved looks are stored in backend memory only for the current mock user during the running server session
- backend history resets when the backend process restarts
- mobile still keeps a local fallback when backend history requests fail
- preview generation and credit deduction still remain local-only

Current stop point:

- local image selection is real
- upload confirmation is a backend stub only
- analysis and generate are still mocked
- backend-readable beta profile is available, but credits remain read-only there for now
- backend-readable beta history is available, but it is memory-only and falls back to local state
- storage, auth, payment, and real AI are not implemented yet
- Batch 3C sync polish is intentionally skipped for now

Manual QA summary and checklist:
- [QA_MOCK_MVP_CHECKLIST.md](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\QA_MOCK_MVP_CHECKLIST.md)
- [QA_PUBLIC_BETA_DISCOVERY_CHECKLIST.md](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\docs\QA_PUBLIC_BETA_DISCOVERY_CHECKLIST.md)

## Standardized API response format

Success response:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Current mock endpoints

- `GET /health`
- `GET /api/profile/me`
- `GET /api/history`
- `POST /api/history`
- `POST /api/photos/confirm-upload`
- `POST /api/ai/analyze`
- `POST /api/ai/generate`
- `GET /api/explore/feed`
- `POST /api/barbers/claim`
- `GET /api/business/profile`
- `PUT /api/business/profile`
- `DELETE /api/history/:id`

These endpoints are mock contract endpoints only. They do not connect to Supabase, auth, AI providers, camera features, or payments yet.
Their data now flows through backend repository abstractions, but the responses remain mocked by default.

## Photo upload boundary

- `POST /api/photos/confirm-upload` remains the canonical route
- The upload boundary is backend-only. Mobile never receives Supabase service credentials.
- `PHOTO_STORAGE_MODE=mock` keeps the current mock confirmation flow active by default.
- `PHOTO_STORAGE_MODE=supabase` enables backend-only upload to the `original-temp` bucket when a real image file is provided.
- The backend still does not save files to local disk.
- No database row creation or AI processing happens yet.
- The mobile confirmed-photo step now prefers multipart upload for real local camera/gallery images and keeps a JSON metadata fallback for the mock path.
- The returned `photoSessionId`, `storageMode`, and expiry values are stored only in local mobile state.
- Analyze and Preview still remain mocked after confirm-upload succeeds.

### Storage mode env

Backend `.env` values for the upload boundary:

```env
PHOTO_STORAGE_MODE=mock
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET=original-temp
```

Mode behavior:

- `mock` or unset:
  - no Supabase credentials required
  - confirm-upload returns a mock `photoSessionId`
  - `originalImageTempUrl` remains `null`
- `supabase`:
  - backend-only upload using the service role key
  - a temp storage object is uploaded when a real image file is provided
  - a safe temp URL or storage reference is returned in the response
  - mock fallback still exists when the route is used without a real file payload

## Local-only mobile MVP state

- Free credits start at `2`
- The Profile screen now tries to read a backend beta profile first and falls back safely to local mock profile state if the backend is unavailable
- Saved history now tries backend in-memory history first and falls back safely to local mobile history if the backend is unavailable
- Try AI now uses Expo ImagePicker for local camera and gallery selection
- Camera permission is only requested when `Take Photo` is tapped
- Media library permission is only requested when `Upload from Gallery` is tapped
- The selected image stays local on-device until the user taps `Confirm Photo`
- Confirming a photo now calls the backend upload boundary and stores only mock session metadata locally
- The returned `photoSessionId` is now passed into mocked analyze and generate requests for traceability
- No permanent file upload or storage integration is implemented yet
- A photo must be confirmed successfully before `Run Mock Analysis` becomes available
- `Run Mock Analysis` is free
- `Run Mock Generate` costs `1` credit only after a successful mock response
- Credits shown in the beta profile route are read-only for Batch 3A. Actual preview deduction still happens locally on-device.
- Failed or blocked generate attempts do not deduct credit
- Generated results can now be saved to backend in-memory history for the current session when the backend is available
- Backend in-memory history resets when the backend restarts
- Local fallback history still remains available when backend history requests fail

## Next Recommended Direction

Prioritize public-beta product features before real persistence:

1. haircut style database expansion
2. custom hair lab
3. recommendation logic
4. hair color options
5. UI polish
6. timeline and home content
7. public QA checklist

## Mobile service mapping

- `aiService.analyzePhoto(payload)` -> `POST /api/ai/analyze`
- `aiService.generatePreview(payload)` -> `POST /api/ai/generate`
- `photoService.confirmUpload(selectedPhoto)` -> `POST /api/photos/confirm-upload`
- `profileService.getCurrentProfile()` -> `GET /api/profile/me`
- `historyService.getHistory()` -> `GET /api/history`
- `historyService.saveHistoryItem(payload)` -> `POST /api/history`
- `exploreService.getFeed()` -> `GET /api/explore/feed`
- `barbershopService.claimBarbershop(payload)` -> `POST /api/barbers/claim`
- `businessService.getProfile()` -> `GET /api/business/profile`
- `businessService.updateProfile(payload)` -> `PUT /api/business/profile`
- `historyService.deleteHistoryItem(historyId)` -> `DELETE /api/history/:id`

These services live under [mobile/src/services](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile\src\services) and use the shared client in [mobile/src/lib/apiClient.js](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile\src\lib\apiClient.js). Successful responses are unwrapped to `response.data`, and standardized backend errors are surfaced as `ApiClientError` with `code` and `message`.

## Request and response examples

### POST /api/ai/analyze

Example request:

```json
{
  "photoSessionId": "mock-photo-session-001",
  "notes": "Looking for styles that suit an oval face."
}
```

Example success response:

```json
{
  "success": true,
  "data": {
    "request": {
      "photoSessionId": "mock-photo-session-001",
      "notes": "Looking for styles that suit an oval face."
    },
    "analysisId": "analysis-mock-001",
    "result": {
      "faceShape": "oval",
      "hairCondition": "normal",
      "recommendations": [
        "textured crop",
        "low taper",
        "classic side part"
      ]
    }
  },
  "message": "Mock AI analyze response generated."
}
```

## Manual mobile service check

1. Start the backend:

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm run dev
```

2. Set `EXPO_PUBLIC_API_BASE_URL` for the mobile app.
3. Start Expo:

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
cmd /c npm start
```

4. To run a basic non-UI smoke check, temporarily call `runMockApiSmokeChecks()` from [mobile/src/smoke/runMockApiSmokeChecks.js](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile\src\smoke\runMockApiSmokeChecks.js) inside a `useEffect` in [mobile/App.js](C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile\App.js), then inspect the Metro logs or browser/dev logs.

Available smoke helpers:

- `runAnalyzeSmokeCheck()`
- `runGenerateSmokeCheck()`
- `runExploreSmokeCheck()`
- `runMockApiSmokeChecks()`
- `runMockUserFlowSmokeCheck()`

### Manual local credit and history flow

1. Start the backend and mobile app.
2. Open `Home` and confirm the top bar and home card show `Free credits: 2`.
3. Open `Try AI` and confirm it starts with no photo selected.
4. Tap `Take Photo` and allow camera access if prompted, or tap `Upload from Gallery` and allow media library access if prompted.
5. Confirm a local image preview card appears.
6. Tap `Confirm Photo` and confirm the backend upload boundary is called successfully.
7. Confirm a mock `photoSessionId` is stored locally and `Run Mock Analysis` only becomes available after the upload-confirm step succeeds.
8. If you cancel the picker, confirm the current photo selection does not change.
9. If permission is denied, confirm a friendly inline error message appears instead of a crash.
10. Run `Run Mock Analysis` and confirm the credit count stays the same after analysis.
11. Run `Run Mock Generate`.
12. Confirm the credit count drops from `2` to `1` only after the generate call succeeds.
13. Tap `Save Result`.
14. Open `Profile` and confirm the saved result appears under beta history.
15. Tap `Delete` on the saved history item and confirm it is removed immediately.
16. Run `Run Mock Generate` again until credits reach `0`, then try once more and confirm the paywall placeholder appears instead of another generate request.

## Future photo input work

- Upload the confirmed local image to the backend or Supabase Storage
- Connect backend image handling and temp/saved image lifecycle
- Replace the mock analysis/generate payload assumptions with real photo-aware processing

### POST /api/ai/generate

Example request:

```json
{
  "prompt": "Show modern textured crop preview ideas",
  "analysisId": "analysis-mock-001",
  "photoSessionId": "mock-photo-session-001",
  "variations": 2
}
```

Example success response:

```json
{
  "success": true,
  "data": {
    "request": {
      "prompt": "Show modern textured crop preview ideas",
      "analysisId": "analysis-mock-001",
      "photoSessionId": "mock-photo-session-001",
      "variations": 2
    },
    "generationId": "generate-mock-001",
    "previews": [
      {
        "id": "preview-001",
        "styleName": "Textured Crop",
        "imageUrl": "https://example.com/mock-preview-1.jpg"
      },
      {
        "id": "preview-002",
        "styleName": "Modern Pompadour",
        "imageUrl": "https://example.com/mock-preview-2.jpg"
      }
    ]
  },
  "message": "Mock AI generate response generated."
}
```

### GET /api/explore/feed

Example success response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "feed-001",
        "type": "barber",
        "title": "Classic Fade Specialist",
        "subtitle": "Mock discovery profile for feed integration"
      },
      {
        "id": "feed-002",
        "type": "style",
        "title": "Textured Crop Inspiration",
        "subtitle": "Mock inspiration card for the explore feed"
      }
    ],
    "nextCursor": null
  },
  "message": "Mock explore feed loaded."
}
```
