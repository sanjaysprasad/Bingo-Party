/**
 * Classic 1-25 Pen-and-Paper BINGO - Main Application Controller
 */
class BingoApp {
  constructor() {
    this.state = {
      mode: 'bot',              // 'bot' | 'multiplayer'
      playerName: '',
      roomCode: '',
      isHost: false,
      isMyTurn: false,
      opponentName: 'Computer',
      opponentLinesCount: 0,
      setupBoard: Array(25).fill(null),
      setupRemaining: new Set(Array.from({ length: 25 }, (_, i) => i + 1)),
      gameBoard: [],            // 25 numbers
      botBoard: [],             // Bot's 25 numbers when in bot mode
      calledNumbers: new Set(),
      myCompletedLineIds: new Set(),
      isGameOver: false,
      isOpponentReady: false,
      amIReady: false
    };

    this.initDOM();
    this.loadPreferences();
    this.setupEventListeners();
    this.setupMultiplayerListeners();
    this.checkUrlRoomParam();
  }

  initDOM() {
    this.dom = {
      // Views
      viewLobby: document.getElementById('view-lobby'),
      viewSetup: document.getElementById('view-setup'),
      viewGame: document.getElementById('view-game'),

      // Header
      btnHeaderLogo: document.getElementById('btn-header-logo'),
      headerStatusPill: document.getElementById('header-status-pill'),
      headerStatusText: document.getElementById('header-status-text'),
      networkStatusDot: document.getElementById('network-status-dot'),
      btnHeaderInvite: document.getElementById('btn-header-invite'),
      btnHeaderSound: document.getElementById('btn-header-sound'),
      btnHeaderVoice: document.getElementById('btn-header-voice'),
      btnHeaderRules: document.getElementById('btn-header-rules'),

      // Lobby
      playerNickname: document.getElementById('player-nickname'),
      btnStartVsBot: document.getElementById('btn-start-vs-bot'),
      btnCreateRoom: document.getElementById('btn-create-room'),
      joinRoomInput: document.getElementById('join-room-input'),
      btnJoinRoom: document.getElementById('btn-join-room'),

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

      // B-I-N-G-O letters
      letters: [
        document.getElementById('bingo-letter-0'),
        document.getElementById('bingo-letter-1'),
        document.getElementById('bingo-letter-2'),
        document.getElementById('bingo-letter-3'),
        document.getElementById('bingo-letter-4')
      ],

      // Modals
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

  loadPreferences() {
    const savedName = localStorage.getItem('bingo_paper_name') || 'Player ' + Math.floor(10 + Math.random() * 90);
    this.dom.playerNickname.value = savedName;
    this.state.playerName = savedName;
  }

  checkUrlRoomParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.dom.joinRoomInput.value = roomParam.toUpperCase().trim();
      this.showToast(`Invited to Room ${roomParam.toUpperCase()}! Enter your name and join.`, 4000);
    }
  }

  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (viewName === 'lobby') {
      this.dom.viewLobby.classList.add('active');
      this.dom.btnHeaderInvite.style.display = 'none';
      this.dom.headerStatusText.textContent = 'Classic 1-25';
    } else if (viewName === 'setup') {
      this.dom.viewSetup.classList.add('active');
      this.dom.btnHeaderInvite.style.display = this.state.mode === 'multiplayer' ? 'inline-flex' : 'none';
      this.dom.headerStatusText.textContent = this.state.mode === 'bot' ? 'Solo vs AI' : `Room: ${this.state.roomCode}`;
    } else if (viewName === 'game') {
      this.dom.viewGame.classList.add('active');
      this.dom.btnHeaderInvite.style.display = this.state.mode === 'multiplayer' ? 'inline-flex' : 'none';
      this.dom.headerStatusText.textContent = this.state.mode === 'bot' ? 'Solo vs AI' : `Room: ${this.state.roomCode}`;
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

  setupEventListeners() {
    // Mode Selection: Play vs Computer
    this.dom.btnStartVsBot.addEventListener('click', () => {
      this.savePlayerName();
      this.state.mode = 'bot';
      this.state.opponentName = 'Smart Bot';
      this.state.isHost = true;
      this.startSetupPhase();
    });

    // Mode Selection: Create Room
    this.dom.btnCreateRoom.addEventListener('click', () => {
      this.savePlayerName();
      const code = 'BING' + Math.floor(10 + Math.random() * 90);
      this.state.mode = 'multiplayer';
      this.state.roomCode = code;
      this.state.isHost = true;
      this.state.opponentName = 'Waiting...';

      window.BingoMultiplayer.joinRoom(code, this.state.playerName, true);
      this.startSetupPhase();
      this.openInviteModal();
    });

    // Mode Selection: Join Room
    this.dom.btnJoinRoom.addEventListener('click', () => {
      this.savePlayerName();
      const code = (this.dom.joinRoomInput.value || '').toUpperCase().trim();
      if (!code) {
        alert('Please enter a room code.');
        return;
      }
      this.state.mode = 'multiplayer';
      this.state.roomCode = code;
      this.state.isHost = false;
      this.state.opponentName = 'Host';

      window.BingoMultiplayer.joinRoom(code, this.state.playerName, false);
      this.startSetupPhase();
    });

    // Setup: Auto-Fill / Shuffle
    this.dom.btnSetupShuffle.addEventListener('click', () => {
      window.bingoAudio.playPop();
      const randomBoard = window.BingoLogic.generateRandomBoard();
      this.state.setupBoard = [...randomBoard];
      this.state.setupRemaining.clear();
      this.renderSetupGrid();
      this.renderSetupPalette();
      this.dom.btnSetupReady.disabled = false;
    });

    // Setup: Clear
    this.dom.btnSetupClear.addEventListener('click', () => {
      window.bingoAudio.playPop();
      this.state.setupBoard = Array(25).fill(null);
      this.state.setupRemaining = new Set(Array.from({ length: 25 }, (_, i) => i + 1));
      this.renderSetupGrid();
      this.renderSetupPalette();
      this.dom.btnSetupReady.disabled = true;
    });

    // Setup: Ready to Play
    this.dom.btnSetupReady.addEventListener('click', () => {
      if (!window.BingoLogic.isValidBoard(this.state.setupBoard)) {
        alert('Please fill all 25 numbers from 1 to 25 on your board!');
        return;
      }
      this.handlePlayerReady();
    });

    // Game: Exit
    this.dom.btnGameExit.addEventListener('click', () => {
      if (confirm('Exit to main menu?')) {
        this.exitToLobby();
      }
    });

    this.dom.btnHeaderLogo.addEventListener('click', () => {
      if (confirm('Return to home?')) {
        this.exitToLobby();
      }
    });

    // Copy Invite Link
    this.dom.btnGameCopyLink.addEventListener('click', () => this.copyInviteLink());
    this.dom.btnCopyModalLink.addEventListener('click', () => this.copyInviteLink());
    this.dom.btnHeaderInvite.addEventListener('click', () => this.openInviteModal());

    // Audio & Voice Toggles
    this.dom.btnHeaderSound.addEventListener('click', () => {
      const isMuted = window.bingoAudio.toggleMute();
      this.dom.btnHeaderSound.textContent = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? 'Audio muted' : 'Audio unmuted');
    });

    this.dom.btnHeaderVoice.addEventListener('click', () => {
      const isVoice = window.bingoAudio.toggleVoice();
      this.dom.btnHeaderVoice.textContent = isVoice ? '🗣️' : '🚫';
      this.showToast(isVoice ? 'Voice caller enabled' : 'Voice caller disabled');
    });

    // Rules
    this.dom.btnHeaderRules.addEventListener('click', () => {
      this.dom.modalRules.classList.add('active');
    });

    // Close Modals
    document.querySelectorAll('[data-close-modal]').forEach(b => {
      b.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Play Again / Rematch
    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.dom.modalWinner.classList.remove('active');
      if (this.state.mode === 'multiplayer') {
        window.BingoMultiplayer.send('REMATCH_REQUEST');
      }
      this.startSetupPhase();
    });

    // Chat Drawer Toggle
    this.dom.chatHeaderToggle.addEventListener('click', () => {
      this.dom.chatDrawer.classList.toggle('open');
      const isOpen = this.dom.chatDrawer.classList.contains('open');
      this.dom.chatToggleIcon.textContent = isOpen ? '▼' : '▲';
    });

    // Chat Form Submit
    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dom.chatInput.value.trim();
      if (!text) return;
      this.sendChatMessage(text);
      this.dom.chatInput.value = '';
    });

    // Reaction Emojis
    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.triggerReaction(btn.dataset.emoji, true);
      });
    });
  }

  savePlayerName() {
    const name = this.dom.playerNickname.value.trim() || 'Player';
    this.state.playerName = name;
    localStorage.setItem('bingo_paper_name', name);
  }

  // =========================================================================
  // SETUP PHASE
  // =========================================================================
  startSetupPhase() {
    this.state.setupBoard = Array(25).fill(null);
    this.state.setupRemaining = new Set(Array.from({ length: 25 }, (_, i) => i + 1));
    this.state.amIReady = false;
    this.state.isOpponentReady = false;
    this.dom.btnSetupReady.disabled = true;
    this.dom.setupWaitingIndicator.style.display = 'none';
    this.dom.setupPaletteContainer.style.display = 'block';

    // Auto-fill by default so player can jump in with 1 tap!
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

      // Tapping a filled slot removes the number
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
        // Find first empty slot
        const emptyIdx = this.state.setupBoard.findIndex(val => val === null);
        if (emptyIdx !== -1) {
          window.bingoAudio.playPop();
          this.state.setupBoard[emptyIdx] = n;
          this.state.setupRemaining.delete(n);
          this.renderSetupGrid();
          this.renderSetupPalette();

          // If all 25 slots filled, unlock Ready
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
      // Bot generates its board and starts immediately!
      this.state.botBoard = window.BingoLogic.generateRandomBoard();
      this.state.isOpponentReady = true;
      this.startActiveGame(true); // Player goes first
    } else {
      // Multiplayer: Notify opponent
      this.dom.setupWaitingIndicator.style.display = 'block';
      this.dom.setupPaletteContainer.style.display = 'none';

      window.BingoMultiplayer.send('PLAYER_READY', {
        playerName: this.state.playerName
      });

      if (this.state.isOpponentReady) {
        // Both are ready! Host decides who goes first
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

  // =========================================================================
  // ACTIVE GAME PHASE
  // =========================================================================
  startActiveGame(isMyTurn) {
    this.state.isMyTurn = isMyTurn;
    this.state.calledNumbers = new Set();
    this.state.myCompletedLineIds = new Set();
    this.state.opponentLinesCount = 0;
    this.state.isGameOver = false;

    // Reset letters
    this.dom.letters.forEach(el => el.classList.remove('crossed'));

    // Top info bar
    this.dom.gameRoomTag.textContent = this.state.mode === 'bot' ? 'Solo vs Bot' : `Room: ${this.state.roomCode}`;
    this.dom.opponentNameDisplay.textContent = this.state.opponentName;
    this.dom.opponentLinesDisplay.textContent = '(0/5)';

    this.dom.latestCallNumber.textContent = '-';
    this.dom.latestCallCaller.textContent = 'Game started!';

    this.updateTurnBanner();
    this.renderGameBoard();
    this.switchView('game');

    if (isMyTurn) {
      window.bingoAudio.playYourTurn();
    } else if (this.state.mode === 'bot') {
      // Bot takes first turn
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

      // Check if it's player's turn to call this number
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

    // Update B - I - N - G - O letters
    this.updateBingoLetters(evaluation);
  }

  // Player taps a number to call it
  handlePlayerCallNumber(num) {
    if (!this.state.isMyTurn || this.state.isGameOver) return;
    if (this.state.calledNumbers.has(num)) return;

    this.state.calledNumbers.add(num);
    window.bingoAudio.playStrike();
    window.bingoAudio.speakNumber(num);

    this.dom.latestCallNumber.textContent = num;
    this.dom.latestCallCaller.textContent = 'Called by You';

    // Broadcast in multiplayer
    if (this.state.mode === 'multiplayer') {
      window.BingoMultiplayer.send('NUMBER_CALLED', {
        number: num,
        callerName: this.state.playerName
      });
    }

    // Evaluate win condition
    const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
    this.renderGameBoard();

    if (evaluation.isBingo) {
      this.handleGameOver(this.state.playerName, true);
      return;
    }

    // Switch turn
    this.state.isMyTurn = false;
    this.updateTurnBanner();
    this.renderGameBoard();

    if (this.state.mode === 'bot') {
      this.scheduleBotMove();
    }
  }

  // Bot AI Turn
  scheduleBotMove() {
    setTimeout(() => {
      if (this.state.isGameOver) return;

      const botPick = window.BingoLogic.getBestComputerMove(this.state.botBoard, this.state.calledNumbers);
      if (botPick === null) return;

      this.state.calledNumbers.add(botPick);
      window.bingoAudio.playStrike();
      window.bingoAudio.speakNumber(botPick);

      this.dom.latestCallNumber.textContent = botPick;
      this.dom.latestCallCaller.textContent = `Called by ${this.state.opponentName}`;

      // Check if bot completed lines
      const botEval = window.BingoLogic.evaluateBoard(this.state.botBoard, this.state.calledNumbers);
      this.state.opponentLinesCount = botEval.lineCount;
      this.dom.opponentLinesDisplay.textContent = `(${botEval.lineCount}/5)`;

      // Render player's updated board
      const myEval = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
      this.renderGameBoard();

      // Check if bot won or player won from bot's pick
      if (botEval.isBingo && myEval.isBingo) {
        this.handleGameOver('Tie! Both got BINGO!', true);
      } else if (botEval.isBingo) {
        this.handleGameOver(this.state.opponentName, false);
      } else if (myEval.isBingo) {
        this.handleGameOver(this.state.playerName, true);
      } else {
        // Player's turn now!
        this.state.isMyTurn = true;
        this.updateTurnBanner();
        this.renderGameBoard();
        window.bingoAudio.playYourTurn();
      }
    }, 1100);
  }

  // Update B - I - N - G - O letters display
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

  // Game Won
  handleGameOver(winnerName, isMe) {
    this.state.isGameOver = true;

    if (isMe) {
      window.bingoAudio.playBingoWin();
      window.BingoConfetti.fireBingoCannons();
      this.dom.winnerNameDisplay.textContent = '🎉 B - I - N - G - O !';
      this.dom.winnerSubDisplay.textContent = `${winnerName} completed all 5 lines and won!`;
    } else {
      window.bingoAudio.playBingoWin();
      this.dom.winnerNameDisplay.textContent = `${winnerName} Won!`;
      this.dom.winnerSubDisplay.textContent = `${winnerName} completed 5 lines first! Better luck next round.`;
    }

    if (this.state.mode === 'multiplayer' && isMe) {
      window.BingoMultiplayer.send('BINGO_WIN', {
        winnerName: this.state.playerName
      });
    }

    setTimeout(() => {
      this.dom.modalWinner.classList.add('active');
    }, 700);
  }

  // =========================================================================
  // MULTIPLAYER LISTENERS
  // =========================================================================
  setupMultiplayerListeners() {
    window.BingoMultiplayer.on('status_change', ({ status, message }) => {
      this.dom.networkStatusDot.className = `status-dot ${status}`;
      if (message) this.showToast(message, 3000);
    });

    // Player joined room
    window.BingoMultiplayer.on('PLAYER_JOINED', (data) => {
      if (data.id !== window.BingoMultiplayer.playerId) {
        this.state.opponentName = data.name || 'Friend';
        this.dom.opponentNameDisplay.textContent = this.state.opponentName;
        this.showToast(`👋 ${data.name} joined the room!`, 3000);
        window.bingoAudio.playPop();

        // Send back self info so both know each other
        window.BingoMultiplayer.send('PLAYER_ANNOUNCE', {
          name: this.state.playerName
        });
      }
    });

    window.BingoMultiplayer.on('PLAYER_ANNOUNCE', (data) => {
      this.state.opponentName = data.name || 'Friend';
      this.dom.opponentNameDisplay.textContent = this.state.opponentName;
    });

    // Opponent marked ready
    window.BingoMultiplayer.on('PLAYER_READY', (data) => {
      this.state.isOpponentReady = true;
      this.showToast(`✅ ${data.playerName || 'Opponent'} is ready!`, 3000);

      if (this.state.amIReady && this.state.isHost) {
        const startingTurn = Math.random() > 0.5 ? 'host' : 'guest';
        window.BingoMultiplayer.send('GAME_START', { startingTurn });
        this.startActiveGame(startingTurn === 'host');
      }
    });

    // Game Start announcement from Host
    window.BingoMultiplayer.on('GAME_START', (data) => {
      const amIStarting = (this.state.isHost && data.startingTurn === 'host') || (!this.state.isHost && data.startingTurn === 'guest');
      this.startActiveGame(amIStarting);
    });

    // Number called by opponent
    window.BingoMultiplayer.on('NUMBER_CALLED', (data) => {
      const num = data.number;
      if (!num) return;

      this.state.calledNumbers.add(num);
      window.bingoAudio.playStrike();
      window.bingoAudio.speakNumber(num);

      this.dom.latestCallNumber.textContent = num;
      this.dom.latestCallCaller.textContent = `Called by ${data.callerName || this.state.opponentName}`;

      // Check my lines
      const evaluation = window.BingoLogic.evaluateBoard(this.state.gameBoard, this.state.calledNumbers);
      this.renderGameBoard();

      if (evaluation.isBingo) {
        this.handleGameOver(this.state.playerName, true);
        return;
      }

      // Turn passes to me!
      this.state.isMyTurn = true;
      this.updateTurnBanner();
      this.renderGameBoard();
      window.bingoAudio.playYourTurn();
    });

    // Bingo Win from opponent
    window.BingoMultiplayer.on('BINGO_WIN', (data) => {
      this.handleGameOver(data.winnerName || 'Opponent', false);
    });

    // Rematch proposal
    window.BingoMultiplayer.on('REMATCH_REQUEST', () => {
      this.showToast('Opponent requested a rematch! Setting up new boards.', 3000);
      this.startSetupPhase();
    });

    // Chat
    window.BingoMultiplayer.on('CHAT', (data) => {
      this.appendChatMessage(data);
    });

    // Reactions
    window.BingoMultiplayer.on('REACTION', (data) => {
      this.triggerReaction(data.emoji, false);
    });
  }

  // Chat
  sendChatMessage(text) {
    const msg = {
      sender: this.state.playerName,
      text: text
    };
    window.BingoMultiplayer.send('CHAT', msg);
    this.appendChatMessage(msg);
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

    if (!this.dom.chatDrawer.classList.contains('open')) {
      this.dom.chatToggleIcon.textContent = '💬 (1)';
    }
  }

  // Floating Emoji Reactions
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

  // Modals & Links
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

  exitToLobby() {
    window.BingoMultiplayer.disconnect();
    this.state.isGameOver = false;
    this.state.calledNumbers.clear();
    this.switchView('lobby');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.bingoApp = new BingoApp();
});
