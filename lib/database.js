const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(process.cwd(), 'database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  const conn = db;

  // Match data table (single-row pattern using key-value)
  conn.exec(`
    CREATE TABLE IF NOT EXISTS match_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // Style settings table (single-row key-value)
  conn.exec(`
    CREATE TABLE IF NOT EXISTS style_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // Access tokens table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS access_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_string TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('scorer', 'manager')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Initialize match data defaults
  const matchDefaults = {
    team1_name: 'Team A',
    team2_name: 'Team B',
    runs: '0',
    wickets: '0',
    overs: '0',
    balls: '0',
    target: '0',
    striker_name: 'Batsman 1',
    striker_runs: '0',
    striker_balls: '0',
    non_striker_name: 'Batsman 2',
    non_striker_runs: '0',
    non_striker_balls: '0',
    bowler_name: 'Bowler 1',
    bowler_overs: '0',
    bowler_runs: '0',
    bowler_wickets: '0',
    bowler_maidens: '0',
    recent_balls: '[]',
    match_status: 'Yet to begin',
    innings: '1',
    batting_team: 'team1',
  };

  const insertStmt = conn.prepare(
    'INSERT OR IGNORE INTO match_data (key, value) VALUES (?, ?)'
  );
  for (const [key, value] of Object.entries(matchDefaults)) {
    insertStmt.run(key, value);
  }

  // Initialize style settings defaults
  const styleDefaults = {
    x_offset: '50',
    y_offset: '85',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
    bg_opacity: '0.75',
    show_timeline: '1',
  };

  for (const [key, value] of Object.entries(styleDefaults)) {
    insertStmt.run(key, value); // Reuse since same SQL pattern
  }
  // Actually style_settings uses same pattern, let me use a separate stmt
  const styleStmt = conn.prepare(
    'INSERT OR IGNORE INTO style_settings (key, value) VALUES (?, ?)'
  );
  for (const [key, value] of Object.entries(styleDefaults)) {
    styleStmt.run(key, value);
  }
}

// ──── Match Data CRUD ────

function getMatchData() {
  const conn = getDb();
  const rows = conn.prepare('SELECT key, value FROM match_data').all();
  const result = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

function updateMatchData(key, value) {
  const conn = getDb();
  conn.prepare(
    'INSERT INTO match_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, String(value));
}

function resetMatchData() {
  const conn = getDb();
  const defaults = {
    runs: '0',
    wickets: '0',
    overs: '0',
    balls: '0',
    target: '0',
    striker_name: 'Batsman 1',
    striker_runs: '0',
    striker_balls: '0',
    non_striker_name: 'Batsman 2',
    non_striker_runs: '0',
    non_striker_balls: '0',
    bowler_name: 'Bowler 1',
    bowler_overs: '0',
    bowler_runs: '0',
    bowler_wickets: '0',
    bowler_maidens: '0',
    recent_balls: '[]',
    match_status: 'Yet to begin',
    innings: '1',
  };
  const stmt = conn.prepare(
    'INSERT INTO match_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const transaction = conn.transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      stmt.run(key, value);
    }
  });
  transaction();
}

// ──── Style Settings CRUD ────

function getStyleSettings() {
  const conn = getDb();
  const rows = conn.prepare('SELECT key, value FROM style_settings').all();
  const result = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

function updateStyleSettings(key, value) {
  const conn = getDb();
  conn.prepare(
    'INSERT INTO style_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, String(value));
}

// ──── Access Tokens CRUD ────

function createToken(role) {
  const conn = getDb();
  const token = uuidv4().replace(/-/g, '').slice(0, 16);
  conn.prepare(
    'INSERT INTO access_tokens (token_string, role) VALUES (?, ?)'
  ).run(token, role);
  return { token, role };
}

function validateToken(token) {
  const conn = getDb();
  const row = conn.prepare(
    'SELECT * FROM access_tokens WHERE token_string = ? AND active = 1'
  ).get(token);
  return row || null;
}

function listTokens() {
  const conn = getDb();
  return conn.prepare('SELECT * FROM access_tokens ORDER BY created_at DESC').all();
}

function revokeToken(token) {
  const conn = getDb();
  conn.prepare('UPDATE access_tokens SET active = 0 WHERE token_string = ?').run(token);
}

function deleteToken(token) {
  const conn = getDb();
  conn.prepare('DELETE FROM access_tokens WHERE token_string = ?').run(token);
}

module.exports = {
  getDb,
  getMatchData,
  updateMatchData,
  resetMatchData,
  getStyleSettings,
  updateStyleSettings,
  createToken,
  validateToken,
  listTokens,
  revokeToken,
  deleteToken,
};
