/**
 * Classic 1-25 Pen-and-Paper BINGO - Main Application Coordinator
 * Handles Navigation, Authentication, Ongoing Game Resumption,
 * Match History with Dates, Leaderboard, and Realtime Gameplay.
 */
class BingoApp {
  constructor() {
    this.state = {
      mode: 'bot',              // 'bot' | 'multiplayer'
      roomCode: '',
      isHost: false,
      isMyTurn: false,
      opponentName: 'Smart Bot',
      opponentLinesCount: 0,
      setupBoard: Array(25).fill(null),
      setupRemaining: new Set(Array.from({ length: 25 }, (_, i) => i + 1)),
      gameBoard: [],            // 25 numbers
      botBoard: [],             // Bot's 25 numbers
      calledNumbers: new Set(),
      myCompletedLineIds: new Set(),
      isGameOver: false,
      isOpponentReady: false,
      amIReady: false,
      turnCount: 0
    };

    this.initDOM();
    this.setupNavigation();
    this.setupAuth();
    this.setupGameEvents();
    this.setupMultiplayerListeners();
    this.refreshUserProfileUI();
    this.checkSavedActiveGame();
    this.checkUrlRoomParam();
  }

  initDOM() {
    this.dom = {
      // Views
      viewHome: document.getElementById('view-home'),
      viewLobby: document.getElementById('view-lobby'),
      viewSetup: document.getElementById('view-setup'),
      viewGame: document.getElementById('view-game'),
      viewLeaderboard: document.getElementById('view-leaderboard'),
      viewHistory: document.getElementById('view-history'),

      // Navigation & Header
      navButtons: document.querySelectorAll('.nav-link-btn'),
      btnHeaderLogo: document.getElementById('btn-header-logo'),
      btnHeaderProfile: document.getElementById('btn-header-profile'),
      headerUserAvatar: document.getElementById('header-user-avatar'),
      headerUserName: document.getElementById('header-user-name'),
      headerUserStreak: document.getElementById('header-user-streak'),
      btnHeaderInvite: document.getElementById('btn-header-invite'),
      btnHeaderSound: document.getElementById('btn-header-sound'),
      btnHeaderRules: document.getElementById('btn-header-rules'),

      // Home Page
      resumeGameCard: document.getElementById('resume-game-card'),
      resumeGameDesc: document.getElementById('resume-game-desc'),
      btnResumeGame: document.getElementById('btn-resume-game'),
      btnDiscardGame: document.getElementById('btn-discard-game'),
      btnHomePlayBot: document.getElementById('btn-home-play-bot'),
      btnHomePlayMultiplayer: document.getElementById('btn-home-play-multiplayer'),
      btnHomeLeaderboard: document.getElementById('btn-home-leaderboard'),
      homeStatWins: document.getElementById('home-stat-wins'),
      homeStatLosses: document.getElementById('home-stat-losses'),
      homeStatWinrate: document.getElementById('home-stat-winrate'),
      homeStatStreak: document.getElementById('home-stat-streak'),
      homeStatRank: document.getElementById('home-stat-rank'),

      // Lobby
      btnLobbyBot: document.getElementById('btn-lobby-bot'),
      btnLobbyCreate: document.getElementById('btn-lobby-create'),
      joinRoomInput: document.getElementById('join-room-input'),
      btnLobbyJoin: document.getElementById('btn-lobby-join'),

      // Setup
      setupGridElement: document.getElementById('setup-grid-element'),
      setupPaletteGrid: document.getElementById('setup-palette-grid'),
      btnSetupShuffle: document.getElementById('btn-setup-shuffle'),
      btnSetupClear: document.getElementById('btn-setup-clear'),
      btnSetupReady: document.getElementById('btn-setup-ready'),
      setupWaitingIndicator: document.getElementById('setup-waiting-indicator'),
      setupPaletteContainer: document.getElementById('setup-palette-container'),

      // Game
      gameRoomTag: document.getElementById('game-room-tag'),
      btnGameCopyLink: document.getElementById('btn-game-copy-link'),
      opponentNameDisplay: document.getElementById('opponent-name-display'),
      opponentLinesDisplay: document.getElementById('opponent-lines-display'),
      btnGameExit: document.getElementById('btn-game-exit'),
      turnBanner: document.getElementById('turn-banner'),
      turnBannerIcon: document.getElementById('turn-banner-icon'),
      turnBannerText: document.getElementById('turn-banner-text'),
      latestCallNumber: document.getElementById('latest-call-number'),
      latestCallCaller: document.getElementById('latest-call-caller'),
      gameGridElement: document.getElementById('game-grid-element'),
      letters: [
        document.getElementById('bingo-letter-0'),
        document.getElementById('bingo-letter-1'),
        document.getElementById('bingo-letter-2'),
        document.getElementById('bingo-letter-3'),
        document.getElementById('bingo-letter-4')
      ],

      // Leaderboard & History
      leaderboardTbody: document.getElementById('leaderboard-tbody'),
      btnLeaderboardPlay: document.getElementById('btn-leaderboard-play'),
      historyFeedContainer: document.getElementById('history-feed-container'),

      // Modals
      modalAuth: document.getElementById('modal-auth'),
      tabAuthSignin: document.getElementById('tab-auth-signin'),
      tabAuthSignup: document.getElementById('tab-auth-signup'),
      formSignin: document.getElementById('form-signin'),
      formSignup: document.getElementById('form-signup'),
      signinUsername: document.getElementById('signin-username'),
      signinPin: document.getElementById('signin-pin'),
      signupUsername: document.getElementById('signup-username'),
      signupPin: document.getElementById('signup-pin'),
      signupAvatarSelector: document.getElementById('signup-avatar-selector'),

      modalBoardInspect: document.getElementById('modal-board-inspect'),
      inspectMatchDate: document.getElementById('inspect-match-date'),
      inspectGridElement: document.getElementById('inspect-grid-element'),

      modalInvite: document.getElementById('modal-invite'),
      modalQrContainer: document.getElementById('modal-qr-container'),
      modalRoomCodeDisplay: document.getElementById('modal-room-code-display'),
      modalInviteLinkInput: document.getElementById('modal-invite-link-input'),
      btnCopyModalLink: document.getElementById('btn-copy-modal-link'),

      modalWinner: document.getElementById('modal-winner'),
      winnerNameDisplay: document.getElementById('winner-name-display'),
      winnerSubDisplay: document.getElementById('winner-sub-display'),
      btnPlayAgain: document.getElementById('btn-play-again'),

      modalRules: document.getElementById('modal-rules'),

      // Chat & Reactions
      reactionContainer: document.getElementById('reaction-container'),
      chatDrawer: document.getElementById('chat-drawer'),
      chatHeaderToggle: document.getElementById('chat-header-toggle'),
      chatToggleIcon: document.getElementById('chat-toggle-icon'),
      chatMessages: document.getElementById('chat-messages'),
      chatForm: document.getElementById('chat-form'),
      chatInput: document.getElementById('chat-input'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  // =========================================================================
  // NAVIGATION & VIEW ROUTING
  // =========================================================================
  setupNavigation() {
    this.dom.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.nav;
        this.switchView(targetView);
      });
    });

    this.dom.btnHeaderLogo.addEventListener('click', () => {
      this.switchView('home');
    });

    this.dom.btnHomeLeaderboard.addEventListener('click', () => {
      this.switchView('leaderboard');
    });

    this.dom.btnLeaderboardPlay.addEventListener('click', () => {
      this.switchView('lobby');
    });
  }

  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    this.dom.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === viewName);
    });

    if (viewName === 'home') {
      this.dom.viewHome.classList.add('active');
      this.dom.btnHeaderInvite.style.display = 'none';
      this.refreshUserProfileUI();
      this.checkSavedActiveGame();
    } else if (viewName === 'lobby') {
      this.dom.viewLobby.classList.add('active');
      this.dom.btnHeaderInvite.style.display = 'none';
    } else if (viewName === 'setup') {
      this.dom.viewSetup.classList.add('active');
      this.dom.btnHeaderInvite.style.display = this.state.mode === 'multiplayer' ? 'inline-flex' : 'none';
    } else if (viewName === 'game') {
      this.dom.viewGame.classList.add('active');
      this.dom.btnHeaderInvite.style.display = this.state.mode === 'multiplayer' ? 'inline-flex' : 'none';
    } else if (viewName === 'leaderboard') {
      this.dom.viewLeaderboard.classList.add('active');
      this.dom.btnHeaderInvite.style.display = 'none';
      this.renderLeaderboardView();
    } else if (viewName === 'history') {
      this.dom.viewHistory.classList.add('active');
      this.dom.btnHeaderInvite.style.display = 'none';
      this.renderHistoryView();
    }
  }

  showToast(msg, duration = 3000) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    this.dom.toastContainer.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  // =========================================================================
  // USER AUTHENTICATION & PROFILES
  // =========================================================================
  setupAuth() {
    this.selectedSignupAvatar = '🦊';

    this.dom.btnHeaderProfile.addEventListener('click', () => {
      this.dom.modalAuth.classList.add('active');
    });

    // Toggle Sign In vs Sign Up tabs
    this.dom.tabAuthSignin.addEventListener('click', () => {
      this.dom.tabAuthSignin.classList.add('active');
      this.dom.tabAuthSignup.classList.remove('active');
      this.dom.formSignin.style.display = 'block';
      this.dom.formSignup.style.display = 'none';
    });

    this.dom.tabAuthSignup.addEventListener('click', () => {
      this.dom.tabAuthSignup.classList.add('active');
      this.dom.tabAuthSignin.classList.remove('active');
      this.dom.formSignin.style.display = 'none';
      this.dom.formSignup.style.display = 'block';
    });

    // Avatar selector
    this.dom.signupAvatarSelector.querySelectorAll('.avatar-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.signupAvatarSelector.querySelectorAll('.avatar-opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedSignupAvatar = btn.dataset.avatar;
      });
    });

    // Handle Sign In submit
    this.dom.formSignin.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = this.dom.signinUsername.value.trim();
      const p = this.dom.signinPin.value.trim();

      const res = window.BingoAuthStorage.signIn(u, p);
      if (res.success) {
        this.showToast(`Welcome back, ${res.user.username}!`, 3000);
        this.dom.modalAuth.classList.remove('active');
        this.refreshUserProfileUI();
        this.checkSavedActiveGame();
      } else {
        alert(res.error);
      }
    });

    // Handle Sign Up submit
    this.dom.formSignup.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = this.dom.signupUsername.value.trim();
      const p = this.dom.signupPin.value.trim();

      const res = window.BingoAuthStorage.signUp(u, p, this.selectedSignupAvatar);
      if (res.success) {
        this.showToast(`Account created for ${res.user.username}!`, 3000);
        this.dom.modalAuth.classList.remove('active');
        this.refreshUserProfileUI();
      } else {
        alert(res.error);
      }
    });
  }

  refreshUserProfileUI() {
    const user = window.BingoAuthStorage.currentUser;
    if (!user) return;

    this.dom.headerUserAvatar.textContent = user.avatar || '👤';
    this.dom.headerUserName.textContent = user.username;

    const streak = user.stats?.streak || 0;
    if (streak > 0) {
      this.dom.headerUserStreak.style.display = 'inline';
      this.dom.headerUserStreak.textContent = `🔥 ${streak}`;
    } else {
      this.dom.headerUserStreak.style.display = 'none';
    }

    // Home profile widget
    const wins = user.stats?.wins || 0;
    const losses = user.stats?.losses || 0;
    const total = wins + losses;
    const rate = total > 0 ? Math.round((wins / total) * 100) : 0;

    let rankTitle = 'Novice';
    if (wins >= 25) rankTitle = 'Legend 👑';
    else if (wins >= 15) rankTitle = 'Grandmaster ⭐';
    else if (wins >= 8) rankTitle = 'Sharp Shooter 🎯';
    else if (wins >= 3) rankTitle = 'Veteran ⚡';

    this.dom.homeStatWins.textContent = wins;
    this.dom.homeStatLosses.textContent = losses;
    this.dom.homeStatWinrate.textContent = `${rate}%`;
    this.dom.homeStatStreak.textContent = `🔥 ${streak}`;
    this.dom.homeStatRank.textContent = rankTitle;
  }

  // =========================================================================
  // ONGOING GAME SAVING & RESUMPTION
  // =========================================================================
  checkSavedActiveGame() {
    const saved = window.BingoAuthStorage.loadActiveGame();
    if (saved && saved.gameBoard && saved.gameBoard.length === 25) {
      this.dom.resumeGameCard.style.display = 'flex';
      this.dom.resumeGameDesc.textContent = `Unfinished match vs ${saved.opponentName} saved on ${saved.formattedDate}. Pick up where you left off!`;

      this.dom.btnResumeGame.onclick = () => {
        this.resumeActiveGame(saved);
      };

      this.dom.btnDiscardGame.onclick = () => {
        if (confirm('Discard this unfinished game?')) {
          window.BingoAuthStorage.clearActiveGame();
          this.dom.resumeGameCard.style.display = 'none';
          this.showToast('Saved game cleared.');
        }
      };
    } else {
      this.dom.resumeGameCard.style.display = 'none';
    }
  }

  resumeActiveGame(saved) {
    this.state.mode = saved.mode || 'bot';
    this.state.roomCode = saved.roomCode || '';
    this.state.isMyTurn = saved.isMyTurn;
    this.state.opponentName = saved.opponentName || 'Computer';
    this.state.opponentLinesCount = saved.opponentLinesCount || 0;
    this.state.gameBoard = [...saved.gameBoard];
    this.state.botBoard = saved.botBoard ? [...saved.botBoard] : [];
    this.state.calledNumbers = new Set(saved.calledNumbers || []);
    this.state.isGameOver = false;

    this.dom.gameRoomTag.textContent = this.state.mode === 'bot' ? 'Solo vs Bot' : `Room: ${this.state.roomCode}`;
    this.dom.opponentNameDisplay.textContent = this.state.opponentName;
    this.dom.opponentLinesDisplay.textContent = `(${this.state.opponentLinesCount}/5)`;

    const lastCalled = Array.from(this.state.calledNumbers).pop();
    this.dom.latestCallNumber.textContent = lastCalled !== undefined ? lastCalled : '-';
    this.dom.latestCallCaller.textContent = 'Resumed match';

    this.updateTurnBanner();
    this.renderGameBoard();
    this.switchView('game');
    this.showToast('Game resumed right where you left off!', 3000);

    if (this.state.isMyTurn) {
      window.bingoAudio.playYourTurn();
    } else if (this.state.mode === 'bot') {
      this.scheduleBotMove();
    }
  }

  // =========================================================================
  // LEADERBOARD & MATCH HISTORY RENDERING
  // =========================================================================
  renderLeaderboardView() {
    const list = window.BingoAuthStorage.getLeaderboard();
    const currentUsername = window.BingoAuthStorage.currentUser?.username;
    this.dom.leaderboardTbody.innerHTML = '';

    list.forEach((p, idx) => {
      const tr = document.createElement('tr');
      if (p.username === currentUsername) {
        tr.className = 'current-user';
      }

      const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

      tr.innerHTML = `
        <td><span class="rank-badge ${rankClass}">${medal}</span></td>
        <td>
          <div class="player-cell-info">
            <span class="player-cell-avatar">${p.avatar}</span>
            <strong>${p.username} ${p.username === currentUsername ? '(You)' : ''}</strong>
          </div>
        </td>
        <td style="color:#38bdf8; font-weight:700;">${p.rankTitle}</td>
        <td style="color:#4ade80; font-weight:800;">${p.wins}</td>
        <td style="color:#94a3b8;">${p.losses}</td>
        <td><strong>${p.winRate}%</strong></td>
        <td><span style="color:#f59e0b; font-weight:800;">🔥 ${p.streak}</span></td>
      `;

      this.dom.leaderboardTbody.appendChild(tr);
    });
  }

  renderHistoryView() {
    const user = window.BingoAuthStorage.currentUser;
    this.dom.historyFeedContainer.innerHTML = '';

    if (!user || !user.history || user.history.length === 0) {
      this.dom.historyFeedContainer.innerHTML = `
        <div class="card-glass" style="text-align:center; padding:36px;">
          <div style="font-size:2.5rem; margin-bottom:10px;">📜</div>
          <h3>No Match History Yet</h3>
          <p style="color:var(--text-muted); margin-top:6px;">Play a game against the computer or with friends to see your full date and gameplay history logged here!</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="window.bingoApp.switchView('lobby')">Play a Match</button>
        </div>
      `;
      return;
    }

    user.history.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'history-card';

      const isWon = m.result === 'WON';
      const badgeClass = isWon ? 'result-won' : 'result-lost';
      const resultText = isWon ? '🏆 VICTORY' : '💀 DEFEAT';

      card.innerHTML = `
        <div class="history-main-info">
          <span class="history-result-badge ${badgeClass}">${resultText}</span>
          <div>
            <div style="font-weight:800; font-size:1rem;">
              vs ${m.opponent} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(${m.mode})</span>
            </div>
            <div class="history-date">📅 ${m.formattedDate}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:14px;">
          <div style="text-align:right; font-size:0.85rem;">
            <div>Lines: <strong style="color:#f59e0b;">${m.myLines}/5</strong></div>
            <div style="color:var(--text-muted); font-size:0.75rem;">${m.turns} turns</div>
          </div>
          ${m.myBoard && m.myBoard.length === 25 ? `
            <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;" onclick='window.bingoApp.inspectHistoricBoard(${JSON.stringify(m)})'>
              🔍 Inspect Board
            </button>
          ` : ''}
        </div>
      `;

      this.dom.historyFeedContainer.appendChild(card);
    });
  }

  inspectHistoricBoard(matchData) {
    this.dom.inspectMatchDate.textContent = `Match vs ${matchData.opponent} on ${matchData.formattedDate}`;
    this.dom.inspectGridElement.innerHTML = '';

    const calledSet = new Set(matchData.calledNumbers || []);

    matchData.myBoard.forEach(num => {
      const isCrossed = calledSet.has(num);
      const cell = document.createElement('div');
      cell.className = 'paper-cell' + (isCrossed ? ' crossed' : '');
      cell.textContent = num;
      this.dom.inspectGridElement.appendChild(cell);
    });

    this.dom.modalBoardInspect.classList.add('active');
  }

  // =========================================================================
  // GAME SETUP & GAMEPLAY EVENTS
  // =========================================================================
  setupGameEvents() {
    // Home Play Buttons
    this.dom.btnHomePlayBot.addEventListener('click', () => {
      this.startSoloBotGame();
    });

    this.dom.btnHomePlayMultiplayer.addEventListener('click', () => {
      this.switchView('lobby');
    });

    // Lobby Buttons
    this.dom.btnLobbyBot.addEventListener('click', () => {
      this.startSoloBotGame();
    });

    this.dom.btnLobbyCreate.addEventListener('click', () => {
      const code = 'BING' + Math.floor(10 + Math.random() * 90);
      this.state.mode = 'multiplayer';
      this.state.roomCode = code;
      this.state.isHost = true;
      this.state.opponentName = 'Waiting...';

      window.BingoMultiplayer.joinRoom(code, window.BingoAuthStorage.currentUser.username, true);
      this.startSetupPhase();
      this.openInviteModal();
    });

    this.dom.btnLobbyJoin.addEventListener('click', () => {
      const code = (this.dom.joinRoomInput.value || '').toUpperCase().trim();
      if (!code) {
        alert('Please enter a room code.');
        return;
      }
      this.state.mode = 'multiplayer';
      this.state.roomCode = code;
      this.state.isHost = false;
      this.state.opponentName = 'Host';

      window.BingoMultiplayer.joinRoom(code, window.BingoAuthStorage.currentUser.username, false);
      this.startSetupPhase();
    });

    // Setup Board Actions
    this.dom.btnSetupShuffle.addEventListener('click', () => {
      window.bingoAudio.playPop();
      const randomBoard = window.BingoLogic.generateRandomBoard();
      this.state.setupBoard = [...randomBoard];
      this.state.setupRemaining.clear();
      this.renderSetupGrid();
      this.renderSetupPalette();
      this.dom.btnSetupReady.disabled = false;
    });

    this.dom.btnSetupClear.addEventListener('click', () => {
      window.bingoAudio.playPop();
      this.state.setupBoard = Array(25).fill(null);
      this.state.setupRemaining = new Set(Array.from({ length: 25 }, (_, i) => i + 1));
      this.renderSetupGrid();
      this.renderSetupPalette();
      this.dom.btnSetupReady.disabled = true;
    });

    this.dom.btnSetupReady.addEventListener('click', () => {
      if (!window.BingoLogic.isValidBoard(this.state.setupBoard)) {
        alert('Please fill all 25 numbers from 1 to 25 on your board!');
        return;
      }
      this.handlePlayerReady();
    });

    // Game Exit
    this.dom.btnGameExit.addEventListener('click', () => {
      if (confirm('Leave current game? (Unfinished game will be saved)')) {
        this.saveCurrentGame();
        this.switchView('home');
      }
    });

    // Invite & Modals
    this.dom.btnGameCopyLink.addEventListener('click', () => this.copyInviteLink());
    this.dom.btnCopyModalLink.addEventListener('click', () => this.copyInviteLink());
    this.dom.btnHeaderInvite.addEventListener('click', () => this.openInviteModal());

    this.dom.btnHeaderSound.addEventListener('click', () => {
      const isMuted = window.bingoAudio.toggleMute();
      this.dom.btnHeaderSound.textContent = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? 'Audio muted' : 'Audio unmuted');
    });

    this.dom.btnHeaderRules.addEventListener('click', () => {
      this.dom.modalRules.classList.add('active');
    });

    document.querySelectorAll('[data-close-modal]').forEach(b => {
      b.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Rematch
    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.dom.modalWinner.classList.remove('active');
      if (this.state.mode === 'multiplayer') {
        window.BingoMultiplayer.send('REMATCH_REQUEST');
      }
      this.startSetupPhase();
    });

    // Chat
    this.dom.chatHeaderToggle.addEventListener('click', () => {
      this.dom.chatDrawer.classList.toggle('open');
      const isOpen = this.dom.chatDrawer.classList.contains('open');
      this.dom.chatToggleIcon.textContent = isOpen ? '▼' : '▲';
    });

    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dom.chatInput.value.trim();
      if (!text) return;
      this.sendChatMessage(text);
      this.dom.chatInput.value = '';
    });

    // Reactions
    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.triggerReaction(btn.dataset.emoji, true);
      });
    });
  }

  startSoloBotGame() {
    this.state.mode = 'bot';
    this.state.opponentName = 'Smart Bot';
    this.state.isHost = true;
    this.startSetupPhase();
  }

  startSetupPhase() {
    this.state.setupBoard = Array(25).fill(null);
    this.state.setupRemaining = new Set(Array.from({ length: 25 }, (_, i) => i + 1));
    this.state.amIReady = false;
    this.state.isOpponentReady = false;
    this.dom.btnSetupReady.disabled = true;
    this.dom.setupWaitingIndicator.style.display = 'none';
    this.dom.setupPaletteContainer.style.display = 'block';

    // Auto-fill random 1-25 board so player can immediately play
    const randomBoard = window.BingoLogic.generateRandomBoard();
    this.state.setupBoard = [...randomBoard];
    this.state.setupRemaining.clear();
    this.dom.btnSetupReady.disabled = false;

    this.renderSetupGrid();
    this.renderSetupPalette();
    this.switchView('setup');
  }

  renderSetupGrid() {
    this.dom.setupGridElement.innerHTML = '';
    this.state.setupBoard.forEach((num, idx) => {
      const cell = document.createElement('div');
      cell.className = 'paper-cell' + (num === null ? ' empty' : '');
      cell.textContent = num !== null ? num : '';

      cell.addEventListener('click', () => {
        if (num !== null && !this.state.amIReady) {
          window.bingoAudio.playPop();
          this.state.setupRemaining.add(num);
          this.state.setupBoard[idx] = null;
          this.renderSetupGrid();
          this.renderSetupPalette();
          this.dom.btnSetupReady.disabled = true;
        }
      });

      this.dom.setupGridElement.appendChild(cell);
    });
  }

  renderSetupPalette() {
    this.dom.setupPaletteGrid.innerHTML = '';
    for (let n = 1; n <= 25; n++) {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = n;
      btn.disabled = !this.state.setupRemaining.has(n);

      btn.addEventListener('click', () => {
        if (this.state.amIReady) return;
        const emptyIdx = this.state.setupBoard.findIndex(val => val === null);
        if (emptyIdx !== -1) {
          window.bingoAudio.playPop();
          this.state.setupBoard[emptyIdx] = n;
          this.state.setupRemaining.delete(n);
          this.renderSetupGrid();
          this.renderSetupPalette();

          if (this.state.setupBoard.every(v => v !== null)) {
            this.dom.btnSetupReady.disabled = false;
          }
        }
      });

      this.dom.setupPaletteGrid.appendChild(btn);
    }
  }

  handlePlayerReady() {
    this.state.amIReady = true;
    this.state.gameBoard = [...this.state.setupBoard];
    this.dom.btnSetupReady.disabled = true;

    if (this.state.mode === 'bot') {
      this.state.botBoard = window.BingoLogic.generateRandomBoard();
      this.state.isOpponentReady = true;
      this.startActiveGame(true); // Player starts first
    } else {
      this.dom.setupWaitingIndicator.style.display = 'block';
      this.dom.setupPaletteContainer.style.display = 'none';

      window.BingoMultiplayer.send('PLAYER_READY', {
        playerName: window.BingoAuthStorage.currentUser.username
      });

      if (this.state.isOpponentReady) {
        if (this.state.isHost) {
          const startingTurn = Math.random() > 0.5 ? 'host' : 'guest';
          window.BingoMultiplayer.send('GAME_START', { startingTurn });
          this.startActiveGame(startingTurn === 'host');
        }
      } else {
        this.showToast('You are ready! Waiting for your opponent...', 4000);
      }
    }
  }

  // Start Active Game
  startActiveGame(isMyTurn) {
    this.state.isMyTurn = isMyTurn;
    this.state.calledNumbers = new Set();
    this.state.myCompletedLineIds = new Set();
    this.state.opponentLinesCount = 0;
    this.state.isGameOver = false;
    this.state.turnCount = 0;

    this.dom.letters.forEach(el => el.classList.remove('crossed'));
    this.dom.gameRoomTag.textContent = this.state.mode === 'bot' ? 'Solo vs Bot' : `Room: ${this.state.roomCode}`;
    this.dom.opponentNameDisplay.textContent = this.state.opponentName;
    this.dom.opponentLinesDisplay.textContent = '(0/5)';

    this.dom.latestCallNumber.textContent = '-';
    this.dom.latestCallCaller.textContent = 'Game started!';

    this.updateTurnBanner();
    this.renderGameBoard();
    this.switchView('game');
    this.saveCurrentGame();

    if (isMyTurn) {
      window.bingoAudio.playYourTurn();
    } else if (this.state.mode === 'bot') {
      this.scheduleBotMove();
    }
  }

  updateTurnBanner() {
    if (this.state.isMyTurn) {
      this.dom.turnBanner.className = 'turn-banner my-turn';
      this.dom.turnBannerIcon.textContent = '👉';
      this.dom.turnBannerText.textContent = 'YOUR TURN! Pick any uncrossed number on your board.';
    } else {
      this.dom.turnBanner.className = 'turn-banner opponent-turn';
      this.dom.turnBannerIcon.textContent = '⏳';
      this.dom.turnBannerText.textContent = `Waiting for ${this.state.opponentName} to pick...`;
    }
  }

  renderGameBoard() {
    this.dom.gameGridElement.innerHTML = '';
    const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);

    this.state.gameBoard.forEach((num) => {
      const isCrossed = this.state.calledNumbers.has(num);
      const cell = document.createElement('div');
      cell.className = 'paper-cell';
      cell.textContent = num;

      if (isCrossed) {
        cell.classList.add('crossed');
      }

      if (!isCrossed && this.state.isMyTurn && !this.state.isGameOver) {
        cell.addEventListener('click', () => {
          this.handlePlayerCallNumber(num);
        });
      } else {
        if (!this.state.isMyTurn || isCrossed) {
          cell.classList.add('disabled');
        }
      }

      this.dom.gameGridElement.appendChild(cell);
    });

    this.updateBingoLetters(evaluation);
  }

  handlePlayerCallNumber(num) {
    if (!this.state.isMyTurn || this.state.isGameOver) return;
    if (this.state.calledNumbers.has(num)) return;

    this.state.calledNumbers.add(num);
    this.state.turnCount++;
    window.bingoAudio.playStrike();

    this.dom.latestCallNumber.textContent = num;
    this.dom.latestCallCaller.textContent = 'Called by You';

    if (this.state.mode === 'multiplayer') {
      window.BingoMultiplayer.send('NUMBER_CALLED', {
        number: num,
        callerName: window.BingoAuthStorage.currentUser.username
      });
    }

    const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
    this.renderGameBoard();
    this.saveCurrentGame();

    if (evaluation.isBingo) {
      this.handleGameOver(window.BingoAuthStorage.currentUser.username, true);
      return;
    }

    this.state.isMyTurn = false;
    this.updateTurnBanner();
    this.renderGameBoard();

    if (this.state.mode === 'bot') {
      this.scheduleBotMove();
    }
  }

  scheduleBotMove() {
    setTimeout(() => {
      if (this.state.isGameOver) return;

      const botPick = window.BingoLogic.getBestComputerMove(this.state.botBoard, this.state.calledNumbers);
      if (botPick === null) return;

      this.state.calledNumbers.add(botPick);
      this.state.turnCount++;
      window.bingoAudio.playStrike();

      this.dom.latestCallNumber.textContent = botPick;
      this.dom.latestCallCaller.textContent = `Called by ${this.state.opponentName}`;

      const botEval = window.BingoLogic.evaluateBoard(this.state.botBoard, this.state.calledNumbers);
      this.state.opponentLinesCount = botEval.lineCount;
      this.dom.opponentLinesDisplay.textContent = `(${botEval.lineCount}/5)`;

      const myEval = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
      this.renderGameBoard();
      this.saveCurrentGame();

      if (botEval.isBingo && myEval.isBingo) {
        this.handleGameOver('Tie Match!', true);
      } else if (botEval.isBingo) {
        this.handleGameOver(this.state.opponentName, false);
      } else if (myEval.isBingo) {
        this.handleGameOver(window.BingoAuthStorage.currentUser.username, true);
      } else {
        this.state.isMyTurn = true;
        this.updateTurnBanner();
        this.renderGameBoard();
        window.bingoAudio.playYourTurn();
      }
    }, 1100);
  }

  updateBingoLetters(evaluation) {
    const count = evaluation.lettersEarned.length;
    for (let i = 0; i < 5; i++) {
      const letterBox = this.dom.letters[i];
      const shouldBeCrossed = i < count;

      if (shouldBeCrossed && !letterBox.classList.contains('crossed')) {
        letterBox.classList.add('crossed');
        window.bingoAudio.playLetterCross(i);
        this.showToast(`🔥 Line Complete! Letter "${window.BingoLogic.LETTERS[i]}" crossed!`, 2500);
      }
    }
  }

  handleGameOver(winnerName, isMe) {
    this.state.isGameOver = true;

    const myEval = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
    const result = isMe ? 'WON' : 'LOST';

    // Record to match history with date & time
    window.BingoAuthStorage.recordMatchResult({
      opponent: this.state.opponentName,
      mode: this.state.mode === 'bot' ? 'Solo vs Bot' : `Multiplayer (Room: ${this.state.roomCode})`,
      result: result,
      myLines: myEval.lineCount,
      opponentLines: this.state.opponentLinesCount,
      turns: this.state.turnCount,
      myBoard: this.state.gameBoard,
      calledNumbers: this.state.calledNumbers
    });

    this.refreshUserProfileUI();

    if (isMe) {
      window.bingoAudio.playBingoWin();
      window.BingoConfetti.fireBingoCannons();
      this.dom.winnerNameDisplay.textContent = '🎉 B - I - N - G - O !';
      this.dom.winnerSubDisplay.textContent = `${winnerName} completed all 5 lines and won the match!`;
    } else {
      window.bingoAudio.playBingoWin();
      this.dom.winnerNameDisplay.textContent = `${winnerName} Won!`;
      this.dom.winnerSubDisplay.textContent = `${winnerName} reached 5 lines first. Saved to your match history.`;
    }

    if (this.state.mode === 'multiplayer' && isMe) {
      window.BingoMultiplayer.send('BINGO_WIN', {
        winnerName: window.BingoAuthStorage.currentUser.username
      });
    }

    setTimeout(() => {
      this.dom.modalWinner.classList.add('active');
    }, 700);
  }

  saveCurrentGame() {
    if (this.state.isGameOver || this.state.gameBoard.length !== 25) return;
    window.BingoAuthStorage.saveActiveGame(this.state);
  }

  // =========================================================================
  // MULTIPLAYER LISTENERS
  // =========================================================================
  setupMultiplayerListeners() {
    window.BingoMultiplayer.on('PLAYER_JOINED', (data) => {
      if (data.id !== window.BingoMultiplayer.playerId) {
        this.state.opponentName = data.name || 'Friend';
        this.dom.opponentNameDisplay.textContent = this.state.opponentName;
        this.showToast(`👋 ${data.name} joined the room!`, 3000);
        window.bingoAudio.playPop();

        window.BingoMultiplayer.send('PLAYER_ANNOUNCE', {
          name: window.BingoAuthStorage.currentUser.username
        });
      }
    });

    window.BingoMultiplayer.on('PLAYER_ANNOUNCE', (data) => {
      this.state.opponentName = data.name || 'Friend';
      this.dom.opponentNameDisplay.textContent = this.state.opponentName;
    });

    window.BingoMultiplayer.on('PLAYER_READY', (data) => {
      this.state.isOpponentReady = true;
      this.showToast(`✅ ${data.playerName || 'Opponent'} is ready!`, 3000);

      if (this.state.amIReady && this.state.isHost) {
        const startingTurn = Math.random() > 0.5 ? 'host' : 'guest';
        window.BingoMultiplayer.send('GAME_START', { startingTurn });
        this.startActiveGame(startingTurn === 'host');
      }
    });

    window.BingoMultiplayer.on('GAME_START', (data) => {
      const amIStarting = (this.state.isHost && data.startingTurn === 'host') || (!this.state.isHost && data.startingTurn === 'guest');
      this.startActiveGame(amIStarting);
    });

    window.BingoMultiplayer.on('NUMBER_CALLED', (data) => {
      const num = data.number;
      if (!num) return;

      this.state.calledNumbers.add(num);
      this.state.turnCount++;
      window.bingoAudio.playStrike();

      this.dom.latestCallNumber.textContent = num;
      this.dom.latestCallCaller.textContent = `Called by ${data.callerName || this.state.opponentName}`;

      const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
      this.renderGameBoard();
      this.saveCurrentGame();

      if (evaluation.isBingo) {
        this.handleGameOver(window.BingoAuthStorage.currentUser.username, true);
        return;
      }

      this.state.isMyTurn = true;
      this.updateTurnBanner();
      this.renderGameBoard();
      window.bingoAudio.playYourTurn();
    });

    window.BingoMultiplayer.on('BINGO_WIN', (data) => {
      this.handleGameOver(data.winnerName || 'Opponent', false);
    });

    window.BingoMultiplayer.on('REMATCH_REQUEST', () => {
      this.showToast('Opponent requested a rematch! Setting up new boards.', 3000);
      this.startSetupPhase();
    });

    window.BingoMultiplayer.on('CHAT', (data) => {
      this.appendChatMessage(data);
    });

    window.BingoMultiplayer.on('REACTION', (data) => {
      this.triggerReaction(data.emoji, false);
    });
  }

  sendChatMessage(text) {
    const msg = {
      sender: window.BingoAuthStorage.currentUser.username,
      text: text
    };
    window.BingoMultiplayer.send('CHAT', msg);
    this.appendChatMessage(msg);
  }

  appendChatMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="sender">${msg.sender}:</span> <span>${msg.text}</span>`;
    this.dom.chatMessages.appendChild(div);
    this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

    if (!this.dom.chatDrawer.classList.contains('open')) {
      this.dom.chatToggleIcon.textContent = '💬 (1)';
    }
  }

  triggerReaction(emoji, broadcast = true) {
    window.bingoAudio.playPop();
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = `${Math.random() * 60 + 20}px`;
    this.dom.reactionContainer.appendChild(el);
    setTimeout(() => el.remove(), 2800);

    if (broadcast && this.state.mode === 'multiplayer') {
      window.BingoMultiplayer.send('REACTION', { emoji });
    }
  }

  openInviteModal() {
    this.dom.modalRoomCodeDisplay.textContent = this.state.roomCode;
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.state.roomCode);
    const inviteUrl = url.toString();
    this.dom.modalInviteLinkInput.value = inviteUrl;

    if (window.BingoQRCode) {
      this.dom.modalQrContainer.innerHTML = window.BingoQRCode.generateSVG(inviteUrl, 160);
    }
    this.dom.modalInvite.classList.add('active');
  }

  copyInviteLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.state.roomCode);
    const inviteUrl = url.toString();

    navigator.clipboard.writeText(inviteUrl).then(() => {
      this.showToast('📋 Room link copied to clipboard!');
    }).catch(() => {
      prompt('Copy invite link:', inviteUrl);
    });
  }

  checkUrlRoomParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.dom.joinRoomInput.value = roomParam.toUpperCase().trim();
      this.switchView('lobby');
      this.showToast(`Invited to Room ${roomParam.toUpperCase()}! Click Join to enter.`, 4000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.bingoApp = new BingoApp();
});
