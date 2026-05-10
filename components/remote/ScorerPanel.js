import { useState } from 'react';
import { ArrowLeftRight, Undo2, ChevronDown, ChevronUp, RotateCcw, Edit3, Settings, Users, Wind, BarChart2 } from 'lucide-react';
import RealTimeClock from '@/components/RealTimeClock';


export default function ScorerPanel({ matchData, emit, teams = [] }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  if (!matchData) return null;

  const runs = parseInt(matchData.runs || '0');
  const wickets = parseInt(matchData.wickets || '0');
  const overs = parseInt(matchData.overs || '0');
  const balls = parseInt(matchData.balls || '0');
  const strikerRuns = parseInt(matchData.striker_runs || '0');
  const strikerBalls = parseInt(matchData.striker_balls || '0');
  const bowlerRuns = parseInt(matchData.bowler_runs || '0');
  const bowlerWickets = parseInt(matchData.bowler_wickets || '0');
  const bowlerOversVal = matchData.bowler_overs || '0';
  const strikerName = matchData.striker_name || '';
  const bowlerName = matchData.bowler_name || '';
  const innings = parseInt(matchData.innings || '1');

  // Identify teams and players
  const battingTeamId = matchData.batting_team === 'team2' ? matchData.team2_id : matchData.team1_id;
  const bowlingTeamId = matchData.batting_team === 'team2' ? matchData.team1_id : matchData.team2_id;
  
  const currentBattingTeam = teams.find(t => t.id === battingTeamId);
  const currentBowlingTeam = teams.find(t => t.id === bowlingTeamId);
  
  const battingPlayers = currentBattingTeam?.players || [];
  const bowlingPlayers = currentBowlingTeam?.players || [];

  const EditableField = ({ label, field, wide = false }) => (
    <div className={`${wide ? 'col-span-2' : ''}`}>
      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium block mb-1">{label}</label>
      {editingField === field ? (
        <div className="flex gap-1">
          <input
            className="input-field text-sm"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            autoFocus
          />
          <button onClick={saveEdit} className="btn btn-primary text-xs px-3">Save</button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => startEdit(field)}
        >
          <span className="text-white text-sm font-medium">{matchData[field] || '—'}</span>
          <Edit3 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );

  const PlayerSelect = ({ label, field, players, isBowler = false }) => (
    <div className="w-full">
      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">{label}</label>
      <select
        className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer"
        value={matchData[field] || ''}
        onChange={(e) => {
          const val = e.target.value;
          const updates = [];
          if (isBowler) {
            updates.push(
              { field: 'bowler_name', value: val },
              { field: 'bowler_runs', value: 0 },
              { field: 'bowler_wickets', value: 0 },
              { field: 'bowler_overs', value: '0.0' }
            );
          } else {
            updates.push(
              { field: field, value: val },
              { field: field.replace('_name', '_runs'), value: 0 },
              { field: field.replace('_name', '_balls'), value: 0 }
            );
          }
          emit('match:updateBulk', { updates });
        }}
      >
        <option value="">-- Select --</option>
        {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        <option value="custom">Custom Entry...</option>
      </select>
    </div>
  );

  function startEdit(field) {
    setEditingField(field);
    setEditValue(matchData[field] || '');
  }

  function saveEdit() {
    if (editingField) {
      emit('match:update', { field: editingField, value: editValue });
      setEditingField(null);
    }
  }

  function handleWide4() { addRuns(5, false, true, 'Wd4'); }
  function handleNoBall4() {
    const updates = [
      { field: 'runs', value: runs + 5 },
      { field: 'bowler_runs', value: bowlerRuns + 5 },
      { field: 'striker_runs', value: strikerRuns + 4 },
      { field: 'striker_balls', value: strikerBalls + 1 }
    ];
    const ballObj = {
      label: 'NB4', run: 5, extra: true, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };
    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: ballObj });
  }
  function handleLegBye5() { addRuns(5, true, true, 'LB5'); }
  function handleNoBall6() { 
    const updates = [
      { field: 'runs', value: runs + 7 },
      { field: 'bowler_runs', value: bowlerRuns + 7 },
      { field: 'striker_runs', value: strikerRuns + 6 },
      { field: 'striker_balls', value: strikerBalls + 1 }
    ];
    const ballObj = {
      label: 'NB6', run: 7, extra: true, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };
    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: ballObj });
  }

  function handleNewOver() {
    emit('match:updateBulk', {
      updates: [
        { field: 'bowler_name', value: '' },
        { field: 'bowler_overs', value: '0.0' },
        { field: 'bowler_runs', value: 0 },
        { field: 'bowler_wickets', value: 0 },
        { field: 'recent_balls', value: '[]' }
      ]
    });
  }

  function handleEndInnings() {
    const newInnings = innings + 1;
    const targetVal = runs + 1;
    const totalOversLimit = parseInt(matchData.total_overs || '20');
    const reqRate = (targetVal / totalOversLimit).toFixed(2);
    const battingSecondTeam = matchData.batting_team === 'team1' ? (matchData.team2_name || 'Team 2') : (matchData.team1_name || 'Team 1');
    const breakMessage = `TARGET: ${targetVal} | ${battingSecondTeam} need ${targetVal} runs (Req. Rate: ${reqRate})`;

    emit('match:updateBulk', {
      updates: [
        { field: 'innings', value: newInnings },
        { field: 'target', value: targetVal },
        { field: 'first_innings_total', value: runs },
        { field: 'first_innings_wickets', value: wickets },
        { field: 'runs', value: 0 },
        { field: 'wickets', value: 0 },
        { field: 'overs', value: 0 },
        { field: 'balls', value: 0 },
        { field: 'striker_name', value: '' },
        { field: 'striker_runs', value: 0 },
        { field: 'striker_balls', value: 0 },
        { field: 'non_striker_name', value: '' },
        { field: 'non_striker_runs', value: 0 },
        { field: 'non_striker_balls', value: 0 },
        { field: 'bowler_name', value: '' },
        { field: 'bowler_overs', value: '0.0' },
        { field: 'bowler_runs', value: 0 },
        { field: 'bowler_wickets', value: 0 },
        { field: 'recent_balls', value: '[]' },
        { field: 'batting_team', value: matchData.batting_team === 'team1' ? 'team2' : 'team1' },
        { field: 'match_status', value: `Innings ${newInnings}` },
        { field: 'is_innings_break', value: 'true' },
        { field: 'innings_break_message', value: breakMessage },
        { field: 'innings_break_at', value: Date.now().toString() }
      ],
    });
  }

  function handleEndMatch() {
    if (!confirm('Are you sure you want to end this match?')) return;
    emit('match:updateBulk', {
      updates: [
        { field: 'match_status', value: 'Match Finished' },
        { field: 'is_match_ended', value: 'true' },
        { field: 'match_ended_at', value: Date.now().toString() }
      ]
    });
  }

  function addRuns(runsToAdd, isLegal = true, isExtra = false) {
    const updates = [{ field: 'runs', value: runs + runsToAdd }];
    if (isLegal) {
      let nb = balls + 1, no = overs;
      if (nb >= 6) { no++; nb = 0; }
      
      // Clear timeline if starting a new over
      if (balls === 0 && isLegal) {
        updates.push({ field: 'recent_balls', value: '[]' });
      }

      updates.push({ field: 'balls', value: nb }, { field: 'overs', value: no });
      const bo = parseFloat(bowlerOversVal), bw = Math.floor(bo), bb = Math.round((bo - bw) * 10);
      let nbb = bb + 1, nbw = bw;
      if (nbb >= 6) { nbw++; nbb = 0; }
      updates.push({ field: 'bowler_overs', value: `${nbw}.${nbb}` });
    }
    updates.push({ field: 'bowler_runs', value: bowlerRuns + runsToAdd });
    if (!isExtra) {
      updates.push({ field: 'striker_runs', value: strikerRuns + runsToAdd });
      if (isLegal) updates.push({ field: 'striker_balls', value: strikerBalls + 1 });
    }
    const label = isExtra ? (runsToAdd === 1 ? 'Wd' : 'Nb') : (runsToAdd === 0 ? '0' : String(runsToAdd));
    
    const ballObj = {
      label,
      run: runsToAdd,
      extra: isExtra,
      wicket: false,
      striker: strikerName,
      bowler: bowlerName,
      timestamp: new Date().toISOString()
    };
    
    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: ballObj });

    // Handle Striker Swaps
    const isOverComplete = isLegal && (balls + 1 >= 6);
    const isOddRun = (runsToAdd % 2 === 1) && !isExtra;

    if (isOddRun && isOverComplete) {
      console.log('[ScorerPanel] Odd run on last ball - Striker stays');
    } else if (isOddRun || isOverComplete) {
      setTimeout(() => swapStrikers(), 50);
    }
  }

  function handleWicket() {
    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'bowler_wickets', value: bowlerWickets + 1 },
      { field: 'striker_balls', value: strikerBalls + 1 },
    ];
    let nb = balls + 1, no = overs;
    if (nb >= 6) { no++; nb = 0; }
    
    // Clear timeline if starting a new over
    if (balls === 0) {
      updates.push({ field: 'recent_balls', value: '[]' });
    }

    updates.push({ field: 'balls', value: nb }, { field: 'overs', value: no });
    const bo = parseFloat(bowlerOversVal), bw = Math.floor(bo), bb = Math.round((bo - bw) * 10);
    let nbb = bb + 1, nbw = bw;
    if (nbb >= 6) { nbw++; nbb = 0; }
    updates.push({ field: 'bowler_overs', value: `${nbw}.${nbb}` });
    emit('match:updateBulk', { updates });

    const ballObj = {
      label: 'W',
      run: 0,
      extra: false,
      wicket: true,
      striker: strikerName,
      bowler: bowlerName,
      timestamp: new Date().toISOString()
    };
    emit('match:addBall', { ball: ballObj });

    // Handle Striker Swap if it's the last ball of the over
    if (balls + 1 >= 6) {
      setTimeout(() => swapStrikers(), 50);
    }
  }

  function swapStrikers() {
    emit('match:updateBulk', { updates: [
      { field: 'striker_name', value: matchData.non_striker_name },
      { field: 'striker_runs', value: matchData.non_striker_runs },
      { field: 'striker_balls', value: matchData.non_striker_balls },
      { field: 'non_striker_name', value: matchData.striker_name },
      { field: 'non_striker_runs', value: matchData.striker_runs },
      { field: 'non_striker_balls', value: matchData.striker_balls },
    ]});
  }

  const teamName = matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name;

  return (
    <div className="space-y-4">
      {/* Mini Score Display */}
      <div className="glass rounded-2xl p-4 text-center relative overflow-hidden">
        <div className="absolute top-3 left-4 text-left">
          <RealTimeClock />
        </div>
        <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">{teamName}</span>
        <div className="text-white font-display font-black text-5xl mt-1">
          {runs}<span className="text-slate-500 text-3xl">/{wickets}</span>
        </div>
        <span className="text-slate-400 text-sm font-mono">{overs}.{balls} overs</span>
      </div>

      {/* Player Selection / Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-light rounded-xl p-3 relative overflow-hidden border-l-2 border-emerald-500">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Striker</span>
          </div>
          {!matchData.striker_name ? (
            <PlayerSelect label="" field="striker_name" players={battingPlayers} />
          ) : (
            <div className="flex items-center justify-between">
                <EditableField label="" field="striker_name" />
                <button onClick={() => emit('match:update', {field: 'striker_name', value: ''})} className="text-slate-500 hover:text-white"><RotateCcw size={10}/></button>
            </div>
          )}
          <span className="text-white text-sm font-mono font-bold mt-1 block">
            {strikerRuns} <span className="text-slate-400 text-xs font-normal">({strikerBalls})</span>
          </span>
        </div>

        <div className="glass-light rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Non-Striker</span>
          </div>
          {!matchData.non_striker_name ? (
            <PlayerSelect label="" field="non_striker_name" players={battingPlayers} />
          ) : (
            <div className="flex items-center justify-between">
              <EditableField label="" field="non_striker_name" />
              <button onClick={() => emit('match:update', {field: 'non_striker_name', value: ''})} className="text-slate-500 hover:text-white"><RotateCcw size={10}/></button>
            </div>
          )}
          <span className="text-slate-300 text-sm font-mono mt-1 block">
            {matchData.non_striker_runs || 0} <span className="text-slate-500 text-xs font-normal">({matchData.non_striker_balls || 0})</span>
          </span>
        </div>

        <div className="glass-light rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Bowler</span>
          </div>
          {!matchData.bowler_name ? (
            <PlayerSelect label="" field="bowler_name" players={bowlingPlayers} isBowler />
          ) : (
            <div className="flex items-center justify-between">
              <EditableField label="" field="bowler_name" />
              <button onClick={() => emit('match:update', {field: 'bowler_name', value: ''})} className="text-slate-500 hover:text-white"><RotateCcw size={10}/></button>
            </div>
          )}
          <span className="text-slate-300 text-sm font-mono mt-1 block">
            {bowlerWickets}/{bowlerRuns} <span className="text-slate-500 text-xs font-normal">({bowlerOversVal})</span>
          </span>
        </div>
      </div>

      {/* Main Scoring Grid */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-white font-bold text-xs mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-emerald-400" /> Scoring
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <button onClick={() => addRuns(0)} className="score-btn-small bg-slate-800/80 text-slate-300 border border-white/5">Dot</button>
            <button onClick={() => addRuns(1)} className="score-btn-small bg-white/10 text-white">+1</button>
            <button onClick={() => addRuns(2)} className="score-btn-small bg-blue-500/20 text-blue-300">+2</button>
            <button onClick={() => addRuns(3)} className="score-btn-small bg-blue-600/25 text-blue-300">+3</button>
            <button onClick={() => addRuns(4)} className="score-btn-small bg-emerald-500/20 text-emerald-300">4</button>
            <button onClick={() => addRuns(6)} className="score-btn-small bg-amber-500/20 text-amber-300">6</button>
            <button onClick={() => addRuns(1, false, true)} className="score-btn-small bg-purple-500/15 text-purple-300 text-xs">Wide</button>
            <button onClick={() => addRuns(1, false, true)} className="score-btn-small bg-pink-500/15 text-pink-300 text-xs">NB</button>
            <button onClick={handleWide4} className="score-btn-small bg-purple-500/30 text-purple-200 text-[10px]">Wd 4</button>
            <button onClick={handleNoBall4} className="score-btn-small bg-pink-500/30 text-pink-200 text-[10px]">NB 4</button>
            <button onClick={handleLegBye5} className="score-btn-small bg-orange-500/20 text-orange-300 text-[10px]">LB 5</button>
            <button onClick={handleNoBall6} className="score-btn-small bg-rose-500/20 text-rose-300 text-[10px]">NB 6</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={handleWicket} className="score-btn-small bg-red-500/20 text-red-300 font-bold">🏏 Wicket</button>
            <button onClick={swapStrikers} className="score-btn-small bg-white/5 text-slate-300 flex items-center gap-1.5">
                <ArrowLeftRight size={14} /> Swap
            </button>
        </div>
        <button onClick={() => emit('match:undo')} className="w-full mt-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 bg-white/5 rounded-lg">
            <Undo2 size={12} /> Undo Last Ball
        </button>
      </div>

      {/* Match Controls */}
      <div className="glass rounded-xl p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={handleNewOver} className="btn-secondary py-2 text-xs">New Over</button>
          {innings === 1 ? (
            <button onClick={handleEndInnings} className="btn bg-amber-500/20 text-amber-300 py-2 text-xs">End Innings</button>
          ) : (
            <button onClick={handleEndMatch} className="btn bg-blue-500/20 text-blue-300 py-2 text-xs">End Match</button>
          )}
        </div>
        <EditableField label="Match Status" field="match_status" wide />
      </div>

      {/* Advanced / Manual Override */}
      <div className="glass rounded-xl overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
          <span className="text-xs font-semibold flex items-center gap-2">
              <Settings size={14} className="text-slate-400" /> Advanced Control
          </span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showAdvanced && (
          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Overs Limit</label>
                    <input type="number" value={matchData.total_overs || '20'} onChange={e => emit('match:update', {field:'total_overs', value:e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Wicket Limit</label>
                    <input type="number" value={matchData.total_wickets || '10'} onChange={e => emit('match:update', {field:'total_wickets', value:e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-xs" />
                </div>
            </div>

            <div className="h-px bg-white/5" />
            
            <h4 className="text-[10px] text-amber-400 uppercase font-black tracking-widest">Manual Score Override</h4>
            <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Runs</label>
                    <input type="number" value={matchData.runs || 0} onChange={e => emit('match:update', {field:'runs', value:parseInt(e.target.value)||0})} className="bg-slate-900 w-full text-xs p-1 rounded text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Wkt</label>
                    <input type="number" value={matchData.wickets || 0} onChange={e => emit('match:update', {field:'wickets', value:parseInt(e.target.value)||0})} className="bg-slate-900 w-full text-xs p-1 rounded text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Ovr</label>
                    <input type="number" value={matchData.overs || 0} onChange={e => emit('match:update', {field:'overs', value:parseInt(e.target.value)||0})} className="bg-slate-900 w-full text-xs p-1 rounded text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Ball</label>
                    <input type="number" value={matchData.balls || 0} onChange={e => emit('match:update', {field:'balls', value:parseInt(e.target.value)||0})} className="bg-slate-900 w-full text-xs p-1 rounded text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="space-y-2">
                    <h5 className="text-[9px] text-emerald-400 font-bold uppercase">Striker Correction</h5>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Runs" value={matchData.striker_runs || 0} onChange={e => emit('match:update', {field:'striker_runs', value:parseInt(e.target.value)||0})} className="bg-slate-900 text-xs p-1 rounded text-white" />
                        <input type="number" placeholder="Balls" value={matchData.striker_balls || 0} onChange={e => emit('match:update', {field:'striker_balls', value:parseInt(e.target.value)||0})} className="bg-slate-900 text-xs p-1 rounded text-white" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h5 className="text-[9px] text-amber-400 font-bold uppercase">Bowler Correction</h5>
                    <div className="grid grid-cols-3 gap-2">
                        <input type="number" placeholder="Runs" value={matchData.bowler_runs || 0} onChange={e => emit('match:update', {field:'bowler_runs', value:parseInt(e.target.value)||0})} className="bg-slate-900 text-xs p-1 rounded text-white" />
                        <input type="number" placeholder="Wkt" value={matchData.bowler_wickets || 0} onChange={e => emit('match:update', {field:'bowler_wickets', value:parseInt(e.target.value)||0})} className="bg-slate-900 text-xs p-1 rounded text-white" />
                        <input type="text" placeholder="Ovr" value={matchData.bowler_overs || '0.0'} onChange={e => emit('match:update', {field:'bowler_overs', value:e.target.value})} className="bg-slate-900 text-xs p-1 rounded text-white" />
                    </div>
                </div>
            </div>

            <button onClick={() => { if(confirm('Reset match?')) emit('match:reset'); }} className="w-full mt-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                RESET ENTIRE MATCH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
