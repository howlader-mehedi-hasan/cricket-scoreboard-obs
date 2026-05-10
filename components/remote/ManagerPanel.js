import { useState, useEffect } from 'react';
import { UserCircle, RefreshCw, Gamepad2, Shield, Plus, Users, Trash2, Trophy } from 'lucide-react';

export default function ManagerPanel({ matchData, emit, teams = [] }) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [status, setStatus] = useState('');
  
  // Match setup states
  const [matchTeam1, setMatchTeam1] = useState('');
  const [matchTeam2, setMatchTeam2] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [matchName, setMatchName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // New Team Form
  const [newTeam, setNewTeam] = useState({ fullName: '', shortName: '', department: '' });
  const [newPlayer, setNewPlayer] = useState({ name: '', jersey: '' });

  useEffect(() => {
    if (matchData) {
      setStriker(matchData.striker_name || '');
      setNonStriker(matchData.non_striker_name || '');
      setBowler(matchData.bowler_name || '');
      setStatus(matchData.match_status || '');
      
      if (matchData.team1_id) setMatchTeam1(matchData.team1_id);
      if (matchData.team2_id) setMatchTeam2(matchData.team2_id);
      if (matchData.match_name) setMatchName(matchData.match_name);
      if (matchData.toss_decision) setTossDecision(matchData.toss_decision);

      if (matchData.toss_winner_name) {
        const t1 = teams.find(t => t.id === matchData.team1_id);
        const t2 = teams.find(t => t.id === matchData.team2_id);
        if (matchData.toss_winner_name === t1?.fullName) setTossWinner('team1');
        if (matchData.toss_winner_name === t2?.fullName) setTossWinner('team2');
      }
    }
  }, [matchData, teams]);

  if (!matchData) return null;

  function updateField(field, value) {
    emit('match:update', { field, value });
  }

  const handleStartMatch = () => {
    if (!matchTeam1 || !matchTeam2 || matchTeam1 === matchTeam2) {
      alert('Please select two distinct teams.');
      return;
    }

    const t1 = teams.find(t => t.id === matchTeam1);
    const t2 = teams.find(t => t.id === matchTeam2);

    emit('match:updateBulk', {
      updates: [
        { field: 'team1_name', value: t1.shortName },
        { field: 'team2_name', value: t2.shortName },
        { field: 'team1_id', value: t1.id },
        { field: 'team2_id', value: t2.id },
        { field: 'runs', value: '0' },
        { field: 'wickets', value: '0' },
        { field: 'overs', value: '0' },
        { field: 'balls', value: '0' },
        { field: 'innings', value: '1' },
        { field: 'striker_name', value: '' },
        { field: 'non_striker_name', value: '' },
        { field: 'bowler_name', value: '' },
        { field: 'target', value: '0' },
        { field: 'match_status', value: 'Match Start' },
        { field: 'match_name', value: matchName || `${t1.shortName} vs ${t2.shortName}` },
        { field: 'is_match_ended', value: 'false' },
        { field: 'is_pre_match', value: 'true' },
        { field: 'toss_winner_name', value: tossWinner === 'team1' ? t1.fullName : (tossWinner === 'team2' ? t2.fullName : '') },
        { field: 'toss_decision', value: tossDecision },
        { field: 'team1_full', value: t1.fullName },
        { field: 'team2_full', value: t2.fullName },
      ]
    });
    alert('Match initialized!');
  };

  const handleUpdateToss = () => {
    const t1 = teams.find(t => t.id === matchTeam1);
    const t2 = teams.find(t => t.id === matchTeam2);
    if (!t1 || !t2) return;

    emit('match:updateBulk', {
      updates: [
        { field: 'toss_winner_name', value: tossWinner === 'team1' ? t1.fullName : (tossWinner === 'team2' ? t2.fullName : '') },
        { field: 'toss_decision', value: tossDecision }
      ]
    });
    alert('Toss information updated!');
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      if (res.ok) {
        setNewTeam({ fullName: '', shortName: '', department: '' });
        // Trigger a refresh of teams in the parent
        window.location.reload(); 
      }
    } catch (err) { console.error('Error creating team:', err); }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayer)
      });
      if (res.ok) {
        setNewPlayer({ name: '', jersey: '' });
        window.location.reload();
      }
    } catch (err) { console.error('Error adding player:', err); }
  };

  const teamName = matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name;
  const runs = matchData.runs || '0';
  const wickets = matchData.wickets || '0';
  const overs = matchData.overs || '0';
  const balls = matchData.balls || '0';

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className="glass rounded-2xl p-4 text-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">{teamName}</span>
        <div className="text-white font-display font-black text-4xl mt-1">
          {runs}<span className="text-slate-500 text-2xl">/{wickets}</span>
        </div>
        <span className="text-slate-400 text-sm font-mono">{overs}.{balls} overs</span>
      </div>

      {/* Match Setup / Toss */}
      <div className="glass rounded-2xl p-4 border-l-4 border-blue-500">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Gamepad2 size={16} className="text-blue-400" /> Match Initialization
        </h3>
        <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Match Name</label>
              <input type="text" value={matchName} onChange={e => setMatchName(e.target.value)} className="input-field text-sm" placeholder="e.g. Final / T20 Cup" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Team 1</label>
                    <select value={matchTeam1} onChange={e => setMatchTeam1(e.target.value)} className="input-field text-sm">
                        <option value="">Select Team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Team 2</label>
                    <select value={matchTeam2} onChange={e => setMatchTeam2(e.target.value)} className="input-field text-sm">
                        <option value="">Select Team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                    </select>
                </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Toss Winner</label>
                    <select value={tossWinner} onChange={e => setTossWinner(e.target.value)} className="input-field text-sm">
                        <option value="">Select</option>
                        {matchTeam1 && <option value="team1">{teams.find(t => t.id === matchTeam1)?.shortName}</option>}
                        {matchTeam2 && <option value="team2">{teams.find(t => t.id === matchTeam2)?.shortName}</option>}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Decision</label>
                    <select value={tossDecision} onChange={e => setTossDecision(e.target.value)} className="input-field text-sm">
                        <option value="bat">Bat First</option>
                        <option value="bowl">Bowl First</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleStartMatch} className="btn-primary py-2.5 text-xs">Initialize</button>
                <button onClick={handleUpdateToss} className="btn-secondary py-2.5 text-xs">Update Toss</button>
            </div>
        </div>
      </div>

      {/* Batting Players */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <UserCircle size={16} className="text-emerald-400" /> Active Players
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Striker</label>
            <div className="flex gap-2">
              <input className="input-field text-sm" value={striker} onChange={e => setStriker(e.target.value)} placeholder="Striker name" />
              <button onClick={() => updateField('striker_name', striker)} className="btn btn-primary text-xs px-4">Set</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Non-Striker</label>
            <div className="flex gap-2">
              <input className="input-field text-sm" value={nonStriker} onChange={e => setNonStriker(e.target.value)} placeholder="Non-striker name" />
              <button onClick={() => updateField('non_striker_name', nonStriker)} className="btn btn-primary text-xs px-4">Set</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Current Bowler</label>
            <div className="flex gap-2">
              <input className="input-field text-sm" value={bowler} onChange={e => setBowler(e.target.value)} placeholder="Bowler name" />
              <button onClick={() => updateField('bowler_name', bowler)} className="btn btn-primary text-xs px-4">Set</button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Status */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Match Status</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className="input-field text-sm" value={status} onChange={e => setStatus(e.target.value)} placeholder="e.g. Innings Break" />
            <button onClick={() => updateField('match_status', status)} className="btn btn-primary text-xs px-4">Update</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Live', 'Innings Break', 'Drinks Break', 'Rain Delay', 'Match Over'].map(s => (
              <button key={s} onClick={() => { setStatus(s); updateField('match_status', s); }} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team & Roster Management */}
      <div className="glass rounded-2xl p-4 border-l-4 border-purple-500">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-purple-400" /> Team Management
          </h3>
          <div className="space-y-6">
              {/* Create Team */}
              <div className="space-y-3 p-3 bg-white/5 rounded-xl">
                  <h4 className="text-[10px] text-slate-400 uppercase font-black">Add New Team</h4>
                  <input type="text" value={newTeam.fullName} onChange={e => setNewTeam({...newTeam, fullName: e.target.value})} placeholder="Full Name" className="input-field text-xs mb-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={newTeam.shortName} onChange={e => setNewTeam({...newTeam, shortName: e.target.value})} placeholder="Short Name" className="input-field text-xs" />
                    <button onClick={handleCreateTeam} className="btn-primary py-2 text-xs flex items-center gap-1 justify-center"><Plus size={14}/> Add</button>
                  </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Roster */}
              <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-400 uppercase font-black">Manage Roster</h4>
                  <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(e.target.value)} className="input-field text-sm">
                      <option value="">Select Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>

                  {selectedTeamId && (
                      <div className="space-y-3 pt-2">
                          <div className="flex gap-2">
                            <input type="text" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} placeholder="Player Name" className="input-field text-xs" />
                            <input type="text" value={newPlayer.jersey} onChange={e => setNewPlayer({...newPlayer, jersey: e.target.value})} placeholder="#" className="input-field text-xs w-12" />
                            <button onClick={handleAddPlayer} className="btn-primary px-3 text-xs"><Plus size={14}/></button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              {teams.find(t => t.id === selectedTeamId)?.players.map(p => (
                                  <div key={p.id} className="bg-slate-900 border border-white/5 p-2 rounded text-[10px] text-white flex justify-between items-center">
                                      <span>{p.name} (#{p.jersey})</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
