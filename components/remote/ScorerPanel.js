import { ArrowLeftRight } from 'lucide-react';

export default function ScorerPanel({ matchData, emit }) {
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

  function addRuns(runsToAdd, isLegal = true, isExtra = false) {
    const updates = [{ field: 'runs', value: runs + runsToAdd }];
    if (isLegal) {
      let nb = balls + 1, no = overs;
      if (nb >= 6) { no++; nb = 0; }
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
    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: label });
    if (runsToAdd % 2 === 1 && !isExtra) setTimeout(() => swapStrikers(), 50);
  }

  function handleWicket() {
    const updates = [
      { field: 'wickets', value: wickets + 1 },
      { field: 'bowler_wickets', value: bowlerWickets + 1 },
      { field: 'striker_balls', value: strikerBalls + 1 },
    ];
    let nb = balls + 1, no = overs;
    if (nb >= 6) { no++; nb = 0; }
    updates.push({ field: 'balls', value: nb }, { field: 'overs', value: no });
    const bo = parseFloat(bowlerOversVal), bw = Math.floor(bo), bb = Math.round((bo - bw) * 10);
    let nbb = bb + 1, nbw = bw;
    if (nbb >= 6) { nbw++; nbb = 0; }
    updates.push({ field: 'bowler_overs', value: `${nbw}.${nbb}` });
    emit('match:updateBulk', { updates });
    emit('match:addBall', { ball: 'W' });
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
      <div className="glass rounded-2xl p-4 text-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">{teamName}</span>
        <div className="text-white font-display font-black text-5xl mt-1">
          {runs}<span className="text-slate-500 text-3xl">/{wickets}</span>
        </div>
        <span className="text-slate-400 text-sm font-mono">{overs}.{balls} overs</span>
      </div>

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => addRuns(0)}
          className="score-btn bg-slate-800/80 text-slate-300 border border-white/5">
          Dot
        </button>
        <button onClick={() => addRuns(1)}
          className="score-btn bg-white/10 text-white border border-white/10">
          +1
        </button>
        <button onClick={() => addRuns(2)}
          className="score-btn bg-blue-500/20 text-blue-300 border border-blue-500/20">
          +2
        </button>
        <button onClick={() => addRuns(3)}
          className="score-btn bg-blue-600/25 text-blue-300 border border-blue-500/20">
          +3
        </button>
        <button onClick={() => addRuns(4)}
          className="score-btn bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-3xl">
          4
        </button>
        <button onClick={() => addRuns(6)}
          className="score-btn bg-amber-500/20 text-amber-300 border border-amber-500/20 text-3xl">
          6
        </button>
      </div>

      {/* Extras */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => addRuns(1, false, true)}
          className="score-btn bg-purple-500/15 text-purple-300 border border-purple-500/15 text-lg min-h-[60px]">
          Wide
        </button>
        <button onClick={() => addRuns(1, false, true)}
          className="score-btn bg-pink-500/15 text-pink-300 border border-pink-500/15 text-lg min-h-[60px]">
          No Ball
        </button>
      </div>

      {/* Wicket + Swap */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleWicket}
          className="score-btn bg-red-500/20 text-red-300 border border-red-500/20 text-xl min-h-[70px]">
          🏏 Wicket
        </button>
        <button onClick={swapStrikers}
          className="score-btn bg-white/5 text-slate-300 border border-white/5 text-base min-h-[70px] flex-col gap-1">
          <ArrowLeftRight size={24} />
          <span className="text-xs">Swap</span>
        </button>
      </div>
    </div>
  );
}
