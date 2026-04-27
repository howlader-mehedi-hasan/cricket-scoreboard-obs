const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const os = require('os');
const db = require('./lib/database');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Make io accessible in API routes
  app.set('io', io);

  // ──── Socket.io Event Handlers ────
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current state on connect
    socket.emit('match:state', db.getMatchData());
    socket.emit('style:state', db.getStyleSettings());

    // ── Match Events ──
    socket.on('match:update', (data) => {
      try {
        db.pushHistory();
        const { field, value } = data;
        db.updateMatchData(field, value);
        const updated = db.getMatchData();
        io.emit('match:state', updated);
      } catch (err) {
        console.error('[Socket] match:update error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('match:updateBulk', (data) => {
      try {
        db.pushHistory();
        const { updates } = data; // Array of { field, value }
        updates.forEach(({ field, value }) => {
          db.updateMatchData(field, value);
        });
        const updated = db.getMatchData();
        io.emit('match:state', updated);
      } catch (err) {
        console.error('[Socket] match:updateBulk error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('match:addBall', (data) => {
      try {
        db.pushHistory();
        const { ball } = data; // e.g., '1', '4', '6', '0', 'W', 'Wd', 'Nb'
        const current = db.getMatchData();
        let recentBalls = [];
        try { recentBalls = JSON.parse(current.recent_balls || '[]'); } catch {}
        recentBalls.push(ball);
        if (recentBalls.length > 36) recentBalls = recentBalls.slice(-36);
        db.updateMatchData('recent_balls', JSON.stringify(recentBalls));
        const updated = db.getMatchData();
        io.emit('match:state', updated);
      } catch (err) {
        console.error('[Socket] match:addBall error:', err.message);
      }
    });

    socket.on('match:recordBall', (data) => {
      try {
        db.pushHistory();
        const { updates, ball } = data;
        
        // Update stats
        if (updates) {
          updates.forEach(({ field, value }) => {
            db.updateMatchData(field, value);
          });
        }
        
        // Update timeline
        if (ball) {
          const current = db.getMatchData();
          let recentBalls = [];
          try { recentBalls = JSON.parse(current.recent_balls || '[]'); } catch {}
          recentBalls.push(ball);
          if (recentBalls.length > 36) recentBalls = recentBalls.slice(-36);
          db.updateMatchData('recent_balls', JSON.stringify(recentBalls));
        }

        const updated = db.getMatchData();
        io.emit('match:state', updated);
      } catch (err) {
        console.error('[Socket] match:recordBall error:', err.message);
      }
    });

    socket.on('match:undo', () => {
      try {
        const state = db.popHistory();
        if (state) {
          io.emit('match:state', db.getMatchData());
        }
      } catch (err) {
        console.error('[Socket] match:undo error:', err.message);
      }
    });

    socket.on('match:reset', () => {
      try {
        db.pushHistory();
        db.resetMatchData();
        const updated = db.getMatchData();
        io.emit('match:state', updated);
      } catch (err) {
        console.error('[Socket] match:reset error:', err.message);
      }
    });

    // ── Style Events ──
    socket.on('style:update', (data) => {
      try {
        const { field, value } = data;
        db.updateStyleSettings(field, value);
        const updated = db.getStyleSettings();
        io.emit('style:state', updated);
      } catch (err) {
        console.error('[Socket] style:update error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('profile:switch', (data) => {
      try {
        const { name } = data;
        db.updateStyleSettings('active_profile', name);
        const updated = db.getStyleSettings();
        io.emit('style:state', updated);
      } catch (err) {
        console.error('[Socket] profile:switch error:', err.message);
      }
    });

    socket.on('profile:create', (data) => {
      try {
        const { name, layout_type, settings } = data;
        db.createProfile(name, layout_type, settings);
        db.updateStyleSettings('active_profile', name);
        const updated = db.getStyleSettings();
        io.emit('style:state', updated);
      } catch (err) {
        console.error('[Socket] profile:create error:', err.message);
      }
    });

    socket.on('profile:delete', (data) => {
      try {
        const { name } = data;
        db.deleteProfile(name);
        db.updateStyleSettings('active_profile', 'default style');
        const updated = db.getStyleSettings();
        io.emit('style:state', updated);
      } catch (err) {
        console.error('[Socket] profile:delete error:', err.message);
      }
    });

    // ── Token Events ──
    socket.on('token:validate', (data, callback) => {
      try {
        const result = db.validateToken(data.token);
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback(null);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Let Next.js handle all other routes
  app.all('/{*path}', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, hostname, () => {
    // Find the LAN IP
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
