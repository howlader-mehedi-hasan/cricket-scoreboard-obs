import { useState, useEffect } from 'react';
import { 
  UserCircle, RefreshCw, Gamepad2, Shield, Plus, Users, 
  Trash2, Trophy, Image, Edit3, ChevronDown, ChevronUp, 
  X, Check, Settings, Layout, BarChart2 
} from 'lucide-react';
import RealTimeClock from '@/components/RealTimeClock';

export default function ManagerPanel({ matchData, emit, teams = [] }) {
  const [activeView, setActiveView] = useState('match'); // 'match', 'teams', 'roster'
  const [loading, setLoading] = useState(false);
  
  // Match Setup States
  const [matchTeam1, setMatchTeam1] = useState('');
  const [matchTeam2, setMatchTeam2] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [matchName, setMatchName] = useState('');
  const [totalOvers, setTotalOvers] = useState('20');
  const [totalWickets, setTotalWickets] = useState('10');

  // Team Form States
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [newTeam, setNewTeam] = useState({ fullName: '', shortName: '', department: '', logo: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Roster States
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', jersey: '' });

  useEffect(() => {
    if (matchData) {
      if (matchData.team1_id) setMatchTeam1(matchData.team1_id);
      if (matchData.team2_id) setMatchTeam2(matchData.team2_id);
      if (matchData.match_name) setMatchName(matchData.match_name);
      if (matchData.toss_decision) setTossDecision(matchData.toss_decision);
      if (matchData.total_overs) setTotalOvers(matchData.total_overs);
      if (matchData.total_wickets) setTotalWickets(matchData.total_wickets);

      if (matchData.toss_winner_name) {
        const t1 = teams.find(t => t.id === matchData.team1_id);
        const t2 = teams.find(t => t.id === matchData.team2_id);
        if (matchData.toss_winner_name === t1?.fullName) setTossWinner('team1');
        if (matchData.toss_winner_name === t2?.fullName) setTossWinner('team2');
      }
    }
  }, [matchData, teams]);

  if (!matchData) return null;

  // ──── LOGIC HANDLERS ────

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
        if (data.url) setNewTeam(prev => ({ ...prev, logo: data.url }));
      } catch (err) { console.error('Upload failed', err); }
      finally { setUploadingLogo(false); }
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
        window.location.reload();
      }
    } catch (err) { console.error('Error saving team:', err); }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm('Delete this team and its roster?')) return;
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    } catch (err) { console.error('Error deleting team:', err); }
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

  const handleDeletePlayer = async (teamId, playerId) => {
    if (!confirm('Remove player from roster?')) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    } catch (err) { console.error('Error deleting player:', err); }
  };

  const handleStartMatch = () => {
    if (!matchTeam1 || !matchTeam2 || matchTeam1 === matchTeam2) {
      alert('Select two distinct teams.');
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
        { field: 'total_overs', value: totalOvers },
        { field: 'total_wickets', value: totalWickets }
      ]
    });
    alert('Match Initialized!');
  };

  // ──── UI RENDERING ────

  const teamName = matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name;
  const runs = matchData.runs || '0';
  const wickets = matchData.wickets || '0';
  const overs = matchData.overs || '0';
  const balls = matchData.balls || '0';

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-20">
      
      {/* Header Scoreboard (Mirror ScorerPanel) */}
      <div className="glass rounded-3xl p-5 text-center relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute top-4 left-5 text-left"><RealTimeClock /></div>
        <div className="flex flex-col items-center">
            <span className="text-purple-400 text-[10px] uppercase font-black tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 mb-2">
                Info Manager
            </span>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{teamName || 'NO MATCH'}</span>
            <div className="text-white font-display font-black text-5xl my-2 drop-shadow-2xl">
                {runs}<span className="text-slate-500 text-2xl">/{wickets}</span>
            </div>
            <span className="bg-slate-800 text-slate-300 px-4 py-1 rounded-full text-xs font-black font-mono border border-white/5">
                {overs}.{balls} <span className="text-[9px] text-slate-500 font-normal uppercase ml-1">Overs</span>
            </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
        {[
          { id: 'match', label: 'Setup', icon: Gamepad2 },
          { id: 'teams', label: 'Teams', icon: Shield },
          { id: 'roster', label: 'Roster', icon: Users }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeView === tab.id ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <tab.icon size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* View: Match Setup */}
      {activeView === 'match' && (
        <div className="glass rounded-3xl p-5 border border-white/10 space-y-6 animate-in slide-in-from-bottom-2">
            <h3 className="text-white font-black uppercase tracking-tighter flex items-center gap-2 italic text-lg italic">
                <Gamepad2 size={20} className="text-purple-400" /> Match Initialization
            </h3>
            
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Match Name / Cup</label>
                    <input type="text" value={matchName} onChange={e => setMatchName(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" placeholder="e.g. T20 Final" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Team 1</label>
                        <select value={matchTeam1} onChange={e => setMatchTeam1(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="">Select Team</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Team 2</label>
                        <select value={matchTeam2} onChange={e => setMatchTeam2(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="">Select Team</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                        </select>
                    </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Toss Winner</label>
                        <select value={tossWinner} onChange={e => setTossWinner(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="">Select Winner</option>
                            {matchTeam1 && <option value="team1">{teams.find(t => t.id === matchTeam1)?.shortName}</option>}
                            {matchTeam2 && <option value="team2">{teams.find(t => t.id === matchTeam2)?.shortName}</option>}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Decision</label>
                        <select value={tossDecision} onChange={e => setTossDecision(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="bat">Batting First</option>
                            <option value="bowl">Bowling First</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-center bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                        <label className="text-[9px] text-slate-600 uppercase font-black">Overs Limit</label>
                        <input type="number" value={totalOvers} onChange={e => setTotalOvers(e.target.value)} className="bg-transparent text-white text-xl font-black w-full text-center outline-none" />
                    </div>
                    <div className="space-y-1.5 text-center bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                        <label className="text-[9px] text-slate-600 uppercase font-black">Wicket Limit</label>
                        <input type="number" value={totalWickets} onChange={e => setTotalWickets(e.target.value)} className="bg-transparent text-white text-xl font-black w-full text-center outline-none" />
                    </div>
                </div>

                <button onClick={handleStartMatch} className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black italic text-lg shadow-xl shadow-purple-500/20 active:scale-95 transition-all border-b-4 border-purple-700">
                    START MATCH SESSION
                </button>
            </div>
        </div>
      )}

      {/* View: Team Management */}
      {activeView === 'teams' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2">
            {/* Create Form */}
            <div className="glass rounded-3xl p-5 border border-white/10 space-y-5">
                <h3 className="text-white font-black uppercase tracking-tighter flex items-center gap-2 italic text-lg">
                    <Shield size={20} className="text-emerald-400" /> {editingTeamId ? 'Edit Team' : 'Create Team'}
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex gap-4 items-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                           {newTeam.logo ? (
                               <img src={newTeam.logo} className="w-full h-full object-contain p-2" />
                           ) : (
                               <Image className="text-slate-600" size={24} />
                           )}
                           {uploadingLogo && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><RefreshCw size={20} className="text-emerald-400 animate-spin" /></div>}
                           <input type="file" id="logo-mobile" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                           <label htmlFor="logo-mobile" className="absolute inset-0 cursor-pointer" />
                        </div>
                        <div className="flex-1 space-y-1">
                             <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Team Logo</label>
                             <p className="text-[10px] text-slate-600 leading-tight">Tap the box to upload team emblem</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input type="text" value={newTeam.fullName} onChange={e => setNewTeam({...newTeam, fullName: e.target.value})} placeholder="Team Full Name" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={newTeam.shortName} onChange={e => setNewTeam({...newTeam, shortName: e.target.value})} placeholder="Short Name (RCB)" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                            <input type="text" value={newTeam.department} onChange={e => setNewTeam({...newTeam, department: e.target.value})} placeholder="Dept (Optional)" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handleCreateOrUpdateTeam} className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/10 border-b-4 border-emerald-700 active:scale-95 transition-all">
                            {editingTeamId ? 'Update Team' : 'Add Team'}
                        </button>
                        {editingTeamId && (
                            <button onClick={() => { setEditingTeamId(null); setNewTeam({fullName:'', shortName:'', department:'', logo:''}); }} className="px-6 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[9px] border border-white/10">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Team List */}
            <div className="grid grid-cols-1 gap-2">
                {teams.map(team => (
                    <div key={team.id} className="glass-light rounded-2xl p-3 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 p-1">
                                {team.logo ? <img src={team.logo} className="w-full h-full object-contain" /> : <Shield className="w-full h-full p-2 opacity-20" />}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm leading-tight">{team.fullName}</h4>
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{team.shortName} • {team.players?.length || 0} Rostered</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => { setEditingTeamId(team.id); setNewTeam({fullName: team.fullName, shortName: team.shortName, department: team.department, logo: team.logo}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 text-slate-500 hover:text-emerald-400"><Edit3 size={16}/></button>
                            <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* View: Roster Management */}
      {activeView === 'roster' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2">
            <div className="glass rounded-3xl p-5 border border-white/10 space-y-5">
                <h3 className="text-white font-black uppercase tracking-tighter flex items-center gap-2 italic text-lg">
                    <Users size={20} className="text-blue-400" /> Roster Builder
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Target Team</label>
                        <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500">
                            <option value="">Select Team to Manage</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>

                    {selectedTeamId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20 space-y-3">
                                <label className="text-[9px] text-blue-400 uppercase font-black tracking-widest">Quick Add Player</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="text" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} placeholder="Name" className="col-span-2 bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                                    <input type="text" value={newPlayer.jersey} onChange={e => setNewPlayer({...newPlayer, jersey: e.target.value})} placeholder="#" className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white text-center" />
                                </div>
                                <button onClick={handleAddPlayer} className="w-full py-3 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20">
                                    Add To Roster
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {teams.find(t => t.id === selectedTeamId)?.players.map(p => (
                                    <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl flex items-center justify-between border border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/20">
                                                #{p.jersey}
                                            </div>
                                            <span className="text-white text-sm font-medium">{p.name}</span>
                                        </div>
                                        <button onClick={() => handleDeletePlayer(selectedTeamId, p.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
