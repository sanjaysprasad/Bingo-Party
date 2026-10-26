/**
 * Multi-Transport Multiplayer Networking for Classic BINGO
 * Bridges MQTT over WebSockets (for internet cross-device play)
 * and BroadcastChannel (for instant local multi-tab testing).
 */
class BingoMultiplayer {
  constructor() {
    this.roomCode = null;
    this.playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.playerName = 'Player';
    this.isHost = false;
    this.handlers = new Map();
    this.broadcastChannel = null;
    this.mqttClient = null;
    this.isConnected = false;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.processedMsgIds = new Set();
  }

  on(type, callback) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(callback);
  }

  emit(type, data) {
    const list = this.handlers.get(type);
    if (list) {
      list.forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Error in event ${type}:`, e); }
      });
    }
  }

  setStatus(status, message = '') {
    this.status = status;
    this.emit('status_change', { status, message });
  }

  // Connect & Join Room
  async joinRoom(roomCode, playerName, isHost = false) {
    this.roomCode = (roomCode || '').toUpperCase().trim();
    this.playerName = playerName || 'Player';
    this.isHost = isHost;
    this.processedMsgIds.clear();

    this.setStatus('connecting', `Connecting to Room ${this.roomCode}...`);

    // 1. Setup BroadcastChannel (for same-browser tabs)
    try {
      if (this.broadcastChannel) this.broadcastChannel.close();
      this.broadcastChannel = new BroadcastChannel(`bingo_paper_${this.roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data;
        if (!msg || msg.senderId === this.playerId) return; // ignore self
        if (msg.msgId && this.processedMsgIds.has(msg.msgId)) return; // ignore duplicate
        if (msg.msgId) {
          this.processedMsgIds.add(msg.msgId);
          if (this.processedMsgIds.size > 200) {
            const first = this.processedMsgIds.values().next().value;
            this.processedMsgIds.delete(first);
          }
        }
        this.emit(msg.type, msg.payload);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Setup MQTT over WebSockets (for internet multiplayer on GitHub Pages)
    this.initMqtt();

    // Broadcast self join after a short delay
    setTimeout(() => {
      this.send('PLAYER_JOINED', {
        id: this.playerId,
        name: this.playerName,
        isHost: this.isHost
      });
    }, 400);

    return { roomCode: this.roomCode, playerId: this.playerId };
  }

  initMqtt() {
    if (typeof window.mqtt === 'undefined') {
      console.warn('MQTT.js library not loaded; operating in local channel mode.');
      this.setStatus('connected', 'Connected via Local Channel');
      return;
    }

    try {
      const topic = `ssp_bingo_party_v2/${this.roomCode}`;
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

      this.mqttClient = window.mqtt.connect(brokerUrl, {
        clientId: `bingo_${this.playerId}_${Date.now()}`,
        clean: true,
        connectTimeout: 6000,
        keepalive: 30
      });

      this.mqttClient.on('connect', () => {
        this.isConnected = true;
        this.setStatus('connected', 'Connected online to game room!');
        this.mqttClient.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) {
            this.send('PLAYER_JOINED', {
              id: this.playerId,
              name: this.playerName,
              isHost: this.isHost
            });
          }
        });
      });

      this.mqttClient.on('message', (t, message) => {
        try {
          const msg = JSON.parse(message.toString());
          if (!msg || msg.senderId === this.playerId) return; // ignore self
          if (msg.msgId && this.processedMsgIds.has(msg.msgId)) return; // ignore duplicate
          if (msg.msgId) {
            this.processedMsgIds.add(msg.msgId);
            if (this.processedMsgIds.size > 200) {
              const first = this.processedMsgIds.values().next().value;
              this.processedMsgIds.delete(first);
            }
          }
          this.emit(msg.type, msg.payload);
        } catch (e) {
          console.error('Failed to parse MQTT message:', e);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn('MQTT connection warning:', err);
      });

      this.mqttClient.on('close', () => {
        this.isConnected = false;
      });

    } catch (err) {
      console.warn('MQTT initialization fallback:', err);
      this.setStatus('connected', 'Local multi-tab channel active');
    }
  }

  // Send a message to all players in the room
  send(type, payload = {}) {
    const msgId = `${this.playerId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.processedMsgIds.add(msgId);
    if (this.processedMsgIds.size > 200) {
      const first = this.processedMsgIds.values().next().value;
      this.processedMsgIds.delete(first);
    }

    const packet = {
      msgId: msgId,
      type: type,
      payload: payload,
      senderId: this.playerId,
      senderName: this.playerName,
      timestamp: Date.now()
    };

    // 1. Post to local BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch (e) {}
    }

    // 2. Publish to MQTT topic
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        const topic = `ssp_bingo_party_v2/${this.roomCode}`;
        this.mqttClient.publish(topic, JSON.stringify(packet), { qos: 0 });
      } catch (e) {
        console.warn('Failed to publish MQTT message:', e);
      }
    }
  }

  disconnect() {
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
    }
    if (this.mqttClient) {
      try { this.mqttClient.end(); } catch (e) {}
      this.mqttClient = null;
    }
    this.setStatus('disconnected', 'Disconnected');
  }
}

window.BingoMultiplayer = new BingoMultiplayer();
