import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, Gamepad2 } from 'lucide-react';

export default function TeamSetup({ emit, matchData, teams = [], onTeamsUpdate }) {
  const [loading, setLoading] = useState(false);

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

  const fetchTeams = () => {
    if (onTeamsUpdate) onTeamsUpdate();
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
      <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Syncing Team Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create/Edit Team Form */}
        <div className="glass rounded-2xl p-6 border-t-4 border-accent-primary relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Shield size={80} className="text-accent-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-gradient-vibrant font-display font-black text-2xl">{editingTeamId ? 'Update Team Profile' : 'Register New Team'}</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Team & Roster Database</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateOrUpdateTeam} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent-primary" /> Full Team Name
                  </label>
                  <input type="text" value={newTeam.fullName} onChange={e => setNewTeam({ ...newTeam, fullName: e.target.value })} required className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main outline-none focus:border-accent-primary/50 transition-all font-bold" placeholder="e.g. Royal Challengers Bangalore" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-500" /> Short Name
                    </label>
                    <input type="text" value={newTeam.shortName} onChange={e => setNewTeam({ ...newTeam, shortName: e.target.value })} required className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main outline-none focus:border-blue-500/50 transition-all font-bold" placeholder="e.g. RCB" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-purple-500" /> Division/Dept
                    </label>
                    <input type="text" value={newTeam.department} onChange={e => setNewTeam({ ...newTeam, department: e.target.value })} className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main outline-none focus:border-purple-500/50 transition-all font-bold" placeholder="Optional" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Team Branding</label>
                  <div className="flex items-center gap-6 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="w-20 h-20 bg-black/40 border border-dashed border-white/10 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                      {newTeam.logo ? (
                        <img src={newTeam.logo} className="w-full h-full object-contain p-2" alt="Preview" />
                      ) : (
                        <Shield size={32} className="opacity-10 text-main" />
                      )}
                      {uploadingLogo && <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm"><div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      <label htmlFor="logo-upload" className="w-full bg-white/5 hover:bg-white/10 text-main font-black text-[10px] uppercase tracking-widest py-3 rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2">
                        <Plus size={16} /> {newTeam.logo ? 'Change Brand Image' : 'Upload Team Logo'}
                      </label>
                      <p className="text-[9px] text-slate-500 italic text-center">Recommended: 512x512 Transparent PNG</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-accent-primary/10 border-2 border-accent-primary text-accent-primary font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-accent-primary hover:text-main transition-all flex items-center justify-center gap-2">
                  <Plus size={18} /> {editingTeamId ? 'Save Changes' : 'Register Team'}
                </button>
                {editingTeamId && (
                  <button type="button" onClick={() => { setEditingTeamId(null); setNewTeam({ fullName: '', shortName: '', department: '', logo: '' }); }} className="bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 px-6 rounded-xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Initialize Match Form */}
        <div className="glass rounded-2xl p-6 border-t-4 border-accent-secondary relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Gamepad2 size={80} className="text-accent-secondary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary border border-accent-secondary/20">
                <Gamepad2 size={20} />
              </div>
              <div>
                <h3 className="text-gradient-gold font-display font-black text-2xl">Match Configuration</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pre-match Toss & Setup</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-accent-secondary" /> Tournament/Match Name
                </label>
                <input type="text" value={matchName} onChange={e => setMatchName(e.target.value)} className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main outline-none focus:border-accent-secondary/50 transition-all font-bold" placeholder="e.g. ICC T20 World Cup Final" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                    <Shield size={10} className="text-emerald-500" /> Team 1
                  </label>
                  <select value={matchTeam1} onChange={e => setMatchTeam1(e.target.value)} className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main outline-none focus:border-accent-secondary/50 appearance-none custom-select font-bold">
                    <option value="" className="bg-slate-900">Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.fullName}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                    <Shield size={10} className="text-blue-500" /> Team 2
                  </label>
                  <select value={matchTeam2} onChange={e => setMatchTeam2(e.target.value)} className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main outline-none focus:border-accent-secondary/50 appearance-none custom-select font-bold">
                    <option value="" className="bg-slate-900">Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-black/20 rounded-2xl border border-white/5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Toss Winner</label>
                  <select value={tossWinner} onChange={e => setTossWinner(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-main text-xs outline-none appearance-none custom-select">
                    <option value="" className="bg-slate-900">N/A</option>
                    {matchTeam1 && <option value="team1" className="bg-slate-900">{teams.find(t => t.id === matchTeam1)?.shortName}</option>}
                    {matchTeam2 && <option value="team2" className="bg-slate-900">{teams.find(t => t.id === matchTeam2)?.shortName}</option>}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Decision</label>
                  <select value={tossDecision} onChange={e => setTossDecision(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-main text-xs outline-none appearance-none custom-select">
                    <option value="bat" className="bg-slate-900">Elected to Bat</option>
                    <option value="bowl" className="bg-slate-900">Elected to Bowl</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button onClick={handleStartMatch} className="bg-accent-secondary/10 border-2 border-accent-secondary text-accent-secondary font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-accent-secondary hover:text-main transition-all flex items-center justify-center gap-2">
                  <Gamepad2 size={18} /> Initialize Match
                </button>
                <button onClick={handleUpdateToss} className="bg-sec hover:bg-white/10 text-main py-4 rounded-xl border border-main transition-all font-black text-[10px] uppercase tracking-widest">
                  Update Toss Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Manage Teams List */}
      <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-gradient-vibrant font-display font-black text-2xl">Manage Teams</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Registered Squads & Rosters</p>
            </div>
          </div>
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-black/20 rounded-full border border-white/5">
             Total Teams: {teams.length}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-accent-primary/30 hover:bg-black/40 transition-all group/card relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover/card:border-accent-primary/50 transition-colors">
                    {team.logo ? (
                      <img src={team.logo} className="w-full h-full object-contain p-1.5" alt="Logo" />
                    ) : (
                      <Shield size={24} className="opacity-10 text-main" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-main font-bold text-base truncate pr-2" title={team.fullName}>{team.fullName}</div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-accent-primary text-[10px] font-black uppercase tracking-widest bg-accent-primary/10 px-2 py-0.5 rounded-md border border-accent-primary/20">{team.shortName}</span>
                       <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          {team.players?.length || 0} Players
                       </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5 opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0">
                <button onClick={() => setSelectedTeamId(team.id)} className="flex-1 bg-white/5 hover:bg-accent-primary/20 text-slate-400 hover:text-accent-primary py-2 rounded-xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
                  Manage Roster
                </button>
                <button onClick={() => startEditTeam(team)} className="w-10 h-10 flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-main rounded-xl transition-all border border-blue-500/20" title="Edit Team">
                  <Gamepad2 size={16} />
                </button>
                <button onClick={() => handleDeleteTeam(team.id)} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-main rounded-xl transition-all border border-red-500/20" title="Delete Team">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center glass border-dashed rounded-2xl">
               <Shield size={48} className="text-slate-700 mb-4 opacity-20" />
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">No teams registered yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Roster Management */}
      <div id="roster-section" className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-gradient-gold font-display font-black text-2xl">Roster Management</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Edit Player Names & Jersey Numbers</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(e.target.value)} className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main text-xs outline-none focus:border-purple-500 appearance-none custom-select font-black tracking-widest uppercase">
              <option value="" className="bg-slate-900">Select Team to Manage</option>
              {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.fullName}</option>)}
            </select>
          </div>
        </div>

        {selectedTeamId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="lg:col-span-1">
              <div className="bg-black/20 border border-white/10 rounded-2xl p-6 sticky top-24">
                <h4 className="text-main font-black text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Register Player
                </h4>
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Name</label>
                    <input type="text" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-main text-sm outline-none focus:border-purple-500" placeholder="e.g. Virat Kohli" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Jersey No.</label>
                    <input type="text" value={newPlayer.jersey} onChange={e => setNewPlayer({ ...newPlayer, jersey: e.target.value })} required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-main text-sm outline-none focus:border-purple-500" placeholder="e.g. 18" />
                  </div>
                  <button type="submit" className="w-full bg-purple-500/10 border-2 border-purple-500 text-purple-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-purple-500 hover:text-main transition-all flex items-center justify-center gap-2 mt-4">
                    <Plus size={18} /> Add to Squad
                  </button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-3">
               <div className="flex items-center gap-3 mb-6">
                  <h4 className="text-main font-black text-[10px] uppercase tracking-[0.2em]">Active Squad</h4>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] text-slate-500 font-bold">
                    {teams.find(t => t.id === selectedTeamId)?.players.length || 0} Total
                  </span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {teams.find(t => t.id === selectedTeamId)?.players.map(p => (
                  <div key={p.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-all hover:bg-black/40 hover:border-purple-500/30">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-mono font-black border border-purple-500/20">
                          {p.jersey}
                       </div>
                       <div>
                         <div className="text-main font-bold text-sm">{p.name}</div>
                         <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Jersey #{p.jersey}</div>
                       </div>
                    </div>
                    <button onClick={() => handleDeletePlayer(selectedTeamId, p.id)} className="w-8 h-8 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!teams.find(t => t.id === selectedTeamId)?.players.length) && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">No players in this roster yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
