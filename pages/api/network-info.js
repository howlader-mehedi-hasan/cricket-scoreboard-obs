import os from 'os';

export default function handler(req, res) {
  // Lazy-require database to avoid client-side bundling issues
  const db = require('../../lib/database');

  if (req.method === 'GET') {
    // Get LAN IP
    const nets = os.networkInterfaces();
    let ip = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ip = net.address;
          break;
        }
      }
    }
    const tokens = db.listTokens();
    return res.json({ ip, tokens });
  }

  if (req.method === 'POST') {
    const { action, role, token } = req.body;
    if (action === 'create' && role) {
      db.createToken(role);
    } else if (action === 'revoke' && token) {
      db.revokeToken(token);
    } else if (action === 'delete' && token) {
      db.deleteToken(token);
    }
    const tokens = db.listTokens();
    return res.json({ tokens });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
