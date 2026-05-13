const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(process.cwd(), 'data');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const LIVE_MATCH_FILE = path.join(DATA_DIR, 'live_match.json');
const STYLE_SETTINGS_FILE = path.join(DATA_DIR, 'style_settings.json');

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(TEAMS_FILE)) {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(MATCHES_FILE)) {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(LIVE_MATCH_FILE)) {
    const defaultMatch = {
      team1_name: 'Team A', team2_name: 'Team B',
      runs: '0', wickets: '0', overs: '0', balls: '0',
      innings: '1', striker_name: 'Batsman 1', striker_runs: '0', striker_balls: '0',
      non_striker_name: 'Batsman 2', non_striker_runs: '0', non_striker_balls: '0',
      bowler_name: 'Bowler 1', bowler_overs: '0', bowler_runs: '0', bowler_wickets: '0',
      recent_balls: '[]', ball_log: '[]', batting_team: 'team1', match_status: 'Yet to begin'
    };
    fs.writeFileSync(LIVE_MATCH_FILE, JSON.stringify(defaultMatch, null, 2), 'utf-8');
  }

  if (!fs.existsSync(STYLE_SETTINGS_FILE)) {
    const defaultStyles = {
      primary_color: '#10b981',
      secondary_color: '#3b82f6',
      bg_opacity: '0.75',
      theme: 'dark',
      layout_type: 'default',
      active_profile: 'default style'
    };
    fs.writeFileSync(STYLE_SETTINGS_FILE, JSON.stringify(defaultStyles, null, 2), 'utf-8');
  }
}

function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Teams API
function getTeams() {
  return readJson(TEAMS_FILE);
}

function createTeam(team) {
  const teams = getTeams();
  const newTeam = {
    id: uuidv4(),
    fullName: team.fullName,
    shortName: team.shortName,
    department: team.department || '',
    logo: team.logo || '',
    players: [] // Array of { id, name, jersey }
  };
  teams.push(newTeam);
  writeJson(TEAMS_FILE, teams);
  return newTeam;
}

function addPlayerToTeam(teamId, player) {
  const teams = getTeams();
  const teamIndex = teams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) return null;

  const newPlayer = {
    id: uuidv4(),
    name: player.name,
    jersey: player.jersey
  };

  teams[teamIndex].players.push(newPlayer);
  writeJson(TEAMS_FILE, teams);
  return newPlayer;
}

function deletePlayer(teamId, playerId) {
    const teams = getTeams();
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return false;

    teams[teamIndex].players = teams[teamIndex].players.filter(p => p.id !== playerId);
    writeJson(TEAMS_FILE, teams);
    return true;
}

// Matches API
function getMatches() {
  return readJson(MATCHES_FILE);
}

function saveMatch(matchData) {
  const matches = getMatches();
  const newMatch = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    team1: matchData.team1_name,
    team2: matchData.team2_name,
    score: `${matchData.runs}/${matchData.wickets}`,
    overs: `${matchData.overs}.${matchData.balls}`,
    result: matchData.match_status,
    performances: matchData.performances || {},
    ballLog: JSON.parse(matchData.ball_log || '[]')
  };
  matches.push(newMatch);
  writeJson(MATCHES_FILE, matches);
  return newMatch;
}

function updateTeam(teamId, updates) {
  const teams = getTeams();
  const teamIndex = teams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) return null;

  teams[teamIndex] = {
    ...teams[teamIndex],
    ...updates,
    id: teamId, // Ensure ID doesn't change
    players: teams[teamIndex].players // Ensure players don't change via this API
  };

  writeJson(TEAMS_FILE, teams);
  return teams[teamIndex];
}

function deleteTeam(teamId) {
  const teams = getTeams();
  const filtered = teams.filter(t => t.id !== teamId);
  if (filtered.length === teams.length) return false;
  writeJson(TEAMS_FILE, filtered);
  return true;
}

// Live Match & Style Settings Persistence
function getLiveMatch() {
  return readJson(LIVE_MATCH_FILE);
}

function updateLiveMatch(data) {
  writeJson(LIVE_MATCH_FILE, data);
}

function getStyleSettings() {
  const styles = readJson(STYLE_SETTINGS_FILE);
  // Ensure it's an object, not an array (readJson returns [] on error)
  return Array.isArray(styles) ? {} : styles;
}

function updateStyleSettings(data) {
  writeJson(STYLE_SETTINGS_FILE, data);
}

module.exports = {
  initDb,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayerToTeam,
  deletePlayer,
  getMatches,
  saveMatch,
  getLiveMatch,
  updateLiveMatch,
  getStyleSettings,
  updateStyleSettings
};
