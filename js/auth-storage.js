/**
 * User Authentication, Game State Persistence, and Leaderboard Storage
 * Stores profiles, match history with dates, ongoing game resumption,
 * and leaderboard stats using localStorage and MQTT synchronization.
 */
class BingoAuthStorage {
  constructor() {
    this.STORAGE_KEY_USERS = 'bingo_users_db_v1';
    this.STORAGE_KEY_CURRENT = 'bingo_current_user_v1';
    this.STORAGE_KEY_ACTIVE_GAME = 'bingo_active_saved_game_v1';
    this.STORAGE_KEY_LEADERBOARD = 'bingo_shared_leaderboard_v1';

    this.currentUser = null;
    this.initDefaultUsers();
    this.loadCurrentUser();
  }

  // Initialize DB with starter/demo accounts if empty
  initDefaultUsers() {
    let users = this.getAllUsers();
    if (!users || Object.keys(users).length === 0) {
      users = {
        'player1': {
          username: 'ChampionAce',
          pin: '1234',
          avatar: '🦁',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          stats: { wins: 8, losses: 2, streak: 3, totalLines: 46 },
          history: [
            {
              id: 'm_1',
              date: new Date(Date.now() - 86400000 * 2).toISOString(),
              formattedDate: this.formatDate(new Date(Date.now() - 86400000 * 2)),
              opponent: 'Smart Bot',
              mode: 'Solo vs Bot',
              result: 'WON',
              myLines: 5,
              opponentLines: 3,
              turns: 14
            },
            {
              id: 'm_2',
              date: new Date(Date.now() - 86400000).toISOString(),
              formattedDate: this.formatDate(new Date(Date.now() - 86400000)),
              opponent: 'Alex_Pro',
              mode: 'Multiplayer (Room: BING)',
              result: 'WON',
              myLines: 5,
              opponentLines: 4,
              turns: 18
            }
          ]
        },
        'grandmaster': {
          username: 'BingoGuru',
          pin: '0000',
          avatar: '👑',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          stats: { wins: 15, losses: 4, streak: 5, totalLines: 82 },
          history: []
        }
      };
      localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
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
    const username = localStorage.getItem(this.STORAGE_KEY_CURRENT);
    const users = this.getAllUsers();
    if (username && users[username.toLowerCase()]) {
      this.currentUser = users[username.toLowerCase()];
    } else {
      // Create default guest user if none exists
      this.currentUser = Object.values(users)[0] || this.signUp('Player1', '1234', '🦊');
      localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
    }
    return this.currentUser;
  }

  // Sign In with username & PIN
  signIn(username, pin) {
    const key = (username || '').trim().toLowerCase();
    const users = this.getAllUsers();

    if (!users[key]) {
      return { success: false, error: 'User not found. Sign up to create a new profile!' };
    }

    if (users[key].pin && users[key].pin !== pin) {
      return { success: false, error: 'Incorrect PIN / Password.' };
    }

    this.currentUser = users[key];
    localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
    return { success: true, user: this.currentUser };
  }

  // Sign Up new account
  signUp(username, pin = '1234', avatar = '⭐') {
    const trimmed = (username || '').trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters.' };
    }

    const key = trimmed.toLowerCase();
    const users = this.getAllUsers();

    if (users[key]) {
      return { success: false, error: 'Username already taken. Please sign in or choose another.' };
    }

    const newUser = {
      username: trimmed,
      pin: pin || '1234',
      avatar: avatar || '⭐',
      createdAt: new Date().toISOString(),
      stats: { wins: 0, losses: 0, streak: 0, totalLines: 0 },
      history: []
    };

    users[key] = newUser;
    this.saveUsers(users);
    this.currentUser = newUser;
    localStorage.setItem(this.STORAGE_KEY_CURRENT, trimmed);

    return { success: true, user: newUser };
  }

  signOut() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY_CURRENT);
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

  // Save completed match to user's history with date & time
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

    // Update stats
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
    this.currentUser.history.unshift(matchRecord); // newest first

    // Limit history to last 50 matches
    if (this.currentUser.history.length > 50) {
      this.currentUser.history.pop();
    }

    // Persist to DB
    const users = this.getAllUsers();
    users[this.currentUser.username.toLowerCase()] = this.currentUser;
    this.saveUsers(users);

    // Clear any active saved game
    this.clearActiveGame();

    return matchRecord;
  }

  // =========================================================================
  // ACTIVE GAME STATE PERSISTENCE (Resume game where left off)
  // =========================================================================
  saveActiveGame(gameState) {
    if (!this.currentUser) return;
    try {
      const payload = {
        userId: this.currentUser.username,
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
        return null; // belongs to another user
      }
      return game;
    } catch (e) {
      return null;
    }
  }

  clearActiveGame() {
    localStorage.removeItem(this.STORAGE_KEY_ACTIVE_GAME);
  }

  // =========================================================================
  // LEADERBOARD AGGREGATION
  // =========================================================================
  getLeaderboard() {
    const users = this.getAllUsers();
    const list = Object.values(users).map(u => {
      const wins = u.stats?.wins || 0;
      const losses = u.stats?.losses || 0;
      const totalGames = wins + losses;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
      const streak = u.stats?.streak || 0;
      const totalLines = u.stats?.totalLines || 0;

      // Calculate Rank Level Title
      let rankTitle = 'Novice';
      if (wins >= 25) rankTitle = 'BINGO Legend 👑';
      else if (wins >= 15) rankTitle = 'Grandmaster ⭐';
      else if (wins >= 8) rankTitle = 'Sharp Shooter 🎯';
      else if (wins >= 3) rankTitle = 'Veteran ⚡';

      return {
        username: u.username,
        avatar: u.avatar || '👤',
        wins: wins,
        losses: losses,
        totalGames: totalGames,
        winRate: winRate,
        streak: streak,
        totalLines: totalLines,
        rankTitle: rankTitle
      };
    });

    // Sort by wins (descending), then winRate (descending)
    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });

    return list;
  }
}

window.BingoAuthStorage = new BingoAuthStorage();
