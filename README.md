# 🎲 Bingo Party - Realtime Multiplayer Bingo Web App

A modern, fast, responsive realtime multiplayer Bingo game built with vanilla HTML5, CSS3, and JavaScript. Zero backend servers or databases required — it uses WebRTC peer-to-peer data channels so it runs **100% free on GitHub Pages**!

Play with your friends on iPhone, Android, iPad, Mac, or PC directly in any web browser.

---

## 🌐 Live Demo & GitHub Pages URL

Once GitHub Pages is turned on, the app is live at:
**[https://sanjaysprasad.github.io/Bingo-Party/](https://sanjaysprasad.github.io/Bingo-Party/)**

---

## ✨ Features

- 🌐 **Realtime Multiplayer (Zero Server)**: Host creates a room code; friends connect directly via WebRTC data channels.
- 📱 **QR Code & Instant Invite Links**: 1-click invite link copying or instant QR code scanning with your phone's camera.
- 🎱 **3D Rolling Ball Tumbler**: Animated ball tumbler with realistic physics bounce and signature letter colors:
  - **B** (Blue, 1–15)
  - **I** (Red, 16–30)
  - **N** (Amber, 31–45)
  - **G** (Emerald, 46–60)
  - **O** (Violet, 61–75)
- 🗣️ **Synthesized Voice Caller & Sound Effects**:
  - Voice caller announces each ball ("B-12", "O-67") using the browser's speech synthesis API.
  - Tactile daubing stamps, near-bingo chords, winner fanfares, and error buzzers generated with Web Audio API (zero audio files to download!).
- 🎯 **Configurable Winning Patterns**:
  - Any Single Line (Row, Column, Diagonal)
  - Any 2 Lines
  - Four Corners
  - Plus / Cross (+)
  - Postage Stamp (2x2 Corner)
  - Blackout / Full House
- 🎨 **Tactile Dauber Customization**:
  - Pick ink colors: Crimson, Azure Blue, Emerald Green, Royal Violet, Star Gold, or Pink.
  - Optional **Auto-Daub** helper for casual/accessible gameplay.
- ⚡ **Anti-Cheat Verification**:
  - When a player hits **BINGO!**, the host validates that every marked square on their winning line was genuinely drawn.
  - Confetti cannons, victory fanfares, and winner modals pop up on everyone's screen simultaneously!
- 💬 **Social Interactions**:
  - Floating emoji reactions (🎉, 🔥, 🍀, 😱, 😂, 👏).
  - In-game real-time chat drawer.
  - Live player roster with connection indicators and "1 Away!" badges.
- 🎭 **Custom Themes & Words**:
  - Classic 75-Ball Number Bingo.
  - Tech & Dev Night.
  - Remote Work / Office Bingo ("You're on mute", "Can you see my screen?").
  - Party Night.
  - Custom Word List (paste your own words!).

---

## 🚀 How to Enable GitHub Pages

1. Open your repository on GitHub: **[https://github.com/sanjaysprasad/Bingo-Party](https://github.com/sanjaysprasad/Bingo-Party)**.
2. Click the **Settings** tab at the top.
3. Click **Pages** in the left sidebar (under "Code and automation").
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` and directory `/ (root)`.
   - Click **Save**.
5. Within 1–2 minutes, your game is live at:
   👉 **[https://sanjaysprasad.github.io/Bingo-Party/](https://sanjaysprasad.github.io/Bingo-Party/)**

---

## 🎮 How to Play

1. **Host Game**:
   - Open your deployed URL.
   - Enter your name, select your preferred winning pattern and game mode.
   - Click **Create Room**.
   - A share modal will appear with your **Room Code**, **QR Code**, and direct link.

2. **Friends Join**:
   - Friends open the link or scan the QR code with their mobile camera.
   - Enter their name and click **Join Game**.

3. **Playing**:
   - Host clicks **Draw Ball** (or enables **Auto Caller** at 4s, 6s, 9s, or 12s intervals).
   - Players hear the call, see the ball tumble, and tap the number on their card to stamp/daub it.
   - When 1 mark away from winning, your card glows with the *"1 Away from BINGO!"* badge.
   - When the pattern is achieved, hit the giant golden **⚡ BINGO! ⚡** button to claim victory and trigger confetti for everyone!

---

## 💻 Local Testing & Multi-Tab Play

```bash
cd "/Users/ssp/Documents/SSP CODES/Bingo Party"
python3 -m http.server 3000
```
- Open `http://localhost:3000` in Tab 1 (Host a game).
- Open `http://localhost:3000` in Tab 2 or an Incognito window (Join the room code). The built-in `BroadcastChannel` and WebRTC engine seamlessly coordinate multiple tabs on the same machine.

---

## 🛠️ Tech Stack

- **Client**: Vanilla HTML5, CSS3 Glassmorphism, ES6 Modules.
- **Networking**: [PeerJS](https://peerjs.com/) (WebRTC DataChannels) with BroadcastChannel fallback.
- **Audio**: Web Audio API (Synthesizer) + Web Speech API (Voice synthesis).
- **Celebration**: Custom zero-dependency Canvas Confetti engine.
- **Hosting**: GitHub Pages (Static hosting, 0 server cost, 0 maintenance).
