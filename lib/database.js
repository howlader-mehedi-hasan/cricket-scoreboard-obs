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

  // Match data table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS match_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // Style settings table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS style_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // Style profiles table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS style_profiles (
      name TEXT PRIMARY KEY,
      layout_type TEXT NOT NULL DEFAULT 'default',
      settings TEXT NOT NULL DEFAULT '{}'
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

  // Match history table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
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

  // Seed Profiles
  const profileStmt = conn.prepare(
    'INSERT OR IGNORE INTO style_profiles (name, layout_type, settings) VALUES (?, ?, ?)'
  );
  
  const defaultLayoutSettings = {
    x_offset: '50', y_offset: '85', primary_color: '#10b981', secondary_color: '#3b82f6', bg_opacity: '0.75', show_timeline: '1',
  };
  const tsportsLayoutSettings = {
    x_offset: '50', y_offset: '90', primary_color: '#044a2b', secondary_color: '#750f1b', bg_opacity: '0.9', show_timeline: '1',
  };

  profileStmt.run('default style', 'default', JSON.stringify(defaultLayoutSettings));
  profileStmt.run('T-sports style', 't-sports', JSON.stringify(tsportsLayoutSettings));

  // Initialize style settings
  const styleDefaults = { active_profile: 'T-sports style' };
  const styleStmt = conn.prepare('INSERT OR IGNORE INTO style_settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(styleDefaults)) {
    styleStmt.run(key, value);
  }
}

// ──── Match Data ────

function getMatchData() {
  const conn = getDb();
  const rows = conn.prepare('SELECT key, value FROM match_data').all();
  const result = {};
  for (const row of rows) { result[row.key] = row.value; }
  return result;
}

function updateMatchData(key, value) {
  const conn = getDb();
  conn.prepare('INSERT INTO match_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
}

function resetMatchData() {
  const conn = getDb();
  const defaults = { runs: '0', wickets: '0', overs: '0', balls: '0', target: '0', striker_name: 'Batsman 1', striker_runs: '0', striker_balls: '0', non_striker_name: 'Batsman 2', non_striker_runs: '0', non_striker_balls: '0', bowler_name: 'Bowler 1', bowler_overs: '0', bowler_runs: '0', bowler_wickets: '0', bowler_maidens: '0', recent_balls: '[]', match_status: 'Yet to begin', innings: '1' };
  const stmt = conn.prepare('INSERT INTO match_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const transaction = conn.transaction(() => { for (const [key, value] of Object.entries(defaults)) { stmt.run(key, value); } });
  transaction();
}

// ──── History ────

function pushHistory() {
  const conn = getDb();
  const current = getMatchData();
  conn.prepare('INSERT INTO match_history (state) VALUES (?)').run(JSON.stringify(current));
  // Keep only last 50 states to save space
  conn.prepare('DELETE FROM match_history WHERE id NOT IN (SELECT id FROM match_history ORDER BY id DESC LIMIT 50)').run();
}

function popHistory() {
  const conn = getDb();
  const last = conn.prepare('SELECT * FROM match_history ORDER BY id DESC LIMIT 1').get();
  if (!last) return null;

  const state = JSON.parse(last.state);
  const stmt = conn.prepare('INSERT INTO match_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  
  const transaction = conn.transaction(() => {
    for (const [key, value] of Object.entries(state)) {
      stmt.run(key, String(value));
    }
  });
  transaction();

  conn.prepare('DELETE FROM match_history WHERE id = ?').run(last.id);
  return state;
}

// ──── Style Profiles ────

function getProfiles() {
  const conn = getDb();
  return conn.prepare('SELECT * FROM style_profiles').all().map(p => ({ ...p, settings: JSON.parse(p.settings) }));
}

function updateProfile(name, layout_type, settings) {
  const conn = getDb();
  conn.prepare('UPDATE style_profiles SET layout_type = ?, settings = ? WHERE name = ?').run(layout_type, JSON.stringify(settings), name);
}

function createProfile(name, layout_type, settings) {
  const conn = getDb();
  conn.prepare('INSERT OR REPLACE INTO style_profiles (name, layout_type, settings) VALUES (?, ?, ?)').run(name, layout_type, JSON.stringify(settings));
}

function deleteProfile(name) {
  const conn = getDb();
  conn.prepare('DELETE FROM style_profiles WHERE name = ?').run(name);
}

function getStyleSettings() {
  const conn = getDb();
  const rows = conn.prepare('SELECT key, value FROM style_settings').all();
  const settings = {};
  for (const row of rows) { settings[row.key] = row.value; }

  const activeProfileName = settings.active_profile || 'default style';
  const profile = conn.prepare('SELECT * FROM style_profiles WHERE name = ?').get(activeProfileName);
  
  if (profile) {
    return { ...settings, ...JSON.parse(profile.settings), layout_type: profile.layout_type, active_profile: profile.name, profiles: getProfiles() };
  }
  return settings;
}

function updateStyleSettings(key, value) {
  const conn = getDb();
  if (key === 'active_profile') {
    conn.prepare('INSERT INTO style_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
  } else {
    // Update setting in the active profile
    const active = conn.prepare("SELECT value FROM style_settings WHERE key = 'active_profile'").get();
    if (active) {
      const profile = conn.prepare('SELECT * FROM style_profiles WHERE name = ?').get(active.value);
      if (profile) {
        const settings = JSON.parse(profile.settings);
        settings[key] = value;
        updateProfile(profile.name, profile.layout_type, settings);
      }
    }
  }
}

// ──── Access Tokens ────

function createToken(role) {
  const conn = getDb();
  const token = uuidv4().replace(/-/g, '').slice(0, 16);
  conn.prepare('INSERT INTO access_tokens (token_string, role) VALUES (?, ?)').run(token, role);
  return { token, role };
}

function validateToken(token) {
  const conn = getDb();
  return conn.prepare('SELECT * FROM access_tokens WHERE token_string = ? AND active = 1').get(token) || null;
}

function listTokens() { return getDb().prepare('SELECT * FROM access_tokens ORDER BY created_at DESC').all(); }
function revokeToken(token) { getDb().prepare('UPDATE access_tokens SET active = 0 WHERE token_string = ?').run(token); }
function deleteToken(token) { getDb().prepare('DELETE FROM access_tokens WHERE token_string = ?').run(token); }

module.exports = {
  getDb, getMatchData, updateMatchData, resetMatchData,
  pushHistory, popHistory,
  getStyleSettings, updateStyleSettings,
  getProfiles, updateProfile, createProfile, deleteProfile,
  createToken, validateToken, listTokens, revokeToken, deleteToken,
};
