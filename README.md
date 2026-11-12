# 🎮 PartyPlay Hub - Multi-Game Board & Tabletop Platform

Welcome to **PartyPlay Hub**, a modern realtime multiplayer gaming hub designed for classic tabletop and party games! Play the nostalgic 1-25 **Bingo Party** live now, with custom editions of **Monopoly** and **Uno** rolling out soon.

Featuring **Multi-Game Profiles & Stats**, **Per-Game Leaderboards**, **Auto-Save & Game Resumption**, **Date-Stamped Match History**, and **Realtime Cross-Device Multiplayer**!

---

## 🌐 Live URL

Play directly in your browser:  
👉 **[https://sanjaysprasad.github.io/Bingo-Party/](https://sanjaysprasad.github.io/Bingo-Party/)**

---

## 🕹️ Featured Games

| Game | Status | Players | Mode |
| :--- | :--- | :--- | :--- |
| 🎲 **1. Bingoparty** | **Playable Now** | 1–8 Players | Solo vs Smart AI & Realtime Online Rooms |
| 🌴 **2. Mallu Monopoly** | **Playable Now** | 2–8 Players | Kerala-themed 40-space board, Smart AI & Malayalam dialogues |
| 🃏 **3. Uno Party** | **In Development** | 2–10 Players | Action card battles, Skips, Reverses, +4 Wilds |

---

## ✨ Hub Platform Features

1. 🏠 **Games Arcade & Hub**:
   - Central game selection arcade with live records and one-click play.
   - Profile summary widget (Avatar, Rank Title, Wins, Losses, Win Rate, Win Streak 🔥).

2. 👤 **Multi-Game User Profiles (`username > game > stats`)**:
   - Accounts track wins, losses, streaks, and match logs per specific game (`games.bingo`, `games.monopoly`, `games.uno`).
   - 100% backward compatibility preserves existing player records without data loss.

3. 🏆 **Multi-Game Leaderboards**:
   - Filter rankings by **All Games**, **Bingo Party**, **Monopoly**, or **Uno**.
   - Ranked badges (🥇, 🥈, 🥉) and titles (*Novice, Veteran, Sharp Shooter, Grandmaster, Legend*).

4. 💾 **Auto-Save & Resumption**:
   - Active games auto-save on every turn! Pick up right where you left off.

5. 📜 **Date-Stamped Match History**:
   - Logged with exact date, opponent, game type, result (`🏆 VICTORY` / `💀 DEFEAT`), and interactive board inspection.

6. 👥 **Multiplayer Networking**:
   - Realtime cross-device turn-based sync over WebSockets/MQTT and zero-latency local `BroadcastChannel`.

---

## 📜 How Classic 1-25 BINGO Works

1. **Board Setup**:
   - Arrange numbers **1 through 25** on your 5x5 board (manually or click **Auto-Fill / Shuffle**).
   - Click **✅ Ready to Play!**.

2. **Taking Turns**:
   - On your turn, tap any uncrossed number on your board.
   - That number is crossed out on **BOTH** players' grids with an authentic red pen slash and sound effect!

3. **Completing Lines (12 Possible Lines)**:
   - 5 Horizontal rows, 5 Vertical columns, 2 Diagonals.

4. **B - I - N - G - O Score Progression**:
   - **1st line**: **B** is struck off!
   - **2nd line**: **I** is struck off!
   - **3rd line**: **N** is struck off!
   - **4th line**: **G** is struck off!
   - **5th line**: **O** is struck off!

5. **Victory**:
   - The first player to complete all 5 letters reaches **B - I - N - G - O** and wins the match! Confetti cannons and victory fanfare celebrate the winner.
