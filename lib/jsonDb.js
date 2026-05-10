const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(process.cwd(), 'data');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

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

module.exports = {
  initDb,
  getTeams,
  createTeam,
  addPlayerToTeam,
  deletePlayer,
  getMatches,
  saveMatch
};
