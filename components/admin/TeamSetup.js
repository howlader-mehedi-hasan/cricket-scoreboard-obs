import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, Gamepad2 } from 'lucide-react';

export default function TeamSetup({ emit, matchData }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTeam, setNewTeam] = useState({ fullName: '', shortName: '', department: '', logo: '' });
  const [newPlayer, setNewPlayer] = useState({ name: '', jersey: '' });

  // Match setup states
  const [matchTeam1, setMatchTeam1] = useState('');
  const [matchTeam2, setMatchTeam2] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [matchName, setMatchName] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (matchData) {
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

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result, name: file.name })
        });
        const data = await res.json();
        if (data.url) {
          setNewTeam(prev => ({ ...prev, logo: data.url }));
        }
      } catch (err) {
        console.error('Upload failed', err);
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      const method = editingTeamId ? 'PUT' : 'POST';
      const url = editingTeamId ? `/api/teams/${editingTeamId}` : '/api/teams';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      if (res.ok) {
        setNewTeam({ fullName: '', shortName: '', department: '', logo: '' });
        setEditingTeamId(null);
        fetchTeams();
      }
    } catch (err) {
      console.error('Error saving team:', err);
    }
  };

  const startEditTeam = (team) => {
    setEditingTeamId(team.id);
    setNewTeam({
      fullName: team.fullName,
      shortName: team.shortName,
      department: team.department || '',
      logo: team.logo || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm('Are you sure you want to delete this team? This will also remove its roster.')) return;
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedTeamId === id) setSelectedTeamId(null);
        fetchTeams();
      }
    } catch (err) {
      console.error('Error deleting team:', err);
    }
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
        fetchTeams();
      }
    } catch (err) {
      console.error('Error adding player:', err);
    }
  };

  const handleDeletePlayer = async (teamId, playerId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchTeams();
    } catch (err) {
      console.error('Error deleting player:', err);
    }
  };

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
        { field: 'team1_logo', value: t1.logo || '' },
        { field: 'team2_logo', value: t2.logo || '' },
        { field: 'runs', value: '0' },
        { field: 'wickets', value: '0' },
        { field: 'overs', value: '0' },
        { field: 'balls', value: '0' },
        { field: 'innings', value: '1' },
        { field: 'striker_name', value: '' },
        { field: 'striker_runs', value: 0 },
        { field: 'striker_balls', value: 0 },
        { field: 'non_striker_name', value: '' },
        { field: 'non_striker_runs', value: 0 },
        { field: 'non_striker_balls', value: 0 },
        { field: 'bowler_name', value: '' },
        { field: 'bowler_runs', value: 0 },
        { field: 'bowler_wickets', value: 0 },
        { field: 'bowler_overs', value: '0.0' },
        { field: 'bowlers_history', value: '{}' },
        { field: 'target', value: '0' },
        { field: 'ball_log', value: '[]' },
        { field: 'recent_balls', value: '[]' },
        { field: 'match_status', value: 'Match Start' },
        { field: 'match_name', value: matchName || `${t1.shortName} vs ${t2.shortName}` },
        { field: 'is_match_ended', value: 'false' },
        { field: 'final_result_message', value: '' },
        { field: 'match_ended_at', value: '0' },
        { field: 'is_pre_match', value: 'true' },
        { field: 'pre_match_at', value: Date.now().toString() },
        { field: 'toss_winner_name', value: tossWinner === 'team1' ? t1.fullName : (tossWinner === 'team2' ? t2.fullName : '') },
        { field: 'toss_decision', value: tossDecision },
        { field: 'opening_message', value: `${t1.fullName} vs ${t2.fullName}` },
        { field: 'team1_full', value: t1.fullName },
        { field: 'team1_dept', value: t1.department || '' },
        { field: 'team2_full', value: t2.fullName },
        { field: 'team2_dept', value: t2.department || '' },
        { field: 'total_overs', value: '20' },
        { field: 'total_wickets', value: '10' }
      ]
    });
    alert('Match initialized! Go to Match Control to continue.');
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

  if (loading) return <div className="p-4 text-white">Loading...</div>;
  if (loading) return <div className="p-4 text-main">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create/Edit Team Form */}
        <div className="glass rounded-xl p-5 border border-main">
          <h3 className="text-main font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" />
            {editingTeamId ? 'Edit Team' : 'Create New Team'}
          </h3>
          <form onSubmit={handleCreateOrUpdateTeam} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
              <input type="text" value={newTeam.fullName} onChange={e => setNewTeam({ ...newTeam, fullName: e.target.value })} required className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-emerald-500" placeholder="e.g. Royal Challengers" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Short Name</label>
                <input type="text" value={newTeam.shortName} onChange={e => setNewTeam({ ...newTeam, shortName: e.target.value })} required className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-emerald-500" placeholder="e.g. RCB" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                <input type="text" value={newTeam.department} onChange={e => setNewTeam({ ...newTeam, department: e.target.value })} className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-emerald-500" placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Team Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-sec border border-dashed border-main rounded flex items-center justify-center overflow-hidden relative">
                  {newTeam.logo ? (
                    <img src={newTeam.logo} className="w-full h-full object-contain" alt="Preview" />
                  ) : (
                    <Shield size={24} className="opacity-20" />
                  )}
                  {uploadingLogo && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}
                </div>
                <div className="flex-1">
                  <input 
                    id="logo-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                  />
                  <label 
                    htmlFor="logo-upload" 
                    className="btn btn-secondary w-full py-2 text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={14} /> {newTeam.logo ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-main font-medium py-2 rounded transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> {editingTeamId ? 'Update Team' : 'Add Team'}
              </button>
              {editingTeamId && (
                <button type="button" onClick={() => { setEditingTeamId(null); setNewTeam({ fullName: '', shortName: '', department: '', logo: '' }); }} className="bg-sec hover:bg-white/20 text-main px-4 rounded transition-colors border border-main">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Start Match Form */}
        <div className="glass rounded-xl p-5 border border-main">
          <h3 className="text-main font-bold mb-4 flex items-center gap-2">
            <Gamepad2 size={18} className="text-blue-400" />
            Initialize Match
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Match Name</label>
              <input type="text" value={matchName} onChange={e => setMatchName(e.target.value)} className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-blue-500" placeholder="e.g. Final Match / T20 Cup" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Team 1 (Name)</label>
              <select value={matchTeam1} onChange={e => setMatchTeam1(e.target.value)} className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-blue-500">
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.shortName})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Team 2 (Name)</label>
              <select value={matchTeam2} onChange={e => setMatchTeam2(e.target.value)} className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-blue-500">
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.shortName})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Toss Winner</label>
              <select value={tossWinner} onChange={e => setTossWinner(e.target.value)} className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-blue-500">
                <option value="">Select Winner (Optional)</option>
                {matchTeam1 && <option value="team1">{teams.find(t => t.id === matchTeam1)?.shortName}</option>}
                {matchTeam2 && <option value="team2">{teams.find(t => t.id === matchTeam2)?.shortName}</option>}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Decision</label>
              <select value={tossDecision} onChange={e => setTossDecision(e.target.value)} className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-blue-500">
                <option value="bat">Bat First</option>
                <option value="bowl">Bowl First</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleStartMatch} className="bg-blue-500 hover:bg-blue-600 text-main font-medium py-2 rounded transition-colors">
                Initialize
              </button>
              <button onClick={handleUpdateToss} className="bg-sec hover:bg-white/20 text-main font-medium py-2 rounded transition-colors border border-main">
                Update Toss
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Manage Teams List */}
      <div className="glass rounded-xl p-5 border border-main">
        <h3 className="text-main font-bold mb-4 flex items-center gap-2">
          <Users size={18} className="text-emerald-400" />
          Manage Teams
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-sec border border-main rounded-lg p-4 flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded border border-main flex items-center justify-center overflow-hidden">
                  {team.logo ? (
                    <img src={team.logo} className="w-full h-full object-contain" alt="Logo" />
                  ) : (
                    <Shield size={20} className="opacity-20" />
                  )}
                </div>
                <div>
                  <div className="text-main font-bold text-sm">{team.fullName}</div>
                  <div className="text-slate-400 text-[10px] uppercase tracking-widest">{team.shortName} • {team.players?.length || 0} Players</div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditTeam(team)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit Team">
                  <Gamepad2 size={16} />
                </button>
                <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Team">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 italic text-sm">
              No teams created yet.
            </div>
          )}
        </div>
      </div>

      {/* Roster Management */}
      <div className="glass rounded-xl p-5 border border-main">
        <h3 className="text-main font-bold mb-4 flex items-center gap-2">
          <Users size={18} className="text-purple-400" />
          Roster Management
        </h3>
        <div className="mb-4">
          <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(e.target.value)} className="w-full max-w-sm bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-purple-500">
            <option value="" className="bg-white text-black">Select Team to Manage</option>
            {teams.map(t => <option key={t.id} value={t.id} className="bg-white text-black">{t.fullName}</option>)}
          </select>
        </div>

        {selectedTeamId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="lg:col-span-1">
              <div className="bg-sec border border-main rounded-lg p-4">
                <h4 className="text-main text-sm font-semibold mb-3">Add New Player</h4>
                <form onSubmit={handleAddPlayer} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Player Name</label>
                    <input type="text" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} required className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Jersey No.</label>
                    <input type="text" value={newPlayer.jersey} onChange={e => setNewPlayer({ ...newPlayer, jersey: e.target.value })} required className="w-full bg-sec border border-main rounded px-3 py-2 text-main outline-none focus:border-purple-500" />
                  </div>
                  <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                    <Plus size={16} /> Add Player
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {teams.find(t => t.id === selectedTeamId)?.players.map(p => (
                  <div key={p.id} className="bg-sec border border-main rounded p-3 flex items-center justify-between group">
                    <div>
                      <div className="text-main font-medium text-sm">{p.name}</div>
                      <div className="text-slate-500 text-xs font-bold">#{p.jersey}</div>
                    </div>
                    <button onClick={() => handleDeletePlayer(selectedTeamId, p.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
