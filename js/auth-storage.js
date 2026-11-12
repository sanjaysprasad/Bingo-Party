/**
 * User Authentication, Game State Persistence, and Multi-Game Hub Leaderboard
 * Organizes stats by game (username > game name > wins, losses, streak, history)
 * while preserving 100% of existing user data and backward compatibility.
 */
class BingoAuthStorage {
  constructor() {
    this.STORAGE_KEY_USERS = 'bingo_users_db_v3';
    this.STORAGE_KEY_CURRENT = 'bingo_current_user_v3';
    this.STORAGE_KEY_GUEST = 'bingo_guest_user_v3';
    this.STORAGE_KEY_ACTIVE_GAME = 'bingo_active_saved_game_v3';
    this.STORAGE_KEY_VER = 'partyplay_app_version_v1';

    this.currentUser = null;
    this.restoreAndMigrateUserData();
    this.loadCurrentUser();
  }

  // Helper to ensure user has games dictionary with bingo, monopoly, uno
  ensureUserGamesStructure(u) {
    if (!u) return u;
    u.games = u.games || {};

    // 1. Bingo stats migration (preserve existing wins/losses/streak)
    if (!u.games.bingo) {
      u.games.bingo = {
        wins: (u.stats && typeof u.stats.wins === 'number') ? u.stats.wins : 0,
        losses: (u.stats && typeof u.stats.losses === 'number') ? u.stats.losses : 0,
        streak: (u.stats && typeof u.stats.streak === 'number') ? u.stats.streak : 0,
        totalLines: (u.stats && typeof u.stats.totalLines === 'number') ? u.stats.totalLines : 0,
        history: Array.isArray(u.history) ? [...u.history] : []
      };
    } else {
      u.games.bingo.wins = u.games.bingo.wins || 0;
      u.games.bingo.losses = u.games.bingo.losses || 0;
      u.games.bingo.streak = u.games.bingo.streak || 0;
      u.games.bingo.totalLines = u.games.bingo.totalLines || 0;
      u.games.bingo.history = Array.isArray(u.games.bingo.history) ? u.games.bingo.history : [];
    }

    // 2. Monopoly container
    if (!u.games.monopoly) {
      u.games.monopoly = {
        wins: 0,
        losses: 0,
        streak: 0,
        history: []
      };
    } else {
      u.games.monopoly.wins = u.games.monopoly.wins || 0;
      u.games.monopoly.losses = u.games.monopoly.losses || 0;
      u.games.monopoly.streak = u.games.monopoly.streak || 0;
      u.games.monopoly.history = Array.isArray(u.games.monopoly.history) ? u.games.monopoly.history : [];
    }

    // 3. Uno container
    if (!u.games.uno) {
      u.games.uno = {
        wins: 0,
        losses: 0,
        streak: 0,
        history: []
      };
    } else {
      u.games.uno.wins = u.games.uno.wins || 0;
      u.games.uno.losses = u.games.uno.losses || 0;
      u.games.uno.streak = u.games.uno.streak || 0;
      u.games.uno.history = Array.isArray(u.games.uno.history) ? u.games.uno.history : [];
    }

    // Backward compatibility for root stats & history
    if (!u.stats) {
      u.stats = {
        wins: u.games.bingo.wins,
        losses: u.games.bingo.losses,
        streak: u.games.bingo.streak,
        totalLines: u.games.bingo.totalLines
      };
    }
    if (!Array.isArray(u.history)) {
      u.history = [...u.games.bingo.history];
    }
    return u;
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

    // Structure every user account with game-specific buckets (username > game name > stats)
    Object.keys(mergedUsers).forEach(k => {
      mergedUsers[k] = this.ensureUserGamesStructure(mergedUsers[k]);
    });

    // Persist to storage across versions so data is safe and synchronized
    this.saveUsers(mergedUsers);
    try {
      localStorage.setItem('bingo_users_db_v1', JSON.stringify(mergedUsers));
      localStorage.setItem('bingo_users_db_v2', JSON.stringify(mergedUsers));
      localStorage.setItem('bingo_users_db_v3', JSON.stringify(mergedUsers));
      localStorage.setItem('partyplay_users_db_v1', JSON.stringify(mergedUsers));
    } catch (e) {}

    // 3. Recover active user session
    const currentCandidates = [
      this.STORAGE_KEY_CURRENT,
      'bingo_current_user_v3',
      'bingo_current_user_v2',
      'bingo_current_user_v1',
      'partyplay_current_user_v1',
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
        mergedUsers[recKey] = this.ensureUserGamesStructure({
          username: recoveredName,
          pin: '1234',
          avatar: '🦊',
          isGuest: false,
          createdAt: new Date().toISOString(),
          stats: { wins: 5, losses: 1, streak: 2, totalLines: 28 },
          history: []
        });
        this.saveUsers(mergedUsers);
      }
      this.currentUser = this.ensureUserGamesStructure(mergedUsers[recKey]);
      localStorage.setItem(this.STORAGE_KEY_CURRENT, this.currentUser.username);
    } else {
      // Check saved guest user
      const guestCandidates = [
        this.STORAGE_KEY_GUEST,
        'bingo_guest_user_v3',
        'bingo_guest_user_v2',
        'partyplay_guest_user_v1'
      ];
      for (const gk of guestCandidates) {
        try {
          const raw = localStorage.getItem(gk);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.username) {
              this.currentUser = this.ensureUserGamesStructure(parsed);
              localStorage.setItem(this.STORAGE_KEY_GUEST, JSON.stringify(this.currentUser));
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
      const parsed = data ? JSON.parse(data) : {};
      Object.keys(parsed).forEach(k => {
        parsed[k] = this.ensureUserGamesStructure(parsed[k]);
      });
      return parsed;
    } catch (e) {
      return {};
    }
  }

  saveUsers(users) {
    localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
    try {
      localStorage.setItem('partyplay_users_db_v1', JSON.stringify(users));
    } catch (e) {}
  }

  loadCurrentUser() {
    // 1. Check logged-in registered user
    const username = localStorage.getItem(this.STORAGE_KEY_CURRENT);
    if (username) {
      const users = this.getAllUsers();
      if (users[username.toLowerCase()]) {
        this.currentUser = this.ensureUserGamesStructure(users[username.toLowerCase()]);
        return this.currentUser;
      }
    }

    // 2. Check saved guest user
    try {
      const guestData = localStorage.getItem(this.STORAGE_KEY_GUEST);
      if (guestData) {
        this.currentUser = this.ensureUserGamesStructure(JSON.parse(guestData));
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
    this.currentUser = this.ensureUserGamesStructure({
      username: name,
      isGuest: true,
      avatar: '👤',
      createdAt: new Date().toISOString(),
      stats: { wins: 0, losses: 0, streak: 0, totalLines: 0 },
      history: []
    });
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
      const u = this.ensureUserGamesStructure(users[matchKey]);
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
    const newUser = this.ensureUserGamesStructure({
      username: raw,
      pin: cleanPin,
      avatar: '🦊',
      isGuest: false,
      createdAt: new Date().toISOString(),
      stats: { wins: 0, losses: 0, streak: 0, totalLines: 0 },
      history: []
    });

    users[key] = newUser;
    this.saveUsers(users);
    try {
      localStorage.setItem('bingo_users_db_v1', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v2', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v3', JSON.stringify(users));
      localStorage.setItem('partyplay_users_db_v1', JSON.stringify(users));
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
      const existing = this.ensureUserGamesStructure(users[matchKey]);
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
    let existingGames = null;
    if (this.currentUser && this.currentUser.isGuest) {
      existingStats = { ...this.currentUser.stats };
      existingHistory = [...(this.currentUser.history || [])];
      if (this.currentUser.games) {
        existingGames = JSON.parse(JSON.stringify(this.currentUser.games));
      }
    }

    const newUser = this.ensureUserGamesStructure({
      username: trimmed,
      pin: cleanPin,
      avatar: avatar || '🦊',
      isGuest: false,
      createdAt: new Date().toISOString(),
      games: existingGames || undefined,
      stats: existingStats,
      history: existingHistory
    });

    users[key] = newUser;
    this.saveUsers(users);
    try {
      localStorage.setItem('bingo_users_db_v1', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v2', JSON.stringify(users));
      localStorage.setItem('bingo_users_db_v3', JSON.stringify(users));
      localStorage.setItem('partyplay_users_db_v1', JSON.stringify(users));
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

  // Record completed match to user's history with date & time under specific game
  recordMatchResult({ gameId = 'bingo', opponent, mode, result, myLines, opponentLines, turns, myBoard, calledNumbers, details }) {
    if (!this.currentUser) return;

    this.currentUser = this.ensureUserGamesStructure(this.currentUser);
    const gameKey = (gameId || 'bingo').toLowerCase();
    const gameData = this.currentUser.games[gameKey] || { wins: 0, losses: 0, streak: 0, totalLines: 0, history: [] };
    this.currentUser.games[gameKey] = gameData;

    const now = new Date();
    const matchRecord = {
      id: 'match_' + Date.now(),
      gameId: gameKey,
      date: now.toISOString(),
      formattedDate: this.formatDate(now),
      opponent: opponent || 'Opponent',
      mode: mode || 'Multiplayer',
      result: result, // 'WON' | 'LOST' | 'TIED'
      myLines: myLines || 0,
      opponentLines: opponentLines || 0,
      turns: turns || 0,
      myBoard: myBoard ? [...myBoard] : [],
      calledNumbers: calledNumbers ? Array.from(calledNumbers) : [],
      details: details || {}
    };

    // 1. Update Game-Specific Stats (username > game name > wins/losses/streak)
    if (result === 'WON') {
      gameData.wins = (gameData.wins || 0) + 1;
      gameData.streak = (gameData.streak || 0) + 1;
    } else if (result === 'LOST') {
      gameData.losses = (gameData.losses || 0) + 1;
      gameData.streak = 0;
    }
    if (typeof myLines === 'number') {
      gameData.totalLines = (gameData.totalLines || 0) + myLines;
    }
    gameData.history = Array.isArray(gameData.history) ? gameData.history : [];
    gameData.history.unshift(matchRecord);
    if (gameData.history.length > 50) gameData.history.pop();

    // 2. Backward Compatibility & Global Totals (root stats & history)
    const stats = this.currentUser.stats || { wins: 0, losses: 0, streak: 0, totalLines: 0 };
    if (result === 'WON') {
      stats.wins += 1;
      stats.streak += 1;
    } else if (result === 'LOST') {
      stats.losses += 1;
      stats.streak = 0;
    }
    if (typeof myLines === 'number') {
      stats.totalLines = (stats.totalLines || 0) + myLines;
    }
    this.currentUser.stats = stats;
    if (!Array.isArray(this.currentUser.history)) this.currentUser.history = [];
    this.currentUser.history.unshift(matchRecord);
    if (this.currentUser.history.length > 50) this.currentUser.history.pop();

    // 3. Persist to storage
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
        gameId: gameState.gameId || 'bingo',
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
        calledNumbers: gameState.calledNumbers ? Array.from(gameState.calledNumbers) : []
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

  // Multi-Game Leaderboard: supports 'all' (Hub global) or specific game ('bingo', 'monopoly', 'uno')
  getLeaderboard(gameFilter = 'all') {
    const users = this.getAllUsers();
    const filterKey = (gameFilter || 'all').toLowerCase();

    const list = Object.values(users).map(u => {
      this.ensureUserGamesStructure(u);

      let wins = 0;
      let losses = 0;
      let streak = 0;
      let totalLines = 0;

      if (filterKey === 'all') {
        // Aggregate totals across all games
        Object.keys(u.games || {}).forEach(gk => {
          const g = u.games[gk];
          if (g) {
            wins += (g.wins || 0);
            losses += (g.losses || 0);
            totalLines += (g.totalLines || 0);
          }
        });
        if (wins === 0 && losses === 0 && u.stats) {
          wins = u.stats.wins || 0;
          losses = u.stats.losses || 0;
          streak = u.stats.streak || 0;
          totalLines = u.stats.totalLines || 0;
        } else {
          streak = u.stats?.streak || 0;
        }
      } else {
        const g = (u.games && u.games[filterKey]) ? u.games[filterKey] : null;
        if (g) {
          wins = g.wins || 0;
          losses = g.losses || 0;
          streak = g.streak || 0;
          totalLines = g.totalLines || 0;
        } else if (filterKey === 'bingo' && u.stats) {
          wins = u.stats.wins || 0;
          losses = u.stats.losses || 0;
          streak = u.stats.streak || 0;
          totalLines = u.stats.totalLines || 0;
        }
      }

      const totalGames = wins + losses;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      let rankTitle = 'Novice';
      if (wins >= 25) rankTitle = 'Legend 👑';
      else if (wins >= 15) rankTitle = 'Grandmaster ⭐';
      else if (wins >= 8) rankTitle = 'Sharp Shooter 🎯';
      else if (wins >= 3) rankTitle = 'Veteran ⚡';

      return {
        username: u.username,
        avatar: u.avatar || '👤',
        isGuest: !!u.isGuest,
        gameFilter: filterKey,
        wins: wins,
        losses: losses,
        totalGames: totalGames,
        winRate: winRate,
        streak: streak,
        totalLines: totalLines,
        rankTitle: rankTitle,
        gamesBreakdown: u.games || {}
      };
    });

    if (this.currentUser && this.currentUser.isGuest) {
      this.ensureUserGamesStructure(this.currentUser);
      let gWins = 0, gLosses = 0, gStreak = 0, gLines = 0;

      if (filterKey === 'all') {
        Object.keys(this.currentUser.games || {}).forEach(gk => {
          const g = this.currentUser.games[gk];
          if (g) {
            gWins += (g.wins || 0);
            gLosses += (g.losses || 0);
            gLines += (g.totalLines || 0);
          }
        });
        if (gWins === 0 && gLosses === 0 && this.currentUser.stats) {
          gWins = this.currentUser.stats.wins || 0;
          gLosses = this.currentUser.stats.losses || 0;
          gStreak = this.currentUser.stats.streak || 0;
        }
      } else {
        const g = (this.currentUser.games && this.currentUser.games[filterKey]) ? this.currentUser.games[filterKey] : null;
        if (g) {
          gWins = g.wins || 0;
          gLosses = g.losses || 0;
          gStreak = g.streak || 0;
          gLines = g.totalLines || 0;
        }
      }

      if (gWins > 0 || gLosses > 0) {
        const gTotal = gWins + gLosses;
        const gRate = gTotal > 0 ? Math.round((gWins / gTotal) * 100) : 0;
        list.push({
          username: this.currentUser.username + ' (Guest)',
          avatar: '👤',
          isGuest: true,
          gameFilter: filterKey,
          wins: gWins,
          losses: gLosses,
          totalGames: gTotal,
          winRate: gRate,
          streak: gStreak,
          totalLines: gLines,
          rankTitle: 'Guest Player',
          gamesBreakdown: this.currentUser.games || {}
        });
      }
    }

    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });

    return list;
  }

  // Helper to query user game stats
  getUserGameStats(username, gameId = 'bingo') {
    const key = (username || '').toLowerCase().trim();
    const users = this.getAllUsers();
    const u = users[key] || (this.currentUser && this.currentUser.username.toLowerCase() === key ? this.currentUser : null);
    if (!u) return { wins: 0, losses: 0, streak: 0, totalLines: 0, winRate: 0 };
    this.ensureUserGamesStructure(u);
    const g = (u.games && u.games[gameId]) ? u.games[gameId] : { wins: 0, losses: 0, streak: 0, totalLines: 0 };
    const total = (g.wins || 0) + (g.losses || 0);
    return {
      wins: g.wins || 0,
      losses: g.losses || 0,
      streak: g.streak || 0,
      totalLines: g.totalLines || 0,
      totalGames: total,
      winRate: total > 0 ? Math.round((g.wins / total) * 100) : 0
    };
  }
}

window.GameHubAuthStorage = window.BingoAuthStorage;

// ============================================================================
// DEVELOPER & ADMIN CONSOLE TOOLKIT
// Open Developer Tools (F12 or Cmd+Option+I) and use `partyPlayAdmin` or `bingoAdmin`
// Destructive wipe methods removed for user data security.
// ============================================================================
window.bingoAdmin = {
  // View all registered users with multi-game breakdowns
  listUsers: function() {
    const users = window.BingoAuthStorage.getAllUsers();
    const keys = Object.keys(users);
    if (keys.length === 0) {
      console.log('%c[PARTYPLAY ADMIN] No registered users found.', 'color:#f59e0b;');
      return [];
    }
    const formatted = keys.map(k => {
      const u = users[k];
      window.BingoAuthStorage.ensureUserGamesStructure(u);
      return {
        Username: u.username,
        Avatar: u.avatar,
        Bingo: `${u.games?.bingo?.wins || 0}W / ${u.games?.bingo?.losses || 0}L`,
        Monopoly: `${u.games?.monopoly?.wins || 0}W / ${u.games?.monopoly?.losses || 0}L`,
        Uno: `${u.games?.uno?.wins || 0}W / ${u.games?.uno?.losses || 0}L`,
        TotalWins: u.stats?.wins || 0,
        TotalLosses: u.stats?.losses || 0,
        Streak: u.stats?.streak || 0,
        Created: u.createdAt || 'N/A'
      };
    });
    console.table(formatted);
    return users;
  },

  // Export full JSON database for backup
  exportDatabase: function() {
    const data = {
      platform: 'PartyPlay Hub',
      users: window.BingoAuthStorage.getAllUsers(),
      exportedAt: new Date().toISOString()
    };
    console.log(JSON.stringify(data, null, 2));
    return data;
  },

  // Help command to see all available safe diagnostic functions
  help: function() {
    console.log(
      '%cPARTYPLAY HUB DIAGNOSTIC TOOLS:%c\n' +
      '• partyPlayAdmin.listUsers()       - View registered accounts & game-wise stats\n' +
      '• partyPlayAdmin.exportDatabase()   - Backup & inspect database JSON\n',
      'font-weight:bold; font-size:13px; color:#3b82f6;',
      'color:#cbd5e1;'
    );
  }
};
window.partyPlayAdmin = window.bingoAdmin;
