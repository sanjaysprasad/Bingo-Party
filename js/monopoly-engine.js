/**
 * Monopoly: Kerala Edition - Core Game Engine
 * Handles State Machine, Turns, Movement, Rent Calculation, Building,
 * Auctions, Trading, Mortgages, Jail, Bankruptcies, Smart AI, and Saving.
 */

class MalluMonopolyEngine {
  constructor() {
    this.config = window.MALLU_MONOPOLY_CONFIG;
    this.audio = window.malluMonopolyAudio;

    this.state = {
      gameId: null,
      turnNumber: 1,
      currentPlayerIndex: 0,
      phase: 'SETUP', // 'SETUP' | 'READY_TO_ROLL' | 'ACTION_REQUIRED' | 'AUCTION' | 'END_TURN' | 'GAME_OVER'
      dice: [1, 1],
      doublesCount: 0,
      hasRolled: false,
      players: [],
      properties: {}, // spaceIndex -> { ownerId, houses, hasHotel, isMortgaged }
      bankHouses: 32,
      bankHotels: 12,
      chanceDeck: [],
      communityChestDeck: [],
      auction: null, // { spaceIndex, currentBid, highBidderId, activeBidders: [], turnIndex }
      log: [],
      winner: null,
      savedAt: null
    };

    this.onStateChange = null; // UI callback
    this.onDialogue = null;    // Dialogue callback
    this.onPrompt = null;      // Prompt callback (Buy/Auction modal, etc.)
  }

  // Initialise a new match with 2-8 players
  startNewGame(playerConfigs) {
    if (!playerConfigs || playerConfigs.length < 2) {
      throw new Error('At least 2 players are required for Monopoly: Kerala Edition');
    }

    const players = playerConfigs.map((cfg, idx) => ({
      id: `p_${idx + 1}`,
      name: cfg.name || `Player ${idx + 1}`,
      token: cfg.token || this.config.tokens[idx % this.config.tokens.length].icon,
      color: cfg.color || this.getPlayerColor(idx),
      isBot: !!cfg.isBot,
      cash: this.config.startingBalance,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      stats: {
        propertiesBought: 0,
        rentPaid: 0,
        rentCollected: 0,
        housesBuilt: 0,
        hotelsBuilt: 0,
        turnsPlayed: 0
      }
    }));

    // Randomize first turn player
    const startingPlayerIdx = Math.floor(Math.random() * players.length);

    // Initialise board properties map
    const properties = {};
    this.config.boardSpaces.forEach((space) => {
      if (space.type === 'property' || space.type === 'transport' || space.type === 'utility') {
        properties[space.index] = {
          spaceIndex: space.index,
          ownerId: null,
          houses: 0,
          hasHotel: false,
          isMortgaged: false
        };
      }
    });

    // Shuffle card decks
    const chanceDeck = this.shuffleDeck([...this.config.chanceCards]);
    const communityChestDeck = this.shuffleDeck([...this.config.communityChestCards]);

    this.state = {
      gameId: `mallu_mono_${Date.now()}`,
      turnNumber: 1,
      currentPlayerIndex: startingPlayerIdx,
      phase: 'READY_TO_ROLL',
      dice: [1, 1],
      doublesCount: 0,
      hasRolled: false,
      players: players,
      properties: properties,
      bankHouses: this.config.totalBankHouses,
      bankHotels: this.config.totalBankHotels,
      chanceDeck: chanceDeck,
      communityChestDeck: communityChestDeck,
      auction: null,
      log: [
        `🌴 Match started! Starting balance ₹${this.formatNumber(this.config.startingBalance)}.`,
        `🎲 ${players[startingPlayerIdx].name} won the toss to start the match!`
      ],
      winner: null,
      savedAt: Date.now()
    };

    this.autoSave();
    this.notifyUpdate();

    // If starting player is bot, trigger bot turn
    this.checkBotTurn();
  }

  getPlayerColor(idx) {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return colors[idx % colors.length];
  }

  shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  getActivePlayers() {
    return this.state.players.filter(p => !p.isBankrupt);
  }

  // =========================================================================
  // CORE TURN & DICE ROLLING
  // =========================================================================
  rollDice() {
    if (this.state.phase !== 'READY_TO_ROLL' && this.state.phase !== 'JAIL_CHOICE') {
      return false;
    }

    const player = this.getCurrentPlayer();
    if (!player || player.isBankrupt) return false;

    // Roll two 6-sided dice
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDoubles = (d1 === d2);
    const total = d1 + d2;

    this.state.dice = [d1, d2];
    this.state.hasRolled = true;

    if (this.audio) this.audio.playDiceRoll();

    this.addLog(`🎲 ${player.name} rolled [${d1}] + [${d2}] = ${total}${isDoubles ? ' (DOUBLES! 🔥)' : ''}.`);

    // Handle Jail condition
    if (player.inJail) {
      if (isDoubles) {
        player.inJail = false;
        player.jailTurns = 0;
        this.addLog(`🔓 ${player.name} rolled doubles and is released from Jail!`);
        if (this.audio) {
          this.audio.playJail();
          this.audio.triggerDialogue('jailExit', player.name);
        }
        this.movePlayer(total);
        return true;
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          // Mandatory fine after 3 failed double rolls
          this.addLog(`⏳ ${player.name} failed 3 turns in jail. Paying mandatory ₹${this.config.jailFine} fine.`);
          this.deductCash(player, this.config.jailFine, null, 'Jail Release Fine');
          player.inJail = false;
          player.jailTurns = 0;
          this.movePlayer(total);
          return true;
        } else {
          this.addLog(`🔒 ${player.name} did not roll doubles. Remains in Jail (Turn ${player.jailTurns}/3).`);
          this.state.phase = 'END_TURN';
          this.notifyUpdate();
          this.checkBotTurn();
          return true;
        }
      }
    }

    // Normal Turn: Check 3 consecutive doubles rule
    if (isDoubles) {
      this.state.doublesCount++;
      if (this.state.doublesCount >= 3) {
        this.addLog(`🚨 ${player.name} rolled 3 consecutive doubles! Sent directly to Jail for speeding.`);
        this.sendToJail(player);
        this.state.doublesCount = 0;
        this.state.phase = 'END_TURN';
        this.notifyUpdate();
        this.checkBotTurn();
        return true;
      } else {
        if (this.audio) this.audio.triggerDialogue('doubles', player.name);
      }
    } else {
      this.state.doublesCount = 0;
    }

    this.movePlayer(total);
    return true;
  }

  // Pay ₹500 fine to leave Jail immediately
  payJailFine() {
    const player = this.getCurrentPlayer();
    if (!player || !player.inJail) return false;

    if (player.cash < this.config.jailFine) {
      this.addLog(`❌ ${player.name} doesn't have ₹${this.config.jailFine} to pay the jail fine.`);
      return false;
    }

    this.deductCash(player, this.config.jailFine, null, 'Jail Fine');
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`🚪 ${player.name} paid ₹${this.config.jailFine} bail fine and was released from Jail.`);

    if (this.audio) {
      this.audio.playCash();
      this.audio.triggerDialogue('jailExit', player.name);
    }

    this.state.phase = 'READY_TO_ROLL';
    this.notifyUpdate();
    return true;
  }

  // Use Get Out of Jail Free Card
  useJailCard() {
    const player = this.getCurrentPlayer();
    if (!player || !player.inJail || player.getOutOfJailCards <= 0) return false;

    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`📜 ${player.name} used a Get Out of Jail Free Card and walked out!`);

    if (this.audio) {
      this.audio.playJail();
      this.audio.triggerDialogue('jailExit', player.name);
    }

    this.state.phase = 'READY_TO_ROLL';
    this.notifyUpdate();
    return true;
  }

  // Send player to Jail
  sendToJail(player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;

    if (this.audio) {
      this.audio.playJail();
      this.audio.triggerDialogue('jailEnter', player.name);
    }
  }

  // =========================================================================
  // MOVEMENT & SPACE RESOLUTION
  // =========================================================================
  movePlayer(steps) {
    const player = this.getCurrentPlayer();
    const oldPos = player.position;
    const newPos = (oldPos + steps) % 40;

    // Check passing START (Award ₹2,000)
    if (newPos < oldPos && oldPos !== 0) {
      player.cash += this.config.startSalary;
      this.addLog(`🏁 ${player.name} passed START and collected ₹${this.formatNumber(this.config.startSalary)}!`);
      if (this.audio) {
        this.audio.playCash();
        this.audio.triggerDialogue('start', player.name);
      }
    }

    player.position = newPos;
    const space = this.config.boardSpaces[newPos];
    this.addLog(`📍 ${player.name} landed on ${space.name} (Space ${newPos}).`);

    this.resolveLandedSpace(space, player);
  }

  // Move directly to target space
  movePlayerTo(player, targetIndex, collectStartIfPassed = true) {
    const oldPos = player.position;
    if (collectStartIfPassed && targetIndex < oldPos) {
      player.cash += this.config.startSalary;
      this.addLog(`🏁 ${player.name} passed START and collected ₹${this.formatNumber(this.config.startSalary)}!`);
      if (this.audio) {
        this.audio.playCash();
        this.audio.triggerDialogue('start', player.name);
      }
    }
    player.position = targetIndex;
    const space = this.config.boardSpaces[targetIndex];
    this.addLog(`📍 ${player.name} advanced to ${space.name}.`);
    this.resolveLandedSpace(space, player);
  }

  resolveLandedSpace(space, player) {
    switch (space.type) {
      case 'start':
        // Landed on START exactly
        this.addLog(`🏁 ${player.name} landed directly on START! Extra blessing!`);
        this.finishActionPhase();
        break;

      case 'property':
      case 'transport':
      case 'utility':
        this.handlePropertyLanded(space, player);
        break;

      case 'tax':
        this.handleTaxLanded(space, player);
        break;

      case 'chest':
        this.drawCommunityChest(player);
        break;

      case 'chance':
        this.drawChance(player);
        break;

      case 'gotojail':
        this.addLog(`👮 Police captured ${player.name}! Go directly to Jail.`);
        this.sendToJail(player);
        this.state.phase = 'END_TURN';
        this.notifyUpdate();
        this.checkBotTurn();
        break;

      case 'jail':
        this.addLog(`⛓️ ${player.name} is just visiting the Lock-Up.`);
        this.finishActionPhase();
        break;

      case 'parking':
        this.addLog(`🚌 ${player.name} takes a rest at KSRTC Bus Stand. Free Parking!`);
        this.finishActionPhase();
        break;

      default:
        this.finishActionPhase();
        break;
    }
  }

  // Handle Property, Transport, or Utility
  handlePropertyLanded(space, player) {
    const prop = this.state.properties[space.index];
    if (!prop) {
      this.finishActionPhase();
      return;
    }

    if (!prop.ownerId) {
      // Unowned: Player can Buy or Auction
      this.state.phase = 'ACTION_REQUIRED';
      this.notifyUpdate();

      if (this.onPrompt) {
        this.onPrompt({
          type: 'BUY_OR_AUCTION',
          space: space,
          player: player,
          canAfford: player.cash >= space.price
        });
      }

      this.checkBotTurn();
    } else if (prop.ownerId === player.id) {
      // Already owned by current player
      this.addLog(`🏠 ${player.name} owns ${space.name}. Relaxing on home turf.`);
      this.finishActionPhase();
    } else {
      // Owned by an opponent: Pay Rent!
      const owner = this.state.players.find(p => p.id === prop.ownerId);
      if (!owner || owner.isBankrupt) {
        this.finishActionPhase();
        return;
      }

      if (prop.isMortgaged) {
        this.addLog(`⚠️ ${space.name} is mortgaged by ${owner.name}. Rent is waived!`);
        this.finishActionPhase();
        return;
      }

      const rentAmount = this.calculateRent(space, prop, owner);
      this.addLog(`💸 ${player.name} must pay ₹${this.formatNumber(rentAmount)} rent to ${owner.name} for ${space.name}.`);

      if (this.audio) {
        this.audio.playRentPaid();
        this.audio.triggerDialogue('rentPayment', player.name);
      }

      this.transferCash(player, owner, rentAmount, `Rent for ${space.name}`);
      this.finishActionPhase();
    }
  }

  // Calculate rent according to specific game spec schedules
  calculateRent(space, prop, owner) {
    if (space.type === 'property') {
      const groupInfo = this.config.colorGroups[space.group];
      const ownsFullSet = this.doesPlayerOwnFullGroup(owner.id, space.group);

      if (prop.hasHotel) {
        return space.rent.hotel;
      } else if (prop.houses === 4) {
        return space.rent.house4;
      } else if (prop.houses === 3) {
        return space.rent.house3;
      } else if (prop.houses === 2) {
        return space.rent.house2;
      } else if (prop.houses === 1) {
        return space.rent.house1;
      } else if (ownsFullSet) {
        return space.rent.fullSet;
      } else {
        return space.rent.base;
      }
    } else if (space.type === 'transport') {
      // 1 owned: 250, 2: 500, 3: 1000, 4: 2000
      const transportCount = this.getPlayerTransportsCount(owner.id);
      return space.rentSchedule[Math.min(transportCount, 4)] || 250;
    } else if (space.type === 'utility') {
      // 1 owned: dice * 40, 2 owned: dice * 100
      const utilitiesCount = this.getPlayerUtilitiesCount(owner.id);
      const diceTotal = this.state.dice[0] + this.state.dice[1];
      const multiplier = utilitiesCount >= 2 ? space.multiplierBoth : space.multiplierSingle;
      return diceTotal * multiplier;
    }

    return 0;
  }

  doesPlayerOwnFullGroup(playerId, groupKey) {
    const group = this.config.colorGroups[groupKey];
    if (!group) return false;
    return group.spaces.every(idx => {
      const p = this.state.properties[idx];
      return p && p.ownerId === playerId && !p.isMortgaged;
    });
  }

  getPlayerTransportsCount(playerId) {
    const transportSpaces = this.config.colorGroups.transport.spaces;
    return transportSpaces.filter(idx => {
      const p = this.state.properties[idx];
      return p && p.ownerId === playerId;
    }).length;
  }

  getPlayerUtilitiesCount(playerId) {
    const utilitySpaces = this.config.colorGroups.utility.spaces;
    return utilitySpaces.filter(idx => {
      const p = this.state.properties[idx];
      return p && p.ownerId === playerId;
    }).length;
  }

  // Buy current landed property
  buyCurrentProperty() {
    const player = this.getCurrentPlayer();
    const space = this.config.boardSpaces[player.position];
    const prop = this.state.properties[space.index];

    if (!prop || prop.ownerId) return false;
    if (player.cash < space.price) {
      this.addLog(`❌ ${player.name} does not have enough cash (₹${this.formatNumber(space.price)}) to purchase ${space.name}.`);
      return false;
    }

    player.cash -= space.price;
    prop.ownerId = player.id;
    player.stats.propertiesBought++;

    this.addLog(`🛒 ${player.name} purchased ${space.name} for ₹${this.formatNumber(space.price)}!`);

    if (this.audio) {
      this.audio.playPurchase();
      this.audio.triggerDialogue('propertyPurchase', player.name);
    }

    this.finishActionPhase();
    return true;
  }

  // Decline property purchase -> goes to AUCTION
  declineToAuction() {
    const player = this.getCurrentPlayer();
    const space = this.config.boardSpaces[player.position];
    this.addLog(`🏷️ ${player.name} declined to buy ${space.name}. It goes to public auction!`);

    this.startAuction(space.index);
  }

  // =========================================================================
  // AUCTION SYSTEM
  // =========================================================================
  startAuction(spaceIndex) {
    const activeBidders = this.getActivePlayers().map(p => p.id);
    if (activeBidders.length === 0) {
      this.finishActionPhase();
      return;
    }

    this.state.phase = 'AUCTION';
    this.state.auction = {
      spaceIndex: spaceIndex,
      currentBid: 0,
      highBidderId: null,
      activeBidders: activeBidders,
      bidderTurnIndex: 0
    };

    const space = this.config.boardSpaces[spaceIndex];
    this.addLog(`📢 Public Auction for ${space.name} (Value: ₹${this.formatNumber(space.price)}) has begun! Minimum bid ₹50.`);

    if (this.audio) {
      this.audio.playAuctionGavel();
      this.audio.triggerDialogue('auction', 'Auctioneer');
    }

    this.notifyUpdate();
    this.checkBotAuction();
  }

  placeAuctionBid(playerId, bidAmount) {
    const auc = this.state.auction;
    if (!auc || this.state.phase !== 'AUCTION') return false;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.cash < bidAmount || bidAmount <= auc.currentBid) {
      return false;
    }

    auc.currentBid = bidAmount;
    auc.highBidderId = playerId;
    const space = this.config.boardSpaces[auc.spaceIndex];
    this.addLog(`🔨 ${player.name} bid ₹${this.formatNumber(bidAmount)} for ${space.name}!`);

    if (this.audio) this.audio.playTone(440, 'triangle', 0.08, 0.2);

    this.advanceAuctionTurn();
    return true;
  }

  passAuction(playerId) {
    const auc = this.state.auction;
    if (!auc || this.state.phase !== 'AUCTION') return false;

    auc.activeBidders = auc.activeBidders.filter(id => id !== playerId);
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      this.addLog(`❌ ${player.name} passed on the auction.`);
    }

    if (auc.activeBidders.length <= 1) {
      this.endAuction();
    } else {
      this.advanceAuctionTurn();
    }
  }

  advanceAuctionTurn() {
    const auc = this.state.auction;
    if (!auc) return;

    auc.bidderTurnIndex = (auc.bidderTurnIndex + 1) % auc.activeBidders.length;
    this.notifyUpdate();
    this.checkBotAuction();
  }

  endAuction() {
    const auc = this.state.auction;
    if (!auc) return;

    const space = this.config.boardSpaces[auc.spaceIndex];
    const prop = this.state.properties[auc.spaceIndex];

    if (auc.highBidderId && auc.currentBid > 0) {
      const winner = this.state.players.find(p => p.id === auc.highBidderId);
      if (winner && winner.cash >= auc.currentBid) {
        winner.cash -= auc.currentBid;
        prop.ownerId = winner.id;
        winner.stats.propertiesBought++;
        this.addLog(`🏆 SOLD! ${winner.name} won the auction for ${space.name} with ₹${this.formatNumber(auc.currentBid)}!`);

        if (this.audio) {
          this.audio.playAuctionGavel();
          this.audio.playCash();
          this.audio.triggerDialogue('propertyPurchase', winner.name);
        }
      }
    } else {
      this.addLog(`🏷️ No bids were placed. ${space.name} remains with the Bank.`);
    }

    this.state.auction = null;
    this.finishActionPhase();
  }

  // Handle Tax Spaces
  handleTaxLanded(space, player) {
    const amount = space.amount || 1000;
    this.addLog(`🏛️ ${player.name} landed on ${space.name} and must pay ₹${this.formatNumber(amount)}.`);

    if (this.audio) {
      this.audio.playRentPaid();
      this.audio.triggerDialogue('tax', player.name);
    }

    this.deductCash(player, amount, null, space.name);
    this.finishActionPhase();
  }

  // Draw Community Chest Card
  drawCommunityChest(player) {
    if (this.state.communityChestDeck.length === 0) {
      this.state.communityChestDeck = this.shuffleDeck([...this.config.communityChestCards]);
    }
    const card = this.state.communityChestDeck.shift();

    this.addLog(`📦 ${player.name} drew Community Chest: "${card.title}"`);
    if (this.audio) {
      this.audio.playCardDraw();
      this.audio.showDialogueCaption({ text: card.dialogue, movie: card.movie }, player.name);
    }

    this.applyCardAction(card, player);
  }

  // Draw Chance Card
  drawChance(player) {
    if (this.state.chanceDeck.length === 0) {
      this.state.chanceDeck = this.shuffleDeck([...this.config.chanceCards]);
    }
    const card = this.state.chanceDeck.shift();

    this.addLog(`❓ ${player.name} drew Chance: "${card.title}"`);
    if (this.audio) {
      this.audio.playCardDraw();
      this.audio.showDialogueCaption({ text: card.dialogue, movie: card.movie }, player.name);
    }

    this.applyCardAction(card, player);
  }

  applyCardAction(card, player) {
    switch (card.action) {
      case 'move_to':
        this.movePlayerTo(player, card.target, card.collectStart);
        break;

      case 'go_to_jail':
        this.sendToJail(player);
        this.state.phase = 'END_TURN';
        this.notifyUpdate();
        this.checkBotTurn();
        break;

      case 'get_out_of_jail':
        player.getOutOfJailCards++;
        this.addLog(`🎫 ${player.name} stored a Get Out of Jail Free card.`);
        this.finishActionPhase();
        break;

      case 'receive_cash':
        player.cash += card.amount;
        this.addLog(`💰 ${player.name} received ₹${this.formatNumber(card.amount)}.`);
        if (this.audio) this.audio.playCash();
        this.finishActionPhase();
        break;

      case 'pay_cash':
        this.deductCash(player, card.amount, null, card.title);
        this.finishActionPhase();
        break;

      case 'pay_each_player':
        this.getActivePlayers().forEach(other => {
          if (other.id !== player.id) {
            this.transferCash(player, other, card.amount, card.title);
          }
        });
        this.finishActionPhase();
        break;

      case 'collect_from_each_player':
        this.getActivePlayers().forEach(other => {
          if (other.id !== player.id) {
            this.transferCash(other, player, card.amount, card.title);
          }
        });
        this.finishActionPhase();
        break;

      case 'property_repairs':
        const repairCost = this.calculateRepairs(player, card.houseCost, card.hotelCost);
        this.addLog(`🛠️ ${player.name} owes ₹${this.formatNumber(repairCost)} for property repairs.`);
        this.deductCash(player, repairCost, null, 'Property Repairs');
        this.finishActionPhase();
        break;

      case 'nearest_transport':
        const nearestTransportIdx = this.findNearestTransport(player.position);
        this.movePlayerTo(player, nearestTransportIdx, true);
        break;

      default:
        this.finishActionPhase();
        break;
    }
  }

  calculateRepairs(player, houseCost, hotelCost) {
    let houses = 0;
    let hotels = 0;
    Object.values(this.state.properties).forEach(p => {
      if (p.ownerId === player.id) {
        if (p.hasHotel) hotels++;
        else houses += p.houses;
      }
    });
    return (houses * houseCost) + (hotels * hotelCost);
  }

  findNearestTransport(currentPos) {
    const transports = [5, 15, 25, 35];
    for (let t of transports) {
      if (t > currentPos) return t;
    }
    return transports[0]; // Wrap around to 5
  }

  finishActionPhase() {
    const player = this.getCurrentPlayer();
    if (player.isBankrupt) {
      this.endTurn();
      return;
    }

    // Check if doubles roll grants another roll
    const isDoubles = (this.state.dice[0] === this.state.dice[1]);
    if (isDoubles && !player.inJail && this.state.doublesCount < 3) {
      this.state.phase = 'READY_TO_ROLL';
      this.state.hasRolled = false;
      this.addLog(`🔄 Doubles! ${player.name} gets another turn to roll.`);
    } else {
      this.state.phase = 'END_TURN';
    }

    this.notifyUpdate();
    this.checkBotTurn();
  }

  // =========================================================================
  // END TURN & ADVANCE SEQUENCER
  // =========================================================================
  endTurn() {
    if (this.state.phase !== 'END_TURN') return;

    this.state.doublesCount = 0;
    this.state.hasRolled = false;

    // Advance to next active player
    let nextIdx = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    let loops = 0;
    while (this.state.players[nextIdx].isBankrupt && loops < this.state.players.length) {
      nextIdx = (nextIdx + 1) % this.state.players.length;
      loops++;
    }

    this.state.currentPlayerIndex = nextIdx;
    this.state.turnNumber++;
    this.state.phase = 'READY_TO_ROLL';

    this.checkGameWinner();

    if (!this.state.winner) {
      const nextPlayer = this.getCurrentPlayer();
      this.addLog(`👉 Turn ${this.state.turnNumber}: ${nextPlayer.name}'s turn (${nextPlayer.token})`);
      this.autoSave();
      this.notifyUpdate();
      this.checkBotTurn();
    }
  }

  // =========================================================================
  // BUILD HOUSES & HOTELS (Even Building Rule)
  // =========================================================================
  buildHouse(spaceIndex) {
    const player = this.getCurrentPlayer();
    const space = this.config.boardSpaces[spaceIndex];
    const prop = this.state.properties[spaceIndex];

    if (!prop || prop.ownerId !== player.id || prop.isMortgaged) return { success: false, msg: 'Not eligible' };
    if (!this.doesPlayerOwnFullGroup(player.id, space.group)) {
      return { success: false, msg: 'Must own the full color group before building.' };
    }

    // Check bank limits
    if (prop.houses === 4) {
      if (this.state.bankHotels <= 0) return { success: false, msg: 'Bank has no hotels left.' };
    } else {
      if (this.state.bankHouses <= 0) return { success: false, msg: 'Bank has no houses left.' };
    }

    // Check even building rule across group
    const groupSpaces = this.config.colorGroups[space.group].spaces;
    const groupProps = groupSpaces.map(idx => this.state.properties[idx]);
    const minHousesInGroup = Math.min(...groupProps.map(p => p.hasHotel ? 5 : p.houses));
    const currentHouses = prop.hasHotel ? 5 : prop.houses;

    if (currentHouses > minHousesInGroup) {
      return { success: false, msg: 'Even building rule: You must build evenly across all properties in this color group.' };
    }

    if (prop.hasHotel) {
      return { success: false, msg: 'Maximum buildings reached (Hotel already built).' };
    }

    const cost = space.houseCost || 1000;
    if (player.cash < cost) {
      return { success: false, msg: `Insufficient cash (Requires ₹${this.formatNumber(cost)}).` };
    }

    player.cash -= cost;

    if (prop.houses === 4) {
      prop.houses = 0;
      prop.hasHotel = true;
      this.state.bankHouses += 4;
      this.state.bankHotels -= 1;
      player.stats.hotelsBuilt++;
      this.addLog(`🏨 ${player.name} built a Hotel on ${space.name} for ₹${this.formatNumber(cost)}!`);
    } else {
      prop.houses++;
      this.state.bankHouses -= 1;
      player.stats.housesBuilt++;
      this.addLog(`🏡 ${player.name} built House #${prop.houses} on ${space.name} for ₹${this.formatNumber(cost)}.`);
    }

    if (this.audio) {
      this.audio.playTone(523.25, 'triangle', 0.15, 0.3);
      this.audio.triggerDialogue('buildHouse', player.name);
    }

    this.notifyUpdate();
    return { success: true };
  }

  // =========================================================================
  // MORTGAGE & UNMORTGAGE
  // =========================================================================
  mortgageProperty(spaceIndex) {
    const player = this.getCurrentPlayer();
    const space = this.config.boardSpaces[spaceIndex];
    const prop = this.state.properties[spaceIndex];

    if (!prop || prop.ownerId !== player.id || prop.isMortgaged) return false;
    if (prop.houses > 0 || prop.hasHotel) {
      return false; // Must sell buildings first
    }

    const mortgageValue = space.mortgage || Math.floor(space.price * 0.5);
    prop.isMortgaged = true;
    player.cash += mortgageValue;

    this.addLog(`💳 ${player.name} mortgaged ${space.name} and received ₹${this.formatNumber(mortgageValue)}.`);

    if (this.audio) this.audio.playCash();
    this.notifyUpdate();
    return true;
  }

  unmortgageProperty(spaceIndex) {
    const player = this.getCurrentPlayer();
    const space = this.config.boardSpaces[spaceIndex];
    const prop = this.state.properties[spaceIndex];

    if (!prop || prop.ownerId !== player.id || !prop.isMortgaged) return false;

    const baseVal = space.mortgage || Math.floor(space.price * 0.5);
    const unmortgageCost = Math.round(baseVal * 1.1); // +10% interest

    if (player.cash < unmortgageCost) return false;

    player.cash -= unmortgageCost;
    prop.isMortgaged = false;

    this.addLog(`✨ ${player.name} lifted mortgage on ${space.name} for ₹${this.formatNumber(unmortgageCost)}.`);

    if (this.audio) this.audio.playCash();
    this.notifyUpdate();
    return true;
  }

  // =========================================================================
  // TRADING SYSTEM (Assets, Cash, Jail Cards)
  // =========================================================================
  executeTrade(tradeOffer) {
    // tradeOffer = {
    //   player1Id, player2Id,
    //   p1Cash, p1Properties: [], p1JailCards,
    //   p2Cash, p2Properties: [], p2JailCards
    // }
    const p1 = this.state.players.find(p => p.id === tradeOffer.player1Id);
    const p2 = this.state.players.find(p => p.id === tradeOffer.player2Id);

    if (!p1 || !p2 || p1.isBankrupt || p2.isBankrupt) return false;

    // Validate balances
    if (p1.cash < tradeOffer.p1Cash || p2.cash < tradeOffer.p2Cash) return false;
    if (p1.getOutOfJailCards < tradeOffer.p1JailCards || p2.getOutOfJailCards < tradeOffer.p2JailCards) return false;

    // Transfer cash
    p1.cash -= tradeOffer.p1Cash;
    p2.cash += tradeOffer.p1Cash;

    p2.cash -= tradeOffer.p2Cash;
    p1.cash += tradeOffer.p2Cash;

    // Transfer cards
    p1.getOutOfJailCards -= tradeOffer.p1JailCards;
    p2.getOutOfJailCards += tradeOffer.p1JailCards;

    p2.getOutOfJailCards -= tradeOffer.p2JailCards;
    p1.getOutOfJailCards += tradeOffer.p2JailCards;

    // Transfer properties
    tradeOffer.p1Properties.forEach(spaceIdx => {
      const prop = this.state.properties[spaceIdx];
      if (prop && prop.ownerId === p1.id) prop.ownerId = p2.id;
    });

    tradeOffer.p2Properties.forEach(spaceIdx => {
      const prop = this.state.properties[spaceIdx];
      if (prop && prop.ownerId === p2.id) prop.ownerId = p1.id;
    });

    this.addLog(`🤝 Trade executed between ${p1.name} and ${p2.name}!`);

    if (this.audio) {
      this.audio.playCash();
      this.audio.triggerDialogue('trade', `${p1.name} & ${p2.name}`);
    }

    this.notifyUpdate();
    return true;
  }

  // =========================================================================
  // FINANCIAL TRANSACTIONS & BANKRUPTCY
  // =========================================================================
  transferCash(sender, receiver, amount, reason = '') {
    if (sender.cash >= amount) {
      sender.cash -= amount;
      receiver.cash += amount;
      sender.stats.rentPaid += amount;
      receiver.stats.rentCollected += amount;
    } else {
      // Insufficient cash: Transfer remaining cash then declare bankruptcy
      const remaining = sender.cash;
      sender.cash = 0;
      receiver.cash += remaining;
      this.declareBankruptcy(sender, receiver);
    }
  }

  deductCash(player, amount, creditor = null, reason = '') {
    if (player.cash >= amount) {
      player.cash -= amount;
    } else {
      this.declareBankruptcy(player, creditor);
    }
  }

  declareBankruptcy(bankruptPlayer, creditor = null) {
    bankruptPlayer.isBankrupt = true;
    bankruptPlayer.cash = 0;

    this.addLog(`💀 BANKRUPTCY! ${bankruptPlayer.name} is bankrupt and eliminated from the game.`);

    if (this.audio) {
      this.audio.playBankruptcy();
      this.audio.triggerDialogue('bankruptcy', bankruptPlayer.name);
    }

    // Liquidate / Transfer properties
    Object.values(this.state.properties).forEach(prop => {
      if (prop.ownerId === bankruptPlayer.id) {
        if (creditor) {
          prop.ownerId = creditor.id;
          this.addLog(`📦 ${this.config.boardSpaces[prop.spaceIndex].name} was surrendered to ${creditor.name}.`);
        } else {
          // Surrender to Bank: unmortgaged and houses reset
          prop.ownerId = null;
          prop.houses = 0;
          prop.hasHotel = false;
          prop.isMortgaged = false;
        }
      }
    });

    this.checkGameWinner();
    this.notifyUpdate();
  }

  // Calculate Net Worth of a player
  calculateNetWorth(player) {
    if (player.isBankrupt) return 0;
    let total = player.cash;

    Object.values(this.state.properties).forEach(prop => {
      if (prop.ownerId === player.id) {
        const space = this.config.boardSpaces[prop.spaceIndex];
        if (prop.isMortgaged) {
          total += (space.mortgage || Math.floor(space.price * 0.5));
        } else {
          total += space.price;
        }
        if (prop.hasHotel) {
          total += (space.houseCost || 1000) * 5;
        } else {
          total += (space.houseCost || 1000) * prop.houses;
        }
      }
    });

    return total;
  }

  // Check if only 1 surviving player remains
  checkGameWinner() {
    const active = this.getActivePlayers();
    if (active.length === 1) {
      const winner = active[0];
      this.state.winner = winner;
      this.state.phase = 'GAME_OVER';

      const finalNetWorth = this.calculateNetWorth(winner);
      this.addLog(`👑 ${winner.name} IS THE KERALA MONOPOLY CHAMPION! Net Worth: ₹${this.formatNumber(finalNetWorth)}.`);

      if (this.audio) {
        this.audio.playVictory();
        this.audio.triggerDialogue('victory', winner.name);
      }

      // Record victory in user's multi-game account stats if signed in
      this.recordVictoryStats(winner);

      this.clearSavedGame();
      this.notifyUpdate();
    }
  }

  recordVictoryStats(winner) {
    try {
      if (window.BingoAuthStorage && window.BingoAuthStorage.recordMatchResult) {
        const isHumanWinner = !winner.isBot;
        window.BingoAuthStorage.recordMatchResult({
          gameId: 'monopoly',
          opponent: this.state.players.filter(p => p.id !== winner.id).map(p => p.name).join(', '),
          mode: 'Kerala Edition Board',
          result: isHumanWinner ? 'WON' : 'LOST',
          details: {
            winnerName: winner.name,
            totalTurns: this.state.turnNumber,
            cash: winner.cash,
            netWorth: this.calculateNetWorth(winner)
          }
        });
      }
    } catch (e) {
      // Storage update safe fallback
    }
  }

  // =========================================================================
  // SMART AI BOT DECISION ENGINE
  // =========================================================================
  checkBotTurn() {
    if (this.state.phase === 'GAME_OVER') return;

    const player = this.getCurrentPlayer();
    if (!player || !player.isBot || player.isBankrupt) return;

    setTimeout(() => {
      this.executeBotAction();
    }, 900);
  }

  executeBotAction() {
    const player = this.getCurrentPlayer();
    if (!player || !player.isBot || player.isBankrupt) return;

    if (this.state.phase === 'READY_TO_ROLL') {
      if (player.inJail) {
        if (player.cash >= 3000) {
          this.payJailFine();
        } else if (player.getOutOfJailCards > 0) {
          this.useJailCard();
        } else {
          this.rollDice();
        }
      } else {
        this.rollDice();
      }
    } else if (this.state.phase === 'ACTION_REQUIRED') {
      const space = this.config.boardSpaces[player.position];
      const prop = this.state.properties[space.index];

      if (prop && !prop.ownerId) {
        // Buy if bot has enough reserve cash
        const reserve = 1200;
        if (player.cash >= space.price + reserve) {
          this.buyCurrentProperty();
        } else {
          this.declineToAuction();
        }
      }
    } else if (this.state.phase === 'END_TURN') {
      // Bot considers building houses if owns full sets
      this.botConsiderBuilding(player);
      this.endTurn();
    }
  }

  botConsiderBuilding(player) {
    if (player.cash < 2500) return;

    // Check all owned color groups
    const ownedGroups = Object.keys(this.config.colorGroups).filter(gKey => {
      if (gKey === 'transport' || gKey === 'utility') return false;
      return this.doesPlayerOwnFullGroup(player.id, gKey);
    });

    ownedGroups.forEach(gKey => {
      const groupSpaces = this.config.colorGroups[gKey].spaces;
      groupSpaces.forEach(spaceIdx => {
        if (player.cash >= 2000) {
          this.buildHouse(spaceIdx);
        }
      });
    });
  }

  checkBotAuction() {
    const auc = this.state.auction;
    if (!auc || this.state.phase !== 'AUCTION') return;

    const currentBidderId = auc.activeBidders[auc.bidderTurnIndex];
    const player = this.state.players.find(p => p.id === currentBidderId);

    if (!player || !player.isBot) return;

    setTimeout(() => {
      const space = this.config.boardSpaces[auc.spaceIndex];
      const maxBidAllowed = Math.floor(space.price * 0.85);

      if (player.cash > auc.currentBid + 100 && (auc.currentBid + 100) <= maxBidAllowed) {
        this.placeAuctionBid(player.id, auc.currentBid + 100);
      } else {
        this.passAuction(player.id);
      }
    }, 700);
  }

  // =========================================================================
  // PERSISTENCE (SAVE & RESUME)
  // =========================================================================
  autoSave() {
    if (this.state.phase === 'GAME_OVER') return;
    try {
      const snapshot = JSON.stringify({
        ...this.state,
        savedAt: Date.now()
      });
      localStorage.setItem('mallu_monopoly_save_v1', snapshot);
    } catch (e) {
      // Safe fallback
    }
  }

  hasSavedGame() {
    try {
      const saved = localStorage.getItem('mallu_monopoly_save_v1');
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return parsed && parsed.players && parsed.players.length >= 2 && !parsed.winner;
    } catch (e) {
      return false;
    }
  }

  loadSavedGame() {
    try {
      const saved = localStorage.getItem('mallu_monopoly_save_v1');
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      if (!parsed || !parsed.players) return false;

      this.state = parsed;
      this.addLog(`🔄 Saved match resumed from turn ${this.state.turnNumber}!`);
      this.notifyUpdate();
      this.checkBotTurn();
      return true;
    } catch (e) {
      return false;
    }
  }

  clearSavedGame() {
    try {
      localStorage.removeItem('mallu_monopoly_save_v1');
    } catch (e) {
      // Safe fallback
    }
  }

  // =========================================================================
  // UTILITIES & LOGGING
  // =========================================================================
  addLog(msg) {
    this.state.log.unshift(msg);
    if (this.state.log.length > 80) this.state.log.pop();
    this.notifyUpdate();
  }

  formatNumber(val) {
    return Number(val || 0).toLocaleString('en-IN');
  }

  notifyUpdate() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }
}

window.malluMonopolyEngine = new MalluMonopolyEngine();
