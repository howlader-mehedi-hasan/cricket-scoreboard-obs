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

// In-Memory state for active match
let matchData = {};
let matchHistory = [];
let styleSettings = {
  primary_color: '#10b981',
  secondary_color: '#3b82f6',
  bg_opacity: '0.75',
  theme: 'dark'
};

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

  // ──── REST API for JSON DB ────
  app.get('/api/teams', (req, res) => {
    res.json(jsonDb.getTeams());
  });

  app.post('/api/teams', (req, res) => {
    const team = jsonDb.createTeam(req.body);
    res.json(team);
  });

  app.post('/api/teams/:id/players', (req, res) => {
    const player = jsonDb.addPlayerToTeam(req.params.id, req.body);
    if (player) res.json(player);
    else res.status(404).json({ error: 'Team not found' });
  });

  app.delete('/api/teams/:id/players/:playerId', (req, res) => {
    const success = jsonDb.deletePlayer(req.params.id, req.params.playerId);
    if (success) res.json({ success: true });
    else res.status(404).json({ error: 'Not found' });
  });

  app.get('/api/matches', (req, res) => {
    res.json(jsonDb.getMatches());
  });

  app.post('/api/matches/end', (req, res) => {
    // Save current active match to DB
    const saved = jsonDb.saveMatch(matchData);
    res.json(saved);
  });

  // API: File Upload
  app.post('/api/upload', (req, res) => {
    console.log('[Server] Received upload request:', req.body?.name);
    try {
      const { image, name } = req.body;
      if (!image || !name) {
        console.error('[Server] Missing image or name');
        return res.status(400).json({ error: 'Missing data' });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const extension = name.split('.').pop();
      const fileName = `bg_${Date.now()}.${extension}`;
      const filePath = path.join(__dirname, 'public', 'uploads', fileName);

      fs.writeFileSync(filePath, base64Data, 'base64');
      console.log('[Server] File saved to:', filePath);
      res.json({ url: `/uploads/${fileName}` });
    } catch (err) {
      console.error('[Server] Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
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

        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:recordBall error:', err.message);
      }
    });

    socket.on('match:end', (data) => {
      try {
        console.log('[Socket] Match ended. Saving to database...');
        matchData.match_status = 'Match Ended';
        matchData.performances = data.performances;
        
        // Save to JSON Database
        jsonDb.saveMatch(matchData);
        
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:end error:', err.message);
      }
    });

    socket.on('match:undo', () => {
      try {
        const stateStr = matchHistory.pop();
        if (stateStr) {
          matchData = JSON.parse(stateStr);
          io.emit('match:state', matchData);
        }
      } catch (err) {
        console.error('[Socket] match:undo error:', err.message);
      }
    });

    socket.on('match:reset', () => {
      try {
        pushHistory();
        matchData = {}; // Clear
        io.emit('match:state', matchData);
      } catch (err) {
        console.error('[Socket] match:reset error:', err.message);
      }
    });

    socket.on('match:end', (summary) => {
      // Save to JSON DB
      const matchRecord = {
        teams: matchData.batting_team === 'team1' ? [matchData.team1_name, matchData.team2_name] : [matchData.team2_name, matchData.team1_name],
        result: summary.result || 'Match Ended',
        ballLog: JSON.parse(matchData.ball_log || '[]'),
        playerPerformances: summary.performances
      };
      jsonDb.saveMatch(matchRecord);
      io.emit('match:ended', matchRecord);
    });

    // ── Style Events ──
    socket.on('style:update', (data) => {
      try {
        const { field, value } = data;
        styleSettings[field] = value;
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
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          lanIP = net.address;
          break;
        }
      }
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║     🏏 Cricket Scoreboard for OBS                ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Local:    http://localhost:${port}                ║`);
    console.log(`║  Network:  http://${lanIP}:${port}           ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Overlay:  http://localhost:${port}/overlay       ║`);
    console.log(`║  Admin:    http://localhost:${port}/admin         ║`);
    console.log('╚══════════════════════════════════════════════════╝\n');
  });
});
