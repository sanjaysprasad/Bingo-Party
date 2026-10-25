/**
 * User Authentication, Game State Persistence, and Leaderboard Storage
 * No random default accounts. Supports Guest Mode, Login, Sign Up, and Cache Clearing.
 */
class BingoAuthStorage {
  constructor() {
    this.STORAGE_KEY_USERS = 'bingo_users_db_v2';
    this.STORAGE_KEY_CURRENT = 'bingo_current_user_v2';
    this.STORAGE_KEY_GUEST = 'bingo_guest_user_v2';
    this.STORAGE_KEY_ACTIVE_GAME = 'bingo_active_saved_game_v2';
    this.STORAGE_KEY_VER = 'bingo_app_version';

    this.currentUser = null;
    this.purgeLegacyCaches();
    this.loadCurrentUser();
  }

  // Automatically purges all legacy v1 cached demo accounts
  purgeLegacyCaches() {
    try {
      const keys = [
        'bingo_users_db_v1',
        'bingo_current_user_v1',
        'bingo_active_saved_game_v1',
        'bingo_shared_leaderboard_v1',
        'bingo_player_name',
        'bingo_dauber_color'
      ];
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  // 1-Click Hard Reset of all local game cache and reload
  clearAllCache() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies if any
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = window.location.pathname + '?nocache=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  }

  getAllUsers() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_USERS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveUsers(users) {
    localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
  }

  loadCurrentUser() {
    // 1. Check logged-in registered user
    const username = localStorage.getItem(this.STORAGE_KEY_CURRENT);
    if (username) {
      const users = this.getAllUsers();
      if (users[username.toLowerCase()]) {
        this.currentUser = users[username.toLowerCase()];
        return this.currentUser;
      }
    }

    // 2. Check saved guest user
    try {
      const guestData = localStorage.getItem(this.STORAGE_KEY_GUEST);
      if (guestData) {
        this.currentUser = JSON.parse(guestData);
        return this.currentUser;
      }
    } catch (e) {}

    // 3. No default accounts! User must choose Guest or Login or Sign Up
    this.currentUser = null;
    return null;
  }

  hasSession() {
    return this.currentUser !== null;
  }

  // Play as Guest (no password required)
  playAsGuest(nickname = '') {
    const name = (nickname || '').trim() || 'Guest_' + Math.floor(100 + Math.random() * 900);
    this.currentUser = {
      username: name,
      isGuest: true,
      avatar: '👤',
      createdAt: new Date().toISOString(),
      stats: { wins: 0, losses: 0, streak: 0, totalLines: 0 },
      history: []
    };
    localStorage.setItem(this.STORAGE_KEY_GUEST, JSON.stringify(this.currentUser));
    localStorage.removeItem(this.STORAGE_KEY_CURRENT);
    return { success: true, user: this.currentUser };
  }

  // Sign In with username & PIN
  signIn(username, pin) {
    const key = (username || '').trim().toLowerCase();
    const users = this.getAllUsers();

    if (!key || !users[key]) {
      return { success: false, error: 'User not found. Please Sign Up to create your profile!' };
    }

    if (users[key].pin && users[key].pin !== (pin || '').trim()) {
      return { success: false, error: 'Incorrect PIN / Password.' };
    }

    this.currentUser = users[key];
    localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
    localStorage.removeItem(this.STORAGE_KEY_GUEST);
    return { success: true, user: this.currentUser };
  }

  // Sign Up new account
  signUp(username, pin = '1234', avatar = '🦊') {
    const trimmed = (username || '').trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters.' };
    }

    const key = trimmed.toLowerCase();
    const users = this.getAllUsers();

    if (users[key]) {
      return { success: false, error: 'Username already taken. Please sign in or choose another.' };
    }

    let existingStats = { wins: 0, losses: 0, streak: 0, totalLines: 0 };
    let existingHistory = [];
    if (this.currentUser && this.currentUser.isGuest) {
      existingStats = { ...this.currentUser.stats };
      existingHistory = [...(this.currentUser.history || [])];
    }

    const newUser = {
      username: trimmed,
      pin: (pin || '').trim() || '1234',
      avatar: avatar || '🦊',
      isGuest: false,
      createdAt: new Date().toISOString(),
      stats: existingStats,
      history: existingHistory
    };

    users[key] = newUser;
    this.saveUsers(users);
    this.currentUser = newUser;
    localStorage.setItem(this.STORAGE_KEY_CURRENT, trimmed);
    localStorage.removeItem(this.STORAGE_KEY_GUEST);

    return { success: true, user: newUser };
  }

  // Sign Out
  signOut() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY_CURRENT);
    localStorage.removeItem(this.STORAGE_KEY_GUEST);
    this.clearActiveGame();
  }

  formatDate(dateObj) {
    const d = new Date(dateObj);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' • ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Record completed match to user's history with date & time
  recordMatchResult({ opponent, mode, result, myLines, opponentLines, turns, myBoard, calledNumbers }) {
    if (!this.currentUser) return;

    const now = new Date();
    const matchRecord = {
      id: 'match_' + Date.now(),
      date: now.toISOString(),
      formattedDate: this.formatDate(now),
      opponent: opponent || 'Opponent',
      mode: mode || 'Multiplayer',
      result: result, // 'WON' | 'LOST' | 'TIED'
      myLines: myLines || 0,
      opponentLines: opponentLines || 0,
      turns: turns || 0,
      myBoard: myBoard ? [...myBoard] : [],
      calledNumbers: calledNumbers ? Array.from(calledNumbers) : []
    };

    const stats = this.currentUser.stats || { wins: 0, losses: 0, streak: 0, totalLines: 0 };
    if (result === 'WON') {
      stats.wins += 1;
      stats.streak += 1;
    } else if (result === 'LOST') {
      stats.losses += 1;
      stats.streak = 0;
    }
    stats.totalLines += (myLines || 0);

    this.currentUser.stats = stats;
    if (!this.currentUser.history) this.currentUser.history = [];
    this.currentUser.history.unshift(matchRecord);

    if (this.currentUser.history.length > 50) {
      this.currentUser.history.pop();
    }

    if (this.currentUser.isGuest) {
      localStorage.setItem(this.STORAGE_KEY_GUEST, JSON.stringify(this.currentUser));
    } else {
      const users = this.getAllUsers();
      users[this.currentUser.username.toLowerCase()] = this.currentUser;
      this.saveUsers(users);
    }

    this.clearActiveGame();
    return matchRecord;
  }

  // Active Game state persistence
  saveActiveGame(gameState) {
    if (!this.currentUser) return;
    try {
      const payload = {
        userId: this.currentUser.username,
        isGuest: !!this.currentUser.isGuest,
        savedAt: new Date().toISOString(),
        formattedDate: this.formatDate(new Date()),
        mode: gameState.mode,
        roomCode: gameState.roomCode,
        isMyTurn: gameState.isMyTurn,
        opponentName: gameState.opponentName,
        opponentLinesCount: gameState.opponentLinesCount,
        gameBoard: gameState.gameBoard,
        botBoard: gameState.botBoard,
        calledNumbers: Array.from(gameState.calledNumbers)
      };
      localStorage.setItem(this.STORAGE_KEY_ACTIVE_GAME, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save active game:', e);
    }
  }

  loadActiveGame() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_ACTIVE_GAME);
      if (!data) return null;
      const game = JSON.parse(data);
      if (this.currentUser && game.userId !== this.currentUser.username) {
        return null;
      }
      return game;
    } catch (e) {
      return null;
    }
  }

  clearActiveGame() {
    localStorage.removeItem(this.STORAGE_KEY_ACTIVE_GAME);
  }

  getLeaderboard() {
    const users = this.getAllUsers();
    const list = Object.values(users).map(u => {
      const wins = u.stats?.wins || 0;
      const losses = u.stats?.losses || 0;
      const totalGames = wins + losses;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
      const streak = u.stats?.streak || 0;
      const totalLines = u.stats?.totalLines || 0;

      let rankTitle = 'Novice';
      if (wins >= 25) rankTitle = 'Legend 👑';
      else if (wins >= 15) rankTitle = 'Grandmaster ⭐';
      else if (wins >= 8) rankTitle = 'Sharp Shooter 🎯';
      else if (wins >= 3) rankTitle = 'Veteran ⚡';

      return {
        username: u.username,
        avatar: u.avatar || '👤',
        isGuest: !!u.isGuest,
        wins: wins,
        losses: losses,
        totalGames: totalGames,
        winRate: winRate,
        streak: streak,
        totalLines: totalLines,
        rankTitle: rankTitle
      };
    });

    if (this.currentUser && this.currentUser.isGuest && (this.currentUser.stats.wins > 0 || this.currentUser.stats.losses > 0)) {
      const gWins = this.currentUser.stats.wins;
      const gLosses = this.currentUser.stats.losses;
      const gTotal = gWins + gLosses;
      const gRate = gTotal > 0 ? Math.round((gWins / gTotal) * 100) : 0;
      list.push({
        username: this.currentUser.username + ' (Guest)',
        avatar: '👤',
        isGuest: true,
        wins: gWins,
        losses: gLosses,
        totalGames: gTotal,
        winRate: gRate,
        streak: this.currentUser.stats.streak,
        totalLines: this.currentUser.stats.totalLines,
        rankTitle: 'Guest Player'
      });
    }

    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });

    return list;
  }
}

window.BingoAuthStorage = new BingoAuthStorage();
