/**
 * Monopoly: Kerala Edition - User Interface & Board Controller
 * Renders the 40-Space 11x11 CSS Grid Board, Animated Dice, Player Tokens,
 * Malayalam Dialogue Banners, Property Deeds, Auctions, Trading & Setup.
 */

class MalluMonopolyUI {
  constructor() {
    this.engine = window.malluMonopolyEngine;
    this.config = window.MALLU_MONOPOLY_CONFIG;
    this.audio = window.malluMonopolyAudio;

    this.selectedPropertyIndex = null;
    this.activeTradeTargetId = null;

    this.init();
  }

  init() {
    this.engine.onStateChange = (state) => this.render(state);
    this.engine.onPrompt = (prompt) => this.handlePrompt(prompt);

    // Initial check for saved game
    this.checkSavedGameBanner();

    // Render initial setup forms for 4 players
    this.renderPlayerSetupForms(4);

    // Bind DOM event listeners once on initialization
    this.setupEventListeners();

    // Build the board once
    this.buildBoardGridOnce();
  }

  // Bind DOM Event Listeners
  setupEventListeners() {
    // Setup Screen Controls
    const btnStartGame = document.getElementById('btn-mono-start-game');
    const btnResumeGame = document.getElementById('btn-mono-resume-game');
    const btnDiscardSave = document.getElementById('btn-mono-discard-save');
    const selectPlayerCount = document.getElementById('mono-player-count-select');
    const btnExitToHub = document.getElementById('btn-mono-exit-to-hub');
    const btnNewMatchFromGame = document.getElementById('btn-mono-game-new-match');

    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => this.handleStartGameFromSetup());
    }

    if (btnResumeGame) {
      btnResumeGame.addEventListener('click', () => {
        if (this.engine.loadSavedGame()) {
          this.showGameScreen();
        }
      });
    }

    if (btnDiscardSave) {
      btnDiscardSave.addEventListener('click', () => {
        if (confirm('Discard saved match?')) {
          this.engine.clearSavedGame();
          this.checkSavedGameBanner();
        }
      });
    }

    if (selectPlayerCount) {
      selectPlayerCount.addEventListener('change', (e) => {
        this.renderPlayerSetupForms(Number(e.target.value));
      });
    }

    if (btnExitToHub) {
      btnExitToHub.addEventListener('click', () => {
        if (window.bingoApp) window.bingoApp.switchView('home');
      });
    }

    if (btnNewMatchFromGame) {
      btnNewMatchFromGame.addEventListener('click', () => {
        if (confirm('Leave current match and configure a new game?')) {
          this.showSetupScreen();
        }
      });
    }

    // Delegated Gameplay Action Buttons (ensures dynamic buttons always respond)
    const actionsContainer = document.getElementById('mono-actions-container');
    if (actionsContainer && !actionsContainer._hasBoundListeners) {
      actionsContainer._hasBoundListeners = true;
      actionsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;

        if (btn.id === 'btn-mono-roll-dice') {
          this.engine.rollDice();
        } else if (btn.id === 'btn-mono-buy-prop') {
          this.engine.buyCurrentProperty();
        } else if (btn.id === 'btn-mono-decline-prop') {
          this.engine.declineToAuction();
        } else if (btn.id === 'btn-mono-end-turn') {
          this.engine.endTurn();
        } else if (btn.id === 'btn-mono-pay-jail') {
          this.engine.payJailFine();
        } else if (btn.id === 'btn-mono-use-jail-card') {
          this.engine.useJailCard();
        } else if (btn.id === 'btn-mono-open-trade') {
          this.openTradeModal();
        } else if (btn.id === 'btn-auction-bid-50') {
          this.handleAuctionBid(50);
        } else if (btn.id === 'btn-auction-bid-100') {
          this.handleAuctionBid(100);
        } else if (btn.id === 'btn-auction-bid-500') {
          this.handleAuctionBid(500);
        } else if (btn.id === 'btn-auction-pass') {
          const auc = this.engine.state.auction;
          if (auc) {
            const currentBidderId = auc.activeBidders[auc.bidderTurnIndex];
            this.engine.passAuction(currentBidderId);
          }
        }
      });
    }

    // Direct Click on Dice Display to Roll
    const diceDisplay = document.getElementById('mono-dice-display');
    if (diceDisplay && !diceDisplay._hasBoundListeners) {
      diceDisplay._hasBoundListeners = true;
      diceDisplay.style.cursor = 'pointer';
      diceDisplay.setAttribute('title', 'Click to roll dice');
      diceDisplay.addEventListener('click', () => {
        const curr = this.engine.getCurrentPlayer();
        if (curr && !curr.isBot && (this.engine.state.phase === 'READY_TO_ROLL' || this.engine.state.phase === 'JAIL_CHOICE')) {
          this.engine.rollDice();
        }
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('[data-close-mono-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Auction Buttons
    const btnAuctionBid50 = document.getElementById('btn-auction-bid-50');
    const btnAuctionBid100 = document.getElementById('btn-auction-bid-100');
    const btnAuctionBid500 = document.getElementById('btn-auction-bid-500');
    const btnAuctionPass = document.getElementById('btn-auction-pass');

    if (btnAuctionBid50) {
      btnAuctionBid50.addEventListener('click', () => this.handleAuctionBid(50));
    }
    if (btnAuctionBid100) {
      btnAuctionBid100.addEventListener('click', () => this.handleAuctionBid(100));
    }
    if (btnAuctionBid500) {
      btnAuctionBid500.addEventListener('click', () => this.handleAuctionBid(500));
    }
    if (btnAuctionPass) {
      btnAuctionPass.addEventListener('click', () => {
        const auc = this.engine.state.auction;
        if (auc) {
          const currentBidderId = auc.activeBidders[auc.bidderTurnIndex];
          this.engine.passAuction(currentBidderId);
        }
      });
    }

    // Trade Target Selector
    const tradeTargetSelect = document.getElementById('mono-trade-target-select');
    if (tradeTargetSelect) {
      tradeTargetSelect.addEventListener('change', (e) => {
        this.activeTradeTargetId = e.target.value;
        this.renderTradeOfferPanels();
      });
    }

    // Execute Trade Submit
    const btnSubmitTrade = document.getElementById('btn-submit-trade-offer');
    if (btnSubmitTrade) {
      btnSubmitTrade.addEventListener('click', () => this.handleSubmitTrade());
    }
  }

  checkSavedGameBanner() {
    const banner = document.getElementById('mono-saved-game-banner');
    if (!banner) return;
    if (this.engine.hasSavedGame()) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  showSetupScreen() {
    const setupView = document.getElementById('mono-view-setup');
    const gameView = document.getElementById('mono-view-game');
    if (setupView) setupView.style.display = 'block';
    if (gameView) gameView.style.display = 'none';
    this.checkSavedGameBanner();
  }

  showGameScreen() {
    const setupView = document.getElementById('mono-view-setup');
    const gameView = document.getElementById('mono-view-game');
    if (setupView) setupView.style.display = 'none';
    if (gameView) gameView.style.display = 'block';
  }

  renderPlayerSetupForms(count = 4) {
    const container = document.getElementById('mono-players-setup-container');
    if (!container) return;
    container.innerHTML = '';

    const currentLoggedIn = window.BingoAuthStorage && window.BingoAuthStorage.currentUser ? window.BingoAuthStorage.currentUser.username : null;

    for (let i = 0; i < count; i++) {
      const isFirst = (i === 0);
      const botProfile = this.config.botProfiles[i % this.config.botProfiles.length];
      const defaultName = isFirst ? (currentLoggedIn || 'You (Host)') : botProfile.name;
      const defaultToken = isFirst ? '🥥' : botProfile.token;
      const isBot = !isFirst;

      const card = document.createElement('div');
      card.className = 'mono-player-setup-card';
      card.innerHTML = `
        <div class="mono-player-setup-header">
          <span style="font-weight:800; font-size:0.95rem;">Player ${i + 1}</span>
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px; cursor:pointer;">
            <input type="checkbox" class="mono-player-is-bot" data-idx="${i}" ${isBot ? 'checked' : ''}>
            <span>Smart Bot</span>
          </label>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <select class="input-select mono-player-token-select" data-idx="${i}" style="width:75px; font-size:1.4rem; padding:4px;">
            ${this.config.tokens.map(t => `
              <option value="${t.icon}" ${t.icon === defaultToken ? 'selected' : ''}>${t.icon} ${t.name}</option>
            `).join('')}
          </select>
          <input type="text" class="input-text mono-player-name-input" data-idx="${i}" value="${this.escapeHTML(defaultName)}" maxlength="16" placeholder="Player Name" style="flex:1;">
        </div>
      `;
      container.appendChild(card);
    }
  }

  handleStartGameFromSetup() {
    const names = document.querySelectorAll('.mono-player-name-input');
    const tokens = document.querySelectorAll('.mono-player-token-select');
    const bots = document.querySelectorAll('.mono-player-is-bot');

    const playerConfigs = [];
    names.forEach((nameInput, idx) => {
      playerConfigs.push({
        name: nameInput.value.trim() || `Player ${idx + 1}`,
        token: tokens[idx] ? tokens[idx].value : '🥥',
        isBot: bots[idx] ? bots[idx].checked : false
      });
    });

    this.engine.startNewGame(playerConfigs);
    this.showGameScreen();
    this.buildBoardGridOnce();
  }

  // =========================================================================
  // BOARD RENDERING (11x11 Grid Matrix)
  // =========================================================================
  buildBoardGridOnce() {
    const boardEl = document.getElementById('mono-board-grid');
    if (!boardEl || boardEl.children.length > 1) return; // Already built

    // Empty previous tiles except center hub
    const centerHub = document.getElementById('mono-center-hub');
    boardEl.innerHTML = '';
    if (centerHub) boardEl.appendChild(centerHub);

    // Grid coordinates map for 40 spaces:
    // row 11, col 11 = Space 0 (START)
    // row 11, col 10..2 = Spaces 1 to 9 (bottom row)
    // row 11, col 1 = Space 10 (Jail)
    // row 10..2, col 1 = Spaces 11 to 19 (left column)
    // row 1, col 1 = Space 20 (Free Parking)
    // row 1, col 2..10 = Spaces 21 to 29 (top row)
    // row 1, col 11 = Space 30 (Go To Jail)
    // row 2..10, col 11 = Spaces 31 to 39 (right column)

    this.config.boardSpaces.forEach((space) => {
      const coords = this.getSpaceGridCoords(space.index);
      const tile = document.createElement('div');
      tile.className = `mono-space-tile ${this.getTileClass(space)}`;
      tile.id = `mono-tile-${space.index}`;
      tile.dataset.spaceIndex = space.index;
      tile.style.gridRow = coords.row;
      tile.style.gridColumn = coords.col;

      tile.innerHTML = `
        <div class="mono-space-inner">
          ${space.group ? `<div class="mono-color-bar" style="background:${this.config.colorGroups[space.group].hex};"></div>` : ''}
          <div class="mono-space-header">
            ${space.icon ? `<span class="mono-space-icon">${space.icon}</span>` : ''}
            <span class="mono-space-name">${space.name}</span>
          </div>
          <div class="mono-buildings-row" id="mono-buildings-${space.index}"></div>
          <div class="mono-space-tokens" id="mono-tokens-${space.index}"></div>
          ${space.price ? `<div class="mono-space-price">₹${this.engine.formatNumber(space.price)}</div>` : ''}
          <div class="mono-space-owner-pill" id="mono-owner-${space.index}"></div>
        </div>
      `;

      tile.addEventListener('click', () => {
        this.openPropertyDeed(space.index);
      });

      boardEl.appendChild(tile);
    });
  }

  getSpaceGridCoords(index) {
    if (index === 0) return { row: 11, col: 11 };
    if (index >= 1 && index <= 9) return { row: 11, col: 11 - index };
    if (index === 10) return { row: 11, col: 1 };
    if (index >= 11 && index <= 19) return { row: 11 - (index - 10), col: 1 };
    if (index === 20) return { row: 1, col: 1 };
    if (index >= 21 && index <= 29) return { row: 1, col: index - 19 };
    if (index === 30) return { row: 1, col: 11 };
    if (index >= 31 && index <= 39) return { row: index - 29, col: 11 };
    return { row: 1, col: 1 };
  }

  getTileClass(space) {
    if (space.type === 'start') return 'tile-start tile-corner';
    if (space.type === 'jail') return 'tile-jail tile-corner';
    if (space.type === 'parking') return 'tile-parking tile-corner';
    if (space.type === 'gotojail') return 'tile-gotojail tile-corner';
    if (space.type === 'transport') return 'tile-transport';
    if (space.type === 'utility') return 'tile-utility';
    if (space.type === 'tax') return 'tile-tax';
    if (space.type === 'chest' || space.type === 'chance') return 'tile-card';
    return `tile-prop tile-${space.group}`;
  }

  // =========================================================================
  // MAIN RENDER UPDATE LOOP
  // =========================================================================
  render(state) {
    if (!state || state.players.length === 0) return;

    this.buildBoardGridOnce();

    const currPlayer = this.engine.getCurrentPlayer();

    // 1. Update Center Hub & Active Turn Info
    const turnBannerEl = document.getElementById('mono-active-player-banner');
    const diceDisplayEl = document.getElementById('mono-dice-display');
    const actionsContainerEl = document.getElementById('mono-actions-container');

    if (turnBannerEl) {
      const lockBadge = !currPlayer.hasStarted ? '<span class="mono-badge-lock">🔒 Needs 6 to Start</span>' : '';
      turnBannerEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.8rem; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2));">${currPlayer.token}</span>
          <div>
            <div style="font-weight:900; font-size:1.05rem; color:${currPlayer.color}; display:flex; align-items:center; gap:6px;">
              ${this.escapeHTML(currPlayer.name)} ${currPlayer.isBot ? '<span class="mono-bot-pill">BOT</span>' : ''} ${lockBadge}
            </div>
            <div style="font-size:0.8rem; color:#475569;">
              Turn ${state.turnNumber} • Cash: <strong style="color:#0f172a;">₹${this.engine.formatNumber(currPlayer.cash)}</strong>
              ${currPlayer.inJail ? '<span style="color:#ef4444; margin-left:6px;">⛓️ In Jail</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }

    if (diceDisplayEl) {
      diceDisplayEl.innerHTML = `
        <div class="mono-die">${this.getDieFace(state.dice[0])}</div>
        <div class="mono-die">${this.getDieFace(state.dice[1])}</div>
      `;
    }

    // 2. Update Action Buttons depending on phase
    if (actionsContainerEl) {
      this.renderActionButtons(state, currPlayer, actionsContainerEl);
    }

    // 3. Update Tokens on Board Tiles
    this.config.boardSpaces.forEach(space => {
      const tokensContainer = document.getElementById(`mono-tokens-${space.index}`);
      if (tokensContainer) {
        const playersOnTile = state.players.filter(p => !p.isBankrupt && p.position === space.index);
        tokensContainer.innerHTML = playersOnTile.map(p => `
          <span class="mono-board-pin" title="${this.escapeHTML(p.name)}" style="background:${p.color}; border:2px solid #fff;">
            ${p.token}
          </span>
        `).join('');
      }

      // Update Owner Pill & Mortgaged Badge
      const prop = state.properties[space.index];
      const ownerEl = document.getElementById(`mono-owner-${space.index}`);
      const buildingsEl = document.getElementById(`mono-buildings-${space.index}`);

      if (prop && ownerEl) {
        if (prop.ownerId) {
          const owner = state.players.find(p => p.id === prop.ownerId);
          if (prop.isMortgaged) {
            ownerEl.innerHTML = `<span class="mono-mortgaged-pill">⚠️ MORTGAGED</span>`;
          } else if (owner) {
            ownerEl.innerHTML = `<span class="mono-owner-tag" style="background:${owner.color}; color:#fff;">${this.escapeHTML(owner.name.substring(0, 7))}</span>`;
          }
        } else {
          ownerEl.innerHTML = '';
        }
      }

      // Update Houses/Hotel indicators
      if (prop && buildingsEl) {
        if (prop.hasHotel) {
          buildingsEl.innerHTML = `<span class="mono-hotel-icon" title="Hotel">🏨</span>`;
        } else if (prop.houses > 0) {
          buildingsEl.innerHTML = Array(prop.houses).fill('<span class="mono-house-icon" title="House">🟢</span>').join('');
        } else {
          buildingsEl.innerHTML = '';
        }
      }
    });

    // 4. Update Players Dashboard Bar
    this.renderPlayersDashboard(state);

    // 5. Update Activity Log
    this.renderActivityLog(state.log);

    // 6. Check Game Over
    if (state.phase === 'GAME_OVER' && state.winner) {
      this.showVictoryModal(state.winner);
    }
  }

  getDieFace(num) {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return faces[Math.max(0, Math.min(5, num - 1))] || '⚀';
  }

  renderActionButtons(state, currPlayer, container) {
    const isHumanTurn = !currPlayer.isBot;

    let html = '';

    if (state.phase === 'READY_TO_ROLL') {
      if (currPlayer.inJail) {
        html += `
          <button class="btn btn-warning btn-mono-action" id="btn-mono-roll-dice" ${!isHumanTurn ? 'disabled' : ''}>🎲 Roll for Doubles</button>
          <button class="btn btn-danger btn-mono-action" id="btn-mono-pay-jail" ${!isHumanTurn || currPlayer.cash < this.config.jailFine ? 'disabled' : ''}>🚪 Pay Fine (₹500)</button>
          ${currPlayer.getOutOfJailCards > 0 ? `<button class="btn btn-success btn-mono-action" id="btn-mono-use-jail-card" ${!isHumanTurn ? 'disabled' : ''}>🎫 Use Jail Card</button>` : ''}
        `;
      } else if (!currPlayer.hasStarted) {
        html += `
          <button class="btn btn-warning btn-lg btn-mono-action btn-pulse-roll" id="btn-mono-roll-dice" ${!isHumanTurn ? 'disabled' : ''}>
            🎲 Roll 6 to Start!
          </button>
        `;
      } else {
        html += `
          <button class="btn btn-primary btn-lg btn-mono-action btn-pulse-roll" id="btn-mono-roll-dice" ${!isHumanTurn ? 'disabled' : ''}>
            🎲 Roll Dice
          </button>
        `;
      }
    } else if (state.phase === 'ACTION_REQUIRED') {
      const space = this.config.boardSpaces[currPlayer.position];
      const canAfford = currPlayer.cash >= space.price;
      html += `
        <button class="btn btn-success btn-lg btn-mono-action" id="btn-mono-buy-prop" ${!isHumanTurn || !canAfford ? 'disabled' : ''}>
          🛒 Buy ${space.name} (₹${this.engine.formatNumber(space.price)})
        </button>
        <button class="btn btn-secondary btn-lg btn-mono-action" id="btn-mono-decline-prop" ${!isHumanTurn ? 'disabled' : ''}>
          🏷️ Auction
        </button>
      `;
    } else if (state.phase === 'AUCTION') {
      const auc = state.auction;
      if (auc) {
        const bidderId = auc.activeBidders[auc.bidderTurnIndex];
        const bidder = state.players.find(p => p.id === bidderId);
        const isMyBid = bidder && !bidder.isBot;
        const space = this.config.boardSpaces[auc.spaceIndex];
        const highBidder = auc.highBidderId ? state.players.find(p => p.id === auc.highBidderId) : null;

        html += `
          <div style="width:100%; text-align:center; margin-bottom:2px; font-size:0.75rem; font-weight:800; color:#0f172a;">
            🏷️ Auction: ${space.name} • Top Bid: <strong style="color:#16a34a;">₹${auc.currentBid}</strong> ${highBidder ? `(${highBidder.name})` : ''}
          </div>
          <div style="font-size:0.72rem; color:#475569; width:100%; text-align:center; margin-bottom:4px;">
            Turn: <strong style="color:#0f172a;">${bidder ? bidder.name : 'Waiting'}</strong>
          </div>
          <button class="btn btn-primary btn-sm btn-mono-action" id="btn-auction-bid-50" ${!isMyBid ? 'disabled' : ''}>+₹50</button>
          <button class="btn btn-primary btn-sm btn-mono-action" id="btn-auction-bid-100" ${!isMyBid ? 'disabled' : ''}>+₹100</button>
          <button class="btn btn-primary btn-sm btn-mono-action" id="btn-auction-bid-500" ${!isMyBid ? 'disabled' : ''}>+₹500</button>
          <button class="btn btn-danger btn-sm btn-mono-action" id="btn-auction-pass" ${!isMyBid ? 'disabled' : ''}>Pass</button>
        `;
      }
    } else if (state.phase === 'END_TURN') {
      html += `
        <button class="btn btn-primary btn-lg btn-mono-action" id="btn-mono-end-turn" ${!isHumanTurn ? 'disabled' : ''}>
          ⏭️ Pass Turn
        </button>
      `;
    }

    // Persistent trade button
    html += `
      <button class="btn btn-secondary btn-mono-action" id="btn-mono-open-trade" style="padding:8px 12px; font-size:0.85rem;">
        🤝 Trade
      </button>
    `;

    container.innerHTML = html;
  }

  renderPlayersDashboard(state) {
    const listEl = document.getElementById('mono-players-list');
    if (!listEl) return;

    listEl.innerHTML = state.players.map((p, idx) => {
      const isCurrent = idx === state.currentPlayerIndex;
      const netWorth = this.engine.calculateNetWorth(p);
      const ownedPropsCount = Object.values(state.properties).filter(prop => prop.ownerId === p.id).length;

      return `
        <div class="mono-player-card ${isCurrent ? 'active-turn-card' : ''} ${p.isBankrupt ? 'bankrupt-card' : ''}">
          <div class="mono-player-card-top">
            <span class="mono-player-token-large">${p.token}</span>
            <div style="flex:1;">
              <div style="font-weight:900; color:${p.color}; font-size:0.95rem;">
                ${this.escapeHTML(p.name)} ${p.isBot ? '<span class="mono-bot-pill">BOT</span>' : ''}
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted);">
                Net Worth: ₹${this.engine.formatNumber(netWorth)}
              </div>
            </div>
            ${p.isBankrupt ? '<span class="mono-badge-bankrupt">BANKRUPT</span>' : ''}
            ${p.inJail ? '<span class="mono-badge-jail">JAIL</span>' : ''}
          </div>
          <div class="mono-player-cash-row">
            <span>Cash:</span>
            <strong style="color:#fcd34d;">₹${this.engine.formatNumber(p.cash)}</strong>
          </div>
          <div class="mono-player-props-summary">
            <span>Props: ${ownedPropsCount}</span>
            ${p.getOutOfJailCards > 0 ? `<span>🎫 x${p.getOutOfJailCards}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderActivityLog(logs) {
    const logEl = document.getElementById('mono-activity-log');
    if (!logEl) return;
    logEl.innerHTML = logs.slice(0, 25).map(m => `
      <div class="mono-log-entry">${this.escapeHTML(m)}</div>
    `).join('');
  }

  // =========================================================================
  // PROPERTY DEED & MANAGEMENT MODAL
  // =========================================================================
  openPropertyDeed(spaceIndex) {
    const space = this.config.boardSpaces[spaceIndex];
    if (!space || (space.type !== 'property' && space.type !== 'transport' && space.type !== 'utility')) {
      return;
    }

    this.selectedPropertyIndex = spaceIndex;
    const prop = this.engine.state.properties[spaceIndex];
    const currPlayer = this.engine.getCurrentPlayer();
    const isOwner = (prop.ownerId === currPlayer.id);
    const owner = prop.ownerId ? this.engine.state.players.find(p => p.id === prop.ownerId) : null;

    const modal = document.getElementById('modal-mono-deed');
    const headerEl = document.getElementById('mono-deed-header');
    const bodyEl = document.getElementById('mono-deed-body');
    const actionsEl = document.getElementById('mono-deed-actions');

    if (!modal || !headerEl || !bodyEl) return;

    const colorHex = space.group ? this.config.colorGroups[space.group].hex : '#475569';
    headerEl.style.backgroundColor = colorHex;
    headerEl.innerHTML = `
      <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; opacity:0.9;">TITLE DEED</div>
      <h3 style="font-size:1.35rem; font-weight:900; margin:4px 0;">${space.name}</h3>
      <div style="font-size:0.8rem; opacity:0.9;">${space.subtitle || space.district || ''}</div>
    `;

    // Render rent schedule table
    let rentTableHtml = '';
    if (space.type === 'property') {
      rentTableHtml = `
        <div class="mono-deed-rent-table">
          <div class="deed-row"><span>Rent (Base)</span><strong>₹${space.rent.base}</strong></div>
          <div class="deed-row"><span>With Full Color Set</span><strong>₹${space.rent.fullSet}</strong></div>
          <div class="deed-row ${prop.houses === 1 ? 'active-tier' : ''}"><span>With 1 House</span><strong>₹${space.rent.house1}</strong></div>
          <div class="deed-row ${prop.houses === 2 ? 'active-tier' : ''}"><span>With 2 Houses</span><strong>₹${space.rent.house2}</strong></div>
          <div class="deed-row ${prop.houses === 3 ? 'active-tier' : ''}"><span>With 3 Houses</span><strong>₹${space.rent.house3}</strong></div>
          <div class="deed-row ${prop.houses === 4 ? 'active-tier' : ''}"><span>With 4 Houses</span><strong>₹${space.rent.house4}</strong></div>
          <div class="deed-row ${prop.hasHotel ? 'active-tier' : ''}"><span>With Hotel</span><strong>₹${space.rent.hotel}</strong></div>
        </div>
        <div style="margin-top:10px; font-size:0.8rem; color:var(--text-muted); text-align:center;">
          Houses Cost: ₹${this.engine.formatNumber(space.houseCost)} each • Hotels Cost: ₹${this.engine.formatNumber(space.hotelCost)} plus 4 houses
        </div>
      `;
    } else if (space.type === 'transport') {
      rentTableHtml = `
        <div class="mono-deed-rent-table">
          <div class="deed-row"><span>1 Transport Owned</span><strong>₹250</strong></div>
          <div class="deed-row"><span>2 Transports Owned</span><strong>₹500</strong></div>
          <div class="deed-row"><span>3 Transports Owned</span><strong>₹1,000</strong></div>
          <div class="deed-row"><span>4 Transports Owned</span><strong>₹2,000</strong></div>
        </div>
      `;
    } else if (space.type === 'utility') {
      rentTableHtml = `
        <div style="font-size:0.85rem; line-height:1.6; padding:8px; background:rgba(255,255,255,0.03); border-radius:8px;">
          ⚡ If 1 utility owned: Rent is <strong>40× dice roll</strong>.<br>
          ⚡ If both utilities owned: Rent is <strong>100× dice roll</strong>.
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div style="margin-bottom:12px; font-size:0.85rem;">
        <strong>Purchase Price:</strong> ₹${this.engine.formatNumber(space.price)} • 
        <strong>Mortgage Value:</strong> ₹${this.engine.formatNumber(space.mortgage)}
      </div>
      <div style="margin-bottom:12px; font-size:0.85rem;">
        <strong>Owner:</strong> ${owner ? `<span style="color:${owner.color}; font-weight:800;">${this.escapeHTML(owner.name)}</span>` : '<span style="color:#94a3b8;">Unowned (Bank)</span>'}
        ${prop.isMortgaged ? '<span class="mono-mortgaged-pill" style="margin-left:8px;">MORTGAGED</span>' : ''}
      </div>
      ${rentTableHtml}
    `;

    // Action buttons (Build House / Sell House / Mortgage / Unmortgage)
    if (actionsEl) {
      if (isOwner && !currPlayer.isBot) {
        actionsEl.innerHTML = `
          ${space.type === 'property' && !prop.isMortgaged && !prop.hasHotel ? `
            <button class="btn btn-success btn-sm" id="btn-deed-build-house">
              🏡 Build (+₹${this.engine.formatNumber(space.houseCost)})
            </button>
          ` : ''}
          ${!prop.isMortgaged ? `
            <button class="btn btn-warning btn-sm" id="btn-deed-mortgage">
              💳 Mortgage (+₹${this.engine.formatNumber(space.mortgage)})
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" id="btn-deed-unmortgage">
              ✨ Unmortgage (-₹${this.engine.formatNumber(Math.round(space.mortgage * 1.1))})
            </button>
          `}
        `;

        const btnBuild = document.getElementById('btn-deed-build-house');
        const btnMort = document.getElementById('btn-deed-mortgage');
        const btnUnmort = document.getElementById('btn-deed-unmortgage');

        if (btnBuild) {
          btnBuild.addEventListener('click', () => {
            const res = this.engine.buildHouse(spaceIndex);
            if (!res.success) alert(res.msg);
            else this.openPropertyDeed(spaceIndex);
          });
        }
        if (btnMort) {
          btnMort.addEventListener('click', () => {
            if (this.engine.mortgageProperty(spaceIndex)) this.openPropertyDeed(spaceIndex);
          });
        }
        if (btnUnmort) {
          btnUnmort.addEventListener('click', () => {
            if (this.engine.unmortgageProperty(spaceIndex)) this.openPropertyDeed(spaceIndex);
          });
        }
      } else {
        actionsEl.innerHTML = '';
      }
    }

    modal.classList.add('active');
  }

  // =========================================================================
  // AUCTION MODAL & BIDDING
  // =========================================================================
  handlePrompt(prompt) {
    if (prompt.type === 'BUY_OR_AUCTION') {
      // Handled via main action buttons on center board
    }
  }

  handleAuctionBid(increment) {
    const auc = this.engine.state.auction;
    if (!auc) return;
    const currentBidderId = auc.activeBidders[auc.bidderTurnIndex];
    const newBid = auc.currentBid + increment;
    this.engine.placeAuctionBid(currentBidderId, newBid);
  }

  // =========================================================================
  // TRADING MODAL & EXECUTION
  // =========================================================================
  openTradeModal() {
    const modal = document.getElementById('modal-mono-trade');
    const selectTarget = document.getElementById('mono-trade-target-select');
    if (!modal || !selectTarget) return;

    const currPlayer = this.engine.getCurrentPlayer();
    const otherPlayers = this.engine.state.players.filter(p => p.id !== currPlayer.id && !p.isBankrupt);

    if (otherPlayers.length === 0) {
      alert('No other active players to trade with.');
      return;
    }

    selectTarget.innerHTML = otherPlayers.map(p => `
      <option value="${p.id}">${p.token} ${this.escapeHTML(p.name)}</option>
    `).join('');

    this.activeTradeTargetId = otherPlayers[0].id;
    this.renderTradeOfferPanels();

    modal.classList.add('active');
  }

  renderTradeOfferPanels() {
    const p1Container = document.getElementById('mono-trade-p1-props');
    const p2Container = document.getElementById('mono-trade-p2-props');
    const p1CashInput = document.getElementById('mono-trade-p1-cash');
    const p2CashInput = document.getElementById('mono-trade-p2-cash');

    const currPlayer = this.engine.getCurrentPlayer();
    const targetPlayer = this.engine.state.players.find(p => p.id === this.activeTradeTargetId);

    if (!currPlayer || !targetPlayer || !p1Container || !p2Container) return;

    const p1Props = Object.values(this.engine.state.properties).filter(p => p.ownerId === currPlayer.id);
    const p2Props = Object.values(this.engine.state.properties).filter(p => p.ownerId === targetPlayer.id);

    p1Container.innerHTML = p1Props.map(prop => {
      const space = this.config.boardSpaces[prop.spaceIndex];
      return `
        <label class="mono-trade-prop-item">
          <input type="checkbox" class="mono-trade-p1-chk" value="${space.index}">
          <span>${space.name} (₹${space.price})</span>
        </label>
      `;
    }).join('') || '<div style="font-size:0.8rem; color:var(--text-muted);">No properties owned</div>';

    p2Container.innerHTML = p2Props.map(prop => {
      const space = this.config.boardSpaces[prop.spaceIndex];
      return `
        <label class="mono-trade-prop-item">
          <input type="checkbox" class="mono-trade-p2-chk" value="${space.index}">
          <span>${space.name} (₹${space.price})</span>
        </label>
      `;
    }).join('') || '<div style="font-size:0.8rem; color:var(--text-muted);">No properties owned</div>';

    if (p1CashInput) p1CashInput.max = currPlayer.cash;
    if (p2CashInput) p2CashInput.max = targetPlayer.cash;
  }

  handleSubmitTrade() {
    const currPlayer = this.engine.getCurrentPlayer();
    const targetPlayer = this.engine.state.players.find(p => p.id === this.activeTradeTargetId);
    if (!currPlayer || !targetPlayer) return;

    const p1Cash = Number(document.getElementById('mono-trade-p1-cash')?.value) || 0;
    const p2Cash = Number(document.getElementById('mono-trade-p2-cash')?.value) || 0;

    const p1SelectedProps = Array.from(document.querySelectorAll('.mono-trade-p1-chk:checked')).map(cb => Number(cb.value));
    const p2SelectedProps = Array.from(document.querySelectorAll('.mono-trade-p2-chk:checked')).map(cb => Number(cb.value));

    // Bot evaluation if target is bot
    if (targetPlayer.isBot) {
      const p1OfferValue = p1Cash + p1SelectedProps.reduce((sum, idx) => sum + this.config.boardSpaces[idx].price, 0);
      const p2AskValue = p2Cash + p2SelectedProps.reduce((sum, idx) => sum + this.config.boardSpaces[idx].price, 0);

      if (p1OfferValue < p2AskValue * 0.9) {
        alert(`${targetPlayer.name} declined the trade offer! ("Ithu oru mosham deal aanu!")`);
        return;
      }
    }

    const tradeOffer = {
      player1Id: currPlayer.id,
      player2Id: targetPlayer.id,
      p1Cash: p1Cash,
      p1Properties: p1SelectedProps,
      p1JailCards: 0,
      p2Cash: p2Cash,
      p2Properties: p2SelectedProps,
      p2JailCards: 0
    };

    if (this.engine.executeTrade(tradeOffer)) {
      document.getElementById('modal-mono-trade')?.classList.remove('active');
    }
  }

  // =========================================================================
  // VICTORY CELEBRATION MODAL
  // =========================================================================
  showVictoryModal(winner) {
    const modal = document.getElementById('modal-mono-winner');
    const nameEl = document.getElementById('mono-winner-name');
    const netWorthEl = document.getElementById('mono-winner-networth');
    if (!modal || !nameEl) return;

    nameEl.textContent = `${winner.token} ${winner.name}`;
    if (netWorthEl) {
      netWorthEl.textContent = `₹${this.engine.formatNumber(this.engine.calculateNetWorth(winner))}`;
    }

    if (window.confetti) {
      window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    modal.classList.add('active');
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Initialise UI on load
document.addEventListener('DOMContentLoaded', () => {
  window.malluMonopolyUI = new MalluMonopolyUI();
  window.malluMonopolyUI.setupEventListeners();
  window.malluMonopolyUI.renderPlayerSetupForms(4);
});
