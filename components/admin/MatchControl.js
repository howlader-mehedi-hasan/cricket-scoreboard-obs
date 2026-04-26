import { useState } from 'react';
import { ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Edit3, Plus, Minus } from 'lucide-react';

export default function MatchControl({ matchData, emit }) {
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

  // Helper to add runs + update ball count + update striker stats
  function addRuns(runsToAdd, isLegal = true, isExtra = false) {
    const updates = [];
    updates.push({ field: 'runs', value: runs + runsToAdd });

    if (isLegal) {
      let newBalls = balls + 1;
      let newOvers = overs;
      if (newBalls >= 6) {
        newOvers += 1;
        newBalls = 0;
      }
      updates.push({ field: 'balls', value: newBalls });
      updates.push({ field: 'overs', value: newOvers });

      // Update bowler overs
      const bOvers = parseFloat(bowlerOversVal);
      const bWhole = Math.floor(bOvers);
      const bBalls = Math.round((bOvers - bWhole) * 10);
      let newBBalls = bBalls + 1;
      let newBWhole = bWhole;
      if (newBBalls >= 6) { newBWhole += 1; newBBalls = 0; }
      updates.push({ field: 'bowler_overs', value: `${newBWhole}.${newBBalls}` });
    }

    // Update bowler runs
    updates.push({ field: 'bowler_runs', value: bowlerRuns + runsToAdd });

    if (!isExtra) {
      // Update striker stats
      updates.push({ field: 'striker_runs', value: strikerRuns + runsToAdd });
      if (isLegal) {
        updates.push({ field: 'striker_balls', value: strikerBalls + 1 });
      }
    }

    // Add ball to timeline
    let ballLabel;
    if (isExtra) {
      ballLabel = runsToAdd === 1 ? 'Wd' : 'Nb';
    } else {
      ballLabel = runsToAdd === 0 ? '0' : String(runsToAdd);
    }

    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: ballLabel });

    // Swap striker on odd runs (1, 3)
    if (runsToAdd % 2 === 1 && !isExtra) {
      setTimeout(() => swapStrikers(), 50);
    }
  }

  function handleWicket() {
    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'bowler_wickets', value: bowlerWickets + 1 },
    ];

    // Legal delivery
    let newBalls = balls + 1;
    let newOvers = overs;
    if (newBalls >= 6) {
      newOvers += 1;
      newBalls = 0;
    }
    updates.push({ field: 'balls', value: newBalls });
    updates.push({ field: 'overs', value: newOvers });

    // Update bowler overs
    const bOvers = parseFloat(bowlerOversVal);
    const bWhole = Math.floor(bOvers);
    const bBalls = Math.round((bOvers - bWhole) * 10);
    let newBBalls = bBalls + 1;
    let newBWhole = bWhole;
    if (newBBalls >= 6) { newBWhole += 1; newBBalls = 0; }
    updates.push({ field: 'bowler_overs', value: `${newBWhole}.${newBBalls}` });

    updates.push({ field: 'striker_balls', value: strikerBalls + 1 });

    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: 'W' });
  }

  function handleWide() {
    addRuns(1, false, true); // 1 run, not legal, is extra
  }

  function handleNoBall() {
    addRuns(1, false, true); // 1 run, not legal, is extra
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
    // Swap strikers at end of over
    swapStrikers();
    // Reset bowler name for new bowler entry
    emit('match:update', { field: 'bowler_name', value: 'New Bowler' });
    emit('match:update', { field: 'bowler_overs', value: '0' });
    emit('match:update', { field: 'bowler_runs', value: '0' });
    emit('match:update', { field: 'bowler_wickets', value: '0' });
    emit('match:update', { field: 'bowler_maidens', value: '0' });
  }

  function handleEndInnings() {
    const newInnings = innings + 1;
    const currentRuns = runs;
    emit('match:updateBulk', {
      updates: [
        { field: 'innings', value: newInnings },
        { field: 'target', value: currentRuns + 1 },
        { field: 'runs', value: 0 },
        { field: 'wickets', value: 0 },
        { field: 'overs', value: 0 },
        { field: 'balls', value: 0 },
        { field: 'striker_name', value: 'Batsman 1' },
        { field: 'striker_runs', value: 0 },
        { field: 'striker_balls', value: 0 },
        { field: 'non_striker_name', value: 'Batsman 2' },
        { field: 'non_striker_runs', value: 0 },
        { field: 'non_striker_balls', value: 0 },
        { field: 'bowler_name', value: 'Bowler 1' },
        { field: 'bowler_overs', value: '0' },
        { field: 'bowler_runs', value: 0 },
        { field: 'bowler_wickets', value: 0 },
        { field: 'bowler_maidens', value: 0 },
        { field: 'recent_balls', value: '[]' },
        { field: 'batting_team', value: matchData.batting_team === 'team1' ? 'team2' : 'team1' },
        { field: 'match_status', value: `Innings ${newInnings}` },
      ],
    });
  }

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
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Striker</span>
            </div>
            <EditableField label="" field="striker_name" />
            <span className="text-slate-300 text-sm font-mono mt-1 block">
              {strikerRuns} ({strikerBalls})
            </span>
          </div>
          <div className="glass-light rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Bowler</span>
            <EditableField label="" field="bowler_name" />
            <span className="text-slate-300 text-sm font-mono mt-1 block">
              {bowlerWickets}/{bowlerRuns} ({bowlerOversVal} ov)
            </span>
          </div>
        </div>
      </div>

      {/* Scoring Buttons */}
      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Scoring
        </h4>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => addRuns(0)} className="btn btn-secondary py-3 text-base font-bold">Dot</button>
          <button onClick={() => addRuns(1)} className="btn bg-white/10 text-white py-3 text-base font-bold hover:bg-white/15">+1</button>
          <button onClick={() => addRuns(2)} className="btn bg-blue-500/20 text-blue-300 py-3 text-base font-bold hover:bg-blue-500/30">+2</button>
          <button onClick={() => addRuns(3)} className="btn bg-blue-500/25 text-blue-300 py-3 text-base font-bold hover:bg-blue-500/35">+3</button>
          <button onClick={() => addRuns(4)} className="btn bg-emerald-500/20 text-emerald-300 py-3 text-base font-bold hover:bg-emerald-500/30">+4</button>
          <button onClick={() => addRuns(6)} className="btn bg-amber-500/20 text-amber-300 py-3 text-base font-bold hover:bg-amber-500/30">+6</button>
          <button onClick={handleWide} className="btn bg-purple-500/20 text-purple-300 py-3 text-sm font-bold hover:bg-purple-500/30">Wide</button>
          <button onClick={handleNoBall} className="btn bg-pink-500/20 text-pink-300 py-3 text-sm font-bold hover:bg-pink-500/30">No Ball</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={handleWicket} className="btn btn-danger py-3 text-base font-bold">🏏 Wicket</button>
          <button onClick={swapStrikers} className="btn btn-secondary py-3 text-sm font-bold flex items-center gap-1.5">
            <ArrowLeftRight size={16} /> Swap Strikers
          </button>
        </div>
      </div>

      {/* Match Controls */}
      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-3">Match Controls</h4>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleNewOver} className="btn btn-secondary py-2.5 text-sm">New Over</button>
          <button onClick={handleEndInnings} className="btn bg-amber-500/20 text-amber-300 py-2.5 text-sm hover:bg-amber-500/30">End Innings</button>
        </div>

        {/* Match Status */}
        <div className="mt-3">
          <EditableField label="Match Status" field="match_status" wide />
        </div>
      </div>

      {/* Advanced: Edit All Fields */}
      <div className="glass rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-5 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
        >
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
            <EditableField label="Striker" field="striker_name" />
            <EditableField label="Striker Runs" field="striker_runs" />
            <EditableField label="Striker Balls" field="striker_balls" />
            <EditableField label="Non-Striker" field="non_striker_name" />
            <EditableField label="Non-Striker Runs" field="non_striker_runs" />
            <EditableField label="Non-Striker Balls" field="non_striker_balls" />
            <EditableField label="Bowler" field="bowler_name" />
            <EditableField label="Bowler Overs" field="bowler_overs" />
            <EditableField label="Bowler Runs" field="bowler_runs" />
            <EditableField label="Bowler Wickets" field="bowler_wickets" />

            <div className="col-span-2 mt-2">
              <button
                onClick={() => { if (confirm('Reset all match data?')) emit('match:reset'); }}
                className="btn btn-danger w-full py-2.5 flex items-center gap-2 justify-center"
              >
                <RotateCcw size={16} /> Reset Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
