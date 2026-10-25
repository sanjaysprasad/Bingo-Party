/**
 * Bingo Party - Main Application Controller
 * Coordinates Views, Networking, Bingo Engine, Web Audio, and UI Event Handlers.
 */
class BingoApp {
  constructor() {
    this.gameState = {
      role: null,           // 'host' | 'player'
      roomId: null,
      playerName: '',
      dauberColor: 'red',
      autoDaub: false,
      gameType: 'classic',
      pattern: 'line',
      customWords: [],
      card: null,           // array of 25 tile objects
      markedIndices: new Set([12]), // index 12 = FREE space always marked
      calledBalls: [],      // array of called ball objects { letter, number, label, colorClass }
      remainingBallPool: [],// host only: remaining uncalled balls
      players: new Map(),   // Map<peerId, { name, dauberColor, marksCount, minAway, isHost }>
      autoCallInterval: null,
      autoCallSpeed: 6000,  // ms
      isAutoCalling: false
    };

    this.initDOMElements();
    this.loadSavedPreferences();
    this.setupViewRouting();
    this.setupEventHandlers();
    this.setupNetworkListeners();
    this.checkUrlRoomParam();
  }

  // Cache essential DOM elements
  initDOMElements() {
    this.dom = {
      // Views
      viewLobby: document.getElementById('view-lobby'),
      viewGame: document.getElementById('view-game'),

      // Header
      headerRoomStatus: document.getElementById('header-room-status'),
      headerRoomCode: document.getElementById('header-room-code'),
      networkStatusDot: document.getElementById('network-status-dot'),
      btnOpenInvite: document.getElementById('btn-open-invite'),
      btnOpenPlayers: document.getElementById('btn-open-players'),
      headerPlayerCount: document.getElementById('header-player-count'),
      btnToggleSound: document.getElementById('btn-toggle-sound'),
      btnToggleVoice: document.getElementById('btn-toggle-voice'),
      btnOpenRules: document.getElementById('btn-open-rules'),
      btnHome: document.getElementById('btn-home'),

      // Lobby Forms
      formHost: document.getElementById('form-host-game'),
      hostName: document.getElementById('host-name'),
      hostRoomCode: document.getElementById('host-room-code'),
      hostGameType: document.getElementById('host-game-type'),
      groupCustomWords: document.getElementById('group-custom-words'),
      hostCustomWords: document.getElementById('host-custom-words'),
      hostPattern: document.getElementById('host-pattern'),
      hostIsPlaying: document.getElementById('host-is-playing'),
      hostDauberPicker: document.getElementById('host-dauber-picker'),

      formJoin: document.getElementById('form-join-game'),
      joinName: document.getElementById('join-name'),
      joinRoomCode: document.getElementById('join-room-code'),
      joinDauberPicker: document.getElementById('join-dauber-picker'),

      // Game Screen
      gameRoomDisplay: document.getElementById('game-room-display'),
      gamePatternDisplay: document.getElementById('game-pattern-display'),
      gameBallsCounter: document.getElementById('game-balls-called-counter'),
      btnCopyLink: document.getElementById('btn-copy-link'),
      btnLeaveRoom: document.getElementById('btn-leave-room'),

      // Caller Display
      callerStageTitle: document.getElementById('caller-stage-title'),
      currentBallElement: document.getElementById('current-ball-element'),
      currentBallLetter: document.getElementById('current-ball-letter'),
      currentBallNumber: document.getElementById('current-ball-number'),
      autoCallTimerBar: document.getElementById('auto-call-timer-bar'),
      autoCallTimerFill: document.getElementById('auto-call-timer-fill'),
      hostControls: document.getElementById('host-controls'),
      btnCallBall: document.getElementById('btn-call-ball'),
      btnNewRound: document.getElementById('btn-new-round'),
      toggleAutoCall: document.getElementById('toggle-auto-call'),
      autoCallSpeed: document.getElementById('auto-call-speed'),
      recentBallsContainer: document.getElementById('recent-balls-container'),
      masterBoardGrid: document.getElementById('master-board-grid'),
      btnToggleMasterBoard: document.getElementById('btn-toggle-master-board'),

      // Bingo Card
      playerCardContainer: document.getElementById('player-card-container'),
      nearBingoAlert: document.getElementById('near-bingo-alert'),
      bingoCardElement: document.getElementById('bingo-card-element'),
      bingoGridElement: document.getElementById('bingo-grid-element'),
      btnClaimBingo: document.getElementById('btn-claim-bingo'),
      toggleAutoDaub: document.getElementById('toggle-auto-daub'),
      inGameDauberPicker: document.getElementById('in-game-dauber-picker'),

      // Modals
      modalInvite: document.getElementById('modal-invite'),
      modalQrContainer: document.getElementById('modal-qr-container'),
      modalRoomCode: document.getElementById('modal-room-code'),
      modalInviteLinkInput: document.getElementById('modal-invite-link-input'),
      btnCopyModalLink: document.getElementById('btn-copy-modal-link'),

      modalPlayers: document.getElementById('modal-players'),
      modalPlayerCount: document.getElementById('modal-player-count'),
      modalPlayersList: document.getElementById('modal-players-list'),

      modalWinner: document.getElementById('modal-winner'),
      winnerNameDisplay: document.getElementById('winner-name-display'),
      winnerDetailsDisplay: document.getElementById('winner-details-display'),
      btnWinnerContinue: document.getElementById('btn-winner-continue'),

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

  // Load preferences from localStorage
  loadSavedPreferences() {
    const savedName = localStorage.getItem('bingo_player_name') || '';
    if (savedName) {
      this.dom.hostName.value = savedName;
      this.dom.joinName.value = savedName;
      this.gameState.playerName = savedName;
    }

    const savedDauber = localStorage.getItem('bingo_dauber_color') || 'red';
    this.setDauberColor(savedDauber);

    // Generate random default 6-character room code
    const randCode = 'BINGO' + Math.floor(10 + Math.random() * 90);
    this.dom.hostRoomCode.value = randCode;

    // Build Master Board Static Grid
    this.buildMasterBoardGrid();
  }

  // Check if URL has ?room=XYZ to prefill join code
  checkUrlRoomParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.dom.joinRoomCode.value = roomParam.toUpperCase().trim();
      this.showToast(`Invited to room ${roomParam.toUpperCase()}! Enter your name and join.`, 4000);
    }
  }

  // View Routing: 'lobby' or 'game'
  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (viewName === 'game') {
      this.dom.viewGame.classList.add('active');
      this.dom.headerRoomStatus.style.display = 'inline-flex';
      this.dom.btnOpenInvite.style.display = 'inline-flex';
      this.dom.btnOpenPlayers.style.display = 'inline-flex';
    } else {
      this.dom.viewLobby.classList.add('active');
      this.dom.headerRoomStatus.style.display = 'none';
      this.dom.btnOpenInvite.style.display = 'none';
      this.dom.btnOpenPlayers.style.display = 'none';
    }
  }

  // Toast feedback notifications
  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Change Dauber Color Scheme
  setDauberColor(color) {
    this.gameState.dauberColor = color;
    localStorage.setItem('bingo_dauber_color', color);

    document.body.className = `dauber-${color}`;

    // Update active button indicators across all pickers
    document.querySelectorAll('.dauber-color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });
  }

  // Build Master Board (15 columns x 5 rows for 75 balls)
  buildMasterBoardGrid() {
    this.dom.masterBoardGrid.innerHTML = '';
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const ranges = [
      { min: 1, max: 15 },
      { min: 16, max: 30 },
      { min: 31, max: 45 },
      { min: 46, max: 60 },
      { min: 61, max: 75 }
    ];

    letters.forEach((letter, rIdx) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'master-grid-row';

      const letterBadge = document.createElement('div');
      letterBadge.className = `master-row-letter header-${letter.toLowerCase()}`;
      letterBadge.textContent = letter;
      rowDiv.appendChild(letterBadge);

      const numContainer = document.createElement('div');
      numContainer.className = 'master-row-numbers';

      const range = ranges[rIdx];
      for (let n = range.min; n <= range.max; n++) {
        const chip = document.createElement('div');
        chip.className = `master-num-chip chip-${letter.toLowerCase()}`;
        chip.id = `master-chip-${letter}-${n}`;
        chip.textContent = n;
        numContainer.appendChild(chip);
      }

      rowDiv.appendChild(numContainer);
      this.dom.masterBoardGrid.appendChild(rowDiv);
    });
  }

  // Setup Event Handlers
  setupEventHandlers() {
    // Dauber picker clicks
    document.querySelectorAll('.dauber-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setDauberColor(btn.dataset.color);
      });
    });

    // Custom words toggle
    this.dom.hostGameType.addEventListener('change', (e) => {
      this.dom.groupCustomWords.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // Host form submit
    this.dom.formHost.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleHostSubmit();
    });

    // Join form submit
    this.dom.formJoin.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleJoinSubmit();
    });

    // Audio & Voice toggles
    this.dom.btnToggleSound.addEventListener('click', () => {
      const isMuted = window.bingoAudio.toggleMute();
      this.dom.btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? 'Audio muted' : 'Audio unmuted');
    });

    this.dom.btnToggleVoice.addEventListener('click', () => {
      const isVoice = window.bingoAudio.toggleVoice();
      this.dom.btnToggleVoice.textContent = isVoice ? '🗣️' : '🚫';
      this.showToast(isVoice ? 'Voice caller enabled' : 'Voice caller disabled');
    });

    // Modals
    this.dom.btnOpenInvite.addEventListener('click', () => this.openInviteModal());
    this.dom.btnOpenPlayers.addEventListener('click', () => this.openPlayersModal());
    this.dom.btnOpenRules.addEventListener('click', () => this.openModal(this.dom.modalRules));
    this.dom.btnCopyLink.addEventListener('click', () => this.copyInviteLink());
    this.dom.btnCopyModalLink.addEventListener('click', () => this.copyInviteLink());

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Host Controls: Draw ball
    this.dom.btnCallBall.addEventListener('click', () => {
      this.hostDrawNextBall();
    });

    // Host Controls: Auto-caller toggle
    this.dom.toggleAutoCall.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.startAutoCaller();
      } else {
        this.stopAutoCaller();
      }
    });

    this.dom.autoCallSpeed.addEventListener('change', (e) => {
      this.gameState.autoCallSpeed = parseInt(e.target.value, 10);
      if (this.gameState.isAutoCalling) {
        this.startAutoCaller(); // restart with new speed
      }
    });

    // Host Controls: New Round
    this.dom.btnNewRound.addEventListener('click', () => {
      if (confirm('Start a new round? This will clear all called balls and restart cards for everyone.')) {
        this.hostResetGame();
      }
    });

    // Winner Continue button
    this.dom.btnWinnerContinue.addEventListener('click', () => {
      this.dom.modalWinner.classList.remove('active');
    });

    // Leave room
    this.dom.btnLeaveRoom.addEventListener('click', () => {
      if (confirm('Are you sure you want to leave the room?')) {
        this.leaveRoom();
      }
    });

    // Auto-daub toggle
    this.dom.toggleAutoDaub.addEventListener('change', (e) => {
      this.gameState.autoDaub = e.target.checked;
      if (this.gameState.autoDaub) {
        this.runAutoDaub();
      }
    });

    // Claim BINGO button
    this.dom.btnClaimBingo.addEventListener('click', () => {
      this.handleClaimBingo();
    });

    // Toggle master board visibility
    this.dom.btnToggleMasterBoard.addEventListener('click', () => {
      const isHidden = this.dom.masterBoardGrid.style.display === 'none';
      this.dom.masterBoardGrid.style.display = isHidden ? 'block' : 'none';
    });

    // Chat drawer toggle
    this.dom.chatHeaderToggle.addEventListener('click', () => {
      this.dom.chatDrawer.classList.toggle('open');
      const isOpen = this.dom.chatDrawer.classList.contains('open');
      this.dom.chatToggleIcon.textContent = isOpen ? '▼' : '▲';
    });

    // Chat form submit
    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dom.chatInput.value.trim();
      if (!text) return;
      this.sendChatMessage(text);
      this.dom.chatInput.value = '';
    });

    // Reaction buttons
    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        this.triggerReaction(emoji, true);
      });
    });

    // Logo click
    this.dom.btnHome.addEventListener('click', () => {
      if (this.gameState.roomId) {
        if (confirm('Return to lobby? This will exit the active game.')) {
          this.leaveRoom();
        }
      }
    });
  }

  // Setup Networking Handlers
  setupNetworkListeners() {
    window.BingoNetwork.on('status_change', ({ status, message }) => {
      this.dom.networkStatusDot.className = `status-dot ${status}`;
      if (message) this.showToast(message, 3000);
    });

    // Host receives client JOIN request
    window.BingoNetwork.on('JOIN', (data) => {
      if (!this.gameState.role === 'host') return;
      const player = data.player;
      if (!player) return;

      this.gameState.players.set(player.peerId, {
        name: player.name,
        dauberColor: player.dauberColor,
        marksCount: 1, // FREE space
        minAway: 5,
        isHost: false,
        peerId: player.peerId
      });

      this.updatePlayerCount();
      this.showToast(`👋 ${player.name} joined!`, 3000);
      window.bingoAudio.playReaction();

      // Send current complete game state to newly joined player
      window.BingoNetwork.sendToPeer(player.peerId, {
        type: 'ROOM_STATE',
        gameType: this.gameState.gameType,
        pattern: this.gameState.pattern,
        calledBalls: this.gameState.calledBalls,
        currentBall: this.gameState.calledBalls[this.gameState.calledBalls.length - 1] || null,
        players: Array.from(this.gameState.players.entries()),
        hostName: this.gameState.playerName
      });

      // Broadcast updated player list to all
      window.BingoNetwork.broadcast({
        type: 'PLAYERS_UPDATE',
        players: Array.from(this.gameState.players.entries())
      });
    });

    // Client receives ROOM_STATE from Host
    window.BingoNetwork.on('ROOM_STATE', (data) => {
      this.gameState.gameType = data.gameType || 'classic';
      this.gameState.pattern = data.pattern || 'line';
      this.gameState.calledBalls = data.calledBalls || [];

      this.dom.gamePatternDisplay.textContent = `Pattern: ${window.BingoEngine.PATTERNS[this.gameState.pattern]?.name || 'Single Line'}`;

      if (data.players) {
        this.gameState.players = new Map(data.players);
        this.updatePlayerCount();
      }

      // Generate player's card if not yet generated
      if (!this.gameState.card) {
        this.generateAndRenderPlayerCard();
      }

      // Sync called balls and master board
      this.syncAllCalledBalls(this.gameState.calledBalls);

      if (data.currentBall) {
        this.displayBallOnTumbler(data.currentBall, false);
      }
    });

    // Broadcasted player roster update
    window.BingoNetwork.on('PLAYERS_UPDATE', (data) => {
      if (data.players) {
        this.gameState.players = new Map(data.players);
        this.updatePlayerCount();
      }
    });

    // Player progress update (Host tracks who is close)
    window.BingoNetwork.on('PLAYER_PROGRESS', (data) => {
      const p = this.gameState.players.get(data.peerId);
      if (p) {
        p.marksCount = data.marksCount;
        p.minAway = data.minAway;
        this.renderPlayersList();
      }
    });

    // Ball called event received by all
    window.BingoNetwork.on('BALL_CALLED', (data) => {
      const ball = data.ball;
      if (!ball) return;

      this.gameState.calledBalls.push(ball);
      this.displayBallOnTumbler(ball, true);
      this.addBallToRecentReel(ball);
      this.markMasterBoardChip(ball);
      this.updateCalledCounter();

      window.bingoAudio.playBallDraw();
      window.bingoAudio.speakBall(ball.label);

      // Check card for match
      this.checkCardForCalledMatch(ball);

      // If auto-daub is turned on, mark automatically
      if (this.gameState.autoDaub) {
        this.runAutoDaub();
      }
    });

    // Claim BINGO event (Host verifies)
    window.BingoNetwork.on('CLAIM_BINGO', (data) => {
      if (this.gameState.role !== 'host') return;
      this.verifyPlayerClaim(data);
    });

    // Bingo Verified Announcement
    window.BingoNetwork.on('BINGO_VERIFIED', (data) => {
      this.handleBingoVictory(data);
    });

    // False Bingo rejection
    window.BingoNetwork.on('BINGO_REJECTED', (data) => {
      window.bingoAudio.playError();
      this.showToast(`❌ False Bingo: ${data.reason}`, 4000);
    });

    // New Round Game Reset
    window.BingoNetwork.on('GAME_RESET', () => {
      this.resetPlayerCardForNewRound();
      this.showToast('🔄 New Round Started!', 3000);
    });

    // Chat message received
    window.BingoNetwork.on('CHAT', (data) => {
      this.appendChatMessage(data);
    });

    // Reaction received
    window.BingoNetwork.on('REACTION', (data) => {
      this.triggerReaction(data.emoji, false);
    });
  }

  // Handle Host Form Submit
  async handleHostSubmit() {
    const name = this.dom.hostName.value.trim() || 'Host';
    const roomCode = BingoNetwork.sanitizeRoomCode(this.dom.hostRoomCode.value);
    const gameType = this.dom.hostGameType.value;
    const pattern = this.dom.hostPattern.value;
    const isPlaying = this.dom.hostIsPlaying.checked;

    if (!roomCode) {
      alert('Please enter a valid room code.');
      return;
    }

    localStorage.setItem('bingo_player_name', name);
    this.gameState.role = 'host';
    this.gameState.roomId = roomCode;
    this.gameState.playerName = name;
    this.gameState.gameType = gameType;
    this.gameState.pattern = pattern;

    // Custom words handling
    if (gameType === 'custom') {
      const words = this.dom.hostCustomWords.value.split(',').map(w => w.trim()).filter(Boolean);
      if (words.length < 24) {
        alert('Please enter at least 24 custom words separated by commas.');
        return;
      }
      this.gameState.customWords = words;
    }

    // Initialize Host ball pool
    if (gameType === 'classic') {
      this.gameState.remainingBallPool = window.BingoEngine.generateAllClassicBalls();
    } else {
      let pool = this.gameState.customWords;
      if (!pool || pool.length < 24) {
        pool = window.BingoEngine.PRESET_THEMES[gameType]?.words || window.BingoEngine.PRESET_THEMES.tech.words;
      }
      this.gameState.remainingBallPool = pool.map((word, i) => ({
        id: `word-${i}`,
        letter: 'B',
        number: i + 1,
        label: word,
        colorClass: 'ball-b'
      }));
    }
    // Shuffle the pool
    this.gameState.remainingBallPool = window.BingoEngine.shuffle(this.gameState.remainingBallPool);

    // Register host player in players map
    this.gameState.players.set('host-peer', {
      name: name,
      dauberColor: this.gameState.dauberColor,
      marksCount: 1,
      minAway: 5,
      isHost: true,
      peerId: 'host-peer'
    });

    try {
      this.dom.hostControls.style.display = 'flex';
      await window.BingoNetwork.createRoom(roomCode, {
        name: name,
        dauberColor: this.gameState.dauberColor
      });

      this.setupGameUI(roomCode, pattern);

      // If host is playing, generate their card; otherwise hide card area
      if (isPlaying) {
        this.dom.playerCardContainer.style.display = 'flex';
        this.generateAndRenderPlayerCard();
      } else {
        this.dom.playerCardContainer.style.display = 'none';
      }

      this.switchView('game');
      this.showToast(`Room ${roomCode} created! Invite friends to play.`, 4000);
      this.openInviteModal();

    } catch (err) {
      console.error('Failed to create room:', err);
      alert(`Could not create room: ${err.message || 'Error connecting to peer server'}`);
    }
  }

  // Handle Join Form Submit
  async handleJoinSubmit() {
    const name = this.dom.joinName.value.trim() || 'Player';
    const roomCode = BingoNetwork.sanitizeRoomCode(this.dom.joinRoomCode.value);

    if (!roomCode) {
      alert('Please enter a room code.');
      return;
    }

    localStorage.setItem('bingo_player_name', name);
    this.gameState.role = 'player';
    this.gameState.roomId = roomCode;
    this.gameState.playerName = name;

    try {
      this.dom.hostControls.style.display = 'none';
      this.dom.playerCardContainer.style.display = 'flex';

      await window.BingoNetwork.joinRoom(roomCode, {
        name: name,
        dauberColor: this.gameState.dauberColor
      });

      this.setupGameUI(roomCode, 'line');
      this.switchView('game');
      this.showToast(`Joined Room ${roomCode}! Waiting for host...`, 3000);

    } catch (err) {
      console.error('Failed to join room:', err);
      alert(`Could not connect to room "${roomCode}". Make sure the host has started the room.`);
    }
  }

  // Setup Common Game UI
  setupGameUI(roomCode, pattern) {
    this.dom.gameRoomDisplay.textContent = roomCode;
    this.dom.headerRoomCode.textContent = roomCode;
    this.dom.gamePatternDisplay.textContent = `Pattern: ${window.BingoEngine.PATTERNS[pattern]?.name || 'Single Line'}`;
    this.updateCalledCounter();
    this.updatePlayerCount();
  }

  // Generate & Render Player's 5x5 Bingo Card
  generateAndRenderPlayerCard() {
    this.gameState.card = window.BingoEngine.generateCard(this.gameState.gameType, this.gameState.customWords);
    this.gameState.markedIndices = new Set([12]); // index 12 = center FREE space

    this.renderBingoCard();
    this.evaluatePlayerCardStatus();
  }

  // Render the Bingo Card Grid
  renderBingoCard() {
    this.dom.bingoGridElement.innerHTML = '';
    const letters = ['B', 'I', 'N', 'G', 'O'];

    // 1. Column headers B - I - N - G - O
    letters.forEach(letter => {
      const headerCell = document.createElement('div');
      headerCell.className = `bingo-header-cell header-${letter.toLowerCase()}`;
      headerCell.textContent = letter;
      this.dom.bingoGridElement.appendChild(headerCell);
    });

    // 2. 25 Card Cells
    const isWordMode = this.gameState.gameType !== 'classic';

    this.gameState.card.forEach(cell => {
      const cellEl = document.createElement('div');
      cellEl.className = `bingo-cell ${isWordMode ? 'word-mode' : ''}`;
      cellEl.id = `card-cell-${cell.index}`;
      cellEl.dataset.index = cell.index;

      if (cell.isFree) {
        cellEl.classList.add('free-space', 'daubed');
      }

      const valSpan = document.createElement('span');
      valSpan.className = 'bingo-cell-value';
      valSpan.textContent = cell.isFree ? '★ FREE' : cell.value;
      cellEl.appendChild(valSpan);

      // Click to daub / stamp
      cellEl.addEventListener('click', () => {
        this.toggleDaubCell(cell.index);
      });

      this.dom.bingoGridElement.appendChild(cellEl);
    });
  }

  // Toggle Daub on a specific cell
  toggleDaubCell(index) {
    if (index === 12) return; // FREE space cannot be un-daubed

    const cellEl = document.getElementById(`card-cell-${index}`);
    if (!cellEl) return;

    if (this.gameState.markedIndices.has(index)) {
      this.gameState.markedIndices.delete(index);
      cellEl.classList.remove('daubed');
      window.bingoAudio.playUnDaub();
    } else {
      this.gameState.markedIndices.add(index);
      cellEl.classList.add('daubed');
      window.bingoAudio.playDaub();
    }

    this.evaluatePlayerCardStatus();
  }

  // Auto-daub helper: marks any square that matches a called ball
  runAutoDaub() {
    if (!this.gameState.card) return;

    const calledLabels = new Set(this.gameState.calledBalls.map(b => b.label));
    let markedAny = false;

    this.gameState.card.forEach(cell => {
      if (cell.isFree) return;
      if (calledLabels.has(cell.label) || calledLabels.has(cell.value)) {
        if (!this.gameState.markedIndices.has(cell.index)) {
          this.gameState.markedIndices.add(cell.index);
          const cellEl = document.getElementById(`card-cell-${cell.index}`);
          if (cellEl) cellEl.classList.add('daubed');
          markedAny = true;
        }
      }
    });

    if (markedAny) {
      window.bingoAudio.playDaub();
      this.evaluatePlayerCardStatus();
    }
  }

  // Check card if newly called ball exists on it and highlight
  checkCardForCalledMatch(ball) {
    if (!this.gameState.card) return;
    this.gameState.card.forEach(cell => {
      if (cell.isFree) return;
      if (cell.label === ball.label || cell.value === ball.label || cell.value === ball.number) {
        const cellEl = document.getElementById(`card-cell-${cell.index}`);
        if (cellEl) {
          cellEl.classList.add('called-match');
        }
      }
    });
  }

  // Evaluate Win Condition and 1-Away Status
  evaluatePlayerCardStatus() {
    const evalResult = window.BingoEngine.evaluateCard(this.gameState.markedIndices, this.gameState.pattern);

    // 1-Away Alert & Glow
    const isNear = evalResult.minAway === 1 && !evalResult.won;
    this.dom.nearBingoAlert.classList.toggle('visible', isNear);
    this.dom.bingoCardElement.classList.toggle('near-bingo', isNear);

    if (isNear && !this._lastWasNear) {
      window.bingoAudio.playNearBingo();
      this._lastWasNear = true;
    } else if (!isNear) {
      this._lastWasNear = false;
    }

    // Ready to Claim Bingo CTA
    if (evalResult.won) {
      this.dom.btnClaimBingo.disabled = false;
      this.dom.btnClaimBingo.classList.add('ready');
      this.dom.bingoCardElement.classList.add('won-bingo');
    } else {
      this.dom.btnClaimBingo.disabled = true;
      this.dom.btnClaimBingo.classList.remove('ready');
      this.dom.bingoCardElement.classList.remove('won-bingo');
    }

    // Send progress to Host
    if (this.gameState.role === 'player') {
      window.BingoNetwork.sendToHost({
        type: 'PLAYER_PROGRESS',
        peerId: window.BingoNetwork.myPeerId,
        marksCount: this.gameState.markedIndices.size,
        minAway: evalResult.minAway
      });
    } else if (this.gameState.role === 'host') {
      const hostP = this.gameState.players.get('host-peer');
      if (hostP) {
        hostP.marksCount = this.gameState.markedIndices.size;
        hostP.minAway = evalResult.minAway;
        this.renderPlayersList();
      }
    }
  }

  // Player clicks "⚡ CLAIM BINGO! ⚡"
  handleClaimBingo() {
    const evalResult = window.BingoEngine.evaluateCard(this.gameState.markedIndices, this.gameState.pattern);
    if (!evalResult.won) {
      alert('You have not completed the required pattern yet!');
      return;
    }

    if (this.gameState.role === 'host') {
      // Host claims their own bingo
      this.verifyPlayerClaim({
        peerId: 'host-peer',
        name: this.gameState.playerName,
        markedIndices: Array.from(this.gameState.markedIndices),
        card: this.gameState.card
      });
    } else {
      this.showToast('⚡ Claiming BINGO! Awaiting host verification...', 4000);
      window.BingoNetwork.sendToHost({
        type: 'CLAIM_BINGO',
        peerId: window.BingoNetwork.myPeerId,
        name: this.gameState.playerName,
        markedIndices: Array.from(this.gameState.markedIndices),
        card: this.gameState.card
      });
    }
  }

  // HOST: Verifies a player's BINGO claim against called numbers
  verifyPlayerClaim(claimData) {
    const verification = window.BingoEngine.verifyBingoClaim(
      claimData.card || this.gameState.card,
      claimData.markedIndices,
      this.gameState.calledBalls,
      this.gameState.pattern
    );

    if (verification.valid) {
      // Valid BINGO! Broadcast victory
      const winnerPayload = {
        type: 'BINGO_VERIFIED',
        winnerName: claimData.name,
        winnerPeerId: claimData.peerId,
        patternName: verification.patternName,
        winningIndices: verification.winningIndices
      };

      if (this.gameState.role === 'host') {
        window.BingoNetwork.broadcast(winnerPayload);
        this.stopAutoCaller();
      }
      this.handleBingoVictory(winnerPayload);

    } else {
      // False Bingo rejected
      if (claimData.peerId && claimData.peerId !== 'host-peer') {
        window.BingoNetwork.sendToPeer(claimData.peerId, {
          type: 'BINGO_REJECTED',
          reason: verification.error
        });
      } else {
        window.bingoAudio.playError();
        this.showToast(`❌ False Bingo: ${verification.error}`, 4000);
      }
    }
  }

  // Handle BINGO Victory Celebration!
  handleBingoVictory(data) {
    window.bingoAudio.playWinFanfare();
    window.BingoConfetti.fireBingoCannons();

    // Highlight winning tiles if it's our card
    if (data.winningIndices && data.winnerName === this.gameState.playerName) {
      data.winningIndices.forEach(idx => {
        const cellEl = document.getElementById(`card-cell-${idx}`);
        if (cellEl) cellEl.classList.add('winning-tile');
      });
    }

    // Show celebration modal
    this.dom.winnerNameDisplay.textContent = data.winnerName;
    this.dom.winnerDetailsDisplay.textContent = `Won the game with ${data.patternName}!`;
    this.openModal(this.dom.modalWinner);
  }

  // HOST: Draws next ball from remaining pool
  hostDrawNextBall() {
    if (this.gameState.remainingBallPool.length === 0) {
      alert('All balls have been drawn! Game over.');
      this.stopAutoCaller();
      return;
    }

    const nextBall = this.gameState.remainingBallPool.pop();
    this.gameState.calledBalls.push(nextBall);

    // Broadcast to all peers
    window.BingoNetwork.broadcast({
      type: 'BALL_CALLED',
      ball: nextBall,
      remainingCount: this.gameState.remainingBallPool.length
    });

    // Update host's own screen
    this.displayBallOnTumbler(nextBall, true);
    this.addBallToRecentReel(nextBall);
    this.markMasterBoardChip(nextBall);
    this.updateCalledCounter();

    window.bingoAudio.playBallDraw();
    window.bingoAudio.speakBall(nextBall.label);

    this.checkCardForCalledMatch(nextBall);

    if (this.gameState.autoDaub) {
      this.runAutoDaub();
    }
  }

  // Auto-Caller Loop
  startAutoCaller() {
    this.stopAutoCaller();
    this.gameState.isAutoCalling = true;
    this.dom.toggleAutoCall.checked = true;
    this.dom.autoCallTimerBar.style.display = 'block';

    const speed = this.gameState.autoCallSpeed;
    let elapsed = 0;
    const step = 100;

    this.gameState.autoCallInterval = setInterval(() => {
      elapsed += step;
      const progress = Math.min(100, (elapsed / speed) * 100);
      this.dom.autoCallTimerFill.style.width = `${progress}%`;

      if (elapsed >= speed) {
        elapsed = 0;
        this.dom.autoCallTimerFill.style.width = '0%';
        this.hostDrawNextBall();
      }
    }, step);
  }

  stopAutoCaller() {
    if (this.gameState.autoCallInterval) {
      clearInterval(this.gameState.autoCallInterval);
      this.gameState.autoCallInterval = null;
    }
    this.gameState.isAutoCalling = false;
    this.dom.toggleAutoCall.checked = false;
    this.dom.autoCallTimerBar.style.display = 'none';
    this.dom.autoCallTimerFill.style.width = '0%';
  }

  // HOST: Reset Game for a New Round
  hostResetGame() {
    this.stopAutoCaller();

    // Re-generate and shuffle ball pool
    if (this.gameState.gameType === 'classic') {
      this.gameState.remainingBallPool = window.BingoEngine.generateAllClassicBalls();
    } else {
      let pool = this.gameState.customWords;
      if (!pool || pool.length < 24) {
        pool = window.BingoEngine.PRESET_THEMES[this.gameState.gameType]?.words || window.BingoEngine.PRESET_THEMES.tech.words;
      }
      this.gameState.remainingBallPool = pool.map((word, i) => ({
        id: `word-${i}`, letter: 'B', number: i + 1, label: word, colorClass: 'ball-b'
      }));
    }
    this.gameState.remainingBallPool = window.BingoEngine.shuffle(this.gameState.remainingBallPool);
    this.gameState.calledBalls = [];

    // Broadcast reset
    window.BingoNetwork.broadcast({ type: 'GAME_RESET' });

    // Reset host's local card
    this.resetPlayerCardForNewRound();
  }

  // Reset player card state for new round
  resetPlayerCardForNewRound() {
    this.gameState.calledBalls = [];
    this.gameState.markedIndices = new Set([12]);

    // Clear tumbler
    this.dom.currentBallElement.className = 'bingo-ball-large ball-placeholder';
    this.dom.currentBallLetter.textContent = '-';
    this.dom.currentBallNumber.textContent = '--';

    // Clear recent balls
    this.dom.recentBallsContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--text-muted);">No balls called yet</span>';

    // Clear master board
    document.querySelectorAll('.master-num-chip.called').forEach(el => el.classList.remove('called'));

    // Re-generate / clear marks on card
    this.generateAndRenderPlayerCard();
    this.updateCalledCounter();

    this.dom.bingoCardElement.classList.remove('near-bingo', 'won-bingo');
    this.dom.nearBingoAlert.classList.remove('visible');
    this.dom.btnClaimBingo.disabled = true;
    this.dom.btnClaimBingo.classList.remove('ready');
  }

  // Display ball on 3D Tumbler
  displayBallOnTumbler(ball, animate = true) {
    const el = this.dom.currentBallElement;
    const letter = ball.letter || 'B';
    const num = ball.number !== undefined ? ball.number : '';

    el.className = `bingo-ball-large ball-${letter.toLowerCase()}`;
    this.dom.currentBallLetter.textContent = letter;
    this.dom.currentBallNumber.textContent = num;
    this.dom.callerStageTitle.textContent = ball.label;

    if (animate) {
      el.classList.remove('ball-drop-anim');
      void el.offsetWidth; // trigger reflow
      el.classList.add('ball-drop-anim');
    }
  }

  // Add ball to Recent Balls carousel
  addBallToRecentReel(ball) {
    if (this.gameState.calledBalls.length === 1) {
      this.dom.recentBallsContainer.innerHTML = '';
    }

    const pill = document.createElement('div');
    pill.className = `recent-ball-pill header-${ball.letter.toLowerCase()}`;
    pill.textContent = ball.label;
    this.dom.recentBallsContainer.prepend(pill);

    // Limit visible recent balls to 10
    while (this.dom.recentBallsContainer.children.length > 10) {
      this.dom.recentBallsContainer.lastElementChild.remove();
    }
  }

  // Mark chip on Master Board
  markMasterBoardChip(ball) {
    const chip = document.getElementById(`master-chip-${ball.letter}-${ball.number}`);
    if (chip) {
      chip.classList.add('called');
    }
  }

  // Sync all balls (when joining ongoing game)
  syncAllCalledBalls(ballsList) {
    if (!ballsList || ballsList.length === 0) return;
    this.dom.recentBallsContainer.innerHTML = '';

    ballsList.forEach(ball => {
      this.addBallToRecentReel(ball);
      this.markMasterBoardChip(ball);
      this.checkCardForCalledMatch(ball);
    });

    this.updateCalledCounter();
  }

  // Update counter display
  updateCalledCounter() {
    const called = this.gameState.calledBalls.length;
    const total = this.gameState.gameType === 'classic' ? 75 : 24;
    this.dom.gameBallsCounter.textContent = `Called: ${called} / ${total}`;
  }

  // Update player counter pill
  updatePlayerCount() {
    const count = Math.max(1, this.gameState.players.size);
    this.dom.headerPlayerCount.textContent = count;
    this.dom.modalPlayerCount.textContent = count;
    this.renderPlayersList();
  }

  // Render players list in modal
  renderPlayersList() {
    this.dom.modalPlayersList.innerHTML = '';

    this.gameState.players.forEach(p => {
      const item = document.createElement('div');
      item.className = 'player-item';

      const info = document.createElement('div');
      info.className = 'player-info';

      const avatar = document.createElement('div');
      avatar.className = `player-avatar dauber-${p.dauberColor || 'blue'}`;
      avatar.style.background = '#3b82f6';
      avatar.textContent = (p.name || 'P')[0].toUpperCase();

      const nameSpan = document.createElement('span');
      nameSpan.style.fontWeight = '600';
      nameSpan.textContent = p.name + (p.isHost ? ' 👑 (Host)' : '');

      info.appendChild(avatar);
      info.appendChild(nameSpan);

      const tag = document.createElement('div');
      tag.className = 'player-progress-tag' + (p.minAway === 1 ? ' near' : '');
      tag.textContent = p.minAway === 1 ? '🔥 1 Away!' : `${p.marksCount || 1} marks`;

      item.appendChild(info);
      item.appendChild(tag);
      this.dom.modalPlayersList.appendChild(item);
    });
  }

  // Modals Helper
  openModal(modal) {
    modal.classList.add('active');
  }

  openInviteModal() {
    const roomCode = this.gameState.roomId;
    this.dom.modalRoomCode.textContent = roomCode;

    // Generate direct join link
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    const inviteUrl = url.toString();
    this.dom.modalInviteLinkInput.value = inviteUrl;

    // Render standalone QR Code
    if (window.BingoQRCode) {
      this.dom.modalQrContainer.innerHTML = window.BingoQRCode.generateSVG(inviteUrl, 180);
    }

    this.openModal(this.dom.modalInvite);
  }

  openPlayersModal() {
    this.renderPlayersList();
    this.openModal(this.dom.modalPlayers);
  }

  // Copy direct link to clipboard
  copyInviteLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.gameState.roomId);
    const inviteUrl = url.toString();

    navigator.clipboard.writeText(inviteUrl).then(() => {
      this.showToast('📋 Invite link copied to clipboard!');
    }).catch(() => {
      // Fallback
      prompt('Copy invite link:', inviteUrl);
    });
  }

  // Chat system
  sendChatMessage(text) {
    const msg = {
      type: 'CHAT',
      sender: this.gameState.playerName,
      text: text,
      timestamp: Date.now()
    };

    if (this.gameState.role === 'host') {
      window.BingoNetwork.broadcast(msg);
    } else {
      window.BingoNetwork.sendToHost(msg);
    }
  }

  appendChatMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-msg';

    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = msg.sender + ':';

    const text = document.createElement('span');
    text.textContent = ' ' + msg.text;

    div.appendChild(sender);
    div.appendChild(text);
    this.dom.chatMessages.appendChild(div);
    this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

    // If chat drawer is closed, give subtle visual hint
    if (!this.dom.chatDrawer.classList.contains('open')) {
      this.dom.chatToggleIcon.textContent = '💬 (1)';
    }
  }

  // Floating Emoji Reactions
  triggerReaction(emoji, broadcast = true) {
    window.bingoAudio.playReaction();

    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = `${Math.random() * 60 + 20}px`;

    this.dom.reactionContainer.appendChild(el);
    setTimeout(() => el.remove(), 2800);

    if (broadcast) {
      const payload = {
        type: 'REACTION',
        emoji: emoji,
        sender: this.gameState.playerName
      };
      if (this.gameState.role === 'host') {
        window.BingoNetwork.broadcast(payload);
      } else {
        window.BingoNetwork.sendToHost(payload);
      }
    }
  }

  // Exit Room
  leaveRoom() {
    this.stopAutoCaller();
    window.BingoNetwork.disconnect();
    this.gameState.roomId = null;
    this.gameState.role = null;
    this.gameState.card = null;
    this.gameState.calledBalls = [];
    this.gameState.players.clear();
    this.switchView('lobby');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.bingoApp = new BingoApp();
});
