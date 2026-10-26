/**
 * Classic 1-25 Pen-and-Paper BINGO - Main Application Coordinator
 * Handles Navigation, Authentication (Guest/Login/Signup), Sign Out,
 * Welcome Gate, Ongoing Game Resumption, Match History, and Realtime Gameplay.
 */
class BingoApp {
  constructor() {
    this.currentView = 'home';
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
      turnCount: 0,

      // Multiplayer Room & Turn Sequencing State
      roomPlayers: new Map(),   // playerId -> { id, name, isHost, isReady, linesCount }
      playerOrder: [],          // array of playerIds [id1, id2, id3, ...] in turn order
      currentTurnPlayerId: null,// playerId whose turn it is
      turnIndex: 0              // index in playerOrder
    };

    this.initDOM();
    this.setupNavigation();
    this.setupAuth();
    this.setupGameEvents();
    this.setupMultiplayerListeners();
    this.checkInitialAuthGate();
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
      btnHeaderSignout: document.getElementById('btn-header-signout'),
      headerUserAvatar: document.getElementById('header-user-avatar'),
      headerUserName: document.getElementById('header-user-name'),
      headerUserStreak: document.getElementById('header-user-streak'),
      btnHeaderInvite: document.getElementById('btn-header-invite'),
      btnHeaderSound: document.getElementById('btn-header-sound'),
      btnHeaderRules: document.getElementById('btn-header-rules'),

      // Home Page
      userHomeCard: document.getElementById('user-home-card'),
      homeUserAvatar: document.getElementById('home-user-avatar'),
      homeUserName: document.getElementById('home-user-name'),
      homeAccountBadge: document.getElementById('home-account-badge'),
      btnHomeProfile: document.getElementById('btn-home-profile'),
      btnHomeSignout: document.getElementById('btn-home-signout'),
      btnMobileAccount: document.getElementById('btn-mobile-account'),

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
      setupRosterCard: document.getElementById('setup-roster-card'),
      setupPlayerCount: document.getElementById('setup-player-count'),
      setupRosterList: document.getElementById('setup-roster-list'),
      btnSetupInvite: document.getElementById('btn-setup-invite'),
      hostStartContainer: document.getElementById('host-start-container'),
      btnHostStartGame: document.getElementById('btn-host-start-game'),

      // Game
      gameRoomTag: document.getElementById('game-room-tag'),
      btnGameCopyLink: document.getElementById('btn-game-copy-link'),
      gameOpponentsContainer: document.getElementById('game-opponents-container'),
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
      modalWelcomeGate: document.getElementById('modal-welcome-gate'),
      btnEntryGuest: document.getElementById('btn-entry-guest'),
      btnEntrySignin: document.getElementById('btn-entry-signin'),
      btnEntrySignup: document.getElementById('btn-entry-signup'),

      modalGuestPrompt: document.getElementById('modal-guest-prompt'),
      formGuestLogin: document.getElementById('form-guest-login'),
      guestNicknameInput: document.getElementById('guest-nickname-input'),

      modalProfile: document.getElementById('modal-profile'),
      modalProfileAvatar: document.getElementById('modal-profile-avatar'),
      modalProfileName: document.getElementById('modal-profile-name'),
      modalProfileBadge: document.getElementById('modal-profile-badge'),
      profileModalWins: document.getElementById('profile-modal-wins'),
      profileModalLosses: document.getElementById('profile-modal-losses'),
      profileModalStreak: document.getElementById('profile-modal-streak'),
      guestUpgradeBanner: document.getElementById('guest-upgrade-banner'),
      btnUpgradeGuest: document.getElementById('btn-upgrade-guest'),
      btnModalSignout: document.getElementById('btn-modal-signout'),

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

  // Check auth on startup: if no session, ask user how they'd like to play
  checkInitialAuthGate() {
    if (!window.BingoAuthStorage.hasSession()) {
      this.refreshUserProfileUI();
      setTimeout(() => {
        this.openWelcomeGate();
      }, 350);
    } else {
      this.refreshUserProfileUI();
      this.checkSavedActiveGame();
    }
  }

  openWelcomeGate() {
    this.dom.modalWelcomeGate.classList.add('active');
  }

  // =========================================================================
  // NAVIGATION & VIEW ROUTING
  // =========================================================================
  setupNavigation() {
    const allNavButtons = document.querySelectorAll('.nav-link-btn, .mobile-nav-btn[data-nav]');
    allNavButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.nav;
        if (targetView) this.switchView(targetView);
      });
    });

    if (this.dom.btnMobileAccount) {
      this.dom.btnMobileAccount.addEventListener('click', () => {
        if (window.BingoAuthStorage.hasSession()) {
          this.openProfileModal();
        } else {
          this.openWelcomeGate();
        }
      });
    }

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
    this.currentView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link-btn, .mobile-nav-btn[data-nav]').forEach(btn => {
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

    this.updateChatVisibility();
  }

  updateChatVisibility() {
    const isMultiplayerActive = (this.state.mode === 'multiplayer' && (this.currentView === 'setup' || this.currentView === 'game'));
    if (this.dom.chatDrawer) {
      this.dom.chatDrawer.style.display = isMultiplayerActive ? 'flex' : 'none';
      if (!isMultiplayerActive) {
        this.dom.chatDrawer.classList.remove('open');
      }
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
  // USER AUTHENTICATION & PROFILES & SIGN OUT
  // =========================================================================
  setupAuth() {
    this.selectedSignupAvatar = '🦊';

    // 1. Welcome Gate Entry Options
    this.dom.btnEntryGuest.addEventListener('click', () => {
      this.dom.modalWelcomeGate.classList.remove('active');
      this.dom.guestNicknameInput.value = '';
      this.dom.modalGuestPrompt.classList.add('active');
    });

    this.dom.btnEntrySignin.addEventListener('click', () => {
      this.dom.modalWelcomeGate.classList.remove('active');
      this.openAuthModal('signin');
    });

    this.dom.btnEntrySignup.addEventListener('click', () => {
      this.dom.modalWelcomeGate.classList.remove('active');
      this.openAuthModal('signup');
    });

    // 2. Guest Login Submit
    this.dom.formGuestLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const nickname = this.dom.guestNicknameInput.value.trim();
      const res = window.BingoAuthStorage.playAsGuest(nickname);
      this.dom.modalGuestPrompt.classList.remove('active');
      this.showToast(`Playing as Guest (${res.user.username})`, 3000);
      this.refreshUserProfileUI();
      this.checkSavedActiveGame();
    });

    // 3. Header Profile Pill Click -> Opens Profile Modal or Welcome Gate
    this.dom.btnHeaderProfile.addEventListener('click', () => {
      if (window.BingoAuthStorage.hasSession()) {
        this.openProfileModal();
      } else {
        this.openWelcomeGate();
      }
    });

    // 4. Quick Header Sign Out Button
    this.dom.btnHeaderSignout.addEventListener('click', () => {
      this.handleSignOut();
    });

    // 4b. Home User Card Buttons
    if (this.dom.btnHomeSignout) {
      this.dom.btnHomeSignout.addEventListener('click', () => {
        this.handleSignOut();
      });
    }

    if (this.dom.btnHomeProfile) {
      this.dom.btnHomeProfile.addEventListener('click', () => {
        if (window.BingoAuthStorage.hasSession()) {
          this.openProfileModal();
        } else {
          this.openWelcomeGate();
        }
      });
    }

    // 5. Modal Sign Out Button
    this.dom.btnModalSignout.addEventListener('click', () => {
      this.dom.modalProfile.classList.remove('active');
      this.handleSignOut();
    });

    // 6. Upgrade Guest to Full Account
    this.dom.btnUpgradeGuest.addEventListener('click', () => {
      this.dom.modalProfile.classList.remove('active');
      this.openAuthModal('signup');
    });

    // Toggle Sign In vs Sign Up tabs in Auth Modal
    this.dom.tabAuthSignin.addEventListener('click', () => {
      this.openAuthModal('signin');
    });

    this.dom.tabAuthSignup.addEventListener('click', () => {
      this.openAuthModal('signup');
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
        if (res.isNew) {
          this.showToast(`✨ Welcome! Profile created & signed in as ${res.user.username}!`, 3500);
        } else {
          this.showToast(`Welcome back, ${res.user.username}!`, 3000);
        }
        this.dom.modalAuth.classList.remove('active');
        if (this.dom.modalWelcomeGate) {
          this.dom.modalWelcomeGate.classList.remove('active');
        }
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
        if (res.existing) {
          this.showToast(`Welcome back, ${res.user.username}!`, 3000);
        } else {
          this.showToast(`Account created for ${res.user.username}!`, 3000);
        }
        this.dom.modalAuth.classList.remove('active');
        if (this.dom.modalWelcomeGate) {
          this.dom.modalWelcomeGate.classList.remove('active');
        }
        this.refreshUserProfileUI();
        this.checkSavedActiveGame();
      } else {
        alert(res.error);
      }
    });
  }

  openAuthModal(tab = 'signin') {
    if (tab === 'signin') {
      this.dom.tabAuthSignin.classList.add('active');
      this.dom.tabAuthSignup.classList.remove('active');
      this.dom.formSignin.style.display = 'block';
      this.dom.formSignup.style.display = 'none';
    } else {
      this.dom.tabAuthSignup.classList.add('active');
      this.dom.tabAuthSignin.classList.remove('active');
      this.dom.formSignin.style.display = 'none';
      this.dom.formSignup.style.display = 'block';
    }
    this.dom.modalAuth.classList.add('active');
  }

  openProfileModal() {
    const user = window.BingoAuthStorage.currentUser;
    if (!user) return;

    this.dom.modalProfileAvatar.textContent = user.avatar || '👤';
    this.dom.modalProfileName.textContent = user.username;

    if (user.isGuest) {
      this.dom.modalProfileBadge.className = 'profile-account-type-badge badge-guest';
      this.dom.modalProfileBadge.textContent = 'Guest Player';
      this.dom.guestUpgradeBanner.style.display = 'block';
    } else {
      this.dom.modalProfileBadge.className = 'profile-account-type-badge badge-registered';
      this.dom.modalProfileBadge.textContent = 'Registered Player';
      this.dom.guestUpgradeBanner.style.display = 'none';
    }

    this.dom.profileModalWins.textContent = user.stats?.wins || 0;
    this.dom.profileModalLosses.textContent = user.stats?.losses || 0;
    this.dom.profileModalStreak.textContent = `🔥 ${user.stats?.streak || 0}`;

    this.dom.modalProfile.classList.add('active');
  }

  handleSignOut() {
    window.BingoAuthStorage.signOut();
    this.showToast('Signed out.', 3000);
    this.refreshUserProfileUI();
    this.dom.resumeGameCard.style.display = 'none';
    this.switchView('home');
    setTimeout(() => {
      this.openWelcomeGate();
    }, 400);
  }

  refreshUserProfileUI() {
    const user = window.BingoAuthStorage.currentUser;
    if (!user) {
      this.dom.headerUserAvatar.textContent = '👤';
      this.dom.headerUserName.textContent = 'Sign In / Guest';
      this.dom.headerUserStreak.style.display = 'none';
      this.dom.btnHeaderSignout.style.display = 'none';

      if (this.dom.homeUserAvatar) this.dom.homeUserAvatar.textContent = '👤';
      if (this.dom.homeUserName) this.dom.homeUserName.textContent = 'Not Signed In';
      if (this.dom.homeAccountBadge) {
        this.dom.homeAccountBadge.textContent = 'No Account';
        this.dom.homeAccountBadge.className = 'profile-account-type-badge';
      }
      if (this.dom.btnHomeSignout) this.dom.btnHomeSignout.style.display = 'none';

      // Zero out stats on home page
      this.dom.homeStatWins.textContent = '0';
      this.dom.homeStatLosses.textContent = '0';
      this.dom.homeStatWinrate.textContent = '0%';
      this.dom.homeStatStreak.textContent = '🔥 0';
      this.dom.homeStatRank.textContent = 'None';
      return;
    }

    this.dom.headerUserAvatar.textContent = user.avatar || '👤';
    this.dom.headerUserName.textContent = user.username + (user.isGuest ? ' (Guest)' : '');
    this.dom.btnHeaderSignout.style.display = 'inline-flex';

    if (this.dom.homeUserAvatar) this.dom.homeUserAvatar.textContent = user.avatar || '👤';
    if (this.dom.homeUserName) this.dom.homeUserName.textContent = user.username;
    if (this.dom.homeAccountBadge) {
      if (user.isGuest) {
        this.dom.homeAccountBadge.textContent = 'Guest Player';
        this.dom.homeAccountBadge.className = 'profile-account-type-badge badge-guest';
      } else {
        this.dom.homeAccountBadge.textContent = 'Registered Player';
        this.dom.homeAccountBadge.className = 'profile-account-type-badge badge-registered';
      }
    }
    if (this.dom.btnHomeSignout) this.dom.btnHomeSignout.style.display = 'inline-flex';

    const streak = user.stats?.streak || 0;
    if (streak > 0) {
      this.dom.headerUserStreak.style.display = 'inline';
      this.dom.headerUserStreak.textContent = `🔥 ${streak}`;
    } else {
      this.dom.headerUserStreak.style.display = 'none';
    }

    const wins = user.stats?.wins || 0;
    const losses = user.stats?.losses || 0;
    const total = wins + losses;
    const rate = total > 0 ? Math.round((wins / total) * 100) : 0;

    let rankTitle = user.isGuest ? 'Guest' : 'Novice';
    if (!user.isGuest) {
      if (wins >= 25) rankTitle = 'Legend 👑';
      else if (wins >= 15) rankTitle = 'Grandmaster ⭐';
      else if (wins >= 8) rankTitle = 'Sharp Shooter 🎯';
      else if (wins >= 3) rankTitle = 'Veteran ⚡';
    }

    this.dom.homeStatWins.textContent = wins;
    this.dom.homeStatLosses.textContent = losses;
    this.dom.homeStatWinrate.textContent = `${rate}%`;
    this.dom.homeStatStreak.textContent = `🔥 ${streak}`;
    this.dom.homeStatRank.textContent = rankTitle;
  }

  // Ensure user has chosen Guest or Account before starting a game
  ensureUserSession() {
    if (!window.BingoAuthStorage.hasSession()) {
      this.openWelcomeGate();
      return false;
    }
    return true;
  }

  // =========================================================================
  // ONGOING GAME SAVING & RESUMPTION
  // =========================================================================
  checkSavedActiveGame() {
    if (!window.BingoAuthStorage.hasSession()) {
      this.dom.resumeGameCard.style.display = 'none';
      return;
    }

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

  // Escape HTML utility to prevent Cross-Site Scripting (XSS)
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // =========================================================================
  // LEADERBOARD & MATCH HISTORY RENDERING
  // =========================================================================
  renderLeaderboardView() {
    const list = window.BingoAuthStorage.getLeaderboard();
    const currentUsername = window.BingoAuthStorage.currentUser?.username;
    this.dom.leaderboardTbody.innerHTML = '';

    if (list.length === 0) {
      this.dom.leaderboardTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
            No registered accounts yet! Create an account and play to claim the #1 spot on the leaderboard!
          </td>
        </tr>
      `;
      return;
    }

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
            <span class="player-cell-avatar">${this.escapeHTML(p.avatar)}</span>
            <strong>${this.escapeHTML(p.username)} ${p.username === currentUsername ? '(You)' : ''}</strong>
          </div>
        </td>
        <td style="color:#38bdf8; font-weight:700;">${this.escapeHTML(p.rankTitle)}</td>
        <td style="color:#4ade80; font-weight:800;">${Number(p.wins) || 0}</td>
        <td style="color:#94a3b8;">${Number(p.losses) || 0}</td>
        <td><strong>${Number(p.winRate) || 0}%</strong></td>
        <td><span style="color:#f59e0b; font-weight:800;">🔥 ${Number(p.streak) || 0}</span></td>
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
              vs ${this.escapeHTML(m.opponent)} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(${this.escapeHTML(m.mode)})</span>
            </div>
            <div class="history-date">📅 ${this.escapeHTML(m.formattedDate)}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:14px;">
          <div style="text-align:right; font-size:0.85rem;">
            <div>Lines: <strong style="color:#f59e0b;">${Number(m.myLines) || 0}/5</strong></div>
            <div style="color:var(--text-muted); font-size:0.75rem;">${Number(m.turns) || 0} turns</div>
          </div>
          ${m.myBoard && m.myBoard.length === 25 ? `
            <button class="btn btn-secondary btn-inspect-board" style="padding:6px 12px; font-size:0.8rem;">
              🔍 Inspect Board
            </button>
          ` : ''}
        </div>
      `;

      const inspectBtn = card.querySelector('.btn-inspect-board');
      if (inspectBtn) {
        inspectBtn.addEventListener('click', () => {
          this.inspectHistoricBoard(m);
        });
      }

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
    this.dom.btnHomePlayBot.addEventListener('click', () => {
      if (!this.ensureUserSession()) return;
      this.startSoloBotGame();
    });

    this.dom.btnHomePlayMultiplayer.addEventListener('click', () => {
      if (!this.ensureUserSession()) return;
      this.switchView('lobby');
    });

    this.dom.btnLobbyBot.addEventListener('click', () => {
      if (!this.ensureUserSession()) return;
      this.startSoloBotGame();
    });

    this.dom.btnLobbyCreate.addEventListener('click', () => {
      if (!this.ensureUserSession()) return;

      const code = 'BING' + Math.floor(10 + Math.random() * 90);
      this.state.mode = 'multiplayer';
      this.state.roomCode = code;
      this.state.isHost = true;
      this.state.opponentName = 'Waiting...';
      this.state.roomPlayers.clear();

      const myId = window.BingoMultiplayer.playerId;
      const myName = window.BingoAuthStorage.currentUser.username;
      this.state.roomPlayers.set(myId, {
        id: myId,
        name: myName,
        isHost: true,
        isReady: false,
        linesCount: 0
      });

      window.BingoMultiplayer.joinRoom(code, myName, true);
      this.startSetupPhase();
      this.openInviteModal();
    });

    this.dom.btnLobbyJoin.addEventListener('click', () => {
      if (!this.ensureUserSession()) return;

      const code = (this.dom.joinRoomInput.value || '').toUpperCase().trim();
      if (!code) {
        alert('Please enter a room code.');
        return;
      }
      this.state.mode = 'multiplayer';
      this.state.roomCode = code;
      this.state.isHost = false;
      this.state.opponentName = 'Host';
      this.state.roomPlayers.clear();

      const myId = window.BingoMultiplayer.playerId;
      const myName = window.BingoAuthStorage.currentUser.username;
      this.state.roomPlayers.set(myId, {
        id: myId,
        name: myName,
        isHost: false,
        isReady: false,
        linesCount: 0
      });

      window.BingoMultiplayer.joinRoom(code, myName, false);
      this.startSetupPhase();
    });

    // Setup Board Actions
    if (this.dom.btnHostStartGame) {
      this.dom.btnHostStartGame.addEventListener('click', () => {
        this.hostStartGame();
      });
    }

    if (this.dom.btnSetupInvite) {
      this.dom.btnSetupInvite.addEventListener('click', () => {
        this.openInviteModal();
      });
    }

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

    // Android Hardware / Gesture Back Button handling
    window.addEventListener('popstate', () => {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        activeModal.classList.remove('active');
      }
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
    this.state.roomPlayers.clear();
    if (this.dom.setupRosterCard) this.dom.setupRosterCard.style.display = 'none';
    if (this.dom.hostStartContainer) this.dom.hostStartContainer.style.display = 'none';
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

    const randomBoard = window.BingoLogic.generateRandomBoard();
    this.state.setupBoard = [...randomBoard];
    this.state.setupRemaining.clear();
    this.dom.btnSetupReady.disabled = false;

    // Reset self ready state in roster
    const myId = window.BingoMultiplayer.playerId;
    if (this.state.roomPlayers.has(myId)) {
      this.state.roomPlayers.get(myId).isReady = false;
    }

    if (this.state.mode === 'multiplayer') {
      if (this.dom.setupRosterCard) this.dom.setupRosterCard.style.display = 'block';
      if (this.dom.hostStartContainer) {
        this.dom.hostStartContainer.style.display = this.state.isHost ? 'block' : 'none';
      }
      this.renderRoomRoster();
      this.checkHostStartEligibility();
    } else {
      if (this.dom.setupRosterCard) this.dom.setupRosterCard.style.display = 'none';
      if (this.dom.hostStartContainer) this.dom.hostStartContainer.style.display = 'none';
    }

    this.renderSetupGrid();
    this.renderSetupPalette();
    this.switchView('setup');
    this.updateChatVisibility();
  }

  renderRoomRoster() {
    if (!this.dom.setupRosterCard) return;
    const count = this.state.roomPlayers.size;
    if (this.dom.setupPlayerCount) {
      this.dom.setupPlayerCount.textContent = count;
    }

    if (!this.dom.setupRosterList) return;
    this.dom.setupRosterList.innerHTML = '';

    const myId = window.BingoMultiplayer.playerId;

    this.state.roomPlayers.forEach(player => {
      const isMe = (player.id === myId);
      const item = document.createElement('div');
      item.className = 'setup-player-item';

      const info = document.createElement('div');
      info.className = 'setup-player-info';
      info.innerHTML = `
        <span>${isMe ? '👉 ' : ''}${this.escapeHTML(player.name)} ${isMe ? '(You)' : ''}</span>
        ${player.isHost ? '<span class="badge-host">👑 Host</span>' : ''}
      `;

      const statusBadge = document.createElement('span');
      if (player.isReady) {
        statusBadge.className = 'badge-ready';
        statusBadge.textContent = '✅ Ready';
      } else {
        statusBadge.className = 'badge-setting';
        statusBadge.textContent = '⏳ Setting grid...';
      }

      item.appendChild(info);
      item.appendChild(statusBadge);
      this.dom.setupRosterList.appendChild(item);
    });

    this.checkHostStartEligibility();
  }

  checkHostStartEligibility() {
    if (!this.state.isHost || !this.dom.btnHostStartGame) return;

    const total = this.state.roomPlayers.size;
    const readyCount = Array.from(this.state.roomPlayers.values()).filter(p => p.isReady).length;

    if (total < 2) {
      this.dom.btnHostStartGame.disabled = true;
      this.dom.btnHostStartGame.textContent = '⏳ Waiting for friends to join... (1/2 min)';
      this.dom.btnHostStartGame.className = 'btn btn-secondary btn-block btn-lg';
    } else if (readyCount < total) {
      this.dom.btnHostStartGame.disabled = true;
      this.dom.btnHostStartGame.textContent = `⏳ Waiting for all to be ready (${readyCount}/${total})`;
      this.dom.btnHostStartGame.className = 'btn btn-secondary btn-block btn-lg';
    } else {
      this.dom.btnHostStartGame.disabled = false;
      this.dom.btnHostStartGame.textContent = `🔥 Start Match Now! (${readyCount}/${total} Ready)`;
      this.dom.btnHostStartGame.className = 'btn btn-success btn-block btn-lg';
    }
  }

  hostStartGame() {
    if (!this.state.isHost) return;
    const total = this.state.roomPlayers.size;
    if (total < 2) {
      alert('Need at least 2 players to start! Invite a friend to join.');
      return;
    }

    const myId = window.BingoMultiplayer.playerId;
    const otherIds = Array.from(this.state.roomPlayers.keys()).filter(id => id !== myId);
    // Player order: Host starts first, followed by other players in order
    const playerOrder = [myId, ...otherIds];

    const payload = {
      playerOrder: playerOrder,
      players: Array.from(this.state.roomPlayers.values()),
      currentTurnPlayerId: playerOrder[0],
      turnIndex: 0
    };

    window.BingoMultiplayer.send('GAME_START', payload);
    this.handleGameStarted(payload);
  }

  handleGameStarted(data) {
    this.state.playerOrder = data.playerOrder || [];
    this.state.currentTurnPlayerId = data.currentTurnPlayerId || (this.state.playerOrder[0] || null);
    this.state.turnIndex = data.turnIndex || 0;

    if (data.players && Array.isArray(data.players)) {
      data.players.forEach(p => {
        if (!this.state.roomPlayers.has(p.id)) {
          this.state.roomPlayers.set(p.id, p);
        }
      });
    }

    const myId = window.BingoMultiplayer.playerId;
    const isMyTurn = (this.state.currentTurnPlayerId === myId);

    this.startActiveGame(isMyTurn);
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

    const myId = window.BingoMultiplayer.playerId;
    const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';

    if (this.state.roomPlayers.has(myId)) {
      this.state.roomPlayers.get(myId).isReady = true;
    }

    if (this.state.mode === 'bot') {
      this.state.botBoard = window.BingoLogic.generateRandomBoard();
      this.state.isOpponentReady = true;
      this.startActiveGame(true);
    } else {
      this.dom.setupWaitingIndicator.style.display = 'block';
      this.dom.setupWaitingIndicator.textContent = this.state.isHost
        ? '✅ You are ready! Click Start Match below when players are ready.'
        : '✅ You are ready! Waiting for host to start match...';
      this.dom.setupPaletteContainer.style.display = 'none';

      window.BingoMultiplayer.send('PLAYER_READY', {
        id: myId,
        name: myName,
        isReady: true
      });

      this.renderRoomRoster();
      this.checkHostStartEligibility();
    }
  }

  startActiveGame(isMyTurn) {
    this.state.isMyTurn = isMyTurn;
    this.state.calledNumbers = new Set();
    this.state.myCompletedLineIds = new Set();
    this.state.opponentLinesCount = 0;
    this.state.isGameOver = false;
    this.state.turnCount = 0;

    this.dom.letters.forEach(el => el.classList.remove('crossed'));
    this.dom.gameRoomTag.textContent = this.state.mode === 'bot' ? 'Solo vs Bot' : `Room: ${this.state.roomCode}`;

    this.updateOpponentStatusDisplays();

    this.dom.latestCallNumber.textContent = '-';
    this.dom.latestCallCaller.textContent = 'Game started!';

    this.updateTurnBanner();
    this.renderGameBoard();
    this.switchView('game');
    this.updateChatVisibility();
    this.saveCurrentGame();

    if (isMyTurn) {
      window.bingoAudio.playYourTurn();
    } else if (this.state.mode === 'bot') {
      this.scheduleBotMove();
    }
  }

  updateOpponentStatusDisplays() {
    if (!this.dom.gameOpponentsContainer) return;

    if (this.state.mode === 'bot') {
      this.dom.gameOpponentsContainer.innerHTML = `
        <div class="opponent-status-pill" id="opponent-status-display">
          <span>Opponent:</span>
          <strong id="opponent-name-display">${this.state.opponentName || 'Computer'}</strong>
          <span id="opponent-lines-display">(${this.state.opponentLinesCount || 0}/5)</span>
        </div>
      `;
      return;
    }

    // Multiplayer: Render all opponents in the room with their line counts
    const myId = window.BingoMultiplayer.playerId;
    this.dom.gameOpponentsContainer.innerHTML = '';

    this.state.roomPlayers.forEach(p => {
      if (p.id === myId) return;

      const isCurrentTurn = (p.id === this.state.currentTurnPlayerId);
      const pill = document.createElement('div');
      pill.className = 'player-status-pill' + (isCurrentTurn ? ' active-turn' : '');
      pill.innerHTML = `
        <span>${isCurrentTurn ? '👉 ' : ''}${this.escapeHTML(p.name)}:</span>
        <span style="color:#f59e0b; font-weight:700;">(${Number(p.linesCount) || 0}/5)</span>
      `;
      this.dom.gameOpponentsContainer.appendChild(pill);
    });
  }

  updateTurnBanner() {
    if (this.state.isMyTurn) {
      this.dom.turnBanner.className = 'turn-banner my-turn';
      this.dom.turnBannerIcon.textContent = '👉';
      this.dom.turnBannerText.textContent = 'YOUR TURN! Pick any uncrossed number on your board.';
    } else {
      let waitingName = 'Opponent';
      if (this.state.mode === 'bot') {
        waitingName = this.state.opponentName || 'Computer';
      } else if (this.state.currentTurnPlayerId) {
        const nextP = this.state.roomPlayers.get(this.state.currentTurnPlayerId);
        waitingName = nextP ? nextP.name : 'other player';
      }
      this.dom.turnBanner.className = 'turn-banner opponent-turn';
      this.dom.turnBannerIcon.textContent = '⏳';
      this.dom.turnBannerText.textContent = `Waiting for ${waitingName} to pick...`;
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

    const myId = window.BingoMultiplayer.playerId;
    const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';

    this.state.calledNumbers.add(num);
    this.state.turnCount++;
    window.bingoAudio.playStrike();

    this.dom.latestCallNumber.textContent = num;
    this.dom.latestCallCaller.textContent = 'Called by You';

    // Calculate next turn for multiplayer round-robin
    let nextTurnIndex = 0;
    let nextTurnPlayerId = null;
    let nextTurnPlayerName = '';

    if (this.state.mode === 'multiplayer' && this.state.playerOrder.length > 0) {
      nextTurnIndex = (this.state.turnIndex + 1) % this.state.playerOrder.length;
      nextTurnPlayerId = this.state.playerOrder[nextTurnIndex];
      const nextP = this.state.roomPlayers.get(nextTurnPlayerId);
      nextTurnPlayerName = nextP ? nextP.name : 'Next Player';

      window.BingoMultiplayer.send('NUMBER_CALLED', {
        number: num,
        callerId: myId,
        callerName: myName,
        turnIndex: nextTurnIndex,
        nextTurnPlayerId: nextTurnPlayerId,
        nextTurnPlayerName: nextTurnPlayerName
      });
    }

    const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
    this.renderGameBoard();
    this.saveCurrentGame();

    if (this.state.mode === 'multiplayer') {
      window.BingoMultiplayer.send('LINES_UPDATE', {
        playerId: myId,
        playerName: myName,
        lineCount: evaluation.lineCount
      });
    }

    if (evaluation.isBingo) {
      this.handleGameOver(myName, true);
      return;
    }

    if (this.state.mode === 'multiplayer') {
      this.state.turnIndex = nextTurnIndex;
      this.state.currentTurnPlayerId = nextTurnPlayerId;
      this.state.isMyTurn = false;
      this.updateTurnBanner();
      this.updateOpponentStatusDisplays();
      this.renderGameBoard();
    } else if (this.state.mode === 'bot') {
      this.state.isMyTurn = false;
      this.updateTurnBanner();
      this.renderGameBoard();
      this.scheduleBotMove();
    }
  }

  scheduleBotMove() {
    setTimeout(() => {
      if (this.state.isGameOver) return;

      const botPick = window.BingoLogic.getBestComputerMove(this.state.botBoard, this.state.calledNumbers);
      if (botPick === null) return;

      const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';

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
        this.handleGameOver(myName, true);
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
    const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';

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
      this.dom.winnerSubDisplay.textContent = `${winnerName} reached 5 lines first. Logged to your match history.`;
    }

    if (this.state.mode === 'multiplayer' && isMe) {
      window.BingoMultiplayer.send('BINGO_WIN', {
        winnerName: myName
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
      if (!data || typeof data !== 'object' || !data.id) return;
      if (data.id === window.BingoMultiplayer.playerId) return;

      const cleanName = String(data.name || 'Friend').substring(0, 20);
      this.state.roomPlayers.set(data.id, {
        id: String(data.id).substring(0, 30),
        name: cleanName,
        isHost: !!data.isHost,
        isReady: !!data.isReady,
        linesCount: 0
      });

      this.renderRoomRoster();
      this.updateOpponentStatusDisplays();
      this.showToast(`👋 ${cleanName} joined the room!`, 3000);
      window.bingoAudio.playPop();

      const myId = window.BingoMultiplayer.playerId;
      const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';

      window.BingoMultiplayer.send('PLAYER_ANNOUNCE', {
        id: myId,
        name: myName,
        isHost: this.state.isHost,
        isReady: this.state.amIReady,
        linesCount: this.state.myCompletedLineIds ? this.state.myCompletedLineIds.size : 0
      });

      if (this.state.isHost) {
        window.BingoMultiplayer.send('ROOM_SYNC', {
          players: Array.from(this.state.roomPlayers.values())
        });
      }
    });

    window.BingoMultiplayer.on('PLAYER_ANNOUNCE', (data) => {
      if (!data || typeof data !== 'object' || !data.id) return;
      if (data.id === window.BingoMultiplayer.playerId) return;

      const cleanName = String(data.name || 'Friend').substring(0, 20);
      const safeLines = Number.isInteger(data.linesCount) && data.linesCount >= 0 && data.linesCount <= 5 ? data.linesCount : 0;
      this.state.roomPlayers.set(data.id, {
        id: String(data.id).substring(0, 30),
        name: cleanName,
        isHost: !!data.isHost,
        isReady: !!data.isReady,
        linesCount: safeLines
      });

      this.renderRoomRoster();
      this.updateOpponentStatusDisplays();
    });

    window.BingoMultiplayer.on('ROOM_SYNC', (data) => {
      if (!data || !data.players || !Array.isArray(data.players)) return;
      data.players.forEach(p => {
        if (p && p.id && p.id !== window.BingoMultiplayer.playerId) {
          const safeLines = Number.isInteger(p.linesCount) && p.linesCount >= 0 && p.linesCount <= 5 ? p.linesCount : 0;
          this.state.roomPlayers.set(p.id, {
            id: String(p.id).substring(0, 30),
            name: String(p.name || 'Friend').substring(0, 20),
            isHost: !!p.isHost,
            isReady: !!p.isReady,
            linesCount: safeLines
          });
        }
      });
      this.renderRoomRoster();
      this.updateOpponentStatusDisplays();
    });

    window.BingoMultiplayer.on('PLAYER_READY', (data) => {
      if (!data || !data.id) return;
      const cleanName = String(data.name || 'Player').substring(0, 20);
      const p = this.state.roomPlayers.get(data.id);
      if (p) {
        p.isReady = true;
      } else {
        this.state.roomPlayers.set(data.id, {
          id: String(data.id).substring(0, 30),
          name: cleanName,
          isHost: false,
          isReady: true,
          linesCount: 0
        });
      }
      this.renderRoomRoster();
      this.showToast(`✅ ${cleanName} is ready!`, 2500);
      this.checkHostStartEligibility();
    });

    window.BingoMultiplayer.on('GAME_START', (data) => {
      this.handleGameStarted(data);
    });

    window.BingoMultiplayer.on('NUMBER_CALLED', (data) => {
      if (!data || typeof data !== 'object') return;
      const num = Number(data.number);
      if (!Number.isInteger(num) || num < 1 || num > 25) return;
      if (this.state.calledNumbers.has(num)) return;

      const myId = window.BingoMultiplayer.playerId;
      const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';

      this.state.calledNumbers.add(num);
      this.state.turnCount++;
      window.bingoAudio.playStrike();

      const safeCaller = String(data.callerName || 'Player').substring(0, 25);
      this.dom.latestCallNumber.textContent = num;
      this.dom.latestCallCaller.textContent = `Called by ${safeCaller}`;

      const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
      this.renderGameBoard();
      this.saveCurrentGame();

      // Broadcast my line count if it updated
      window.BingoMultiplayer.send('LINES_UPDATE', {
        playerId: myId,
        playerName: myName,
        lineCount: evaluation.lineCount
      });

      if (evaluation.isBingo) {
        this.handleGameOver(myName, true);
        return;
      }

      this.state.turnIndex = (typeof data.turnIndex === 'number') ? data.turnIndex : 0;
      this.state.currentTurnPlayerId = data.nextTurnPlayerId;
      this.state.isMyTurn = (data.nextTurnPlayerId === myId);

      this.updateTurnBanner();
      this.updateOpponentStatusDisplays();
      this.renderGameBoard();

      if (this.state.isMyTurn) {
        window.bingoAudio.playYourTurn();
      }
    });

    window.BingoMultiplayer.on('LINES_UPDATE', (data) => {
      if (!data || typeof data !== 'object' || !data.playerId) return;
      const count = Number(data.lineCount);
      if (!Number.isInteger(count) || count < 0 || count > 5) return;
      const p = this.state.roomPlayers.get(data.playerId);
      if (p) {
        p.linesCount = count;
      }
      this.updateOpponentStatusDisplays();
    });

    window.BingoMultiplayer.on('BINGO_WIN', (data) => {
      if (!data || typeof data !== 'object') return;
      const winner = String(data.winnerName || 'Opponent').substring(0, 25);
      this.handleGameOver(winner, false);
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
    const rawText = String(text || '').trim();
    if (!rawText) return;
    const cleanText = rawText.substring(0, 150);

    const myName = window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : 'Player';
    const msg = {
      sender: myName,
      text: cleanText
    };
    window.BingoMultiplayer.send('CHAT', msg);
    this.appendChatMessage(msg);
  }

  appendChatMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    const sender = String(msg.sender || 'Player').substring(0, 25);
    const text = String(msg.text || '').substring(0, 150);
    if (!text.trim()) return;

    const div = document.createElement('div');
    div.className = 'chat-msg';

    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    senderSpan.textContent = sender + ': ';

    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    div.appendChild(senderSpan);
    div.appendChild(textSpan);
    this.dom.chatMessages.appendChild(div);
    this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

    if (!this.dom.chatDrawer.classList.contains('open')) {
      this.dom.chatToggleIcon.textContent = '💬 (1)';
    }
  }

  triggerReaction(emoji, broadcast = true) {
    const ALLOWED_EMOJIS = ['🔥', '👏', '😱', '🎉', '💪', '🤣', '⭐', '❤️', '👍'];
    if (!ALLOWED_EMOJIS.includes(emoji)) return;

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
