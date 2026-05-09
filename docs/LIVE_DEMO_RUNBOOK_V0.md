# Live Demo Runbook v0

This runbook is for the operator who will present the hairstyle try-on demo live.

## Demo Goal

Show that a normal user can:

1. Open the app
2. Add a real photo
3. Analyze face and hair
4. Review hairstyle recommendations
5. Choose a hairstyle
6. Choose a hair color
7. Generate a real AI preview
8. Regenerate with another style or color
9. Save the result
10. Open Profile History and see the saved preview

## Before the Demo

Make sure all of these are ready:

- Laptop and phone are on the same Wi-Fi
- Backend is running
- Expo is running
- Phone can open the app in Expo Go
- `AI_MODE=real` is enabled for the live demo
- `OPENAI_API_KEY` is set on the backend
- `OPENAI_IMAGE_MODEL=gpt-image-1`
- One clear selfie is ready in the phone gallery as backup
- Camera permission is already allowed on the phone

## Backend `.env`

Use this for the live demo:

```env
PORT=4000
AI_MODE=real
PHOTO_STORAGE_MODE=mock
USE_SUPABASE=false
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ANALYZE_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

## Start Commands

### Backend

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\backend"
cmd /c npm run dev
```

### Expo

Replace `<YOUR_LAN_IP>` with your laptop IP.

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
$env:EXPO_PUBLIC_API_BASE_URL="http://<YOUR_LAN_IP>:4000"
cmd /c npm start
```

## What to Watch in Backend Logs

During real AI preview, watch for these lines:

- `[ai][analyze] real mode request`
- `[ai][analyze] real mode success`
- `[ai][generate] real mode request`
- `[ai][generate] OpenAI image request starting`
- `[ai][generate] OpenAI image request succeeded`

Good signals:

- `AI_MODE: 'real'`
- `OPENAI_IMAGE_MODEL: 'gpt-image-1'`
- `selectedStyleName` matches the selected hairstyle
- `selectedHairColor` matches the selected color
- `returnedPreviewBase64: true` or `returnedPreviewUrl: true`

## Recommended Demo Flow

### Step 1: Open the app

Say:

> "This demo helps users preview a new hairstyle from their own photo."

Show:

- App opens normally
- `ID / EN` language toggle is visible

Optional:

- Switch to Indonesian first if the audience is local

### Step 2: Open Try AI

Say:

> "The main flow is in Try AI."

Show:

- Step labels are visible
- The flow looks guided and simple

### Step 3: Add photo

Preferred:

- Use `Upload from Gallery` with a clear selfie for reliability

If needed:

- Use `Take Photo`

Show:

- Photo preview appears
- Tap `Confirm Photo`

### Step 4: Analyze

Tap:

- `Analyze My Look`

Show:

- Analysis card appears
- Recommendation groups appear:
  - `Paling Cocok`
  - `Alternatif Aman`
  - `Lebih Berani`

Say:

> "The app gives hairstyle suggestions based on the photo before generating the preview."

### Step 5: Choose hairstyle

Tap:

- `Try This Look` on one recommendation

Show:

- Selected card state
- `Your inspiration` updates
- Selected haircut text updates

### Step 6: Choose hair color

Tap:

- A hair color chip

Show:

- Selected color updates clearly

### Step 7: Generate preview

Tap:

- `Preview This Style` or `Generate This Look`

Show:

- Loading state
- Real preview image appears

Say:

> "This is a real AI-generated try-on preview using the selected style and hair color."

### Step 8: Regenerate

Do both:

1. Change only the color, then generate again
2. Change the hairstyle, then generate again

Show:

- Preview updates correctly
- The same person remains recognizable

### Step 9: Save look

Tap:

- `Save Look`

Show:

- Save confirmation message appears

### Step 10: Open Profile

Show:

- Saved history entry appears
- Thumbnail is visible
- Delete button is visible

## If Something Fails

### If the app cannot reach backend

Check:

- phone and laptop are on same Wi-Fi
- `EXPO_PUBLIC_API_BASE_URL` uses the correct LAN IP
- backend is still running

### If AI preview fails

Take screenshots of:

- phone screen
- backend terminal

Especially capture:

- `[ai][generate] real mode failed`
- any OpenAI error message

### If preview image does not appear

Check:

- backend returned `previewBase64` or `previewUrl`
- app is not stuck on loading

If needed:

- restart backend
- restart Expo with cache clear

```powershell
cd "C:\Users\PROGRAM DISPLAY\Documents\New project 4\potongin-ai\mobile"
cmd /c npx expo start --clear
```

## Backup Plan

If real mode becomes unstable during the live demo:

1. Switch backend to `AI_MODE=mock`
2. Restart backend
3. Continue showing the same user flow

This keeps the product flow demonstrable even if the external AI service has issues.

## Demo Notes to Say Out Loud

Helpful phrases:

- "This is a beta preview, so the result is a style direction rather than a final salon guarantee."
- "The app tries to preserve the same face and only change the hair."
- "You can try another hairstyle or another color immediately."
- "Saved results stay visible in Profile History during the demo."

## Definition of a Successful Live Demo

The demo is successful if the audience sees:

1. Real photo input
2. AI analysis
3. Hairstyle recommendations
4. Real preview generation
5. Regenerate with new style or color
6. Save Look
7. Profile History thumbnail

## After the Demo

Collect quick feedback:

- Was the flow easy to understand?
- Did the hairstyle suggestions make sense?
- Did the preview still look like the same person?
- Which part felt most useful?
- Which part felt confusing or less trustworthy?
