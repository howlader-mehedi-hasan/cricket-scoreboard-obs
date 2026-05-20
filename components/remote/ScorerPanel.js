import { useState, useEffect } from 'react';
import { ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Edit3, Plus, Minus, Undo2, BarChart2, Settings, Users, Wind, Zap, AlertTriangle, X, Eye } from 'lucide-react';
import RealTimeClock from '@/components/RealTimeClock';

export default function ScorerPanel({ matchData, emit, teams = [] }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExtraControls, setShowExtraControls] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Modals state
  const [showOTModal, setShowOTModal] = useState(false);
  const [showRunOutModal, setShowRunOutModal] = useState(false);
  const [showCustomExtraModal, setShowCustomExtraModal] = useState(false);

  // Configurations
  const [otConfig, setOtConfig] = useState({
    deliveryType: 'normal',
    initialRuns: 0,
    isBoundary: false,
    additionalRuns: 0,
  });

  const [runOutConfig, setRunOutConfig] = useState({
    playerOut: 'striker',
    runsCompleted: 0,
    deliveryType: 'normal'
  });

  const [customExtraConfig, setCustomExtraConfig] = useState({
    type: 'wide',
    runs: 0,
    isOffBat: false
  });

  const [changingStriker, setChangingStriker] = useState(false);
  const [changingNonStriker, setChangingNonStriker] = useState(false);
  const [changingBowler, setChangingBowler] = useState(false);

  // Sync jerseys if missing
  useEffect(() => {
    if (!matchData) return;
    const updates = [];
    const sName = matchData.striker_name || '';
    const nsName = matchData.non_striker_name || '';
    const bName = matchData.bowler_name || '';
    
    const bTeamId = matchData.batting_team === 'team2' ? matchData.team2_id : matchData.team1_id;
    const bwTeamId = matchData.batting_team === 'team2' ? matchData.team1_id : matchData.team2_id;
    const cBattingTeam = teams.find(t => t.id === bTeamId);
    const cBowlingTeam = teams.find(t => t.id === bwTeamId);
    const bPlayers = cBattingTeam?.players || [];
    const bwPlayers = cBowlingTeam?.players || [];

    if (sName && !matchData.striker_jersey) {
      const p = bPlayers.find(pl => pl.name === sName);
      if (p?.jersey) updates.push({ field: 'striker_jersey', value: p.jersey });
    }
    if (nsName && !matchData.non_striker_jersey) {
      const p = bPlayers.find(pl => pl.name === nsName);
      if (p?.jersey) updates.push({ field: 'non_striker_jersey', value: p.jersey });
    }
    if (bName && !matchData.bowler_jersey) {
      const p = bwPlayers.find(pl => pl.name === bName);
      if (p?.jersey) updates.push({ field: 'bowler_jersey', value: p.jersey });
    }
    if (updates.length > 0) {
      emit('match:updateBulk', { updates });
    }
  }, [matchData, teams]);

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

  const getJersey = (name, players) => {
    if (!name) return null;
    const p = players.find(player => player.name === name);
    return p?.jersey ? `#${p.jersey}` : null;
  };

  // Helper Components
  const EditableField = ({ label, field, wide = false, prefix = null }) => (
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
          <span className="text-white text-sm font-medium">
            {prefix && <span className="text-emerald-500 font-black mr-1.5">{prefix}</span>}
            {matchData[field] || '—'}
          </span>
          <Edit3 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );

  const PlayerSelect = ({ label, field, players, isBowler = false, onSelect }) => (
    <div className="w-full">
      {label && <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">{label}</label>}
      <div className="relative group">
        <select
          className="w-full bg-slate-800 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-all pr-10"
          value={matchData[field] || ''}
          autoFocus
          onBlur={onSelect}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'custom') {
               startEdit(field);
               onSelect?.();
               return;
            }
            const updates = [];
            const batHistory = JSON.parse(matchData.batters_history || '{}');

            if (isBowler) {
              const history = JSON.parse(matchData.bowlers_history || '{}');
              if (matchData.bowler_name) {
                history[matchData.bowler_name] = {
                  runs: parseInt(matchData.bowler_runs || '0'),
                  wickets: parseInt(matchData.bowler_wickets || '0'),
                  overs: matchData.bowler_overs || '0.0'
                };
              }
              const newStats = history[val] || { runs: 0, wickets: 0, overs: '0.0' };
              const selectedPlayer = players.find(p => p.name === val);
              updates.push(
                { field: 'bowler_name', value: val },
                { field: 'bowler_runs', value: newStats.runs },
                { field: 'bowler_wickets', value: newStats.wickets },
                { field: 'bowler_overs', value: newStats.overs },
                { field: 'bowler_jersey', value: selectedPlayer?.jersey || '' },
                { field: 'bowlers_history', value: JSON.stringify(history) }
              );
            } else {
              const currentName = matchData[field];
              if (currentName) {
                batHistory[currentName] = {
                  runs: parseInt(matchData[field.replace('_name', '_runs')] || '0'),
                  balls: parseInt(matchData[field.replace('_name', '_balls')] || '0'),
                  isOut: false
                };
              }
              const newStats = batHistory[val] || { runs: 0, balls: 0, isOut: false };
              const selectedPlayer = players.find(p => p.name === val);
              updates.push(
                { field: field, value: val },
                { field: field.replace('_name', '_runs'), value: newStats.runs },
                { field: field.replace('_name', '_balls'), value: newStats.balls },
                { field: field.replace('_name', '_jersey'), value: selectedPlayer?.jersey || '' },
                { field: 'batters_history', value: JSON.stringify(batHistory) }
              );
            }
            emit('match:updateBulk', { updates });
            onSelect?.();
          }}
        >
          <option value="">-- Select --</option>
          {players.map(p => (
            <option key={p.id} value={p.name}>
              {p.name} {p.jersey ? `(#${p.jersey})` : ''}
            </option>
          ))}
          <option value="custom">✎ Custom Entry...</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400">
           <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );

  // Scoring Logic Functions (Mirrored from MatchControl.js)
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

  function addRuns(runsToAdd, isLegal = true, isExtra = false, customLabel = null, deliveryType = 'normal', runsOffBat = null) {
    const updates = [];
    updates.push({ field: 'runs', value: runs + runsToAdd });
    
    const pRuns = parseInt(matchData.partnership_runs || '0');
    const pBalls = parseInt(matchData.partnership_balls || '0');
    updates.push({ field: 'partnership_runs', value: pRuns + runsToAdd });
    updates.push({ field: 'partnership_balls', value: pBalls + (isLegal || deliveryType === 'noball' ? 1 : 0) });

    const rb = JSON.parse(matchData.recent_balls || '[]');
    const hasLegalInRecent = rb.some(b => {
      const lbl = String(typeof b === 'object' ? b.label : b || '').toLowerCase();
      return lbl && !lbl.includes('wd') && !lbl.includes('nb') && lbl !== 'empty';
    });

    if (balls === 0 && hasLegalInRecent) {
      updates.push({ field: 'recent_balls', value: '[]' });
    }

    if (isLegal) {
      let newBalls = balls + 1;
      let newOvers = overs;
      if (newBalls >= 6) { newOvers += 1; newBalls = 0; }
      updates.push({ field: 'balls', value: newBalls }, { field: 'overs', value: newOvers });

      const bOvers = parseFloat(bowlerOversVal);
      const bWhole = Math.floor(bOvers);
      const bBalls = Math.round((bOvers - bWhole) * 10);
      let nbb = bBalls + 1, nbw = bWhole;
      if (nbb >= 6) { nbw++; nbb = 0; }
      updates.push({ field: 'bowler_overs', value: `${nbw}.${nbb}` });
    }

    if (deliveryType === 'wide' || deliveryType === 'noball' || deliveryType === 'normal') {
       updates.push({ field: 'bowler_runs', value: bowlerRuns + runsToAdd });
    }

    if (!isExtra || deliveryType === 'noball') {
      const runsForStriker = runsOffBat !== null ? runsOffBat : (deliveryType === 'noball' ? runsToAdd - 1 : runsToAdd);
      updates.push({ field: 'striker_runs', value: strikerRuns + runsForStriker });
      if (isLegal || deliveryType === 'noball') updates.push({ field: 'striker_balls', value: strikerBalls + 1 });
    }

    const prefixMap = { normal: '', wide: 'Wd', noball: 'NB', bye: 'B', legbye: 'LB' };
    const prefix = prefixMap[deliveryType] || '';
    const ballLabel = customLabel || (prefix ? (runsToAdd > 1 ? `${prefix}${runsToAdd}` : prefix) : String(runsToAdd));

    const ballObj = {
      label: ballLabel, run: runsToAdd, extra: isExtra, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
    };

    emit('match:recordBall', { updates, ball: ballObj });

    const isOverComplete = isLegal && (balls + 1 >= 6);
    const runsForSwap = runsOffBat !== null ? runsOffBat : (deliveryType === 'noball' ? runsToAdd - 1 : runsToAdd);
    if (((runsForSwap % 2 === 1) && !isOverComplete) || ((runsForSwap % 2 === 0) && isOverComplete)) {
       setTimeout(() => swapStrikers(), 100);
    }
  }

  function handleWicket() {
    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'bowler_wickets', value: bowlerWickets + 1 },
      { field: 'partnership_runs', value: 0 },
      { field: 'partnership_balls', value: 0 },
    ];
    let nb = balls + 1, no = overs;
    if (nb >= 6) { no++; nb = 0; }
    if (balls === 0) updates.push({ field: 'recent_balls', value: '[]' });
    updates.push({ field: 'balls', value: nb }, { field: 'overs', value: no });

    const bo = parseFloat(bowlerOversVal), bw = Math.floor(bo), bb = Math.round((bo - bw) * 10);
    let nbb = bb + 1, nbw = bw;
    if (nbb >= 6) { nbw++; nbb = 0; }
    updates.push({ field: 'bowler_overs', value: `${nbw}.${nbb}` });

    const batHistory = JSON.parse(matchData.batters_history || '{}');
    if (strikerName) {
      batHistory[strikerName] = { runs: strikerRuns, balls: strikerBalls, isOut: true };
      updates.push({ field: 'batters_history', value: JSON.stringify(batHistory) });
    }

    if (nb === 0) {
      updates.push(
        { field: 'striker_name', value: matchData.non_striker_name },
        { field: 'striker_runs', value: parseInt(matchData.non_striker_runs || '0') },
        { field: 'striker_balls', value: parseInt(matchData.non_striker_balls || '0') },
        { field: 'non_striker_name', value: '' },
        { field: 'non_striker_runs', value: 0 },
        { field: 'non_striker_balls', value: 0 },
        { field: 'striker_on_top', value: matchData.striker_on_top === 'false' ? 'true' : 'false' }
      );
    } else {
      updates.push({ field: 'striker_name', value: '' }, { field: 'striker_runs', value: 0 }, { field: 'striker_balls', value: 0 });
    }

    updates.push(
      { field: 'show_wicket_card', value: 'true' },
      { field: 'last_out_name', value: strikerName },
      { field: 'last_out_runs', value: strikerRuns },
      { field: 'last_out_balls', value: strikerBalls },
      { field: 'last_out_team', value: matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name },
      { field: 'wicket_card_at', value: Date.now().toString() }
    );

    const ballObj = { label: 'W', run: 0, extra: false, wicket: true, striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(), innings: parseInt(matchData.innings || '1') };
    emit('match:recordBall', { updates, ball: ballObj });
  }

  function swapStrikers() {
    emit('match:updateBulk', { updates: [
      { field: 'striker_name', value: matchData.non_striker_name },
      { field: 'striker_runs', value: parseInt(matchData.non_striker_runs || '0') },
      { field: 'striker_balls', value: parseInt(matchData.non_striker_balls || '0') },
      { field: 'striker_jersey', value: matchData.non_striker_jersey || '' },
      { field: 'non_striker_name', value: matchData.striker_name },
      { field: 'non_striker_runs', value: parseInt(matchData.striker_runs || '0') },
      { field: 'non_striker_balls', value: parseInt(matchData.striker_balls || '0') },
      { field: 'non_striker_jersey', value: matchData.striker_jersey || '' },
      { field: 'striker_on_top', value: matchData.striker_on_top === 'false' ? 'true' : 'false' }
    ]});
  }

  function handleOverthrow(initialRuns, overthrowRuns, deliveryType = 'normal', isBoundary = false) {
    const actualOTRuns = isBoundary ? 4 : overthrowRuns;
    const totalRunsFromDelivery = initialRuns + actualOTRuns;
    const isLegal = deliveryType === 'normal' || deliveryType === 'bye' || deliveryType === 'legbye';
    const extraPenalty = (deliveryType === 'wide' || deliveryType === 'noball') ? 1 : 0;
    const totalTeamRuns = totalRunsFromDelivery + extraPenalty;
    
    const updates = [{ field: 'runs', value: runs + totalTeamRuns }];
    if (isLegal) {
      let nb = balls + 1, no = overs;
      if (nb >= 6) { no++; nb = 0; }
      updates.push({ field: 'balls', value: nb }, { field: 'overs', value: no });
    }
    
    const prefixMap = { normal: '', wide: 'Wd', noball: 'NB', bye: 'B', legbye: 'LB' };
    const label = `${prefixMap[deliveryType]}${totalRunsFromDelivery}+OT${isBoundary ? '4' : ''}`;
    const ballObj = { label, run: totalTeamRuns, extra: !isLegal, wicket: false, striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(), innings: parseInt(matchData.innings || '1') };
    emit('match:recordBall', { updates, ball: ballObj });
  }

  // UI Render
  const teamName = matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-20">
      {/* Header Scoreboard */}
      <div className="glass rounded-3xl p-6 text-center border border-white/10 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
            <RealTimeClock />
            <div className="flex gap-2">
                <button onClick={() => emit('match:update', { field: 'show_scoreboard', value: matchData.show_scoreboard === 'false' ? 'true' : 'false' })}
                    className={`p-2 rounded-xl border transition-all ${matchData.show_scoreboard !== 'false' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                    <Eye size={18} className={matchData.show_scoreboard !== 'false' ? 'animate-pulse' : ''} />
                </button>
                <button onClick={() => emit('match:update', { field: 'show_partnership', value: matchData.show_partnership === 'true' ? 'false' : 'true' })}
                    className={`p-2 rounded-xl border transition-all ${matchData.show_partnership === 'true' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                    <ArrowLeftRight size={18} className={matchData.show_partnership === 'true' ? 'animate-pulse' : ''} />
                </button>
            </div>
        </div>
        <span className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">{teamName}</span>
        <div className="text-white font-display font-black text-6xl my-2 tracking-tighter">
            {runs}<span className="text-slate-500 text-3xl">/{wickets}</span>
        </div>
        <div className="flex items-center justify-center gap-3">
            <span className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-2xl text-sm font-black font-mono border border-white/5">
                {overs}.{balls} <span className="text-[10px] text-slate-500 font-normal uppercase ml-1">Overs</span>
            </span>
            {matchData.free_hit === 'true' && (
                <span className="bg-amber-500 text-slate-950 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase animate-pulse border border-white/20">
                    FREE HIT
                </span>
            )}
        </div>
      </div>

      {/* Players Section */}
      <div className="grid grid-cols-1 gap-3">
         {/* Striker Card */}
         <div className={`glass-light rounded-2xl p-4 border-l-4 transition-all ${matchData.striker_on_top !== 'false' ? 'border-emerald-500 bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'border-slate-800 opacity-80 scale-[0.98]'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${matchData.striker_on_top !== 'false' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse' : 'bg-slate-700'}`} />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">Striker</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setChangingStriker(true)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-emerald-400 border border-white/5"><Plus size={16}/></button>
                    <button onClick={() => emit('match:update', {field: 'striker_name', value: ''})} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-white/5"><RotateCcw size={16}/></button>
                </div>
            </div>
            
            {changingStriker ? (
                <PlayerSelect label="" field="striker_name" players={battingPlayers} onSelect={() => setChangingStriker(false)} />
            ) : (
                <div className="flex items-baseline justify-between">
                    <div className="flex flex-col">
                        <EditableField label="" field="striker_name" prefix={getJersey(matchData.striker_name, battingPlayers)} />
                        <span className="text-white text-4xl font-black font-mono mt-1 tracking-tighter">
                            {strikerRuns} <span className="text-slate-500 text-2xl font-normal">({strikerBalls})</span>
                        </span>
                    </div>
                    <button onClick={swapStrikers} className="bg-slate-800 p-4 rounded-2xl text-slate-400 border border-white/5 active:scale-90 transition-all shadow-xl hover:text-emerald-400">
                        <ArrowLeftRight size={24} />
                    </button>
                </div>
            )}
         </div>

         {/* Non-Striker Card */}
         <div className={`glass-light rounded-2xl p-4 border-l-4 transition-all ${matchData.striker_on_top === 'false' ? 'border-emerald-500 bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'border-slate-800 opacity-80 scale-[0.98]'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${matchData.striker_on_top === 'false' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse' : 'bg-slate-700'}`} />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">Non-Striker</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setChangingNonStriker(true)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-emerald-400 border border-white/5"><Plus size={16}/></button>
                    <button onClick={() => emit('match:update', {field: 'non_striker_name', value: ''})} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-white/5"><RotateCcw size={16}/></button>
                </div>
            </div>
            {changingNonStriker ? (
                <PlayerSelect label="" field="non_striker_name" players={battingPlayers} onSelect={() => setChangingNonStriker(false)} />
            ) : (
                <div className="flex flex-col">
                    <EditableField label="" field="non_striker_name" prefix={getJersey(matchData.non_striker_name, battingPlayers)} />
                    <span className="text-slate-300 text-3xl font-black font-mono mt-1 tracking-tighter">
                        {matchData.non_striker_runs || 0} <span className="text-slate-600 text-xl font-normal">({matchData.non_striker_balls || 0})</span>
                    </span>
                </div>
            )}
         </div>

         {/* Bowler Card */}
         <div className="glass-light rounded-2xl p-4 border-l-4 border-amber-500 bg-amber-500/5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)] animate-pulse" />
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black italic">Bowler</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setChangingBowler(true)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 border border-white/5"><Plus size={16}/></button>
                    <button onClick={() => emit('match:update', {field: 'bowler_name', value: ''})} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-white/5"><RotateCcw size={16}/></button>
                </div>
            </div>
            {changingBowler ? (
                <PlayerSelect label="" field="bowler_name" players={bowlingPlayers} isBowler onSelect={() => setChangingBowler(false)} />
            ) : (
                <div className="flex flex-col">
                    <EditableField label="" field="bowler_name" prefix={getJersey(matchData.bowler_name, bowlingPlayers)} />
                    <span className="text-white text-4xl font-black font-mono mt-1 tracking-tighter">
                        {bowlerWickets}/{bowlerRuns} <span className="text-slate-500 text-2xl font-normal">({bowlerOversVal})</span>
                    </span>
                </div>
            )}
         </div>
      </div>

      {/* Control Dashboard */}
      <div className="glass rounded-[2rem] p-6 border border-white/10 space-y-6 shadow-2xl">
          {/* Main Scoring Row */}
          <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} onClick={() => addRuns(r)} 
                    className={`h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl active:scale-95 transition-all border-b-4 ${
                        r === 4 ? 'bg-emerald-500 text-slate-950 border-emerald-700' : 
                        r === 6 ? 'bg-amber-500 text-slate-950 border-amber-700' : 
                        r === 0 ? 'bg-slate-800 text-slate-500 border-slate-950' :
                        'bg-white text-slate-900 border-slate-200'
                    }`}>
                    {r === 0 ? '•' : r}
                  </button>
              ))}
              <button onClick={() => setShowExtraControls(!showExtraControls)} className={`h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 shadow-xl active:scale-95 transition-all ${showExtraControls ? 'bg-cyan-500 text-slate-950 border-cyan-700' : 'bg-slate-800 text-cyan-400 border-slate-950'}`}>
                  <Plus size={20} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1">Extras</span>
              </button>
              <button onClick={() => setShowOTModal(true)} className="h-16 bg-slate-800 text-cyan-400 rounded-2xl flex flex-col items-center justify-center border-b-4 border-slate-950 shadow-xl active:scale-95 transition-all">
                  <Wind size={20} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1">Overthrow</span>
              </button>
          </div>

          {/* Expanded Extras Grid */}
          {showExtraControls && (
              <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-300">
                  <button onClick={() => addRuns(1, false, true, 'Wd', 'wide')} className="py-3 bg-purple-500/20 text-purple-300 rounded-xl text-xs font-black border border-purple-500/30">WIDE</button>
                  <button onClick={() => addRuns(1, false, true, 'NB', 'noball')} className="py-3 bg-pink-500/20 text-pink-300 rounded-xl text-xs font-black border border-pink-500/30">NO BALL</button>
                  <button onClick={() => addRuns(1, true, true, 'B1', 'bye')} className="py-3 bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-black border border-indigo-500/30">BYE</button>
                  <button onClick={() => addRuns(1, true, true, 'LB1', 'legbye')} className="py-3 bg-orange-500/20 text-orange-300 rounded-xl text-xs font-black border border-orange-500/30">LB</button>
                  <button onClick={() => addRuns(5, false, true, 'Wd4', 'wide')} className="py-3 bg-purple-500/40 text-purple-100 rounded-xl text-xs font-black border border-purple-500/30">WD +4</button>
                  <button onClick={() => addRuns(4, true, true, 'B4', 'bye')} className="py-3 bg-indigo-500/40 text-indigo-100 rounded-xl text-xs font-black border border-indigo-500/30">B 4</button>
                  <button onClick={() => addRuns(4, true, true, 'LB4', 'legbye')} className="py-3 bg-orange-500/40 text-orange-100 rounded-xl text-xs font-black border border-orange-500/30">LB 4</button>
                  <button onClick={() => setShowCustomExtraModal(true)} className="py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-black border border-white/5">CUSTOM</button>
              </div>
          )}

          {/* Dismissal Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={handleWicket} className="h-20 bg-red-600 text-white rounded-3xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_40px_rgba(220,38,38,0.3)] active:scale-95 transition-all border-b-8 border-red-900">
                  <Zap size={32} className="fill-white" />
                  <span className="text-xl font-black italic tracking-tight">WICKET</span>
              </button>
              <button onClick={() => setShowRunOutModal(true)} className="h-20 bg-orange-600 text-white rounded-3xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_40px_rgba(234,88,12,0.3)] active:scale-95 transition-all border-b-8 border-orange-900">
                  <Users size={32} className="fill-white" />
                  <span className="text-xl font-black italic tracking-tight">RUN OUT</span>
              </button>
          </div>

          {/* System Buttons */}
          <div className="grid grid-cols-2 gap-3">
              <button onClick={() => emit('match:undo')} className="h-14 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] border border-white/5 active:scale-95 transition-all">
                  <Undo2 size={18} /> Undo
              </button>
              <button onClick={() => emit('match:update', { field: 'free_hit', value: matchData.free_hit === 'true' ? 'false' : 'true' })}
                  className={`h-14 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${matchData.free_hit === 'true' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-600 border-white/5'}`}>
                  <Zap size={18} /> Free Hit
              </button>
          </div>

          {/* Advanced Toggles */}
          <div className="space-y-3">
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 rounded-2xl border border-white/5 text-slate-500 hover:text-white transition-all">
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Settings size={14} /> Advanced Management
                  </span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showAdvanced && (
                  <div className="space-y-4 p-4 bg-slate-900/50 rounded-[1.5rem] border border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">PowerPlay</label>
                              <div className="flex gap-1 bg-black/30 p-1 rounded-xl">
                                  {['P1', 'P2', 'P3'].map(p => (
                                      <button key={p} onClick={() => emit('match:update', { field: 'powerplay', value: p })}
                                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${ (matchData.powerplay || 'P1') === p ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}>
                                          {p}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Limits</label>
                              <div className="flex gap-2">
                                  <div className="flex-1 bg-black/30 p-2 rounded-xl border border-white/5 text-center">
                                      <span className="text-[8px] text-slate-600 block">Overs</span>
                                      <input type="number" value={matchData.total_overs || '20'} onChange={e => emit('match:update', { field: 'total_overs', value: e.target.value })} className="bg-transparent text-white text-xs font-black outline-none w-full text-center" />
                                  </div>
                                  <div className="flex-1 bg-black/30 p-2 rounded-xl border border-white/5 text-center">
                                      <span className="text-[8px] text-slate-600 block">Wkts</span>
                                      <input type="number" value={matchData.total_wickets || '10'} onChange={e => emit('match:update', { field: 'total_wickets', value: e.target.value })} className="bg-transparent text-white text-xs font-black outline-none w-full text-center" />
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="h-px bg-white/5" />
                      
                      <div className="space-y-2">
                          <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest italic">Manual Score Correction</label>
                          <div className="grid grid-cols-4 gap-2">
                              {['runs', 'wickets', 'overs', 'balls'].map(f => (
                                  <div key={f} className="bg-black/40 p-2 rounded-xl border border-white/5">
                                      <span className="text-[8px] text-slate-600 block uppercase">{f}</span>
                                      <input type="number" value={matchData[f] || 0} onChange={e => emit('match:update', {field: f, value: parseInt(e.target.value)||0})} className="bg-transparent text-white text-sm font-black outline-none w-full text-center" />
                                  </div>
                              ))}
                          </div>
                      </div>

                      <button onClick={() => { if(confirm('RESET MATCH?')) emit('match:reset'); }} className="w-full py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                          Reset Entire Match
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* MODALS */}
      {showOTModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setShowOTModal(false)} />
              <div className="relative glass rounded-[2.5rem] p-8 w-full max-w-sm border border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em]">Advanced Scoring</span>
                        <h3 className="text-white font-black italic tracking-tighter text-3xl uppercase leading-none">Overthrow</h3>
                      </div>
                      <button onClick={() => setShowOTModal(false)} className="bg-white/5 p-2 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center block">Before Throw</label>
                              <div className="flex items-center justify-center gap-4 bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                                  <button onClick={() => setOtConfig({...otConfig, initialRuns: Math.max(0, otConfig.initialRuns - 1)})} className="text-slate-500 active:text-white"><Minus size={20}/></button>
                                  <span className="text-white text-4xl font-black font-mono">{otConfig.initialRuns}</span>
                                  <button onClick={() => setOtConfig({...otConfig, initialRuns: otConfig.initialRuns + 1})} className="text-slate-500 active:text-white"><Plus size={20}/></button>
                              </div>
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center block">After Throw</label>
                              <div className="flex items-center justify-center gap-4 bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                                  <button onClick={() => setOtConfig({...otConfig, additionalRuns: Math.max(0, otConfig.additionalRuns - 1)})} className="text-slate-500 active:text-white"><Minus size={20}/></button>
                                  <span className="text-white text-4xl font-black font-mono">{otConfig.additionalRuns}</span>
                                  <button onClick={() => setOtConfig({...otConfig, additionalRuns: otConfig.additionalRuns + 1})} className="text-slate-500 active:text-white"><Plus size={20}/></button>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="flex gap-2">
                             {['normal', 'wide', 'noball'].map(t => (
                                 <button key={t} onClick={() => setOtConfig({...otConfig, deliveryType: t})}
                                     className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${otConfig.deliveryType === t ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900/50 text-slate-500 border-white/5'}`}>
                                     {t}
                                 </button>
                             ))}
                          </div>
                          <button onClick={() => setOtConfig({...otConfig, isBoundary: !otConfig.isBoundary})}
                              className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border ${otConfig.isBoundary ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900/50 text-slate-600 border-white/5'}`}>
                              {otConfig.isBoundary ? '🏏 Boundary (+4)' : 'No Boundary'}
                          </button>
                      </div>

                      <button onClick={() => { handleOverthrow(otConfig.initialRuns, otConfig.additionalRuns, otConfig.deliveryType, otConfig.isBoundary); setShowOTModal(false); }}
                          className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-3xl font-black italic text-xl shadow-2xl active:scale-95 transition-all border-b-8 border-blue-800">
                          RECORD OVERTHROW
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showRunOutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setShowRunOutModal(false)} />
              <div className="relative glass rounded-[2.5rem] p-8 w-full max-w-sm border border-orange-500/30 shadow-[0_0_100px_rgba(249,115,22,0.1)]">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-orange-400 font-black uppercase tracking-[0.3em]">Wicket Manager</span>
                        <h3 className="text-white font-black italic tracking-tighter text-3xl uppercase leading-none">Run Out</h3>
                      </div>
                      <button onClick={() => setShowRunOutModal(false)} className="bg-white/5 p-2 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setRunOutConfig({...runOutConfig, playerOut: 'striker'})}
                              className={`py-6 rounded-3xl flex flex-col items-center gap-2 transition-all border-2 ${runOutConfig.playerOut === 'striker' ? 'bg-red-500 border-red-400 text-white shadow-2xl' : 'bg-slate-900/50 border-white/5 text-slate-600'}`}>
                              <span className="font-black italic text-lg uppercase leading-none">Striker</span>
                              <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest truncate max-w-full px-2">{strikerName || 'Out'}</span>
                          </button>
                          <button onClick={() => setRunOutConfig({...runOutConfig, playerOut: 'non-striker'})}
                              className={`py-6 rounded-3xl flex flex-col items-center gap-2 transition-all border-2 ${runOutConfig.playerOut === 'non-striker' ? 'bg-red-500 border-red-400 text-white shadow-2xl' : 'bg-slate-900/50 border-white/5 text-slate-600'}`}>
                              <span className="font-black italic text-lg uppercase leading-none">N-Striker</span>
                              <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest truncate max-w-full px-2">{matchData.non_striker_name || 'Out'}</span>
                          </button>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center block">Runs Completed</label>
                          <div className="grid grid-cols-5 gap-2">
                              {[0, 1, 2, 3, 4].map(r => (
                                  <button key={r} onClick={() => setRunOutConfig({...runOutConfig, runsCompleted: r})}
                                      className={`h-12 rounded-xl text-xl font-black transition-all border ${runOutConfig.runsCompleted === r ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900/50 text-slate-600 border-white/5'}`}>
                                      {r}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <button onClick={() => { handleRunOutSubmit(); setShowRunOutModal(false); }}
                          className="w-full py-5 bg-gradient-to-r from-red-600 to-orange-700 text-white rounded-3xl font-black italic text-xl shadow-2xl active:scale-95 transition-all border-b-8 border-red-900">
                          CONFIRM DISMISSAL
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showCustomExtraModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setShowCustomExtraModal(false)} />
              <div className="relative glass rounded-[2.5rem] p-8 w-full max-w-sm border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em]">Custom Entry</span>
                        <h3 className="text-white font-black italic tracking-tighter text-3xl uppercase leading-none">Extra Runs</h3>
                      </div>
                      <button onClick={() => setShowCustomExtraModal(false)} className="bg-white/5 p-2 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-2">
                          {['wide', 'noball', 'bye', 'legbye'].map(t => (
                              <button key={t} onClick={() => setCustomExtraConfig({...customExtraConfig, type: t})}
                                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${customExtraConfig.type === t ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900/50 text-slate-500 border-white/5'}`}>
                                  {t}
                              </button>
                          ))}
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center block">Total Runs</label>
                          <div className="flex items-center justify-center gap-6 bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                              <button onClick={() => setCustomExtraConfig({...customExtraConfig, runs: Math.max(0, customExtraConfig.runs - 1)})} className="text-slate-500"><Minus size={24}/></button>
                              <span className="text-white text-5xl font-black font-mono">{customExtraConfig.runs}</span>
                              <button onClick={() => setCustomExtraConfig({...customExtraConfig, runs: customExtraConfig.runs + 1})} className="text-slate-500"><Plus size={24}/></button>
                          </div>
                      </div>

                      <button onClick={() => { addRuns(customExtraConfig.runs, customExtraConfig.type === 'bye' || customExtraConfig.type === 'legbye', true, null, customExtraConfig.type); setShowCustomExtraModal(false); }}
                          className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 rounded-3xl font-black italic text-xl shadow-2xl active:scale-95 transition-all border-b-8 border-emerald-800">
                          APPLY EXTRA
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
