/**
 * Peer-to-Peer Realtime Multiplayer Networking
 * Uses PeerJS (WebRTC) for zero-backend internet play,
 * plus BroadcastChannel for instant local multi-tab play and testing.
 */
class BingoNetwork {
  constructor() {
    this.isHost = false;
    this.roomId = null;
    this.peer = null;
    this.connections = new Map(); // For host: Map<peerId, DataConnection>
    this.hostConnection = null;   // For client: DataConnection to host
    this.broadcastChannel = null;
    this.handlers = new Map();    // Event handlers
    this.heartbeatTimer = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
    this.myPeerId = null;
    this.localPlayerInfo = null;
  }

  // Register event callbacks
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  emit(event, data) {
    const list = this.handlers.get(event);
    if (list) {
      list.forEach(fn => {
        try { fn(data); } catch (e) { console.error(`Error in event "${event}":`, e); }
      });
    }
  }

  setStatus(status, message = '') {
    this.status = status;
    this.emit('status_change', { status, message });
  }

  // Helper to format Room Code to Peer ID
  static sanitizeRoomCode(code) {
    return (code || '').toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
  }

  static getHostPeerId(roomCode) {
    return `bingo-party-${BingoNetwork.sanitizeRoomCode(roomCode).toLowerCase()}`;
  }

  // Initialize BroadcastChannel fallback for multi-tab testing
  initBroadcastChannel(roomId) {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    try {
      this.broadcastChannel = new BroadcastChannel(`bingo_room_${roomId}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data;
        if (!msg || msg._senderId === this.myPeerId) return; // ignore self
        this.handleIncomingData(msg, 'local-channel');
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }

  // HOST: Create a new Game Room
  async createRoom(roomCode, hostPlayerInfo) {
    this.isHost = true;
    this.roomId = BingoNetwork.sanitizeRoomCode(roomCode);
    this.localPlayerInfo = hostPlayerInfo;
    const targetPeerId = BingoNetwork.getHostPeerId(this.roomId);
    this.myPeerId = targetPeerId;

    this.setStatus('connecting', 'Creating multiplayer room...');
    this.initBroadcastChannel(this.roomId);

    return new Promise((resolve, reject) => {
      // Check if PeerJS library is available in window
      if (typeof window.Peer === 'undefined') {
        console.warn('PeerJS library not loaded. Falling back to local multi-tab channel mode.');
        this.setStatus('connected', 'Offline / Local Multi-Tab Mode (PeerJS unavailable)');
        resolve({ roomId: this.roomId, peerId: targetPeerId, offline: true });
        return;
      }

      try {
        // Standard PeerJS cloud connection
        this.peer = new window.Peer(targetPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          this.setStatus('connected', 'Room is live! Ready for players.');
          this.startHeartbeat();
          resolve({ roomId: this.roomId, peerId: id });
        });

        this.peer.on('connection', (conn) => {
          this.setupHostConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Host Error:', err);
          if (err.type === 'unavailable-id') {
            this.setStatus('error', `Room code "${this.roomId}" is already in use. Try a different code!`);
          } else {
            this.setStatus('error', `Connection error: ${err.type || err.message}`);
          }
          reject(err);
        });

        this.peer.on('disconnected', () => {
          this.setStatus('connecting', 'Reconnecting to signaling server...');
          try { this.peer.reconnect(); } catch (e) {}
        });

      } catch (err) {
        console.error('Failed to initialize Host Peer:', err);
        // Fallback to local
        this.setStatus('connected', 'Local Room Created (WebRTC skipped)');
        resolve({ roomId: this.roomId, peerId: targetPeerId, offline: true });
      }
    });
  }

  // CLIENT: Join an existing Game Room
  async joinRoom(roomCode, playerInfo) {
    this.isHost = false;
    this.roomId = BingoNetwork.sanitizeRoomCode(roomCode);
    this.localPlayerInfo = playerInfo;
    const hostPeerId = BingoNetwork.getHostPeerId(this.roomId);
    this.myPeerId = `player-${Math.random().toString(36).substring(2, 9)}`;

    this.setStatus('connecting', `Connecting to Room "${this.roomId}"...`);
    this.initBroadcastChannel(this.roomId);

    return new Promise((resolve, reject) => {
      // Local fallback test
      if (typeof window.Peer === 'undefined') {
        console.warn('PeerJS library not loaded. Using local broadcast channel.');
        this.setStatus('connected', 'Connected via Local Multi-Tab Channel');
        this.sendToHost({ type: 'JOIN', player: playerInfo });
        resolve({ roomId: this.roomId, peerId: this.myPeerId, offline: true });
        return;
      }

      let timeoutId = setTimeout(() => {
        if (this.status === 'connecting') {
          // If PeerJS takes > 8 seconds, warn user
          this.emit('connection_warning', 'Host is taking a while to respond. Ensure room code is correct and host is in the game.');
        }
      }, 7000);

      try {
        this.peer = new window.Peer(this.myPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', () => {
          this.connectToHostPeer(hostPeerId, playerInfo, resolve, reject, timeoutId);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Client Peer Error:', err);
          this.setStatus('error', `Connection error: ${err.type || err.message}`);
          clearTimeout(timeoutId);
          reject(err);
        });

      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Peer initialization failed:', err);
        // Fallback to local broadcast
        this.setStatus('connected', 'Local mode active');
        this.sendToHost({ type: 'JOIN', player: playerInfo });
        resolve({ roomId: this.roomId, peerId: this.myPeerId, offline: true });
      }
    });
  }

  // Connect client to host's peer
  connectToHostPeer(hostPeerId, playerInfo, resolve, reject, timeoutId) {
    const conn = this.peer.connect(hostPeerId, {
      reliable: true,
      metadata: { player: playerInfo }
    });

    this.hostConnection = conn;

    conn.on('open', () => {
      clearTimeout(timeoutId);
      this.setStatus('connected', 'Connected to Game Host!');
      // Send JOIN handshake
      conn.send({
        type: 'JOIN',
        player: { ...playerInfo, peerId: this.myPeerId }
      });
      this.startHeartbeat();
      resolve({ roomId: this.roomId, peerId: this.myPeerId });
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data, conn.peer);
    });

    conn.on('close', () => {
      this.setStatus('disconnected', 'Host disconnected or ended the game.');
      this.emit('host_disconnected');
    });

    conn.on('error', (err) => {
      console.error('Connection to host error:', err);
      clearTimeout(timeoutId);
      this.setStatus('error', 'Could not reach host. Verify room code.');
      reject(err);
    });
  }

  // Host handling incoming client connections
  setupHostConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.emit('peer_connected', { peerId: conn.peer });
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.emit('peer_disconnected', { peerId: conn.peer });
    });

    conn.on('error', (err) => {
      console.warn('Host connection error from client:', conn.peer, err);
      this.connections.delete(conn.peer);
      this.emit('peer_disconnected', { peerId: conn.peer });
    });
  }

  // Universal message dispatcher
  handleIncomingData(data, senderPeerId) {
    if (!data || !data.type) return;

    // Heartbeat ping-pong
    if (data.type === 'PING') {
      if (this.isHost) {
        this.sendToPeer(senderPeerId, { type: 'PONG', timestamp: data.timestamp });
      }
      return;
    }
    if (data.type === 'PONG') {
      return;
    }

    // Attach sender ID if missing
    data._senderId = senderPeerId || data._senderId || 'unknown';

    // Route event by message type
    this.emit(data.type, data);
  }

  // Host broadcasts message to all connected clients & local channel
  broadcast(msg) {
    const payload = { ...msg, _senderId: this.myPeerId, _time: Date.now() };

    // Send to WebRTC peers
    this.connections.forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send(payload); } catch (e) { console.warn('Broadcast send error:', e); }
      }
    });

    // Send to BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(payload); } catch (e) {}
    }

    // Also notify self if self is listening to own broadcasts (e.g. Chat or Reactions)
    if (msg.type === 'CHAT' || msg.type === 'REACTION') {
      this.emit(msg.type, payload);
    }
  }

  // Send message to a specific peer (Host -> Single Client)
  sendToPeer(peerId, msg) {
    const payload = { ...msg, _senderId: this.myPeerId, _time: Date.now() };
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      try { conn.send(payload); } catch (e) { console.warn('Send to peer error:', e); }
    } else if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ ...payload, _targetPeerId: peerId });
    }
  }

  // Client sends message to Host
  sendToHost(msg) {
    const payload = { ...msg, _senderId: this.myPeerId, _time: Date.now() };
    if (this.hostConnection && this.hostConnection.open) {
      try { this.hostConnection.send(payload); } catch (e) { console.warn('Send to host error:', e); }
    } else if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }
  }

  // Heartbeat keep-alive every 5 seconds
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isHost) {
        // Send small ping to all clients
        this.connections.forEach(conn => {
          if (conn && conn.open) {
            try { conn.send({ type: 'PING', timestamp: Date.now() }); } catch (e) {}
          }
        });
      } else if (this.hostConnection && this.hostConnection.open) {
        try { this.hostConnection.send({ type: 'PING', timestamp: Date.now() }); } catch (e) {}
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Disconnect & cleanup
  disconnect() {
    this.stopHeartbeat();
    if (this.hostConnection) {
      try { this.hostConnection.close(); } catch (e) {}
      this.hostConnection = null;
    }
    this.connections.forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    this.connections.clear();

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }

    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
    }

    this.setStatus('disconnected', 'Disconnected');
  }
}

window.BingoNetwork = new BingoNetwork();
