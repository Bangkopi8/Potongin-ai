# External Demo v0 Guide

## What this demo can do

- Open in Expo Go on a real phone
- Take a photo or upload a photo from the gallery
- Confirm the photo
- Run real AI analysis
- Show haircut recommendation groups
- Let the user tap `Try This Look`
- Let the user choose and change hair color
- Generate a real hairstyle preview image with `gpt-image-1`
- Regenerate with a different haircut
- Regenerate with a different hair color
- Save the final look
- Show the saved result in Profile History
- Fall back to mock mode if needed

## What this demo cannot do yet

- No login or user accounts
- No payment or top-up flow
- No real cloud history persistence
- No Supabase persistence
- No admin or business dashboard
- No Custom Hair Lab to Try AI handoff
- No production-grade reliability guarantees

## Required backend `.env` values

Use this for the real external demo:

```env
PORT=4000
AI_MODE=real
PHOTO_STORAGE_MODE=mock
USE_SUPABASE=false
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ANALYZE_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

Use this for mock fallback:

```env
PORT=4000
AI_MODE=mock
PHOTO_STORAGE_MODE=mock
USE_SUPABASE=false
OPENAI_API_KEY=
OPENAI_ANALYZE_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

## Backend start command

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm run dev
```

## Mobile Expo start command

Replace `<YOUR_LAN_IP>` with the laptop/computer LAN IP.

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
$env:EXPO_PUBLIC_API_BASE_URL="http://<YOUR_LAN_IP>:4000"
cmd /c npm start
```

## Phone QA flow

1. Open the app in Expo Go.
2. Open `Try AI`.
3. Take a photo or upload one from the gallery.
4. Tap `Confirm Photo`.
5. Tap `Analyze My Look`.
6. Wait for recommendation groups to appear.
7. Tap `Try This Look` on one haircut recommendation.
8. Choose a hair color.
9. Tap `Generate This Look` if preview does not auto-start.
10. Wait for the preview image to appear.
11. Change only the hair color and tap `Generate Updated Look`.
12. Change the haircut and generate again.
13. Tap `Save Look`.
14. Open `Profile`.
15. Confirm the saved result appears in Profile History.

## Tester script

Use this simple script when handing the phone to a tester:

1. "Please open Try AI."
2. "Take a selfie or upload a clear photo from your gallery."
3. "Tap Confirm Photo."
4. "Tap Analyze My Look."
5. "Choose one hairstyle by tapping Try This Look."
6. "Choose a hair color you like."
7. "Generate the preview."
8. "Now try changing the color and generate again."
9. "Now try changing the hairstyle and generate again."
10. "If you like the result, tap Save Look."
11. "Open Profile and check that your saved look appears there."

## Known limitations

- Beta AI preview may still slightly change the face
- Result is a hairstyle direction, not a salon guarantee
- No login
- No payment
- No real cloud history persistence
- Backend must run locally

## Troubleshooting

- Phone and laptop must be on the same Wi-Fi network
- Restart backend after `.env` changes
- Restart Expo with `--clear` if the app behaves oddly
- Screenshot backend logs if AI generation fails

Useful Expo restart command:

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
$env:EXPO_PUBLIC_API_BASE_URL="http://<YOUR_LAN_IP>:4000"
cmd /c npx expo start --clear
```

## Definition of done for external demo

The external demo is ready when a non-technical tester can:

1. Open the app in Expo Go
2. Open Try AI
3. Add and confirm a real photo
4. Run analysis
5. See recommendations
6. Select a hairstyle
7. Select or change hair color
8. Generate a visible preview image
9. Regenerate with another style or color
10. Save the look
11. See the saved result in Profile History
