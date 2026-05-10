import { useState } from 'react';
import { ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Edit3, Plus, Minus, Undo2, BarChart2, Settings, Users, Wind } from 'lucide-react';

export default function MatchControl({ matchData, emit, teams = [] }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!matchData) return null;

  const runs = parseInt(matchData.runs || '0');
  const wickets = parseInt(matchData.wickets || '0');
  const overs = parseInt(matchData.overs || '0');
  const balls = parseInt(matchData.balls || '0');
  const innings = parseInt(matchData.innings || '1');
  const strikerRuns = parseInt(matchData.striker_runs || '0');
  const strikerBalls = parseInt(matchData.striker_balls || '0');
  const bowlerRuns = parseInt(matchData.bowler_runs || '0');
  const bowlerWickets = parseInt(matchData.bowler_wickets || '0');
  const bowlerOversVal = matchData.bowler_overs || '0';
  const strikerName = matchData.striker_name || '';
  const bowlerName = matchData.bowler_name || '';

  // Identify teams and players
  const battingTeamId = matchData.batting_team === 'team2' ? matchData.team2_id : matchData.team1_id;
  const bowlingTeamId = matchData.batting_team === 'team2' ? matchData.team1_id : matchData.team2_id;
  
  const currentBattingTeam = teams.find(t => t.id === battingTeamId);
  const currentBowlingTeam = teams.find(t => t.id === bowlingTeamId);
  
  const battingPlayers = currentBattingTeam?.players || [];
  const bowlingPlayers = currentBowlingTeam?.players || [];

  // Helper components
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
          if (matchData.is_innings_break === 'true' || matchData.is_pre_match === 'true') {
            updates.push(
              { field: 'is_innings_break', value: 'false' },
              { field: 'is_pre_match', value: 'false' }
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

  // Helper to add runs + update ball count + update striker stats
  function addRuns(runsToAdd, isLegal = true, isExtra = false, customLabel = null) {
    const updates = [];
    updates.push({ field: 'runs', value: runs + runsToAdd });

    if (isLegal) {
      let newBalls = balls + 1;
      let newOvers = overs;
      if (newBalls >= 6) {
        newOvers += 1;
        newBalls = 0;
      }
      
      if (balls === 0 && isLegal) {
        updates.push({ field: 'recent_balls', value: '[]' });
      }

      updates.push({ field: 'balls', value: newBalls });
      updates.push({ field: 'overs', value: newOvers });

      const bOvers = parseFloat(bowlerOversVal);
      const bWhole = Math.floor(bOvers);
      const bBalls = Math.round((bOvers - bWhole) * 10);
      let newBBalls = bBalls + 1;
      let newBWhole = bWhole;
      if (newBBalls >= 6) { newBWhole += 1; newBBalls = 0; }
      updates.push({ field: 'bowler_overs', value: `${newBWhole}.${newBBalls}` });
    }

    updates.push({ field: 'bowler_runs', value: bowlerRuns + runsToAdd });

    if (!isExtra) {
      updates.push({ field: 'striker_runs', value: strikerRuns + runsToAdd });
      if (isLegal) {
        updates.push({ field: 'striker_balls', value: strikerBalls + 1 });
      }
    }

    let ballLabel = customLabel;
    if (!ballLabel) {
      if (isExtra) {
        ballLabel = runsToAdd === 1 ? 'Wd' : 'Nb';
      } else {
        ballLabel = runsToAdd === 0 ? '0' : String(runsToAdd);
      }
    }

    const ballObj = {
      label: ballLabel, run: runsToAdd, extra: isExtra, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };

    emit('match:recordBall', { updates, ball: ballObj });

    const isOverComplete = isLegal && (balls + 1 >= 6);
    const isOddRun = (runsToAdd % 2 === 1) && !isExtra;

    if (isOddRun && isOverComplete) {
      console.log('[MatchControl] Odd run on last ball - Striker stays for next over');
    } else if (isOddRun || isOverComplete) {
      setTimeout(() => swapStrikers(), 50);
    }
  }

  function handleWicket() {
    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'bowler_wickets', value: bowlerWickets + 1 },
    ];

    let newBalls = balls + 1;
    let newOvers = overs;
    if (newBalls >= 6) { newOvers += 1; newBalls = 0; }
    if (balls === 0) updates.push({ field: 'recent_balls', value: '[]' });

    updates.push({ field: 'balls', value: newBalls });
    updates.push({ field: 'overs', value: newOvers });

    const bOvers = parseFloat(bowlerOversVal);
    const bWhole = Math.floor(bOvers);
    const bBalls = Math.round((bOvers - bWhole) * 10);
    let newBBalls = bBalls + 1;
    let newBWhole = bWhole;
    if (newBBalls >= 6) { newBWhole += 1; newBBalls = 0; }
    updates.push({ field: 'bowler_overs', value: `${newBWhole}.${newBBalls}` });

    updates.push({ field: 'striker_balls', value: strikerBalls + 1 });

    const ballObj = {
      label: 'W', run: 0, extra: false, wicket: true,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };

    emit('match:recordBall', { updates, ball: ballObj });

    // Clear striker so user selects a new one
    emit('match:updateBulk', {
      updates: [
        { field: 'striker_name', value: '' },
        { field: 'striker_runs', value: 0 },
        { field: 'striker_balls', value: 0 }
      ]
    });

    if (balls + 1 >= 6) setTimeout(() => swapStrikers(), 50);
  }

  function handleUndo() { emit('match:undo'); }
  function handleWide() { addRuns(1, false, true); }
  function handleNoBall() { addRuns(1, false, true); }
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
    emit('match:recordBall', { updates, ball: ballObj });
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
    emit('match:recordBall', { updates, ball: ballObj });
  }

  function swapStrikers() {
    const updates = [
      { field: 'striker_name', value: matchData.non_striker_name },
      { field: 'striker_runs', value: matchData.non_striker_runs },
      { field: 'striker_balls', value: matchData.non_striker_balls },
      { field: 'non_striker_name', value: matchData.striker_name },
      { field: 'non_striker_runs', value: matchData.striker_runs },
      { field: 'non_striker_balls', value: matchData.striker_balls },
    ];
    emit('match:updateBulk', { updates });
  }

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
    if (!confirm('Are you sure you want to end this match? This will save the final statistics.')) return;
    
    const ballLog = JSON.parse(matchData.ball_log || '[]');
    const performances = { batsmen: {}, bowlers: {} };

    ballLog.forEach(b => {
      const ball = typeof b === 'object' ? b : { run: 0, extra: false, wicket: false, striker: 'Unknown', bowler: 'Unknown' };
      if (ball.striker) {
        if (!performances.batsmen[ball.striker]) performances.batsmen[ball.striker] = { runs: 0, balls: 0, strikeRate: 0 };
        if (!ball.extra) {
          performances.batsmen[ball.striker].runs += ball.run;
          performances.batsmen[ball.striker].balls += 1;
        }
      }
      if (ball.bowler) {
        if (!performances.bowlers[ball.bowler]) performances.bowlers[ball.bowler] = { validBalls: 0, runs: 0, wickets: 0, overs: '0.0', economy: 0 };
        performances.bowlers[ball.bowler].runs += ball.run;
        if (ball.wicket) performances.bowlers[ball.bowler].wickets += 1;
        if (!ball.extra) performances.bowlers[ball.bowler].validBalls += 1;
      }
    });

    Object.keys(performances.batsmen).forEach(name => {
      const p = performances.batsmen[name];
      p.strikeRate = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : 0;
    });

    Object.keys(performances.bowlers).forEach(name => {
      const p = performances.bowlers[name];
      const overs = Math.floor(p.validBalls / 6);
      const remainingBalls = p.validBalls % 6;
      p.overs = `${overs}.${remainingBalls}`;
      const totalOversDec = overs + (remainingBalls / 6);
      p.economy = totalOversDec > 0 ? (p.runs / totalOversDec).toFixed(2) : 0;
    });

    // Calculate Result Message
    const team1Name = matchData.team1_name || 'Team 1';
    const team2Name = matchData.team2_name || 'Team 2';
    const matchName = matchData.match_name || 'Match';
    
    const battingFirstTeam = matchData.batting_team === 'team1' ? team2Name : team1Name; // If current is team1, then team2 was first
    const battingSecondTeam = matchData.batting_team === 'team1' ? team1Name : team2Name;
    
    const score1 = parseInt(matchData.first_innings_total || '0');
    const score2 = runs;
    const targetVal = parseInt(matchData.target || '0');
    
    let resultMessage = '';
    if (score2 >= targetVal) {
      const margin = 10 - wickets;
      resultMessage = `${battingSecondTeam} win the ${matchName} by ${margin} wicket${margin > 1 ? 's' : ''}`;
    } else {
      const margin = (targetVal - 1) - score2;
      if (margin === 0) {
        resultMessage = `The ${matchName} ended in a TIE!`;
      } else {
        resultMessage = `${battingFirstTeam} win the ${matchName} by ${margin} run${margin > 1 ? 's' : ''}`;
      }
    }

    emit('match:updateBulk', {
      updates: [
        { field: 'match_status', value: 'Match Finished' },
        { field: 'is_match_ended', value: 'true' },
        { field: 'final_result_message', value: resultMessage },
        { field: 'match_ended_at', value: Date.now().toString() }
      ]
    });

    emit('match:end', { result: resultMessage, performances });
    alert('Match ended and statistics saved!');
  }

  return (
    <div className="space-y-5">
      {/* Score Display */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-display font-bold text-lg">
              {matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name}
            </h3>
            <span className="text-slate-400 text-xs">Innings {innings}</span>
          </div>
          <div className="text-right">
            <div className="text-white font-display font-black text-4xl">
              {runs}<span className="text-slate-500 text-2xl">/{wickets}</span>
            </div>
            <span className="text-slate-400 text-sm font-mono">{overs}.{balls} overs</span>
          </div>
        </div>

        {/* Current Players */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
          <div className="glass-light rounded-lg p-3 relative overflow-hidden">
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

          <div className="glass-light rounded-lg p-3">
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

          <div className="glass-light rounded-lg p-3">
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
      </div>

      {/* Scoring Buttons */}
        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-400" />
              Match Control
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Overs</span>
                <input 
                  type="number"
                  value={matchData.total_overs || '20'} 
                  onChange={(e) => emit('match:update', { field: 'total_overs', value: e.target.value })}
                  className="bg-transparent text-white text-xs font-bold outline-none w-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Wickets</span>
                <input 
                  type="number"
                  value={matchData.total_wickets || '10'} 
                  onChange={(e) => emit('match:update', { field: 'total_wickets', value: e.target.value })}
                  className="bg-transparent text-white text-xs font-bold outline-none w-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          <button onClick={() => addRuns(0)} className="btn btn-secondary py-3 text-base font-bold">Dot</button>
          <button onClick={() => addRuns(1)} className="btn bg-white/10 text-white py-3 text-base font-bold hover:bg-white/15">+1</button>
          <button onClick={() => addRuns(2)} className="btn bg-blue-500/20 text-blue-300 py-3 text-base font-bold hover:bg-blue-500/30">+2</button>
          <button onClick={() => addRuns(3)} className="btn bg-blue-500/25 text-blue-300 py-3 text-base font-bold hover:bg-blue-500/35">+3</button>
          <button onClick={() => addRuns(4)} className="btn bg-emerald-500/20 text-emerald-300 py-3 text-base font-bold hover:bg-emerald-500/30">+4</button>
          <button onClick={() => addRuns(6)} className="btn bg-amber-500/20 text-amber-300 py-3 text-base font-bold hover:bg-amber-500/30">+6</button>
          <button onClick={handleWide} className="btn bg-purple-500/20 text-purple-300 py-3 text-sm font-bold hover:bg-purple-500/30">Wide</button>
          <button onClick={handleNoBall} className="btn bg-pink-500/20 text-pink-300 py-3 text-sm font-bold hover:bg-pink-500/30">No Ball</button>
          <button onClick={handleWide4} className="btn bg-purple-500/30 text-purple-200 py-3 text-xs font-bold hover:bg-purple-500/40">Wd 4</button>
          <button onClick={handleNoBall4} className="btn bg-pink-500/30 text-pink-200 py-3 text-xs font-bold hover:bg-pink-500/40">NB 4</button>
          <button onClick={handleLegBye5} className="btn bg-orange-500/20 text-orange-300 py-3 text-xs font-bold hover:bg-orange-500/30">LB 5</button>
          <button onClick={handleNoBall6} className="btn bg-rose-500/20 text-rose-300 py-3 text-xs font-bold hover:bg-rose-500/30">NB 6</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={handleWicket} className="btn btn-danger py-3 text-base font-bold">🏏 Wicket</button>
          <button onClick={swapStrikers} className="btn btn-secondary py-3 text-sm font-bold flex items-center gap-1.5">
            <ArrowLeftRight size={16} /> Swap Strikers
          </button>
        </div>
        <button onClick={handleUndo} className="btn bg-white/5 text-slate-400 w-full mt-2 py-2 text-xs font-bold flex items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest">
          <Undo2 size={14} /> Undo Last Ball
        </button>
      </div>

      {/* Match Controls */}
      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-3">Match Controls</h4>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleNewOver} className="btn btn-secondary py-2.5 text-sm">New Over</button>
          {innings === 1 ? (
            <button onClick={handleEndInnings} className="btn bg-amber-500/20 text-amber-300 py-2.5 text-sm hover:bg-amber-500/30">End Innings</button>
          ) : (
            <button onClick={handleEndMatch} className="btn bg-blue-500/20 text-blue-300 py-2.5 text-sm hover:bg-blue-500/30">End Match</button>
          )}
        </div>
        <div className="mt-3">
          <EditableField label="Match Status" field="match_status" wide />
        </div>
      </div>

      {/* Advanced Overlay */}
      <div className="glass rounded-xl overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-5 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors">
          <span className="text-sm font-semibold">Advanced / Manual Override</span>
          {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showAdvanced && (
          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            <EditableField label="Team 1" field="team1_name" />
            <EditableField label="Team 2" field="team2_name" />
            <EditableField label="Runs" field="runs" />
            <EditableField label="Wickets" field="wickets" />
            <EditableField label="Overs" field="overs" />
            <EditableField label="Balls" field="balls" />
            <EditableField label="Innings" field="innings" />
            <EditableField label="Target" field="target" />
            <div className="col-span-2 mt-2">
              <button onClick={() => { if (confirm('Reset all match data?')) emit('match:reset'); }} className="btn btn-danger w-full py-2.5 flex items-center gap-2 justify-center bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white">
                <RotateCcw size={16} /> Reset Match
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Manual Score Correction */}
      <div className="glass rounded-xl p-5 border border-amber-500/30 bg-amber-500/5 mt-6">
        <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-4">
          <Settings size={18} />
          Manual Score Correction (Override)
        </h3>
        
        <div className="space-y-6">
          {/* Team Score Correction */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Runs</label>
              <input type="number" value={matchData.runs || 0} 
                onChange={(e) => emit('match:update', { field: 'runs', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-amber-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Wickets</label>
              <input type="number" value={matchData.wickets || 0} 
                onChange={(e) => emit('match:update', { field: 'wickets', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-amber-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Overs</label>
              <input type="number" value={matchData.overs || 0} 
                onChange={(e) => emit('match:update', { field: 'overs', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-amber-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Balls</label>
              <input type="number" value={matchData.balls || 0} 
                onChange={(e) => emit('match:update', { field: 'balls', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-amber-500/50" 
                min="0" max="5" />
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Player Stats Correction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-emerald-400" /> Striker Stats
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Runs</label>
                  <input type="number" value={matchData.striker_runs || 0} 
                    onChange={(e) => emit('match:update', { field: 'striker_runs', value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Balls</label>
                  <input type="number" value={matchData.striker_balls || 0} 
                    onChange={(e) => emit('match:update', { field: 'striker_balls', value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Wind size={14} className="text-amber-400" /> Bowler Stats
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Runs</label>
                  <input type="number" value={matchData.bowler_runs || 0} 
                    onChange={(e) => emit('match:update', { field: 'bowler_runs', value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Wickets</label>
                  <input type="number" value={matchData.bowler_wickets || 0} 
                    onChange={(e) => emit('match:update', { field: 'bowler_wickets', value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Overs (ex: 2.3)</label>
                  <input type="text" value={matchData.bowler_overs || '0'} 
                    onChange={(e) => emit('match:update', { field: 'bowler_overs', value: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-[10px] text-amber-200/60 leading-relaxed italic">
              <strong>Note:</strong> Manual corrections update the scoreboard immediately but do not affect the ball-by-ball history log. Use this for quick fixes if a ball was recorded incorrectly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
