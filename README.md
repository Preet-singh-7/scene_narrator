# Scene Narrator — AI Vision Assistant for the Visually Impaired

Point your phone's camera at a scene and hear it described out loud in real time.
Built for an MCA AIML showcase: a vision-language model (via Ollama, running locally
on your Mac) interprets the camera image, and the phone speaks the description aloud.

```
Phone camera → Expo app → Backend (Node/Express) → Ollama (LLaVA) → description → Text-to-Speech
```

No cloud APIs, no API keys, everything runs on your MacBook + phone over local WiFi.

---

## Project structure

```
scene-narrator/
├── backend/         Node.js server that talks to Ollama
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── mobile/          Expo (React Native) app
    ├── App.js
    ├── app.json
    └── package.json
```

---

## 1. One-time setup (on your MacBook M2 Air)

### a) Install the LLaVA vision model in Ollama

You already have Ollama installed. Pull the vision model:

```bash
ollama pull llava
```

This downloads a ~4.5GB model (llava:7b). It runs comfortably on an M2 Air.

Test it works:

```bash
ollama run llava
```
Type `/bye` to exit once you see it load correctly.

### b) Install backend dependencies

```bash
cd scene-narrator/backend
npm install
```

### c) Install mobile app dependencies

```bash
cd scene-narrator/mobile
npm install
```

### d) Install the Expo Go app on your phone

Download **Expo Go** from the App Store (iPhone) or Play Store (Android).
This lets you run the app instantly without building a native binary.

---

## 2. Find your Mac's local IP address

Your phone needs to reach your Mac over WiFi. Both devices must be on the **same WiFi network**.

```bash
ipconfig getifaddr en0
```

This prints something like `192.168.1.42`. Note it down — you'll enter it in the app.

---

## 3. Run everything

### Terminal 1 — start Ollama (if not already running)

```bash
ollama serve
```
(If you've used Ollama before, it may already be running in the background — that's fine.)

### Terminal 2 — start the backend

```bash
cd scene-narrator/backend
npm start
```

You should see:
```
Scene Narrator backend running on http://0.0.0.0:3000
Forwarding image descriptions to Ollama at http://127.0.0.1:11434 using model "llava"
```

Quick sanity check — open this in your Mac's browser: `http://localhost:3000/health`
You should see `{"status":"ok","model":"llava",...}`

### Terminal 3 — start the Expo app

```bash
cd scene-narrator/mobile
npx expo start
```

A QR code appears in the terminal.

### On your phone

1. Open **Expo Go**
2. Scan the QR code (iPhone: use the Camera app to scan it, then tap the banner; Android: scan inside Expo Go)
3. The app loads on your phone
4. Grant camera permission when asked
5. Tap the **⚙ settings icon** (top-left) and enter your Mac's IP, e.g. `http://192.168.1.42:3000`
6. Tap **Save & Close**
7. Point the camera at something and tap **Describe Scene**

The first request may take 5–15 seconds while Ollama processes the image (M2 Air, local model — this is expected). It'll speak the result out loud and show it on screen.

---

## 4. Demo tips for your showcase

- **Let the judges point the camera themselves** — unscripted demos land better than a rehearsed clip.
- Keep the room reasonably lit — LLaVA (like any vision model) does better with clear images.
- Have 2–3 objects ready that give visibly different, sensible descriptions (a doorway, a chair with a bag on it, a table with a laptop) — shows it's not just repeating one canned phrase.
- Mention in your explanation: "This runs entirely on-device/local-network — no cloud, no API cost, no internet dependency once the model is pulled." That's a strong technical point for a viva.
- If you want a stronger stat to open with: India has an estimated 30+ million people with significant visual impairment, and most affordable assistive tools cover screen-reading, not physical navigation — this fills that gap.

---

## 5. Troubleshooting

**"Could not reach the server" in the app**
- Confirm phone and Mac are on the *same* WiFi network (not phone on mobile data)
- Double check the IP in Settings matches `ipconfig getifaddr en0` exactly, including `http://` and the port
- Some university/office WiFi networks block device-to-device traffic ("AP isolation") — use a personal hotspot or home WiFi for the demo if this happens

**Ollama errors ("model not found" etc.)**
- Run `ollama list` to confirm `llava` is pulled
- Run `ollama serve` if it's not already running

**Slow responses**
- Normal for local inference on a laptop — 5–15 seconds per image is expected for LLaVA on an M2 Air
- You can try `ollama pull llava:7b` explicitly (the smaller variant) if not already using it, for faster responses

**Camera permission denied**
- iPhone: Settings → Expo Go → Camera → allow
- Android: Settings → Apps → Expo Go → Permissions → Camera → allow

---

## 6. Ideas to extend (if you have time before submission)

- Auto-capture every 5–10 seconds instead of manual tap ("continuous mode")
- Add haptic feedback (vibration) when a description is ready, useful for actual visually impaired users
- Cache/skip repeated near-identical descriptions to avoid narrating the same static scene repeatedly
- Add a distance/urgency cue — prompt the model to flag "close obstacle" scenarios more assertively
