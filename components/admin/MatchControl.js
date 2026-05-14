import { useState, useEffect } from 'react';
import { ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Edit3, Plus, Minus, Undo2, BarChart2, Settings, Users, Wind, Zap, AlertTriangle, X, Eye } from 'lucide-react';

export default function MatchControl({ matchData, emit, teams = [] }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showOTModal, setShowOTModal] = useState(false);
  const [otConfig, setOtConfig] = useState({
    deliveryType: 'normal',   // 'normal' | 'wide' | 'noball' | 'bye' | 'legbye'
    initialRuns: 0,           // runs completed before the throw
    isBoundary: false,        // overthrow went to boundary?
    additionalRuns: 0,        // runs completed after throw (if not boundary)
  });
  const [showRunOutModal, setShowRunOutModal] = useState(false);
  const [showCustomExtraModal, setShowCustomExtraModal] = useState(false);
  const [customExtraConfig, setCustomExtraConfig] = useState({
    type: 'wide',
    runs: 0,
    isOffBat: false
  });
  const [runOutConfig, setRunOutConfig] = useState({
    playerOut: 'striker',
    runsCompleted: 0,
    deliveryType: 'normal'
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

  // Helper components
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
              // Save current batsman to history before switching
              const currentName = matchData[field];
              if (currentName) {
                batHistory[currentName] = {
                  runs: parseInt(matchData[field.replace('_name', '_runs')] || '0'),
                  balls: parseInt(matchData[field.replace('_name', '_balls')] || '0'),
                  isOut: false
                };
              }

              // Load new batsman stats if exists
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
            if (matchData.is_innings_break === 'true' || matchData.is_pre_match === 'true') {
              updates.push(
                { field: 'is_innings_break', value: 'false' },
                { field: 'is_pre_match', value: 'false' }
              );
            }
            emit('match:updateBulk', { updates });
            onSelect?.();
          }}
        >
          <option value="">-- Select Player --</option>
          {players.map(p => (
            <option key={p.id} value={p.name}>
              {p.jersey ? `#${p.jersey} - ` : ''}{p.name}
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

  // Helper to add runs + update ball count + update striker stats
  function addRuns(runsToAdd, isLegal = true, isExtra = false, customLabel = null, deliveryType = 'normal', runsOffBat = null) {
    const updates = [];
    updates.push({ field: 'runs', value: runs + runsToAdd });
    
    // Partnership Logic
    const pRuns = parseInt(matchData.partnership_runs || '0');
    const pBalls = parseInt(matchData.partnership_balls || '0');
    updates.push({ field: 'partnership_runs', value: pRuns + runsToAdd });
    updates.push({ field: 'partnership_balls', value: pBalls + (isLegal || deliveryType === 'noball' ? 1 : 0) });

    // FIX: Detect if we are starting a new over. 
    // If balls === 0 and recent_balls has legal deliveries, it's from the previous over.
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
      if (newBalls >= 6) {
        newOvers += 1;
        newBalls = 0;
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

    const bowlerCharged = deliveryType !== 'bye' && deliveryType !== 'legbye';
    if (bowlerCharged) {
      updates.push({ field: 'bowler_runs', value: bowlerRuns + runsToAdd });
    }

    // Free Hit Logic
    const currentFreeHit = matchData.free_hit === 'true';
    if (deliveryType === 'noball') {
      updates.push({ field: 'free_hit', value: 'true' });
    } else if (isLegal && currentFreeHit) {
      // Legal ball delivered, free hit is spent
      updates.push({ field: 'free_hit', value: 'false' });
    }
    // (If it's a Wide during a Free Hit, it remains a Free Hit)

    // Update history in real-time
    const history = JSON.parse(matchData.bowlers_history || '{}');
    if (matchData.bowler_name) {
      const bOversFinal = isLegal ? updates.find(u => u.field === 'bowler_overs')?.value : bowlerOversVal;
      history[matchData.bowler_name] = {
        runs: bowlerRuns + (bowlerCharged ? runsToAdd : 0),
        wickets: bowlerWickets,
        overs: bOversFinal || bowlerOversVal
      };
      updates.push({ field: 'bowlers_history', value: JSON.stringify(history) });
    }

    const actualRunsOffBat = (runsOffBat !== null) ? runsOffBat : (!isExtra ? runsToAdd : 0);
    let newStrikerRuns = strikerRuns + actualRunsOffBat;
    let newStrikerBalls = strikerBalls + (isLegal || (deliveryType === 'noball') ? 1 : 0);
    let newNonStrikerRuns = parseInt(matchData.non_striker_runs || '0');
    let newNonStrikerBalls = parseInt(matchData.non_striker_balls || '0');
    let newStrikerName = strikerName;
    let newNonStrikerName = matchData.non_striker_name;

    const isOverComplete = isLegal && (balls + 1 >= 6);
    
    // Swap Logic for international rules
    let runsForSwap = runsToAdd;
    if (deliveryType === 'wide' || deliveryType === 'noball') {
      runsForSwap = Math.max(0, runsToAdd - 1); // Subtract 1 run penalty (Wide/NB)
    }
    const isOddRun = (runsForSwap % 2 === 1);

    if ((isOddRun && !isOverComplete) || (!isOddRun && isOverComplete)) {
      const currentOnTop = matchData.striker_on_top === 'false' ? false : true;
      updates.push(
        { field: 'striker_name', value: newNonStrikerName },
        { field: 'striker_runs', value: newNonStrikerRuns },
        { field: 'striker_balls', value: newNonStrikerBalls },
        { field: 'non_striker_name', value: newStrikerName },
        { field: 'non_striker_runs', value: newStrikerRuns },
        { field: 'non_striker_balls', value: newStrikerBalls },
        { field: 'striker_on_top', value: String(!currentOnTop) }
      );
    } else {
      // No swap needed (even runs + no over end, OR odd run + over end)
      updates.push(
        { field: 'striker_runs', value: newStrikerRuns },
        { field: 'striker_balls', value: newStrikerBalls }
      );
    }

    // Update Batter History
    const batHistory = JSON.parse(matchData.batters_history || '{}');
    if (strikerName) {
      batHistory[strikerName] = { runs: newStrikerRuns, balls: newStrikerBalls, isOut: false };
    }
    if (newNonStrikerName) {
      batHistory[newNonStrikerName] = { runs: newNonStrikerRuns, balls: newNonStrikerBalls, isOut: false };
    }
    updates.push({ field: 'batters_history', value: JSON.stringify(batHistory) });

    let ballLabel = customLabel;
    if (!ballLabel) {
      if (isExtra) {
        if (deliveryType === 'wide') ballLabel = 'Wd';
        else if (deliveryType === 'noball') ballLabel = 'Nb';
        else ballLabel = 'E'; // fallback
      } else {
        ballLabel = runsToAdd === 0 ? '0' : String(runsToAdd);
      }
    }

    const ballObj = {
      label: ballLabel, run: runsToAdd, extra: isExtra, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };

    emit('match:recordBall', { updates, ball: ballObj });
  }

  function handleWicket() {
    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'bowler_wickets', value: bowlerWickets + 1 },
      { field: 'partnership_runs', value: 0 },
      { field: 'partnership_balls', value: 0 },
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
    const newBOversVal = `${newBWhole}.${newBBalls}`;
    updates.push({ field: 'bowler_overs', value: newBOversVal });

    // Update history in real-time for wicket
    const history = JSON.parse(matchData.bowlers_history || '{}');
    if (matchData.bowler_name) {
      history[matchData.bowler_name] = {
        runs: bowlerRuns,
        wickets: bowlerWickets + 1,
        overs: newBOversVal
      };
      updates.push({ field: 'bowlers_history', value: JSON.stringify(history) });
    }

    const isOverComplete = (balls + 1 >= 6);
    
    // Clear the current striker (they are out)
    // If it's NOT the end of the over, the new batsman will be the striker.
    // If it IS the end of the over, the non-striker will become the striker for the next over.
    if (isOverComplete) {
      // Over end swap: non-striker becomes the new striker
      const currentOnTop = matchData.striker_on_top === 'false' ? false : true;
      updates.push(
        { field: 'striker_name', value: matchData.non_striker_name },
        { field: 'striker_runs', value: parseInt(matchData.non_striker_runs || '0') },
        { field: 'striker_balls', value: parseInt(matchData.non_striker_balls || '0') },
        { field: 'non_striker_name', value: '' },
        { field: 'non_striker_runs', value: 0 },
        { field: 'non_striker_balls', value: 0 },
        { field: 'striker_on_top', value: String(!currentOnTop) }
      );
    } else {
      // Not over end: just clear striker, non-striker stays non-striker
      updates.push(
        { field: 'striker_name', value: '' },
        { field: 'striker_runs', value: 0 },
        { field: 'striker_balls', value: 0 }
      );
    }

    // Trigger Wicket Card
    updates.push(
      { field: 'show_wicket_card', value: 'true' },
      { field: 'last_out_name', value: strikerName },
      { field: 'last_out_runs', value: strikerRuns },
      { field: 'last_out_balls', value: strikerBalls },
      { field: 'last_out_team', value: matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name },
      { field: 'last_out_logo', value: matchData.batting_team === 'team1' ? matchData.team1_logo : matchData.team2_logo },
      { field: 'wicket_card_at', value: Date.now().toString() }
    );

    // Mark batter as OUT in history
    const batHistory = JSON.parse(matchData.batters_history || '{}');
    if (strikerName) {
      batHistory[strikerName] = { runs: strikerRuns, balls: strikerBalls, isOut: true };
      updates.push({ field: 'batters_history', value: JSON.stringify(batHistory) });
    }

    const ballObj = {
      label: 'W', run: 0, extra: false, wicket: true,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };

    emit('match:recordBall', { updates, ball: ballObj });
  }

  function handleUndo() { emit('match:undo'); }
  function handleWide() { addRuns(1, false, true, null, 'wide'); }
  function handleNoBall() { addRuns(1, false, true, null, 'noball'); }
  function handleWide4() { addRuns(5, false, true, 'Wd4', 'wide'); }
  function handleNoBall4() {
    const updates = [
      { field: 'runs', value: runs + 5 },
      { field: 'bowler_runs', value: bowlerRuns + 5 },
      { field: 'striker_runs', value: strikerRuns + 4 },
      { field: 'striker_balls', value: strikerBalls + 1 },
      { field: 'partnership_runs', value: (parseInt(matchData.partnership_runs || '0') + 5) },
      { field: 'partnership_balls', value: (parseInt(matchData.partnership_balls || '0') + 1) },
      { field: 'free_hit', value: 'true' }
    ];
    const ballObj = {
      label: 'NB4', run: 5, extra: true, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };
    emit('match:recordBall', { updates, ball: ballObj });
  }
  function handleBye(runs) { addRuns(runs, true, true, `B${runs}`, 'bye'); }
  function handleLegBye(runs) { addRuns(runs, true, true, `LB${runs}`, 'legbye'); }
  function handleLegBye4() { addRuns(4, true, true, 'LB4', 'legbye'); }
  function handleNoBall6() { 
    const updates = [
      { field: 'runs', value: runs + 7 },
      { field: 'bowler_runs', value: bowlerRuns + 7 },
      { field: 'striker_runs', value: strikerRuns + 6 },
      { field: 'striker_balls', value: strikerBalls + 1 },
      { field: 'partnership_runs', value: (parseInt(matchData.partnership_runs || '0') + 7) },
      { field: 'partnership_balls', value: (parseInt(matchData.partnership_balls || '0') + 1) },
      { field: 'free_hit', value: 'true' }
    ];
    const ballObj = {
      label: 'NB6', run: 7, extra: true, wicket: false,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };
    emit('match:recordBall', { updates, ball: ballObj });
  }

  // ═══════════════════════════════════════════════════════════
  // OVERTHROW HANDLERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Core overthrow handler.
   * @param {number} initialRuns - Runs completed before the fielding throw
   * @param {number} overthrowRuns - Extra runs from overthrow (or 4 if boundary)
   * @param {string} deliveryType - 'normal' | 'wide' | 'noball' | 'bye' | 'legbye'
   * @param {boolean} isBoundary - Did the overthrow reach the boundary?
   */
  function handleOverthrow(initialRuns, overthrowRuns, deliveryType = 'normal', isBoundary = false) {
    const actualOTRuns = isBoundary ? 4 : overthrowRuns;
    const totalRunsFromDelivery = initialRuns + actualOTRuns;
    
    // Determine if ball is legal (Wides and No-balls are illegal deliveries)
    const isLegal = deliveryType !== 'wide' && deliveryType !== 'noball';
    const extraPenalty = (deliveryType === 'wide' || deliveryType === 'noball') ? 1 : 0;
    
    // Total runs added to team score
    const totalTeamRuns = totalRunsFromDelivery + extraPenalty;
    
    const updates = [];
    updates.push({ field: 'runs', value: runs + totalTeamRuns });
    updates.push({ field: 'partnership_runs', value: (parseInt(matchData.partnership_runs || '0') + totalTeamRuns) });
    updates.push({ field: 'partnership_balls', value: (parseInt(matchData.partnership_balls || '0') + (isLegal ? 1 : 0)) });

    // Ball counting (legal deliveries only)
    if (isLegal) {
      let newBalls = balls + 1;
      let newOvers = overs;
      if (newBalls >= 6) { newOvers += 1; newBalls = 0; }
      if (balls === 0) updates.push({ field: 'recent_balls', value: '[]' });
      updates.push({ field: 'balls', value: newBalls });
      updates.push({ field: 'overs', value: newOvers });

      // Bowler overs
      const bOvers = parseFloat(bowlerOversVal);
      const bWhole = Math.floor(bOvers);
      const bBalls = Math.round((bOvers - bWhole) * 10);
      let newBBalls = bBalls + 1;
      let newBWhole = bWhole;
      if (newBBalls >= 6) { newBWhole += 1; newBBalls = 0; }
      updates.push({ field: 'bowler_overs', value: `${newBWhole}.${newBBalls}` });
    }

    // Bowler is charged runs only if delivery type is not bye or legbye
    const bowlerCharged = deliveryType !== 'bye' && deliveryType !== 'legbye';
    const newBowlerRuns = bowlerRuns + (bowlerCharged ? totalTeamRuns : 0);
    updates.push({ field: 'bowler_runs', value: newBowlerRuns });

    // Update history in real-time
    if (matchData.bowler_name) {
      const history = JSON.parse(matchData.bowlers_history || '{}');
      const bOversFinal = isLegal ? updates.find(u => u.field === 'bowler_overs')?.value : bowlerOversVal;
      history[matchData.bowler_name] = {
        runs: newBowlerRuns,
        wickets: bowlerWickets,
        overs: bOversFinal || bowlerOversVal
      };
      updates.push({ field: 'bowlers_history', value: JSON.stringify(history) });
    }

    // Attribution: Who gets credited the runs?
    let newStrikerRuns = strikerRuns;
    let newStrikerBalls = strikerBalls;
    let newNonStrikerRuns = parseInt(matchData.non_striker_runs || '0');
    let newNonStrikerBalls = parseInt(matchData.non_striker_balls || '0');
    let newStrikerName = strikerName;
    let newNonStrikerName = matchData.non_striker_name;

    if (deliveryType === 'normal' || deliveryType === 'noball') {
      newStrikerRuns += totalRunsFromDelivery;
      newStrikerBalls += 1;
    } else if (isLegal) {
      newStrikerBalls += 1;
    }

    // Handle striker swap logic
    const isOverComplete = isLegal && (balls + 1 >= 6);
    const totalBatsmanRuns = (deliveryType === 'normal' || deliveryType === 'noball') ? totalRunsFromDelivery : 0;
    const isOddRun = (totalBatsmanRuns % 2 === 1);

    if ((isOddRun && !isOverComplete) || (!isOddRun && isOverComplete)) {
      const currentOnTop = matchData.striker_on_top === 'false' ? false : true;
      updates.push(
        { field: 'striker_name', value: newNonStrikerName },
        { field: 'striker_runs', value: newNonStrikerRuns },
        { field: 'striker_balls', value: newNonStrikerBalls },
        { field: 'non_striker_name', value: newStrikerName },
        { field: 'non_striker_runs', value: newStrikerRuns },
        { field: 'non_striker_balls', value: newStrikerBalls },
        { field: 'striker_on_top', value: String(!currentOnTop) }
      );
    } else {
      updates.push(
        { field: 'striker_runs', value: newStrikerRuns },
        { field: 'striker_balls', value: newStrikerBalls }
      );
    }

    // Build ball label
    let label = '';
    const prefixMap = { normal: '', wide: 'Wd', noball: 'NB', bye: 'B', legbye: 'LB' };
    const prefix = prefixMap[deliveryType] || '';
    label = `${prefix}${totalRunsFromDelivery}+OT`;
    if (isBoundary) label += '4';

    const ballObj = {
      label, run: totalTeamRuns,
      extra: deliveryType !== 'normal',
      wicket: false,
      overthrow: true,
      overthrowRuns: actualOTRuns,
      initialRuns,
      deliveryType,
      isBoundaryOT: isBoundary,
      striker: strikerName, bowler: bowlerName,
      timestamp: new Date().toISOString()
    };

    emit('match:recordBall', { updates, ball: ballObj });
  }

  // Quick overthrow buttons (most common scenarios)
  function handleOT1() { handleOverthrow(0, 1, 'normal', false); }  // Dot ball → 1 OT run
  function handleOT2() { handleOverthrow(0, 2, 'normal', false); }  // Dot ball → 2 OT runs
  function handleOT4() { handleOverthrow(0, 0, 'normal', true); }   // Dot ball → OT boundary

  function handleByeOT() { handleOverthrow(0, 1, 'bye', false); }     // Bye + 1 OT run
  function handleLegByeOT() { handleOverthrow(0, 1, 'legbye', false); } // Leg-bye + 1 OT run
  function handleWideOT() { handleOverthrow(0, 1, 'wide', false); }    // Wide + 1 OT run
  function handleNoBallOT() { handleOverthrow(0, 1, 'noball', false); } // No-ball + 1 OT run

  function handleRunOutSubmit() {
    const { playerOut, runsCompleted, deliveryType } = runOutConfig;
    const isLegal = deliveryType !== 'wide' && deliveryType !== 'noball';
    const extraPenalty = (deliveryType === 'wide' || deliveryType === 'noball') ? 1 : 0;
    const totalTeamRuns = runsCompleted + extraPenalty;

    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'runs', value: runs + totalTeamRuns },
      { field: 'partnership_runs', value: 0 },
      { field: 'partnership_balls', value: 0 }
    ];

    let currentBowlerOvers = bowlerOversVal;

    if (isLegal) {
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
      currentBowlerOvers = `${newBWhole}.${newBBalls}`;
      updates.push({ field: 'bowler_overs', value: currentBowlerOvers });
    }

    // Update bowler runs (always) and history
    const newBowlerRuns = bowlerRuns + totalTeamRuns;
    updates.push({ field: 'bowler_runs', value: newBowlerRuns });
    
    if (matchData.bowler_name) {
      const history = JSON.parse(matchData.bowlers_history || '{}');
      history[matchData.bowler_name] = {
        runs: newBowlerRuns,
        wickets: bowlerWickets,
        overs: currentBowlerOvers
      };
      updates.push({ field: 'bowlers_history', value: JSON.stringify(history) });
    }

    // Handle Batsman Stats
    let sRuns = strikerRuns;
    let sBalls = strikerBalls + (isLegal || deliveryType === 'noball' ? 1 : 0);
    let nsRuns = parseInt(matchData.non_striker_runs || '0');
    let nsBalls = parseInt(matchData.non_striker_balls || '0');
    let sName = strikerName;
    let nsName = matchData.non_striker_name;

    if (deliveryType === 'normal' || deliveryType === 'noball') {
      sRuns += runsCompleted;
    }
    
    const outName = playerOut === 'striker' ? sName : nsName;
    const isOdd = (runsCompleted % 2 === 1);
    const isOverComplete = isLegal && (balls + 1 >= 6);

    let finalSName, finalSRuns, finalSBalls, finalNSName, finalNSRuns, finalNSBalls;
    let currentOnTop = matchData.striker_on_top === 'false' ? false : true;
    let finalOnTop = currentOnTop;

    if ((isOdd && !isOverComplete) || (!isOdd && isOverComplete)) {
       finalSName = nsName; finalSRuns = nsRuns; finalSBalls = nsBalls;
       finalNSName = sName; finalNSRuns = sRuns; finalNSBalls = sBalls;
       finalOnTop = !currentOnTop;
    } else {
       finalSName = sName; finalSRuns = sRuns; finalSBalls = sBalls;
       finalNSName = nsName; finalNSRuns = nsRuns; finalNSBalls = nsBalls;
    }

    if (finalSName === outName) {
      finalSName = ''; finalSRuns = 0; finalSBalls = 0;
    } else {
      finalNSName = ''; finalNSRuns = 0; finalNSBalls = 0;
    }

    updates.push(
      { field: 'striker_name', value: finalSName },
      { field: 'striker_runs', value: finalSRuns },
      { field: 'striker_balls', value: finalSBalls },
      { field: 'non_striker_name', value: finalNSName },
      { field: 'non_striker_runs', value: finalNSRuns },
      { field: 'non_striker_balls', value: finalNSBalls },
      { field: 'striker_on_top', value: String(finalOnTop) },
      { field: 'show_wicket_card', value: 'true' },
      { field: 'last_out_name', value: outName },
      { field: 'last_out_runs', value: playerOut === 'striker' ? sRuns : nsRuns },
      { field: 'last_out_balls', value: playerOut === 'striker' ? sBalls : nsBalls },
      { field: 'last_out_team', value: matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name },
      { field: 'last_out_logo', value: matchData.batting_team === 'team1' ? matchData.team1_logo : matchData.team2_logo },
      { field: 'wicket_card_at', value: Date.now().toString() }
    );

    const prefixMap = { normal: '', wide: 'Wd', noball: 'NB', bye: 'B', legbye: 'LB' };
    const ballObj = {
      label: `${prefixMap[deliveryType]}${runsCompleted}+RO`,
      run: totalTeamRuns, extra: !isLegal, wicket: true,
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString()
    };

    emit('match:recordBall', { updates, ball: ballObj });
    setShowRunOutModal(false);
    setRunOutConfig({ playerOut: 'striker', runsCompleted: 0, deliveryType: 'normal' });
  }

  function handlePenalty() {
    const updates = [
      { field: 'runs', value: runs + 5 },
    ];
    const ballObj = {
      label: 'PEN+5', run: 5, extra: true, wicket: false,
      penalty: true,
      striker: strikerName, bowler: bowlerName,
      timestamp: new Date().toISOString()
    };
    emit('match:recordBall', { updates, ball: ballObj });
  }

  function handleManualRuns(delta) {
    emit('match:update', { field: 'runs', value: Math.max(0, runs + delta) });
  }

  function handleManualWickets(delta) {
    emit('match:update', { field: 'wickets', value: Math.max(0, Math.min(10, wickets + delta)) });
  }

  function handleManualBalls(delta) {
    let newOvers = overs;
    let newBalls = balls + delta;

    if (newBalls >= 6) {
      newOvers += 1;
      newBalls = 0;
    } else if (newBalls < 0) {
      if (newOvers > 0) {
        newOvers -= 1;
        newBalls = 5;
      } else {
        newBalls = 0;
      }
    }

    emit('match:updateBulk', {
      updates: [
        { field: 'overs', value: newOvers },
        { field: 'balls', value: newBalls }
      ]
    });
  }

  // Custom Overthrow from modal
  function handleCustomOverthrow() {
    const { deliveryType, initialRuns, isBoundary, additionalRuns } = otConfig;
    handleOverthrow(initialRuns, additionalRuns, deliveryType, isBoundary);
    setShowOTModal(false);
    setOtConfig({ deliveryType: 'normal', initialRuns: 0, isBoundary: false, additionalRuns: 0 });
  }

  function swapStrikers() {
    const currentOnTop = matchData.striker_on_top === 'false' ? false : true;
    const updates = [
      { field: 'striker_name', value: matchData.non_striker_name },
      { field: 'striker_runs', value: matchData.non_striker_runs },
      { field: 'striker_balls', value: matchData.non_striker_balls },
      { field: 'non_striker_name', value: matchData.striker_name },
      { field: 'non_striker_runs', value: matchData.striker_runs },
      { field: 'non_striker_balls', value: matchData.striker_balls },
      { field: 'striker_on_top', value: String(!currentOnTop) }
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
    const updates = [
      { field: 'bowler_name', value: '' },
      { field: 'bowler_overs', value: '0.0' },
      { field: 'bowler_runs', value: 0 },
      { field: 'bowler_wickets', value: 0 },
      { field: 'recent_balls', value: '[]' }
    ];

    // Persist current bowler to history before clearing
    if (matchData.bowler_name) {
      const history = JSON.parse(matchData.bowlers_history || '{}');
      history[matchData.bowler_name] = {
        runs: parseInt(matchData.bowler_runs || '0'),
        wickets: parseInt(matchData.bowler_wickets || '0'),
        overs: matchData.bowler_overs || '0.0'
      };
      updates.push({ field: 'bowlers_history', value: JSON.stringify(history) });
    }

    emit('match:updateBulk', { updates });
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
        { field: 'first_innings_overs', value: overs },
        { field: 'first_innings_balls', value: balls },
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
          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-900/50 rounded-lg border border-white/10 overflow-hidden">
                <button 
                  onClick={() => handleManualRuns(-1)}
                  className="px-2 py-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors border-r border-white/10"
                >
                  <Minus size={14} />
                </button>
                <div className="px-4 text-white font-display font-black text-4xl tabular-nums">
                  {runs}
                </div>
                <button 
                  onClick={() => handleManualRuns(1)}
                  className="px-2 py-1 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 transition-colors border-l border-white/10"
                >
                  <Plus size={14} />
                </button>
              </div>
              
              <div className="flex items-center bg-slate-900/50 rounded-lg border border-white/10 overflow-hidden">
                <button 
                  onClick={() => handleManualWickets(-1)}
                  className="px-1.5 py-0.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors border-r border-white/10"
                >
                  <Minus size={12} />
                </button>
                <div className="px-3 text-slate-500 text-3xl font-black italic tabular-nums">
                  /{wickets}
                </div>
                <button 
                  onClick={() => handleManualWickets(1)}
                  className="px-1.5 py-0.5 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 transition-colors border-l border-white/10"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-900/40 rounded-md border border-white/5 overflow-hidden">
                <button 
                  onClick={() => handleManualBalls(-1)}
                  className="px-1.5 py-0.5 hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="px-2 text-slate-400 text-sm font-mono font-bold tracking-tight">
                  {overs}.{balls} <span className="text-[10px] opacity-50 uppercase ml-1">Overs</span>
                </span>
                <button 
                  onClick={() => handleManualBalls(1)}
                  className="px-1.5 py-0.5 hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Players */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
          <div className="glass-light rounded-lg p-3 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Striker</span>
              </div>
              {matchData.striker_name && (
                <button 
                  onClick={() => setChangingStriker(!changingStriker)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Change Player"
                >
                  <ArrowLeftRight size={14} />
                </button>
              )}
            </div>
            
            {(!matchData.striker_name || changingStriker) ? (
              <PlayerSelect label="" field="striker_name" players={battingPlayers} onSelect={() => setChangingStriker(false)} />
            ) : (
              <div className="flex items-center justify-between">
                 <EditableField label="" field="striker_name" prefix={getJersey(matchData.striker_name, battingPlayers)} />
                 <button onClick={() => emit('match:update', {field: 'striker_name', value: ''})} className="text-slate-500 hover:text-white" title="Reset Player">
                   <RotateCcw size={12}/>
                 </button>
              </div>
            )}
            <span className="text-white text-sm font-mono font-bold mt-1 block">
              {strikerRuns} <span className="text-slate-400 text-xs font-normal">({strikerBalls})</span>
            </span>
          </div>

          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Non-Striker</span>
              </div>
              {matchData.non_striker_name && (
                <button 
                  onClick={() => setChangingNonStriker(!changingNonStriker)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Change Player"
                >
                  <ArrowLeftRight size={14} />
                </button>
              )}
            </div>

            {(!matchData.non_striker_name || changingNonStriker) ? (
              <PlayerSelect label="" field="non_striker_name" players={battingPlayers} onSelect={() => setChangingNonStriker(false)} />
            ) : (
              <div className="flex items-center justify-between">
                <EditableField label="" field="non_striker_name" prefix={getJersey(matchData.non_striker_name, battingPlayers)} />
                <button onClick={() => emit('match:update', {field: 'non_striker_name', value: ''})} className="text-slate-500 hover:text-white" title="Reset Player">
                  <RotateCcw size={12}/>
                </button>
              </div>
            )}
            <span className="text-slate-300 text-sm font-mono mt-1 block">
              {matchData.non_striker_runs || 0} <span className="text-slate-500 text-xs font-normal">({matchData.non_striker_balls || 0})</span>
            </span>
          </div>

          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Bowler</span>
              </div>
              {matchData.bowler_name && (
                <button 
                  onClick={() => setChangingBowler(!changingBowler)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                  title="Change Bowler"
                >
                  <ArrowLeftRight size={14} />
                </button>
              )}
            </div>

            {(!matchData.bowler_name || changingBowler) ? (
              <PlayerSelect label="" field="bowler_name" players={bowlingPlayers} isBowler onSelect={() => setChangingBowler(false)} />
            ) : (
              <div className="flex items-center justify-between">
                <EditableField label="" field="bowler_name" prefix={getJersey(matchData.bowler_name, bowlingPlayers)} />
                <button onClick={() => emit('match:update', {field: 'bowler_name', value: ''})} className="text-slate-500 hover:text-white" title="Reset Bowler">
                  <RotateCcw size={12}/>
                </button>
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
              <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mr-1">PowerPlay</span>
                <div className="flex gap-1">
                  {['P1', 'P2', 'P3'].map(p => (
                    <button
                      key={p}
                      onClick={() => emit('match:update', { field: 'powerplay', value: p })}
                      className={`px-2 py-0.5 rounded text-[11px] font-black transition-all ${
                        (matchData.powerplay || 'P1') === p 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
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
              <button 
                onClick={() => emit('match:update', { field: 'show_scoreboard', value: matchData.show_scoreboard === 'false' ? 'true' : 'false' })}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${
                  matchData.show_scoreboard !== 'false' 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10' 
                    : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                }`}
              >
                <Eye size={14} className={matchData.show_scoreboard !== 'false' ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">Scoreboard</span>
              </button>
              <button 
                onClick={() => emit('match:update', { field: 'show_partnership', value: matchData.show_partnership === 'true' ? 'false' : 'true' })}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${
                  matchData.show_partnership === 'true' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
                    : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                }`}
              >
                <ArrowLeftRight size={14} className={matchData.show_partnership === 'true' ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">Partnership</span>
              </button>
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
          <button onClick={handleLegBye4} className="btn bg-orange-500/20 text-orange-300 py-3 text-xs font-bold hover:bg-orange-500/30">LB 4</button>
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

      {/* ═══════ Overthrow & Extras Section ═══════ */}
      <div className="glass rounded-xl p-5 border border-cyan-500/20 bg-cyan-500/5">
        <h3 className="text-cyan-400 font-bold flex items-center gap-2 mb-4">
          <Zap size={18} />
          Overthrows & Extras
        </h3>
        
        {/* Quick Overthrow Buttons */}
        <div className="mb-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Quick Overthrow (Off the bat)</span>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={handleOT1} className="btn bg-cyan-500/15 text-cyan-300 py-2.5 text-sm font-bold hover:bg-cyan-500/25 border border-cyan-500/10 transition-all">
              OT +1
            </button>
            <button onClick={handleOT2} className="btn bg-cyan-500/20 text-cyan-300 py-2.5 text-sm font-bold hover:bg-cyan-500/30 border border-cyan-500/10 transition-all">
              OT +2
            </button>
            <button onClick={handleOT4} className="btn bg-cyan-500/30 text-cyan-200 py-2.5 text-sm font-bold hover:bg-cyan-500/40 border border-cyan-500/15 transition-all">
              OT 🏏4
            </button>
          </div>
        </div>

        <div className="mb-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Byes & Leg Byes</span>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleBye(1)} className="btn bg-indigo-500/15 text-indigo-300 py-2.5 text-xs font-bold hover:bg-indigo-500/25 border border-indigo-500/10 transition-all">
              B 1
            </button>
            <button onClick={() => handleBye(4)} className="btn bg-indigo-500/20 text-indigo-300 py-2.5 text-xs font-bold hover:bg-indigo-500/30 border border-indigo-500/10 transition-all">
              B 4
            </button>
            <button onClick={() => handleLegBye(1)} className="btn bg-orange-500/15 text-orange-300 py-2.5 text-xs font-bold hover:bg-orange-500/25 border border-orange-500/10 transition-all">
              LB 1
            </button>
            <button onClick={() => handleLegBye(4)} className="btn bg-orange-500/20 text-orange-300 py-2.5 text-xs font-bold hover:bg-orange-500/30 border border-orange-500/10 transition-all">
              LB 4
            </button>
          </div>
        </div>

        <div className="mb-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Extras + Overthrow</span>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={handleByeOT} className="btn bg-teal-500/15 text-teal-300 py-2.5 text-xs font-bold hover:bg-teal-500/25 border border-teal-500/10 transition-all">
              Bye OT
            </button>
            <button onClick={handleLegByeOT} className="btn bg-teal-500/20 text-teal-300 py-2.5 text-xs font-bold hover:bg-teal-500/30 border border-teal-500/10 transition-all">
              LB OT
            </button>
            <button onClick={handleWideOT} className="btn bg-violet-500/15 text-violet-300 py-2.5 text-xs font-bold hover:bg-violet-500/25 border border-violet-500/10 transition-all">
              Wd OT
            </button>
            <button onClick={handleNoBallOT} className="btn bg-pink-500/15 text-pink-300 py-2.5 text-xs font-bold hover:bg-pink-500/25 border border-pink-500/10 transition-all">
              NB OT
            </button>
          </div>
        </div>
        <div className="mb-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Custom Extras</span>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => { setCustomExtraConfig({ type: 'wide', runs: 0, isOffBat: false }); setShowCustomExtraModal(true); }} className="btn bg-purple-500/15 text-purple-300 py-2.5 text-[10px] font-bold hover:bg-purple-500/25 border border-purple-500/10 transition-all flex items-center justify-center gap-1">
              <Plus size={12} /> Custom Wide
            </button>
            <button onClick={() => { setCustomExtraConfig({ type: 'noball', runs: 0, isOffBat: false }); setShowCustomExtraModal(true); }} className="btn bg-pink-500/15 text-pink-300 py-2.5 text-[10px] font-bold hover:bg-pink-500/25 border border-pink-500/10 transition-all flex items-center justify-center gap-1">
              <Plus size={12} /> Custom NB
            </button>
            <button onClick={() => { setCustomExtraConfig({ type: 'bye', runs: 0, isOffBat: false }); setShowCustomExtraModal(true); }} className="btn bg-indigo-500/15 text-indigo-300 py-2.5 text-[10px] font-bold hover:bg-indigo-500/25 border border-indigo-500/10 transition-all flex items-center justify-center gap-1">
              <Plus size={12} /> Custom Bye
            </button>
            <button onClick={() => { setCustomExtraConfig({ type: 'legbye', runs: 0, isOffBat: false }); setShowCustomExtraModal(true); }} className="btn bg-orange-500/15 text-orange-300 py-2.5 text-[10px] font-bold hover:bg-orange-500/25 border border-orange-500/10 transition-all flex items-center justify-center gap-1">
              <Plus size={12} /> Custom LB
            </button>
          </div>
        </div>

        {/* Free Hit Toggle */}
        <div className="mt-3 flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <Zap size={16} className={matchData.free_hit === 'true' ? "text-amber-400 animate-pulse" : "text-slate-600"} />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Status</span>
              <span className={`text-xs font-black uppercase ${matchData.free_hit === 'true' ? "text-amber-400" : "text-slate-500"}`}>
                {matchData.free_hit === 'true' ? "Free Hit Active" : "Normal Delivery"}
              </span>
            </div>
          </div>
          <button 
            onClick={() => emit('match:update', { field: 'free_hit', value: matchData.free_hit === 'true' ? 'false' : 'true' })}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold border transition-all ${
              matchData.free_hit === 'true' 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30" 
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            }`}
          >
            {matchData.free_hit === 'true' ? "Cancel Free Hit" : "Trigger Free Hit"}
          </button>
        </div>

        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2.5 mt-3">
          <p className="text-[10px] text-cyan-200/50 leading-relaxed italic">
            <strong>Tip:</strong> Quick buttons assume 0 runs before throw + overthrow runs. Use <strong>Custom OT</strong> for complex scenarios like "batsman hit 2, then overthrow boundary" (= 6 to batsman).
          </p>
        </div>
      </div>

      {/* ═══════ Custom Overthrow Modal ═══════ */}
      {showOTModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOTModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md border border-cyan-500/20 shadow-2xl shadow-cyan-500/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Zap size={20} className="text-cyan-400" />
                Custom Overthrow
              </h3>
              <button onClick={() => setShowOTModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Delivery Type */}
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2">Delivery Type</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { value: 'normal', label: 'Normal', activeClass: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/30' },
                  { value: 'wide', label: 'Wide', activeClass: 'bg-purple-500/30 text-purple-300 border-purple-500/50 ring-1 ring-purple-500/30' },
                  { value: 'noball', label: 'No Ball', activeClass: 'bg-pink-500/30 text-pink-300 border-pink-500/50 ring-1 ring-pink-500/30' },
                  { value: 'bye', label: 'Bye', activeClass: 'bg-orange-500/30 text-orange-300 border-orange-500/50 ring-1 ring-orange-500/30' },
                  { value: 'legbye', label: 'Leg B', activeClass: 'bg-amber-500/30 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOtConfig(c => ({ ...c, deliveryType: opt.value }))}
                    className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                      otConfig.deliveryType === opt.value
                        ? opt.activeClass
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Runs */}
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2">Runs Before Throw</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setOtConfig(c => ({ ...c, initialRuns: Math.max(0, c.initialRuns - 1) }))}
                  className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                  <Minus size={16} />
                </button>
                <span className="text-white text-2xl font-display font-black w-12 text-center">{otConfig.initialRuns}</span>
                <button onClick={() => setOtConfig(c => ({ ...c, initialRuns: c.initialRuns + 1 }))}
                  className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                  <Plus size={16} />
                </button>
                <div className="flex gap-1.5 ml-auto">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} onClick={() => setOtConfig(c => ({ ...c, initialRuns: n }))}
                      className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                        otConfig.initialRuns === n ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Boundary Toggle */}
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2">Overthrow Reached Boundary?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOtConfig(c => ({ ...c, isBoundary: false }))}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                    !otConfig.isBoundary ? 'bg-slate-600/30 text-white border-slate-400/30' : 'bg-white/5 text-slate-500 border-white/5'
                  }`}>
                  No (kept running)
                </button>
                <button
                  onClick={() => setOtConfig(c => ({ ...c, isBoundary: true, additionalRuns: 0 }))}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                    otConfig.isBoundary ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/5'
                  }`}>
                  Yes (+4 boundary)
                </button>
              </div>
            </div>

            {/* Additional Runs (only if NOT boundary) */}
            {!otConfig.isBoundary && (
              <div className="mb-4">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2">Runs After Throw (Overthrow Runs)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setOtConfig(c => ({ ...c, additionalRuns: Math.max(0, c.additionalRuns - 1) }))}
                    className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                    <Minus size={16} />
                  </button>
                  <span className="text-white text-2xl font-display font-black w-12 text-center">{otConfig.additionalRuns}</span>
                  <button onClick={() => setOtConfig(c => ({ ...c, additionalRuns: c.additionalRuns + 1 }))}
                    className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                    <Plus size={16} />
                  </button>
                  <div className="flex gap-1.5 ml-auto">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} onClick={() => setOtConfig(c => ({ ...c, additionalRuns: n }))}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                          otConfig.additionalRuns === n ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="bg-slate-900/80 rounded-xl p-4 mb-4 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Score Preview</span>
              {(() => {
                const otRuns = otConfig.isBoundary ? 4 : otConfig.additionalRuns;
                const deliveryRuns = otConfig.initialRuns + otRuns;
                const penalty = (otConfig.deliveryType === 'wide' || otConfig.deliveryType === 'noball') ? 1 : 0;
                const total = deliveryRuns + penalty;
                const isBat = otConfig.deliveryType === 'normal' || otConfig.deliveryType === 'noball';
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Initial runs</span>
                      <span className="text-white text-sm font-mono font-bold">{otConfig.initialRuns}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Overthrow runs</span>
                      <span className="text-cyan-300 text-sm font-mono font-bold">+{otRuns}{otConfig.isBoundary ? ' (boundary)' : ''}</span>
                    </div>
                    {penalty > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">{otConfig.deliveryType === 'wide' ? 'Wide' : 'No-ball'} penalty</span>
                        <span className="text-pink-300 text-sm font-mono font-bold">+{penalty}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-white text-sm font-bold">Total to team</span>
                      <span className="text-emerald-400 text-lg font-display font-black">{total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px]">Credited to</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isBat ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isBat ? `Batsman (${deliveryRuns} runs)` : `Extras (${otConfig.deliveryType})`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowOTModal(false)}
                className="btn bg-white/5 text-slate-400 py-3 text-sm font-bold border border-white/5 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleCustomOverthrow}
                className="btn bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 text-sm font-bold hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-lg shadow-cyan-500/20">
                Apply Overthrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Out Modal */}
      {showRunOutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRunOutModal(false)}>
          <div className="bg-sec w-full max-w-md rounded-2xl p-6 border border-main shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 border-b border-main pb-4">
              <h3 className="text-xl font-display font-black text-main flex items-center gap-2">
                <AlertTriangle className="text-pink-500" />
                Run Out Configuration
              </h3>
              <button onClick={() => setShowRunOutModal(false)} className="text-slate-500 hover:text-main transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Delivery Type */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Delivery Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['normal', 'wide', 'noball'].map(type => (
                    <button key={type} onClick={() => setRunOutConfig(c => ({ ...c, deliveryType: type }))}
                      className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                        runOutConfig.deliveryType === type ? 'bg-pink-500/20 text-pink-500 border-pink-500' : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                      {type === 'normal' ? 'Legal Ball' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Out */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Who is Run Out?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setRunOutConfig(c => ({ ...c, playerOut: 'striker' }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      runOutConfig.playerOut === 'striker' ? 'bg-pink-500/20 border-pink-500 shadow-lg shadow-pink-500/10' : 'bg-white/5 border-white/5'
                    }`}>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Striker</span>
                    <span className={`text-sm font-bold truncate block ${runOutConfig.playerOut === 'striker' ? 'text-pink-500' : 'text-main'}`}>
                      {strikerName || 'Batsman 1'}
                    </span>
                  </button>
                  <button onClick={() => setRunOutConfig(c => ({ ...c, playerOut: 'non-striker' }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      runOutConfig.playerOut === 'non-striker' ? 'bg-pink-500/20 border-pink-500 shadow-lg shadow-pink-500/10' : 'bg-white/5 border-white/5'
                    }`}>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Non-Striker</span>
                    <span className={`text-sm font-bold truncate block ${runOutConfig.playerOut === 'non-striker' ? 'text-pink-500' : 'text-main'}`}>
                      {matchData.non_striker_name || 'Batsman 2'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Runs Completed */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-3">Runs completed before out</label>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <button onClick={() => setRunOutConfig(c => ({ ...c, runsCompleted: Math.max(0, c.runsCompleted - 1) }))}
                    className="w-10 h-10 rounded-lg bg-white/5 text-main flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                    <Minus size={16} />
                  </button>
                  <span className="text-main text-2xl font-display font-black w-12 text-center">{runOutConfig.runsCompleted}</span>
                  <button onClick={() => setRunOutConfig(c => ({ ...c, runsCompleted: c.runsCompleted + 1 }))}
                    className="w-10 h-10 rounded-lg bg-white/5 text-main flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                    <Plus size={16} />
                  </button>
                  <div className="flex gap-1.5 ml-auto">
                    {[0, 1, 2, 3].map(n => (
                      <button key={n} onClick={() => setRunOutConfig(c => ({ ...c, runsCompleted: n }))}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                          runOutConfig.runsCompleted === n ? 'bg-pink-500/30 text-pink-500 border border-pink-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => setShowRunOutModal(false)}
                className="btn bg-white/5 text-slate-400 py-3 text-sm font-bold border border-white/5 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleRunOutSubmit}
                className="btn bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 text-sm font-bold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/20">
                Confirm Run Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Extra Modal (Unified for Wide, NB, Bye, LB) */}
      {showCustomExtraModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCustomExtraModal(false)}>
          <div className="bg-sec w-full max-w-sm rounded-2xl p-6 border border-main shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 border-b border-main pb-4">
              <h3 className="text-xl font-display font-black text-main flex items-center gap-2">
                <Plus className="text-indigo-500" />
                Custom Extra
              </h3>
              <button onClick={() => setShowCustomExtraModal(false)} className="text-slate-500 hover:text-main transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Extra Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'wide', label: 'Wide', color: 'purple' },
                    { id: 'noball', label: 'NB', color: 'pink' },
                    { id: 'bye', label: 'Bye', color: 'indigo' },
                    { id: 'legbye', label: 'LB', color: 'orange' }
                  ].map(t => (
                    <button key={t.id} onClick={() => setCustomExtraConfig(c => ({ ...c, type: t.id }))}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                        customExtraConfig.type === t.id 
                          ? `bg-${t.color}-500/20 text-${t.color}-400 border-${t.color}-500` 
                          : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* No Ball Specific Option */}
              {customExtraConfig.type === 'noball' && (
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-xs text-slate-300">Runs off the bat?</span>
                  <button 
                    onClick={() => setCustomExtraConfig(c => ({ ...c, isOffBat: !c.isOffBat }))}
                    className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${
                      customExtraConfig.isOffBat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-white/5 text-slate-500 border-white/5'
                    }`}>
                    {customExtraConfig.isOffBat ? 'YES' : 'NO'}
                  </button>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-3">
                  {customExtraConfig.type === 'wide' || customExtraConfig.type === 'noball' ? 'Additional Runs (excluding penalty)' : 'Runs'}
                </label>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <button onClick={() => setCustomExtraConfig(c => ({ ...c, runs: Math.max(0, c.runs - 1) }))}
                    className="w-10 h-10 rounded-lg bg-white/5 text-main flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                    <Minus size={16} />
                  </button>
                  <span className="text-main text-2xl font-display font-black w-12 text-center">{customExtraConfig.runs}</span>
                  <button onClick={() => setCustomExtraConfig(c => ({ ...c, runs: c.runs + 1 }))}
                    className="w-10 h-10 rounded-lg bg-white/5 text-main flex items-center justify-center hover:bg-white/10 border border-white/10 transition-all">
                    <Plus size={16} />
                  </button>
                  <div className="flex flex-wrap gap-1.5 ml-auto justify-end max-w-[120px]">
                    {[0, 1, 2, 3, 4, 6].map(n => (
                      <button key={n} onClick={() => setCustomExtraConfig(c => ({ ...c, runs: n }))}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                          customExtraConfig.runs === n ? 'bg-indigo-500/30 text-indigo-500 border border-indigo-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => setShowCustomExtraModal(false)}
                className="btn bg-white/5 text-slate-400 py-3 text-sm font-bold border border-white/5 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={() => { 
                const { type, runs, isOffBat } = customExtraConfig;
                let totalRuns = runs;
                let label = '';
                let isLegal = false;
                let isExtra = true;
                let offBatRuns = null;

                if (type === 'wide') {
                  totalRuns = runs + 1;
                  label = runs === 0 ? 'Wd' : `Wd${runs+1}`;
                } else if (type === 'noball') {
                  totalRuns = runs + 1;
                  label = runs === 0 ? 'NB' : `NB${runs}`; // Simplified label
                  if (isOffBat) offBatRuns = runs;
                } else {
                  // Bye or Leg Bye
                  isLegal = true;
                  label = `${type === 'bye' ? 'B' : 'LB'}${runs}`;
                }

                addRuns(totalRuns, isLegal, isExtra, label, type, offBatRuns); 
                setShowCustomExtraModal(false); 
              }}
                className="btn bg-gradient-to-r from-indigo-500 to-violet-500 text-white py-3 text-sm font-bold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/20">
                Add Extra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Controls */}
      <div className="glass rounded-xl p-5 border border-main">
        <h4 className="text-main font-semibold text-sm mb-3">Match Controls</h4>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleNewOver} className="btn btn-secondary py-2.5 text-sm">New Over</button>
          {innings === 1 ? (
            <button onClick={handleEndInnings} className="btn bg-amber-500/20 text-amber-600 py-2.5 text-sm hover:bg-amber-500/30">End Innings</button>
          ) : (
            <button onClick={handleEndMatch} className="btn bg-blue-500/20 text-blue-600 py-2.5 text-sm hover:bg-blue-500/30">End Match</button>
          )}
        </div>
        <div className="mt-3">
          <EditableField label="Match Status" field="match_status" wide />
        </div>
      </div>

      {/* Live Batting Stats */}
      <div className="glass rounded-xl p-5 border border-main">
        <h4 className="text-main font-semibold text-sm mb-4 flex items-center gap-2">
          <Users size={16} className="text-emerald-400" />
          Live Batting Stats (Innings {innings})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-main">
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider">Batsman</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">R</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">B</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">SR</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main">
              {(() => {
                const history = JSON.parse(matchData.batters_history || '{}');
                
                // Combine history with current active batters
                const allBatters = { ...history };
                if (matchData.striker_name) {
                  allBatters[matchData.striker_name] = {
                    runs: parseInt(matchData.striker_runs || '0'),
                    balls: parseInt(matchData.striker_balls || '0'),
                    isOut: false
                  };
                }
                if (matchData.non_striker_name) {
                  allBatters[matchData.non_striker_name] = {
                    runs: parseInt(matchData.non_striker_runs || '0'),
                    balls: parseInt(matchData.non_striker_balls || '0'),
                    isOut: false
                  };
                }

                const entries = Object.entries(allBatters);
                if (entries.length === 0) {
                  return <tr><td colSpan="5" className="py-4 text-center text-slate-500 italic">No batting data yet.</td></tr>;
                }

                return entries.map(([name, stats]) => {
                  const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0';
                  const isStriker = name === matchData.striker_name;
                  const isNonStriker = name === matchData.non_striker_name;
                  const isActive = isStriker || isNonStriker;

                  return (
                    <tr key={name} className={`${isActive ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-2.5 font-bold text-main flex items-center gap-2">
                        {name}
                        {isStriker && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Striker" />}
                        {isNonStriker && <div className="w-1 h-1 rounded-full bg-slate-500" title="Non-Striker" />}
                      </td>
                      <td className="py-2.5 text-center font-mono text-main">{stats.runs}</td>
                      <td className="py-2.5 text-center font-mono text-main">{stats.balls}</td>
                      <td className="py-2.5 text-center font-mono text-slate-500">{sr}</td>
                      <td className="py-2.5 text-center">
                        {stats.isOut ? (
                          <span className="text-red-400/80 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold">OUT</span>
                        ) : (
                          <span className="text-emerald-400/80 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold">NOT OUT</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Bowler Stats */}
      <div className="glass rounded-xl p-5 border border-main">
        <h4 className="text-main font-semibold text-sm mb-4 flex items-center gap-2">
          <Wind size={16} className="text-violet-400" />
          Live Bowler Stats (Innings {innings})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-main">
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider">Bowler</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">O</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">R</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">W</th>
                <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-center">Econ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main">
              {(() => {
                const history = JSON.parse(matchData.bowlers_history || '{}');
                const bowlerEntries = Object.entries(history);
                
                if (bowlerEntries.length === 0 && !matchData.bowler_name) {
                  return <tr><td colSpan="5" className="py-4 text-center text-slate-500 italic">No bowling data yet.</td></tr>;
                }

                // Combine history with current active bowler if not in history yet
                const allBowlers = { ...history };
                if (matchData.bowler_name) {
                  allBowlers[matchData.bowler_name] = {
                    runs: parseInt(matchData.bowler_runs || '0'),
                    wickets: parseInt(matchData.bowler_wickets || '0'),
                    overs: matchData.bowler_overs || '0.0'
                  };
                }

                return Object.entries(allBowlers).map(([name, stats]) => {
                  const [o, b] = stats.overs.split('.').map(n => parseInt(n) || 0);
                  const totalOversDec = o + (b / 6);
                  const econ = totalOversDec > 0 ? (stats.runs / totalOversDec).toFixed(2) : '0.00';
                  const isActive = name === matchData.bowler_name;

                  return (
                    <tr key={name} className={`${isActive ? 'bg-violet-500/5' : ''}`}>
                      <td className="py-2.5 font-bold text-main flex items-center gap-2">
                        {name}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
                      </td>
                      <td className="py-2.5 text-center font-mono text-main">{stats.overs}</td>
                      <td className="py-2.5 text-center font-mono text-main">{stats.runs}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-emerald-500">{stats.wickets}</td>
                      <td className="py-2.5 text-center font-mono text-slate-500">{econ}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
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
                className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-sm outline-none focus:border-amber-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Wickets</label>
              <input type="number" value={matchData.wickets || 0} 
                onChange={(e) => emit('match:update', { field: 'wickets', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-sm outline-none focus:border-amber-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Overs</label>
              <input type="number" value={matchData.overs || 0} 
                onChange={(e) => emit('match:update', { field: 'overs', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-sm outline-none focus:border-amber-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Balls</label>
              <input type="number" value={matchData.balls || 0} 
                onChange={(e) => emit('match:update', { field: 'balls', value: parseInt(e.target.value) || 0 })}
                className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-sm outline-none focus:border-amber-500/50" 
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
                    className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Balls</label>
                  <input type="number" value={matchData.striker_balls || 0} 
                    onChange={(e) => emit('match:update', { field: 'striker_balls', value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-xs" />
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
                    className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Wickets</label>
                  <input type="number" value={matchData.bowler_wickets || 0} 
                    onChange={(e) => emit('match:update', { field: 'bowler_wickets', value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Overs (ex: 2.3)</label>
                  <input type="text" value={matchData.bowler_overs || '0'} 
                    onChange={(e) => emit('match:update', { field: 'bowler_overs', value: e.target.value })}
                    className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-main font-mono text-xs" />
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
