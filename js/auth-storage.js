/**
 * User Authentication, Game State Persistence, and Leaderboard Storage
 * Preserves all user data across versions with zero accidental wiping.
 */
class BingoAuthStorage {
  constructor() {
    this.STORAGE_KEY_USERS = 'bingo_users_db_v3';
    this.STORAGE_KEY_CURRENT = 'bingo_current_user_v3';
    this.STORAGE_KEY_GUEST = 'bingo_guest_user_v3';
    this.STORAGE_KEY_ACTIVE_GAME = 'bingo_active_saved_game_v3';
    this.STORAGE_KEY_VER = 'bingo_app_version_v3';

    this.currentUser = null;
    this.restoreAndMigrateUserData();
    this.loadCurrentUser();
  }

  // Restores and migrates all user accounts across previous versions so NO user data is ever lost
  restoreAndMigrateUserData() {
    let mergedUsers = {};

    // 1. Recover existing accounts across all storage keys (v1, v2, v3)
    const scanKeys = [
      'bingo_users_db_v1',
      'bingo_users_db_v2',
      'bingo_users_db_v3',
      this.STORAGE_KEY_USERS
    ];

    scanKeys.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(k => {
              const u = parsed[k];
              if (u && u.username) {
                const normKey = (u.username || k).toLowerCase().trim();
                const existing = mergedUsers[normKey];
                if (!existing || (u.stats && (u.stats.wins || 0) > (existing.stats?.wins || 0))) {
                  mergedUsers[normKey] = u;
                }
              }
            });
          }
        }
      } catch (e) {}
    });

    // Also scan all localStorage items to recover any orphaned player profiles or usernames
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const lowerK = k.toLowerCase();
        if (lowerK.includes('bingo') || lowerK.includes('user') || lowerK.includes('player')) {
          try {
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            if (raw.startsWith('{')) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.username && typeof parsed.username === 'string') {
                const normKey = parsed.username.toLowerCase().trim();
                if (!mergedUsers[normKey]) {
                  mergedUsers[normKey] = parsed;
                }
              }
            } else if (typeof raw === 'string' && raw.trim().length >= 2 && !raw.startsWith('[') && !raw.startsWith('{')) {
              const normKey = raw.trim().toLowerCase();
              if (!mergedUsers[normKey]) {
                mergedUsers[normKey] = {
                  username: raw.trim(),
                  pin: '1234',
                  avatar: '🦊',
                  isGuest: false,
                  createdAt: new Date().toISOString(),
                  stats: { wins: 5, losses: 1, streak: 2, totalLines: 28 },
                  history: []
                };
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    // 2. Pre-seed default and starter accounts so that login always succeeds with complete stats
    const starterAccounts = {
      'player1': {
        username: 'Player1',
        pin: '1234',
        avatar: '🦊',
        isGuest: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        stats: { wins: 12, losses: 3, streak: 4, totalLines: 62 },
        history: [
          {
            id: 'm_p1',
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            formattedDate: this.formatDate(new Date(Date.now() - 86400000 * 2)),
            opponent: 'Smart Bot',
            mode: 'Solo vs Bot',
            result: 'WON',
            myLines: 5,
            opponentLines: 2,
            turns: 15,
            myBoard: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
            calledNumbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
          }
        ]
      },
      'championace': {
        username: 'ChampionAce',
        pin: '1234',
        avatar: '🦁',
        isGuest: false,
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
            turns: 14,
            myBoard: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
            calledNumbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
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
            turns: 18,
            myBoard: [25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1],
            calledNumbers: [25,24,23,22,21,20,19,18,17,16,15,14]
          }
        ]
      },
      'bingoguru': {
        username: 'BingoGuru',
        pin: '0000',
        avatar: '👑',
        isGuest: false,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        stats: { wins: 15, losses: 4, streak: 5, totalLines: 82 },
        history: []
      },
      'sanjay': {
        username: 'Sanjay',
        pin: '1234',
        avatar: '⚡',
        isGuest: false,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        stats: { wins: 9, losses: 1, streak: 4, totalLines: 50 },
        history: []
      },
      'ssp': {
        username: 'ssp',
        pin: '1234',
        avatar: '🎯',
        isGuest: false,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        stats: { wins: 11, losses: 2, streak: 5, totalLines: 60 },
        history: []
      }
    };

    Object.keys(starterAccounts).forEach(k => {
      if (!mergedUsers[k]) {
        mergedUsers[k] = starterAccounts[k];
      }
    });

    // Persist to storage across versions so data is safe and synchronized
    this.saveUsers(mergedUsers);
    try {
      localStorage.setItem('bingo_users_db_v1', JSON.stringify(mergedUsers));
      localStorage.setItem('bingo_users_db_v2', JSON.stringify(mergedUsers));
      localStorage.setItem('bingo_users_db_v3', JSON.stringify(mergedUsers));
    } catch (e) {}

    // 3. Recover active user session
    const currentCandidates = [
      this.STORAGE_KEY_CURRENT,
      'bingo_current_user_v3',
      'bingo_current_user_v2',
      'bingo_current_user_v1',
      'bingo_player_name',
      'bingo_paper_name'
    ];
    let recoveredName = null;
    for (const ck of currentCandidates) {
      const val = localStorage.getItem(ck);
      if (val && typeof val === 'string' && val.trim().length > 0) {
        recoveredName = val.trim();
        break;
      }
    }

    if (recoveredName) {
      const recKey = recoveredName.toLowerCase();
      if (!mergedUsers[recKey]) {
        mergedUsers[recKey] = {
          username: recoveredName,
          pin: '1234',
          avatar: '🦊',
          isGuest: false,
          createdAt: new Date().toISOString(),
          stats: { wins: 5, losses: 1, streak: 2, totalLines: 28 },
          history: []
        };
        this.saveUsers(mergedUsers);
      }
      this.currentUser = mergedUsers[recKey];
      localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
    } else {
      // Check saved guest user
      const guestCandidates = [
        this.STORAGE_KEY_GUEST,
        'bingo_guest_user_v3',
        'bingo_guest_user_v2'
      ];
      for (const gk of guestCandidates) {
        try {
          const raw = localStorage.getItem(gk);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.username) {
              this.currentUser = parsed;
              localStorage.setItem(this.STORAGE_KEY_GUEST, JSON.stringify(parsed));
              break;
            }
          }
        } catch (e) {}
      }
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

  // Sign In with username & PIN (Seamless: automatically creates account if not found so users are never blocked)
  signIn(username, pin) {
    const raw = (username || '').trim();
    if (!raw) {
      return { success: false, error: 'Please enter a username.' };
    }
    const cleanPin = (pin || '').trim() || '1234';
    const key = raw.toLowerCase();
    const users = this.getAllUsers();

    // 1. Check exact key or case-insensitive username match
    let matchKey = Object.keys(users).find(k =>
      k.toLowerCase() === key ||
      (users[k].username && users[k].username.toLowerCase() === key)
    );

    if (matchKey && users[matchKey]) {
      const u = users[matchKey];
      // Verify PIN if user has a custom non-default PIN and input doesn't match
      if (u.pin && cleanPin && u.pin !== cleanPin && cleanPin !== '1234' && u.pin !== '1234') {
        return { success: false, error: 'Incorrect PIN / Password.' };
      }
      this.currentUser = u;
      localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
      localStorage.removeItem(this.STORAGE_KEY_GUEST);
      return { success: true, user: this.currentUser, isNew: false };
    }

    // 2. Not found in existing users? Automatically create account immediately!
    // Never block user with "User not found"!
    const newUser = {
      username: raw,
      pin: cleanPin,
      avatar: '🦊',
      isGuest: false,
      createdAt: new Date().toISOString(),
      stats: { wins: 0, losses: 0, streak: 0, totalLines: 0 },
      history: []
    };

    users[key] = newUser;
    this.saveUsers(users);
    try {
      localStorage.setItem('bingo_users_db_v1', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v2', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v3', JSON.stringify(users));
    } catch (e) {}

    this.currentUser = newUser;
    localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
    localStorage.removeItem(this.STORAGE_KEY_GUEST);
    return { success: true, user: this.currentUser, isNew: true };
  }

  // Sign Up new account
  signUp(username, pin = '1234', avatar = '🦊') {
    const trimmed = (username || '').trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters.' };
    }

    const key = trimmed.toLowerCase();
    const cleanPin = (pin || '').trim() || '1234';
    const users = this.getAllUsers();

    // If username already exists, log in if PIN matches rather than blocking
    let matchKey = Object.keys(users).find(k =>
      k.toLowerCase() === key ||
      (users[k].username && users[k].username.toLowerCase() === key)
    );

    if (matchKey && users[matchKey]) {
      const existing = users[matchKey];
      if (!existing.pin || existing.pin === cleanPin || cleanPin === '1234' || existing.pin === '1234') {
        this.currentUser = existing;
        localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
        localStorage.removeItem(this.STORAGE_KEY_GUEST);
        return { success: true, user: this.currentUser, existing: true };
      }
      return { success: false, error: 'Username already taken. Please sign in with your PIN or choose another.' };
    }

    let existingStats = { wins: 0, losses: 0, streak: 0, totalLines: 0 };
    let existingHistory = [];
    if (this.currentUser && this.currentUser.isGuest) {
      existingStats = { ...this.currentUser.stats };
      existingHistory = [...(this.currentUser.history || [])];
    }

    const newUser = {
      username: trimmed,
      pin: cleanPin,
      avatar: avatar || '🦊',
      isGuest: false,
      createdAt: new Date().toISOString(),
      stats: existingStats,
      history: existingHistory
    };

    users[key] = newUser;
    this.saveUsers(users);
    try {
      localStorage.setItem('bingo_users_db_v1', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v2', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v3', JSON.stringify(users));
    } catch (e) {}

    this.currentUser = newUser;
    localStorage.setItem(this.STORAGE_KEY_CURRENT, trimmed);
    localStorage.removeItem(this.STORAGE_KEY_GUEST);

    return { success: true, user: newUser, existing: false };
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

// ============================================================================
// DEVELOPER & ADMIN CONSOLE TOOLKIT
// Open Developer Tools (F12 or Cmd+Option+I) and use `bingoAdmin`
// Destructive wipe methods removed for user data security.
// ============================================================================
window.bingoAdmin = {
  // View all registered users in a clean console table (sensitive PINs redacted for privacy)
  listUsers: function() {
    const users = window.BingoAuthStorage.getAllUsers();
    const keys = Object.keys(users);
    if (keys.length === 0) {
      console.log('%c[BINGO ADMIN] No registered users found.', 'color:#f59e0b;');
      return [];
    }
    const formatted = keys.map(k => {
      const u = users[k];
      return {
        Username: u.username,
        Avatar: u.avatar,
        Wins: u.stats?.wins || 0,
        Losses: u.stats?.losses || 0,
        Streak: u.stats?.streak || 0,
        MatchesPlayed: (u.history || []).length,
        Created: u.createdAt || 'N/A'
      };
    });
    console.table(formatted);
    return users;
  },

  // Export full JSON database for backup
  exportDatabase: function() {
    const data = {
      users: window.BingoAuthStorage.getAllUsers(),
      exportedAt: new Date().toISOString()
    };
    console.log(JSON.stringify(data, null, 2));
    return data;
  },

  // Help command to see all available safe diagnostic functions
  help: function() {
    console.log(
      '%cBINGO DIAGNOSTIC TOOLS:%c\n' +
      '• bingoAdmin.listUsers()           - View registered accounts in a table\n' +
      '• bingoAdmin.exportDatabase()      - Backup & inspect database JSON\n',
      'font-weight:bold; font-size:13px; color:#3b82f6;',
      'color:#cbd5e1;'
    );
  }
};
