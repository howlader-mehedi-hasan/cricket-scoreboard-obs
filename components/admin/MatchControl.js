import { useState, useEffect } from 'react';
import { ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Edit3, Plus, Minus, Undo2, BarChart2, Settings, Users, Wind, Zap, AlertTriangle, X, Eye, Skull, Trophy } from 'lucide-react';

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
          <span className="text-main text-sm font-black uppercase tracking-widest">
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
          className="w-full bg-sec border border-main rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-accent-primary appearance-none cursor-pointer transition-all pr-10 font-bold"
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
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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
      timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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
      striker: strikerName, bowler: bowlerName, timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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
      timestamp: new Date().toISOString(),
      innings: parseInt(matchData.innings || '1')
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

  function handleManualStrikerRuns(delta) {
    emit('match:update', { field: 'striker_runs', value: Math.max(0, parseInt(matchData.striker_runs || '0') + delta) });
  }

  function handleManualStrikerBalls(delta) {
    emit('match:update', { field: 'striker_balls', value: Math.max(0, parseInt(matchData.striker_balls || '0') + delta) });
  }

  function handleManualNonStrikerRuns(delta) {
    emit('match:update', { field: 'non_striker_runs', value: Math.max(0, parseInt(matchData.non_striker_runs || '0') + delta) });
  }

  function handleManualNonStrikerBalls(delta) {
    emit('match:update', { field: 'non_striker_balls', value: Math.max(0, parseInt(matchData.non_striker_balls || '0') + delta) });
  }

  function handleManualBowlerRuns(delta) {
    emit('match:update', { field: 'bowler_runs', value: Math.max(0, parseInt(matchData.bowler_runs || '0') + delta) });
  }

  function handleManualBowlerWickets(delta) {
    emit('match:update', { field: 'bowler_wickets', value: Math.max(0, parseInt(matchData.bowler_wickets || '0') + delta) });
  }

  function handleManualBowlerBalls(delta) {
    const parts = (matchData.bowler_overs || '0.0').split('.');
    const w = parseInt(parts[0] || '0');
    const b = parseInt(parts[1] || '0');
    let totalBalls = (w * 6) + b + delta;
    if (totalBalls < 0) totalBalls = 0;
    const newW = Math.floor(totalBalls / 6);
    const newB = totalBalls % 6;
    emit('match:update', { field: 'bowler_overs', value: `${newW}.${newB}` });
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
    <div className="space-y-6">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Score Display (Image 1 context) */}
        <div className="lg:col-span-12 xl:col-span-5 glass rounded-2xl p-4 md:p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-primary/10 rounded-full blur-3xl group-hover:bg-accent-primary/20 transition-all duration-700" />

          <div className="flex flex-col gap-6 relative z-10 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_var(--accent-primary)]" />
                  <h3 className="text-main font-display font-black text-xl md:text-2xl tracking-tight truncate">
                    {matchData.batting_team === 'team1' ? matchData.team1_name : matchData.team2_name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    Innings {innings}
                  </span>
                  <span className="text-accent-primary text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <BarChart2 size={12} /> Live Score
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-1.5 border border-white/5 backdrop-blur-sm">
                <button onClick={() => handleManualBalls(-1)} className="p-1 hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors rounded-md">
                  <Minus size={14} />
                </button>
                <div className="flex items-baseline gap-1 mx-2">
                  <span className="text-main text-lg font-mono font-black tracking-tight">{overs}.{balls}</span>
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Overs</span>
                </div>
                <button onClick={() => handleManualBalls(1)} className="p-1 hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors rounded-md">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
              {/* Runs Control */}
              <div className="flex-1 w-full flex items-center justify-between bg-black/30 rounded-2xl border border-white/5 p-1.5 shadow-inner backdrop-blur-md">
                <button
                  onClick={() => handleManualRuns(-1)}
                  className="w-10 h-12 md:w-12 md:h-14 flex items-center justify-center hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all rounded-xl"
                >
                  <Minus size={18} />
                </button>
                <div className="text-main font-display font-black text-5xl md:text-7xl tabular-nums leading-none tracking-tighter">
                  {runs}
                </div>
                <button
                  onClick={() => handleManualRuns(1)}
                  className="w-10 h-12 md:w-12 md:h-14 flex items-center justify-center hover:bg-accent-primary/10 text-slate-500 hover:text-accent-primary transition-all rounded-xl"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Wickets Control */}
              <div className="flex items-center bg-black/30 rounded-2xl border border-white/5 p-1.5 shadow-inner backdrop-blur-md h-full">
                <button
                  onClick={() => handleManualWickets(-1)}
                  className="w-8 h-10 md:w-10 md:h-12 flex items-center justify-center hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all rounded-xl"
                >
                  <Minus size={14} />
                </button>
                <div className="px-3 md:px-5 text-slate-500 text-3xl md:text-5xl font-black italic tabular-nums leading-none flex items-center">
                  <span className="text-xl md:text-2xl mr-0.5 opacity-50 not-italic">/</span>{wickets}
                </div>
                <button
                  onClick={() => handleManualWickets(1)}
                  className="w-8 h-10 md:w-10 md:h-12 flex items-center justify-center hover:bg-accent-primary/10 text-slate-500 hover:text-accent-primary transition-all rounded-xl"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Player Management (Image 2 context) */}
        <div className="lg:col-span-12 xl:col-span-7 glass rounded-2xl p-4 md:p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Users size={16} />
            </div>
            <div>
              <h4 className="text-main font-display font-black text-base md:text-lg tracking-tight uppercase">Active Roster</h4>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Personnel Control</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Striker Card */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group/card hover:bg-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                <Zap size={40} className="text-accent-primary" />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Striker</span>
                </div>
                {matchData.striker_name && (
                  <button
                    onClick={() => setChangingStriker(!changingStriker)}
                    className="text-accent-primary hover:text-main transition-colors bg-accent-primary/10 p-1.5 rounded-lg border border-accent-primary/20"
                    title="Change Player"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                )}
              </div>

              <div className="relative z-10">
                {(!matchData.striker_name || changingStriker) ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <PlayerSelect label="" field="striker_name" players={battingPlayers} onSelect={() => setChangingStriker(false)} />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="striker-jersey text-accent-primary font-mono font-black text-sm">{getJersey(matchData.striker_name, battingPlayers)}</span>
                        <h4 className="text-main font-bold text-lg leading-tight truncate">{matchData.striker_name}</h4>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-main font-display font-black text-2xl tabular-nums">{strikerRuns}</span>
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button onClick={() => handleManualStrikerRuns(-1)} className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 transition-all active:scale-90">
                              <Minus size={14} />
                            </button>
                            <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
                            <button onClick={() => handleManualStrikerRuns(1)} className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-accent-primary transition-all active:scale-90">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-sm font-medium">({strikerBalls})</span>
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button onClick={() => handleManualStrikerBalls(-1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-main transition-all active:scale-90">
                              <Minus size={12} />
                            </button>
                            <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
                            <button onClick={() => handleManualStrikerBalls(1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-main transition-all active:scale-90">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => emit('match:update', { field: 'striker_name', value: '' })} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Reset Player">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Non-Striker Card */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group/card hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Non-Striker</span>
                </div>
                {matchData.non_striker_name && (
                  <button
                    onClick={() => setChangingNonStriker(!changingNonStriker)}
                    className="text-slate-400 hover:text-main transition-colors bg-white/5 p-1.5 rounded-lg border border-white/10"
                    title="Change Player"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                )}
              </div>

              <div className="relative z-10">
                {(!matchData.non_striker_name || changingNonStriker) ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <PlayerSelect label="" field="non_striker_name" players={battingPlayers} onSelect={() => setChangingNonStriker(false)} />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 font-mono font-black text-sm">{getJersey(matchData.non_striker_name, battingPlayers)}</span>
                        <h4 className="text-main font-bold text-lg leading-tight truncate">{matchData.non_striker_name}</h4>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-main font-display font-black text-2xl tabular-nums">{matchData.non_striker_runs || 0}</span>
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button onClick={() => handleManualNonStrikerRuns(-1)} className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 transition-all active:scale-90">
                              <Minus size={14} />
                            </button>
                            <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
                            <button onClick={() => handleManualNonStrikerRuns(1)} className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-accent-primary transition-all active:scale-90">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-sm font-medium">({matchData.non_striker_balls || 0})</span>
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button onClick={() => handleManualNonStrikerBalls(-1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-main transition-all active:scale-90">
                              <Minus size={12} />
                            </button>
                            <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
                            <button onClick={() => handleManualNonStrikerBalls(1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-main transition-all active:scale-90">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => emit('match:update', { field: 'non_striker_name', value: '' })} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Reset Player">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bowler Card */}
            <div className="bg-accent-secondary/5 rounded-2xl p-4 border border-accent-secondary/10 relative overflow-hidden group/card hover:bg-accent-secondary/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                <Wind size={40} className="text-accent-secondary" />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse shadow-[0_0_8px_var(--accent-secondary)]" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Current Bowler</span>
                </div>
                {matchData.bowler_name && (
                  <button
                    onClick={() => setChangingBowler(!changingBowler)}
                    className="text-accent-secondary hover:text-main transition-colors bg-accent-secondary/10 p-1.5 rounded-lg border border-accent-secondary/20"
                    title="Change Bowler"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                )}
              </div>

              <div className="relative z-10">
                {(!matchData.bowler_name || changingBowler) ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <PlayerSelect label="" field="bowler_name" players={bowlingPlayers} isBowler onSelect={() => setChangingBowler(false)} />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bowler-jersey text-accent-secondary font-mono font-black text-sm">{getJersey(matchData.bowler_name, bowlingPlayers)}</span>
                        <h4 className="text-main font-bold text-lg leading-tight truncate">{matchData.bowler_name}</h4>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-main font-display font-black text-2xl tabular-nums">{bowlerWickets}/{bowlerRuns}</span>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                              <span className="text-[8px] text-slate-500 font-bold uppercase w-4 text-center">W</span>
                              <button onClick={() => handleManualBowlerWickets(-1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 transition-all"><Minus size={12} /></button>
                              <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
                              <button onClick={() => handleManualBowlerWickets(1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-accent-primary transition-all"><Plus size={12} /></button>
                            </div>
                            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                              <span className="text-[8px] text-slate-500 font-bold uppercase w-4 text-center">R</span>
                              <button onClick={() => handleManualBowlerRuns(-1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 transition-all"><Minus size={12} /></button>
                              <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
                              <button onClick={() => handleManualBowlerRuns(1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-accent-primary transition-all"><Plus size={12} /></button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-sm font-medium">({bowlerOversVal})</span>
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button onClick={() => handleManualBowlerBalls(-1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-main transition-all"><Minus size={12} /></button>
                            <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
                            <button onClick={() => handleManualBowlerBalls(1)} className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-main transition-all"><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => emit('match:update', { field: 'bowler_name', value: '' })} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Reset Bowler">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Dashboard Control Cockpit ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 relative z-10">

        {/* Column 1: Action Center (Left) */}
        <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden group h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-main font-display font-black text-lg tracking-tight">Action Center</h3>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Primary Scoring</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => addRuns(0)} className="h-14 rounded-xl bg-sec border border-main text-main font-display font-black text-xs hover:border-slate-500 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group/btn shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover/btn:scale-125 transition-transform" />
                <span className="uppercase tracking-widest text-[9px] opacity-60">Dot</span>
              </button>
              <button onClick={() => addRuns(1)} className="h-14 rounded-xl bg-sec border border-main text-main font-display font-black text-2xl hover:bg-accent-secondary/5 hover:border-accent-secondary/50 transition-all active:scale-95 shadow-sm">1</button>

              <button onClick={() => addRuns(2)} className="h-14 rounded-xl bg-sec border border-main text-main font-display font-black text-2xl hover:bg-accent-secondary/5 hover:border-accent-secondary/50 transition-all active:scale-95 shadow-sm">2</button>

              <button onClick={() => addRuns(3)} className="h-14 rounded-xl bg-sec border border-main text-main font-display font-black text-2xl hover:bg-accent-secondary/5 hover:border-accent-secondary/50 transition-all active:scale-95 shadow-sm">3</button>

              <button onClick={() => addRuns(4)} className="h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-display font-black text-3xl hover:bg-emerald-500 hover:text-main transition-all active:scale-95 shadow-lg shadow-emerald-500/10">4</button>
              <button onClick={() => addRuns(6)} className="h-14 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 font-display font-black text-3xl hover:bg-violet-500 hover:text-main transition-all active:scale-95 shadow-lg shadow-violet-500/10">6</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleWide} className="h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[10px] uppercase tracking-wider hover:bg-purple-500/20 transition-all active:scale-95">Wide</button>
              <button onClick={handleNoBall} className="h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-black text-[10px] uppercase tracking-wider hover:bg-pink-500/20 transition-all active:scale-95">No Ball</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleWicket} className="h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-main font-display font-black text-xs hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
                <Zap size={16} className="fill-current" />
                WICKET
              </button>
              <button onClick={() => setShowRunOutModal(true)} className="h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-main font-display font-black text-xs hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
                <Skull size={16} />
                RUN OUT
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={swapStrikers} className="h-12 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-black text-[9px] uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2">
                <ArrowLeftRight size={14} className="text-accent-primary" />
                Swap
              </button>
              <button onClick={handleUndo} className="h-12 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400/70 font-black text-[9px] uppercase tracking-wider hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Undo2 size={14} />
                Undo
              </button>
            </div>

            <button onClick={() => emit('match:update', { field: 'show_partnership', value: matchData.show_partnership === 'true' ? 'false' : 'true' })} className={`w-full h-12 rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-2 ${matchData.show_partnership === 'true' ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
              <Users size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Partnership View</span>
            </button>
          </div>
        </div>
        {/* Column 2: Overthrows & Extras (Middle) */}
        <div className="glass rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/5 relative overflow-hidden group h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Wind size={18} />
            </div>
            <div>
              <h3 className="text-cyan-400 font-display font-black text-lg tracking-tight">Overthrows & Extras</h3>
              <p className="text-cyan-500/50 text-[9px] font-bold uppercase tracking-widest">Advanced Actions</p>
            </div>
            <button onClick={() => setShowOTModal(true)} className="ml-auto bg-cyan-500 text-black font-black text-[9px] px-3 py-1.5 rounded-lg hover:bg-cyan-400 transition-all active:scale-95">
              Custom
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-3 flex items-center gap-2">
                Quick Overthrows
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleOT1} className="h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-black text-[10px] hover:bg-cyan-500/20 transition-all active:scale-95">OT +1</button>
                <button onClick={handleOT2} className="h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 font-black text-[10px] hover:bg-cyan-500/25 transition-all active:scale-95">OT +2</button>
                <button onClick={handleOT4} className="h-11 rounded-xl bg-cyan-500/25 border border-cyan-500/35 text-cyan-100 font-black text-[10px] hover:bg-cyan-500/35 transition-all active:scale-95">OT +4</button>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-3">Byes & Leg Byes</label>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleBye(1)} className="h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black text-[10px] hover:bg-indigo-500/20 transition-all active:scale-95">B 1</button>
                <button onClick={() => handleBye(4)} className="h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 font-black text-[10px] hover:bg-indigo-500/25 transition-all active:scale-95">B 4</button>
                <button onClick={() => handleLegBye(1)} className="h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-black text-[10px] hover:bg-violet-500/20 transition-all active:scale-95">LB 1</button>
                <button onClick={() => handleLegBye(4)} className="h-11 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 font-black text-[10px] hover:bg-violet-500/25 transition-all active:scale-95">LB 4</button>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-3">Special Scenarios</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleWide4} className="h-11 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-300 font-black text-[10px] hover:bg-purple-500/25 transition-all active:scale-95">Wide + 4</button>
                <button onClick={handleNoBall4} className="h-11 rounded-xl bg-pink-500/15 border border-pink-500/25 text-pink-300 font-black text-[10px] hover:bg-pink-500/25 transition-all active:scale-95">NB + 4</button>
                <button onClick={handleLegBye4} className="h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-[10px] hover:bg-orange-500/20 transition-all active:scale-95">LB + 4</button>
                <button onClick={handleNoBall6} className="h-11 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 font-black text-[10px] hover:bg-rose-500/25 transition-all active:scale-95">NB + 6</button>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-3">Mixed Overthrows</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleByeOT} className="h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 font-black text-[10px] hover:bg-teal-500/20 transition-all active:scale-95">Bye OT</button>
                <button onClick={handleLegByeOT} className="h-11 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-300 font-black text-[10px] hover:bg-teal-500/25 transition-all active:scale-95">LB OT</button>
                <button onClick={handleWideOT} className="h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-black text-[10px] hover:bg-violet-500/20 transition-all active:scale-95">Wd OT</button>
                <button onClick={handleNoBallOT} className="h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 font-black text-[10px] hover:bg-pink-500/20 transition-all active:scale-95">NB OT</button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Match Settings (Right) */}
        <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden group h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-main font-display font-black text-lg tracking-tight">Match Control</h3>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Configuration & Meta</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">PowerPlay</span>
                <div className="flex gap-1">
                  {['P1', 'P2', 'P3'].map(p => (
                    <button
                      key={p}
                      onClick={() => emit('match:update', { field: 'powerplay', value: p })}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all duration-300 ${(matchData.powerplay || 'P1') === p
                        ? 'bg-accent-primary text-main shadow-lg'
                        : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Overs Limit</span>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <input
                    type="number"
                    value={matchData.total_overs || '20'}
                    onChange={(e) => emit('match:update', { field: 'total_overs', value: e.target.value })}
                    className="bg-transparent text-main text-sm font-black outline-none w-10 text-center"
                  />
                  <span className="text-[8px] text-slate-500 font-bold">OVS</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Wickets Limit</span>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <input
                    type="number"
                    value={matchData.total_wickets || '10'}
                    onChange={(e) => emit('match:update', { field: 'total_wickets', value: e.target.value })}
                    className="bg-transparent text-main text-sm font-black outline-none w-10 text-center"
                  />
                  <span className="text-[8px] text-slate-500 font-bold">WKT</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNewOver()}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-95 group"
                >
                  <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">New Over</span>
                </button>

                {innings === 1 ? (
                  <button
                    onClick={handleEndInnings}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95"
                  >
                    <Zap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">End Innings</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndMatch}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 transition-all active:scale-95"
                  >
                    <Trophy size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">End Match</span>
                  </button>
                )}
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-3">
                <button
                  onClick={() => emit('match:update', { field: 'show_scoreboard', value: matchData.show_scoreboard === 'false' ? 'true' : 'false' })}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 ${matchData.show_scoreboard !== 'false'
                    ? 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/40'
                    : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Eye size={16} className={matchData.show_scoreboard !== 'false' ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Scoreboard View</span>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${matchData.show_scoreboard !== 'false' ? 'bg-accent-secondary shadow-[0_0_8px_var(--accent-secondary)]' : 'bg-slate-700'}`} />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setShowCustomExtraModal(true); }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Plus size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Extra</span>
                  </button>

                  <button
                    onClick={() => emit('match:update', { field: 'free_hit', value: matchData.free_hit === 'true' ? 'false' : 'true' })}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all active:scale-95 ${matchData.free_hit === 'true' ? 'bg-amber-500 text-black border-amber-500' : 'bg-amber-500/5 border-amber-500/20 text-amber-500/70 hover:bg-amber-500/10'
                      }`}
                  >
                    <Zap size={14} className={matchData.free_hit === 'true' ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Free Hit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Custom Overthrow Modal ═══════ */}
      {showOTModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOTModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md border border-cyan-500/20 shadow-2xl shadow-cyan-500/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-main font-display font-black text-xl flex items-center gap-2">
                <Zap size={20} className="text-cyan-400" />
                Custom Overthrow
              </h3>
              <button onClick={() => setShowOTModal(false)} className="text-slate-500 hover:text-main transition-colors">
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
                    className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${otConfig.deliveryType === opt.value
                      ? opt.activeClass
                      : 'bg-sec text-slate-500 border-main hover:bg-white/5 hover:text-main'
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
                  className="w-10 h-10 rounded-lg bg-sec text-main flex items-center justify-center hover:bg-accent-primary hover:text-main border border-main transition-all">
                  <Minus size={16} />
                </button>
                <span className="text-main text-2xl font-display font-black w-12 text-center">{otConfig.initialRuns}</span>
                <button onClick={() => setOtConfig(c => ({ ...c, initialRuns: c.initialRuns + 1 }))}
                  className="w-10 h-10 rounded-lg bg-sec text-main flex items-center justify-center hover:bg-accent-primary hover:text-main border border-main transition-all">
                  <Plus size={16} />
                </button>
                <div className="flex gap-1.5 ml-auto">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} onClick={() => setOtConfig(c => ({ ...c, initialRuns: n }))}
                      className={`w-8 h-8 rounded text-xs font-bold transition-all ${otConfig.initialRuns === n ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
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
                  className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${!otConfig.isBoundary ? 'bg-slate-600/30 text-main border-slate-400/30' : 'bg-white/5 text-slate-500 border-white/5'
                    }`}>
                  No (kept running)
                </button>
                <button
                  onClick={() => setOtConfig(c => ({ ...c, isBoundary: true, additionalRuns: 0 }))}
                  className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${otConfig.isBoundary ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/5'
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
                    className="w-10 h-10 rounded-lg bg-sec text-main flex items-center justify-center hover:bg-accent-secondary hover:text-main border border-main transition-all">
                    <Minus size={16} />
                  </button>
                  <span className="text-main text-2xl font-display font-black w-12 text-center">{otConfig.additionalRuns}</span>
                  <button onClick={() => setOtConfig(c => ({ ...c, additionalRuns: c.additionalRuns + 1 }))}
                    className="w-10 h-10 rounded-lg bg-sec text-main flex items-center justify-center hover:bg-accent-secondary hover:text-main border border-main transition-all">
                    <Plus size={16} />
                  </button>
                  <div className="flex gap-1.5 ml-auto">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} onClick={() => setOtConfig(c => ({ ...c, additionalRuns: n }))}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${otConfig.additionalRuns === n ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
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
                      <span className="text-main text-sm font-mono font-black">{otConfig.initialRuns}</span>
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
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                      <span className="text-main text-sm font-black uppercase tracking-wider">Total to team</span>
                      <span className="text-accent-primary text-xl font-display font-black">{total} Runs</span>
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
                className="btn bg-gradient-to-r from-cyan-500 to-emerald-500 text-main py-3 text-sm font-bold hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-lg shadow-cyan-500/20">
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
                      className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${runOutConfig.deliveryType === type ? 'bg-pink-500/20 text-pink-500 border-pink-500' : 'bg-white/5 text-slate-400 border-white/5'
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
                    className={`p-4 rounded-xl border text-left transition-all ${runOutConfig.playerOut === 'striker' ? 'bg-pink-500/20 border-pink-500 shadow-lg shadow-pink-500/10' : 'bg-white/5 border-white/5'
                      }`}>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Striker</span>
                    <span className={`text-sm font-bold truncate block ${runOutConfig.playerOut === 'striker' ? 'text-pink-500' : 'text-main'}`}>
                      {strikerName || 'Batsman 1'}
                    </span>
                  </button>
                  <button onClick={() => setRunOutConfig(c => ({ ...c, playerOut: 'non-striker' }))}
                    className={`p-4 rounded-xl border text-left transition-all ${runOutConfig.playerOut === 'non-striker' ? 'bg-pink-500/20 border-pink-500 shadow-lg shadow-pink-500/10' : 'bg-white/5 border-white/5'
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
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${runOutConfig.runsCompleted === n ? 'bg-pink-500/30 text-pink-500 border border-pink-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
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
                className="btn bg-gradient-to-r from-pink-500 to-rose-500 text-main py-3 text-sm font-bold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/20">
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
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${customExtraConfig.type === t.id
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
                    className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${customExtraConfig.isOffBat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-white/5 text-slate-500 border-white/5'
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
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${customExtraConfig.runs === n ? 'bg-indigo-500/30 text-indigo-500 border border-indigo-500/50' : 'bg-white/5 text-slate-400 border border-white/5'
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
                  label = runs === 0 ? 'Wd' : `Wd${runs + 1}`;
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
                className="btn bg-gradient-to-r from-indigo-500 to-violet-500 text-main py-3 text-sm font-bold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/20">
                Add Extra
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Advanced Overlay */}
      <div className="glass rounded-xl overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-5 py-3 flex items-center justify-between text-main font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
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
              <button onClick={() => { if (confirm('Reset all match data?')) emit('match:reset'); }} className="btn btn-danger w-full py-2.5 flex items-center gap-2 justify-center bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-main">
                <RotateCcw size={16} /> Reset Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
