# Mock MVP QA Summary And Checklist

This document captures the current mocked MVP baseline after successful manual device QA in Expo Go.

## Frozen Beta Backend State

- Batch 1 Discovery Layer passed
- Batch 2 Photo Upload / Storage Boundary passed
- Batch 3A Backend Profile Read passed
- Batch 3B Backend In-Memory History passed
- Batch 3C sync polish is intentionally skipped
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

## Current QA Status

The following flow has been manually verified on device:

- Home shows free credits
- Try AI can select a photo from gallery
- Try AI can take a photo from camera
- Confirm Photo succeeds and creates a `mock-photo-session-*`
- Run Mock Analysis succeeds after photo confirmation
- Run Mock Generate succeeds and deducts `1` local credit only after successful generation
- Mock preview and barber instruction card render
- Save Result adds the generated look to Profile history
- Profile shows saved local history
- Delete removes the saved history item
- When credits reach `0`, generate is blocked and shows the insufficient-credit state
- Backend health is reachable from phone at `http://192.168.18.6:4000/health`
- The API base URL is visible inside Profile
- The Profile screen can safely show backend beta profile data when available and fall back to local profile data when the backend is unavailable
- Saved history can now be loaded from backend in-memory beta history when available and fall back to local history when the backend is unavailable

## Environment Setup

### Backend start

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm run dev
```

Optional backend storage gate for this phase:

```env
PHOTO_STORAGE_MODE=mock
```

### Mobile start

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
cmd /c npm start
```

### Required mobile env

Use a reachable LAN IP when testing from Expo Go on a real phone:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.18.6:4000
```

Notes:

- `localhost` is not suitable for a physical device
- update the LAN IP if the host machine address changes
- restart Expo after changing the env value

## Manual Test Steps

### 1. Backend connectivity

1. Start the backend.
2. Confirm `GET /health` works from the phone browser:
   - `http://192.168.18.6:4000/health`

Expected result:

- standardized success response is returned

### 2. Home

1. Open the app.
2. Confirm Home shows free credits.
3. Confirm the app can navigate to Try AI.

Expected result:

- Home shows `Free credits: 2`

### 2A. Beta profile read

1. Open `Profile`.
2. Confirm the screen still opens normally.
3. If the backend is reachable, confirm the profile can show backend beta profile details.
4. If the backend is unavailable, confirm the screen still falls back to local profile data without blocking the app.

Expected result:

- `GET /api/profile/me` is a soft enhancement only
- credits shown for generation still follow the local on-device flow
- saved history is still safe even if backend history is unavailable

### 3. Photo selection

1. Open `Try AI`.
2. Confirm no photo is selected initially.
3. Tap `Take Photo` and allow camera access if prompted.
4. Tap `Upload from Gallery` and allow media library access if prompted.
5. Select a real local image.

Expected result:

- a selected photo card/preview appears
- the flow stays safe even when the backend upload boundary is still in `mock` mode

### 4. Confirm photo

1. Tap `Confirm Photo`.
2. Wait for the backend confirmation response to complete.

Expected result:

- confirm-upload succeeds
- a `mock-photo-session-*` is created
- `storageMode` returns `mock` by default unless a backend-only storage mode is explicitly enabled
- `Run Mock Analysis` becomes available
- the selected image remains visible

### 5. Mock analysis

1. Tap `Run Mock Analysis`.

Expected result:

- analysis succeeds
- analysis uses the confirmed `photoSessionId`
- credits do not decrease

### 6. Mock generate

1. Tap `Run Mock Generate`.

Expected result:

- generate succeeds
- preview result renders
- barber instruction card renders
- credits decrease by `1` only after successful generation

### 7. Save result

1. Tap `Save Result`.
2. Navigate to `Profile`.

Expected result:

- the generated result is added to beta history
- when backend is available, the save first attempts `POST /api/history`
- when backend is unavailable, local fallback still keeps the flow working

### 8. Delete history item

1. In `Profile`, delete the saved result.

Expected result:

- the history item is removed immediately
- when backend is available, delete first attempts `DELETE /api/history/:id`
- when backend is unavailable, local fallback still removes the item

### 9. Insufficient credit state

1. Continue generating until credits reach `0`.
2. Try generating again.

Expected result:

- generate is blocked
- insufficient-credit state is shown
- no payment flow appears

## Expected Results Summary

At the end of QA, all of the following should still be true:

- local image selection is real through Expo ImagePicker
- photo confirmation hits the backend upload stub
- `photoSessionId` is created and used by mocked analyze/generate
- local credits decrease only after successful mock generation
- backend in-memory or local fallback save/delete history behavior works
- Profile shows the current API base URL

## Known Mock Limitations

The current MVP is still intentionally mocked in these areas:

- no real AI analysis or generation
- backend beta profile is read-only only for Batch 3A
- no permanent backend image persistence by default
- no real auth
- no payment/top-up flow
- no permanent backend credits/history persistence
- backend beta history is memory-only and resets when the backend restarts
- no mobile Supabase SDK
- upload confirmation is backend-only and defaults to mock mode

## Recommended Next Implementation Phase

Prioritize public-beta product features before real persistence:

1. haircut style database expansion
2. custom hair lab
3. recommendation logic
4. hair color options
5. UI polish
6. timeline and home content
7. public QA checklist
