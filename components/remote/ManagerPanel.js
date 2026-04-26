import { useState, useEffect } from 'react';
import { UserCircle, RefreshCw } from 'lucide-react';

export default function ManagerPanel({ matchData, emit }) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (matchData) {
      setStriker(matchData.striker_name || '');
      setNonStriker(matchData.non_striker_name || '');
      setBowler(matchData.bowler_name || '');
      setStatus(matchData.match_status || '');
    }
  }, [matchData]);

  if (!matchData) return null;

  function updateField(field, value) {
    emit('match:update', { field, value });
  }

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

      {/* Batting Players */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <UserCircle size={16} className="text-emerald-400" /> Batting
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-1">
              Striker *
            </label>
            <div className="flex gap-2">
              <input className="input-field" value={striker}
                onChange={e => setStriker(e.target.value)}
                placeholder="Striker name" />
              <button onClick={() => updateField('striker_name', striker)}
                className="btn btn-primary text-xs px-4 whitespace-nowrap">Update</button>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-1">
              Non-Striker
            </label>
            <div className="flex gap-2">
              <input className="input-field" value={nonStriker}
                onChange={e => setNonStriker(e.target.value)}
                placeholder="Non-striker name" />
              <button onClick={() => updateField('non_striker_name', nonStriker)}
                className="btn btn-primary text-xs px-4 whitespace-nowrap">Update</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bowling */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-400" /> Bowling
        </h3>
        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-1">
            Current Bowler
          </label>
          <div className="flex gap-2">
            <input className="input-field" value={bowler}
              onChange={e => setBowler(e.target.value)}
              placeholder="Bowler name" />
            <button onClick={() => updateField('bowler_name', bowler)}
              className="btn btn-primary text-xs px-4 whitespace-nowrap">Update</button>
          </div>
        </div>
      </div>

      {/* Match Status */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Match Status</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className="input-field" value={status}
              onChange={e => setStatus(e.target.value)}
              placeholder="e.g. Innings Break" />
            <button onClick={() => updateField('match_status', status)}
              className="btn btn-primary text-xs px-4 whitespace-nowrap">Update</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Live', 'Innings Break', 'Drinks Break', 'Rain Delay', 'Match Over'].map(s => (
              <button key={s}
                onClick={() => { setStatus(s); updateField('match_status', s); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
