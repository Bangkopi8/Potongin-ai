# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Potongin AI** is an AI-powered hairstyle discovery and preview platform. It consists of:
- `backend/` — Node.js/Express 5 API server (port 4000)
- `mobile/` — Expo React Native app (iOS, Android, Web)
- `docs/` — QA checklists, demo runbooks, Supabase integration plans

The entire stack currently runs in **mock mode** — no real database writes, no real AI calls, no real auth. Supabase and OpenAI integrations are wired but inactive.

## Commands

### Backend
```bash
cd backend
npm run dev        # start with node --watch (hot reload)
npm start          # production start
npm test           # run all Vitest tests
```

### Mobile
```bash
cd mobile
npm start          # Expo dev server (choose platform interactively)
npm run android    # open on Android emulator
npm run ios        # open on iOS simulator
npm run web        # open in browser
```

### Run a single backend test file
```bash
cd backend
npx vitest run tests/api.contract.test.mjs
```

## Architecture

### Backend

Entry point: `src/server.js` → `src/app.js` (Express app with routes and middleware).

**Repository pattern** controls data source. `src/repositories/getRepositories.js` returns either mock (in-memory) or Supabase implementations based on `USE_SUPABASE` env var. All business logic in routes talks to repositories, never to Supabase directly.

**Mock-first endpoints** live in `src/routes/mockRoutes.js`. Photo upload has its own route file (`photoUploadRoutes.js`). All responses use `src/utils/apiResponse.js` helpers returning `{success, data, message}` or `{success, error}`.

Request bodies are validated with Zod schemas from `src/schemas/` via `src/middleware/validateRequest.js`. Auth is mocked via `src/middleware/mockCurrentUser.js` (attaches a fixed user to `req.user`).

**Switching to real integrations:**
- Set `USE_SUPABASE=true` → Supabase repository implementations activate
- Set `AI_MODE=real` + OpenAI key → `src/lib/openaiTryOn.js` activates
- Set `PHOTO_STORAGE_MODE=supabase` → Supabase Storage activates

### Mobile

Entry point: `mobile/src/App.js` — manages onboarding flow: `LanguageOnboardingScreen` → `DemoAuthScreen` → `AuthenticatedDemoShell` (6-tab navigator).

**No Redux.** State is managed through custom hooks in `src/hooks/`:
- `useTryAiMockFlow` — photo capture, analysis, preview generation
- `useExploreMockFlow` — explore screen filters and data
- `useMockUserState` / `useProfileMockState` — user profile and credits

**Service layer** (`src/services/`) makes HTTP calls via `src/lib/apiClient.js` (Axios). Each service maps to a backend route group. Many screens fall back to local state / AsyncStorage when the backend is unavailable.

**Static data** (haircut catalogs, hair colors, editorial content) lives in `src/data/` and is imported directly — no backend calls needed for browsing.

API base URL is set via `EXPO_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000`). For Android devices/emulators use the machine's LAN IP or `10.0.2.2`.

**i18n:** English and Indonesian translations are in `src/i18n/translations.js`.

### Backend Environment Variables

| Variable | Default | Effect |
|---|---|---|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | |
| `AI_MODE` | `mock` | `real` activates OpenAI |
| `USE_SUPABASE` | `false` | `true` activates Supabase repos |
| `PHOTO_STORAGE_MODE` | `mock` | `supabase` activates Supabase Storage |

## Key API Endpoints

All routes are prefixed `/api`:

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/profile/me` | Beta user profile (read-only) |
| GET/POST/DELETE | `/api/history` / `/api/history/:id` | Session history |
| POST | `/api/photos/confirm-upload` | Photo upload boundary |
| POST | `/api/ai/analyze` | Mock face/hair analysis |
| POST | `/api/ai/generate` | Mock hairstyle preview generation |
| GET | `/api/explore/feed` | Curated hairstyle feed |
| POST | `/api/barbers/claim` | Barber shop claim |
| GET/PUT | `/api/business/profile` | Business profile |

## Testing

Backend tests use **Vitest** and live in `backend/tests/`:
- `api.contract.test.mjs` — HTTP contract tests for all endpoints
- `current-user.test.mjs` — auth middleware
- `photo-storage.test.mjs` — upload logic
- `repository-selection.test.mjs` — mock vs. Supabase factory

There are no mobile automated tests; mobile validation is manual via `docs/QA_MOCK_MVP_CHECKLIST.md`.
