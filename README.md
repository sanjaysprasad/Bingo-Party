# 🎲 BINGO Party - Classic 1-25 Pen & Paper Multiplayer Game

The nostalgic pen-and-paper game we all played in school and college with a notebook and pen! Fill your 5x5 grid with numbers 1 to 25, take turns calling numbers to strike them off, complete rows, columns, or diagonals to strike off **B - I - N - G - O**, and be the first to reach 5 lines!

Play with your friends on mobile, tablet, or desktop with zero installation, or play solo against the smart AI bot.

---

## 🌐 Live URL

Play directly in your browser:
**[https://sanjaysprasad.github.io/Bingo-Party/](https://sanjaysprasad.github.io/Bingo-Party/)**

---

## 📜 How Classic 1-25 BINGO Works

1. **Board Setup**:
   - Each player has a 5x5 grid containing numbers **1 through 25**.
   - Place them manually or click **Auto-Fill / Shuffle** for an instant random layout.
   - When finished, click **✅ Ready to Play!**.

2. **Taking Turns**:
   - Players take turns calling a number from their grid.
   - When Player 1 calls "17", **BOTH** players strike out 17 on their own grid with a red ink slash!
   - Next, Player 2 calls a number, and both players strike it out.

3. **Completing Lines (12 Total Possible Lines)**:
   - Any completed 5-number horizontal row
   - Any completed 5-number vertical column
   - Either of the 2 diagonal lines

4. **B - I - N - G - O Score Progression**:
   - **1st completed line**: Strike off letter **B**!
   - **2nd completed line**: Strike off letter **I**!
   - **3rd completed line**: Strike off letter **N**!
   - **4th completed line**: Strike off letter **G**!
   - **5th completed line**: Strike off letter **O**!

5. **Victory**:
   - The first player to complete all 5 letters (**B - I - N - G - O**) shouts BINGO and wins the game! Celebratory confetti cannons and victory fanfares erupt across both screens!

---

## ✨ Features

- 🤖 **Play vs Computer (Solo Mode)**: Jump in and play solo immediately against a smart AI opponent without waiting.
- 👥 **Realtime Multiplayer Online**: Create a room with a 4-letter code, share the invite link or QR code, and play live with friends over WebSockets.
- 💬 **Live In-Game Chat**: Chat drawer for instant messaging and friendly trash talk during the game.
- 🎉 **Floating Emoji Reactions**: Send floating animated reaction emojis (🎉, 🔥, 🍀, 😱, 😂, 👏).
- 🔊 **Web Audio Synthesizer**: Authentic pencil scratch/scribble strike sounds, letter cross chimes, turn alert bells, and victory fanfares.
- 🗣️ **Voice Caller**: Optional speech synthesis announcing called numbers.
- 📱 **Mobile & Desktop Responsive**: Large tactile cells, responsive touch targets, dark-mode-first aesthetic.

---

## 💻 Local Testing & Multi-Tab Play

```bash
cd "/Users/ssp/Documents/SSP CODES/Bingo Party"
python3 -m http.server 3000
```
- Open `http://localhost:3000` in Tab 1 (Create Room).
- Open `http://localhost:3000` in Tab 2 (Join Room).
- Watch both boards strike off numbers and track B-I-N-G-O letters in real time!
