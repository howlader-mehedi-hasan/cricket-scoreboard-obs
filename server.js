const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const os = require('os');
const fs = require('fs');
const path = require('path');
const jsonDb = require('./lib/jsonDb');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

// Initialize JSON DB
jsonDb.initDb();

// Initialize active match state from persistent storage
let matchData = jsonDb.getLiveMatch();
let matchHistory = [];
let styleSettings = jsonDb.getStyleSettings();

function pushHistory() {
  matchHistory.push(JSON.stringify(matchData));
  if (matchHistory.length > 50) matchHistory.shift();
}

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  app.set('io', io);

  // REST API routes for Teams and Uploads have been moved to Next.js API routes 
  // in pages/api to support hot-reloading and avoid server restart issues.
  
  app.get('/api/matches', (req, res) => {
    res.json(jsonDb.getMatches());
  });

  app.post('/api/matches/end', (req, res) => {
    // Save current active match to DB
    const saved = jsonDb.saveMatch(matchData);
    res.json(saved);
  });

  // ──── Socket.io Event Handlers ────
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current state on connect
    socket.emit('match:state', matchData);
    socket.emit('style:state', styleSettings);

    // ── Match Events ──
    socket.on('match:update', (data) => {
      try {
        pushHistory();
        const { field, value } = data;
        matchData[field] = value;
        jsonDb.updateLiveMatch(matchData);
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:update error:', err.message);
      }
    });

    socket.on('match:updateBulk', (data) => {
      try {
        pushHistory();
        const { updates } = data; // Array of { field, value }
        updates.forEach(({ field, value }) => {
          matchData[field] = value;
        });
        jsonDb.updateLiveMatch(matchData);
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:updateBulk error:', err.message);
      }
    });

    socket.on('match:addBall', (data) => {
      try {
        pushHistory();
        const { ball } = data;
        let recentBalls = [];
        let fullLog = [];
        try { recentBalls = JSON.parse(matchData.recent_balls || '[]'); } catch {}
        try { fullLog = JSON.parse(matchData.ball_log || '[]'); } catch {}
        
        recentBalls.push(ball);
        fullLog.push(ball);
        
        if (recentBalls.length > 36) recentBalls = recentBalls.slice(-36);
        matchData.recent_balls = JSON.stringify(recentBalls);
        matchData.ball_log = JSON.stringify(fullLog);
        jsonDb.updateLiveMatch(matchData);
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:addBall error:', err.message);
      }
    });

    socket.on('match:recordBall', (data) => {
      try {
        pushHistory();
        const { updates, ball } = data;
        
        if (updates) {
          updates.forEach(({ field, value }) => {
            matchData[field] = value;
          });
        }
        
        if (ball) {
          let recentBalls = [];
          let fullLog = [];
          try { recentBalls = JSON.parse(matchData.recent_balls || '[]'); } catch {}
          try { fullLog = JSON.parse(matchData.ball_log || '[]'); } catch {}
          
          recentBalls.push(ball);
          fullLog.push(ball);
          
          if (recentBalls.length > 36) recentBalls = recentBalls.slice(-36);
          matchData.recent_balls = JSON.stringify(recentBalls);
          matchData.ball_log = JSON.stringify(fullLog);
        }

        jsonDb.updateLiveMatch(matchData);
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:recordBall error:', err.message);
      }
    });

    socket.on('match:end', (data) => {
      try {
        console.log('[Socket] Match ended. Saving to database...');
        matchData.match_status = data.result || 'Match Ended';
        matchData.is_match_ended = 'true';
        matchData.match_ended_at = Date.now().toString();
        matchData.performances = data.performances;
        
        // Save to History Database
        const matchRecord = {
          teams: matchData.batting_team === 'team1' ? [matchData.team1_name, matchData.team2_name] : [matchData.team2_name, matchData.team1_name],
          result: data.result || 'Match Ended',
          ballLog: JSON.parse(matchData.ball_log || '[]'),
          playerPerformances: data.performances
        };
        jsonDb.saveMatch(matchRecord);
        
        // Persist final live state
        jsonDb.updateLiveMatch(matchData);
        
        io.emit('match:state', matchData);
        io.emit('match:ended', matchRecord);
      } catch (err) {
        console.error('[Socket] match:end error:', err.message);
      }
    });

    socket.on('match:undo', () => {
      try {
        const stateStr = matchHistory.pop();
        if (stateStr) {
          matchData = JSON.parse(stateStr);
          jsonDb.updateLiveMatch(matchData);
          io.emit('match:state', matchData);
        }
      } catch (err) {
        console.error('[Socket] match:undo error:', err.message);
      }
    });

    socket.on('match:reset', () => {
      try {
        pushHistory();
        matchData = {
          team1_name: 'Team A', team2_name: 'Team B',
          runs: '0', wickets: '0', overs: '0', balls: '0',
          innings: '1', striker_name: 'Batsman 1', striker_runs: '0', striker_balls: '0',
          non_striker_name: 'Batsman 2', non_striker_runs: '0', non_striker_balls: '0',
          bowler_name: 'Bowler 1', bowler_overs: '0', bowler_runs: '0', bowler_wickets: '0',
          recent_balls: '[]', ball_log: '[]', batting_team: 'team1', match_status: 'Yet to begin'
        };
        jsonDb.updateLiveMatch(matchData);
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:reset error:', err.message);
      }
    });

    // ── Style Events ──
    socket.on('style:update', (data) => {
      try {
        const { field, value } = data;
        styleSettings[field] = value;
        jsonDb.updateStyleSettings(styleSettings);
        io.emit('style:state', styleSettings);
      } catch (err) {
        console.error('[Socket] style:update error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Let Next.js handle all other routes
  app.all(/.*/, (req, res) => {
    return handle(req, res);
  });

  server.listen(port, hostname, () => {
    const nets = os.networkInterfaces();
    let lanIP = 'localhost';
    
    // Find the best LAN IP
    const addresses = [];
    Object.keys(nets).forEach((name) => {
      nets[name].forEach((net) => {
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      });
    });

    // Prefer 192.168.x.x or 10.x.x.x over others
    const bestIP = addresses.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.')) || addresses[0] || 'localhost';
    lanIP = bestIP;

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║     🏏 Cricket Scoreboard for OBS                ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Local:    http://localhost:${port}                ║`);
    console.log(`║  Network:  http://${lanIP}:${port}           ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Overlay:  http://${lanIP}:${port}/overlay       ║`);
    console.log(`║  Admin:    http://${lanIP}:${port}/admin         ║`);
    console.log('╚══════════════════════════════════════════════════╝\n');
  });
});
