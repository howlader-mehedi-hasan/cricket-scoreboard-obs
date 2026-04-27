import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

class SyncManager {
  constructor() {
    this.peer = null;
    this.connections = [];
    this.role = null; // 'host' or 'client'
    this.hostId = null;
    this.state = {
      match: null,
      style: null
    };
    this.listeners = new Set();
    this.onReadyCallback = null;
  }

  // Initialize as Host
  async initHost(savedId = null) {
    this.role = 'host';
    const peerId = savedId || `crick-host-${uuidv4().slice(0, 8)}`;
    
    return new Promise((resolve) => {
      this.peer = new Peer(peerId);

      this.peer.on('open', (id) => {
        console.log('[Sync] Host ID:', id);
        this.hostId = id;
        this.loadLocalState();
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        console.log('[Sync] New connection:', conn.peer);
        this.setupConnection(conn);
      });
    });
  }

  // Initialize as Client
  async initClient(hostId) {
    this.role = 'client';
    this.hostId = hostId;

    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on('open', () => {
        const conn = this.peer.connect(hostId);
        this.setupConnection(conn);
        
        conn.on('open', () => {
          console.log('[Sync] Connected to host:', hostId);
          resolve();
        });

        conn.on('error', (err) => reject(err));
      });
    });
  }

  setupConnection(conn) {
    this.connections.push(conn);

    conn.on('data', (data) => {
      if (data.type === 'STATE_UPDATE') {
        this.state = data.payload;
        this.notify();
      } else if (data.type === 'COMMAND') {
        if (this.role === 'host') {
          this.handleCommand(data.payload);
        }
      }
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c !== conn);
      console.log('[Sync] Connection closed');
    });

    // If host, send initial state
    if (this.role === 'host') {
      setTimeout(() => {
        conn.send({ type: 'STATE_UPDATE', payload: this.state });
      }, 500);
    }
  }

  // Host only: Load from localStorage
  loadLocalState() {
    const savedMatch = localStorage.getItem('match_data');
    const savedStyle = localStorage.getItem('style_settings');
    
    this.state.match = savedMatch ? JSON.parse(savedMatch) : this.getDefaultMatch();
    this.state.style = savedStyle ? JSON.parse(savedStyle) : this.getDefaultStyle();
    this.notify();
  }

  // Host only: Save to localStorage and broadcast
  saveAndBroadcast() {
    localStorage.setItem('match_data', JSON.stringify(this.state.match));
    localStorage.setItem('style_settings', JSON.stringify(this.state.style));
    
    this.connections.forEach(conn => {
      conn.send({ type: 'STATE_UPDATE', payload: this.state });
    });
    this.notify();
  }

  // Host only: Handle commands from clients
  handleCommand({ action, data }) {
    if (action === 'match:update') {
      this.state.match[data.field] = data.value;
    } else if (action === 'match:updateBulk') {
      data.updates.forEach(({ field, value }) => {
        this.state.match[field] = value;
      });
    } else if (action === 'match:addBall') {
      let recent = JSON.parse(this.state.match.recent_balls || '[]');
      recent.push(data.ball);
      if (recent.length > 36) recent = recent.slice(-36);
      this.state.match.recent_balls = JSON.stringify(recent);
    } else if (action === 'match:recordBall') {
      if (data.updates) {
        data.updates.forEach(({ field, value }) => {
          this.state.match[field] = value;
        });
      }
      if (data.ball) {
        let recent = JSON.parse(this.state.match.recent_balls || '[]');
        recent.push(data.ball);
        if (recent.length > 36) recent = recent.slice(-36);
        this.state.match.recent_balls = JSON.stringify(recent);
      }
    } else if (action === 'match:undo') {
      // TODO: Implement history in localStorage
    } else if (action === 'style:update') {
      this.state.style[data.field] = data.value;
    }

    this.saveAndBroadcast();
  }

  // Emit an action (works for both Host and Client)
  emit(action, data) {
    if (this.role === 'host') {
      this.handleCommand({ action, data });
    } else {
      const conn = this.connections[0];
      if (conn && conn.open) {
        conn.send({ type: 'COMMAND', payload: { action, data } });
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  getDefaultMatch() {
    return {
      team1_name: 'Team A', team2_name: 'Team B',
      runs: '0', wickets: '0', overs: '0', balls: '0',
      innings: '1', striker_name: 'Batsman 1', striker_runs: '0', striker_balls: '0',
      non_striker_name: 'Batsman 2', non_striker_runs: '0', non_striker_balls: '0',
      bowler_name: 'Bowler 1', bowler_overs: '0', bowler_runs: '0', bowler_wickets: '0',
      recent_balls: '[]', batting_team: 'team1', match_status: 'Match Start'
    };
  }

  getDefaultStyle() {
    return {
      active_profile: 'default style',
      layout_type: 'default',
      bar_width: '90',
      bar_height: '10',
      bar_x: '5',
      bar_y: '85',
      theme_color: '#1e293b'
    };
  }
}

// Singleton instance
const syncManager = typeof window !== 'undefined' ? new SyncManager() : null;
export default syncManager;
