import { useState, useEffect } from 'react';
import { History, Calendar, Trophy, ChevronRight, BarChart2, Users, Wind, Check } from 'lucide-react';

export default function MatchHistory({ matchData }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      setMatches(data.reverse()); // Show newest first
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-accent-secondary/20 border-t-accent-secondary rounded-full animate-spin" />
      <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Retrieving Archives...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Live Match Performance Tracking */}
      {matchData && (matchData.striker_name || matchData.bowler_name || matchData.runs > 0) && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
               <BarChart2 size={16} />
             </div>
             <h3 className="text-main font-display font-black text-xl tracking-tight uppercase">Live Performance Tracker</h3>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Live Batting Stats */}
              <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users size={80} className="text-emerald-400" />
                </div>
                <h4 className="text-main font-bold text-sm mb-4 flex items-center gap-2 relative z-10">
                  <Users size={16} className="text-emerald-400" />
                  Live Batting Stats (Innings {matchData.innings || 1})
                </h4>
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 uppercase font-black tracking-widest text-[10px]">
                        <th className="py-2">Batsman</th>
                        <th className="py-2 text-center">R</th>
                        <th className="py-2 text-center">B</th>
                        <th className="py-2 text-center">SR</th>
                        <th className="py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const history = JSON.parse(matchData.batters_history || '{}');
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
                          return <tr><td colSpan="5" className="py-4 text-center text-slate-500 italic">No live batting data.</td></tr>;
                        }

                        return entries.map(([name, stats]) => {
                          const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0';
                          const isStriker = name === matchData.striker_name;
                          const isNonStriker = name === matchData.non_striker_name;
                          const isActive = isStriker || isNonStriker;

                          return (
                            <tr key={name} className={`group/row ${isActive ? 'bg-emerald-500/5' : ''}`}>
                              <td className="py-2.5 font-bold text-main flex items-center gap-2">
                                {name}
                                {isStriker && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                {isNonStriker && <div className="w-1 h-1 rounded-full bg-slate-600" />}
                              </td>
                              <td className="py-2.5 text-center font-mono text-main">{stats.runs}</td>
                              <td className="py-2.5 text-center font-mono text-main">{stats.balls}</td>
                              <td className="py-2.5 text-center font-mono text-slate-500">{sr}</td>
                              <td className="py-2.5 text-center">
                                {stats.isOut ? (
                                  <span className="text-red-400/80 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black">OUT</span>
                                ) : (
                                  <span className="text-emerald-400/80 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase">Not Out</span>
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
              <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wind size={80} className="text-violet-400" />
                </div>
                <h4 className="text-main font-bold text-sm mb-4 flex items-center gap-2 relative z-10">
                  <Wind size={16} className="text-violet-400" />
                  Live Bowler Stats (Innings {matchData.innings || 1})
                </h4>
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 uppercase font-black tracking-widest text-[10px]">
                        <th className="py-2">Bowler</th>
                        <th className="py-2 text-center">O</th>
                        <th className="py-2 text-center">R</th>
                        <th className="py-2 text-center">W</th>
                        <th className="py-2 text-center">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const history = JSON.parse(matchData.bowlers_history || '{}');
                        const allBowlers = { ...history };
                        if (matchData.bowler_name) {
                          allBowlers[matchData.bowler_name] = {
                            runs: parseInt(matchData.bowler_runs || '0'),
                            wickets: parseInt(matchData.bowler_wickets || '0'),
                            overs: matchData.bowler_overs || '0.0'
                          };
                        }

                        const bowlerEntries = Object.entries(allBowlers);
                        if (bowlerEntries.length === 0) {
                          return <tr><td colSpan="5" className="py-4 text-center text-slate-500 italic">No live bowling data.</td></tr>;
                        }

                        return bowlerEntries.map(([name, stats]) => {
                          const [o, b] = stats.overs.split('.').map(n => parseInt(n) || 0);
                          const totalOversDec = o + (b / 6);
                          const econ = totalOversDec > 0 ? (stats.runs / totalOversDec).toFixed(2) : '0.00';
                          const isActive = name === matchData.bowler_name;

                          return (
                            <tr key={name} className={`group/row ${isActive ? 'bg-violet-500/5' : ''}`}>
                              <td className="py-2.5 font-bold text-main flex items-center gap-2">
                                {name}
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
                              </td>
                              <td className="py-2.5 text-center font-mono text-main">{stats.overs}</td>
                              <td className="py-2.5 text-center font-mono text-main">{stats.runs}</td>
                              <td className="py-2.5 text-center font-mono font-black text-emerald-500">{stats.wickets}</td>
                              <td className="py-2.5 text-center font-mono text-slate-500">{econ}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
           
           <div className="h-px bg-white/5" />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary border border-accent-secondary/20">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-main font-display font-black text-2xl tracking-tight">Match Archives</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Historical Performance & Detailed Logs</p>
          </div>
        </div>
        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-black/20 rounded-full border border-white/5">
           Total Recorded: {matches.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Match List */}
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {matches.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border-2 border-dashed border-white/5">
              <History size={48} className="text-slate-800 mx-auto mb-4 opacity-20" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic">No match logs available</p>
            </div>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`glass rounded-2xl p-5 border transition-all duration-500 relative overflow-hidden group cursor-pointer ${
                  selectedMatch?.id === m.id 
                    ? 'border-accent-secondary bg-accent-secondary/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                    : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 font-black uppercase tracking-widest">
                    <Calendar size={12} className="text-accent-secondary" />
                    {new Date(m.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-[9px] font-black tracking-tighter bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase">
                    Completed
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="flex flex-col min-w-0">
                    <span className="text-main font-display font-black text-lg truncate pr-2 group-hover:text-accent-secondary transition-colors">
                      {m.team1} <span className="text-slate-500 text-sm mx-1">vs</span> {m.team2}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                       <span className="text-accent-secondary font-mono font-black text-sm">{m.score}</span>
                       <div className="w-1 h-1 rounded-full bg-slate-700" />
                       <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{m.overs} Overs</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${selectedMatch?.id === m.id ? 'bg-accent-secondary border-accent-secondary text-main' : 'border-main text-slate-500 group-hover:border-accent-secondary group-hover:text-accent-secondary'}`}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Match Details */}
        <div className="lg:col-span-2">
          {selectedMatch ? (
            <div className="glass rounded-3xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 shadow-2xl">
              <div className="bg-gradient-to-br from-accent-secondary/20 via-purple-600/10 to-transparent p-8 border-b border-white/10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5">
                   <Trophy size={200} className="text-main" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-accent-secondary mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent-secondary/20 flex items-center justify-center border border-accent-secondary/30">
                       <Trophy size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Match Summary & Result</span>
                  </div>
                  
                  <h3 className="text-4xl font-display font-black text-main mb-3 tracking-tight">
                    {selectedMatch.team1} <span className="text-slate-500 font-normal">v</span> {selectedMatch.team2}
                  </h3>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                     <Check size={14} /> {selectedMatch.result}
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-10">
                {/* Score Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-black/30 rounded-2xl p-6 border border-white/5 group hover:border-accent-secondary/30 transition-colors">
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] block mb-3 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary" /> Final Score
                    </span>
                    <div className="text-4xl font-mono font-black text-main group-hover:text-accent-secondary transition-colors">{selectedMatch.score}</div>
                  </div>
                  <div className="bg-black/30 rounded-2xl p-6 border border-white/5 group hover:border-accent-secondary/30 transition-colors">
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] block mb-3 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Match Duration
                    </span>
                    <div className="text-4xl font-mono font-black text-main group-hover:text-purple-400 transition-colors">{selectedMatch.overs} <span className="text-sm font-display text-slate-500">OVERS</span></div>
                  </div>
                </div>

                {/* Performance Analytics */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
                      <BarChart2 size={16} />
                    </div>
                    <h4 className="text-main font-display font-black text-xl">Player Analytics</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Batting Analytics */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-accent-primary" /> Top Batsmen
                      </h5>
                      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="text-slate-500 uppercase tracking-widest bg-white/5 border-b border-white/10">
                              <th className="px-4 py-3 font-black">Player</th>
                              <th className="px-4 py-3 font-black text-center">R</th>
                              <th className="px-4 py-3 font-black text-center">B</th>
                              <th className="px-4 py-3 font-black text-right">SR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {Object.entries(selectedMatch.performances.batsmen || {}).map(([name, stats]) => (
                              <tr key={name} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 font-bold text-main group-hover:text-accent-primary transition-colors">{name}</td>
                                <td className="px-4 py-3 text-center font-mono font-black">{stats.runs}</td>
                                <td className="px-4 py-3 text-center text-slate-500 font-mono">{stats.balls}</td>
                                <td className="px-4 py-3 text-right text-accent-secondary font-mono font-bold">{stats.strikeRate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bowling Analytics */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-accent-secondary" /> Top Bowlers
                      </h5>
                      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="text-slate-500 uppercase tracking-widest bg-white/5 border-b border-white/10">
                              <th className="px-4 py-3 font-black">Player</th>
                              <th className="px-4 py-3 font-black text-center">O</th>
                              <th className="px-4 py-3 font-black text-center">W</th>
                              <th className="px-4 py-3 font-black text-right">ECON</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {Object.entries(selectedMatch.performances.bowlers || {}).map(([name, stats]) => (
                              <tr key={name} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 font-bold text-main group-hover:text-accent-secondary transition-colors">{name}</td>
                                <td className="px-4 py-3 text-center text-slate-500 font-mono">{stats.overs}</td>
                                <td className="px-4 py-3 text-center font-mono font-black text-emerald-400">{stats.wickets}</td>
                                <td className="px-4 py-3 text-right text-accent-primary font-mono font-bold">{stats.economy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ball by Ball Visualization */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <History size={16} />
                      </div>
                      <h4 className="text-main font-display font-black text-xl">Ball-by-Ball Log</h4>
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-500 bg-sec px-3 py-1 rounded-full border border-main">
                       {selectedMatch.ballLog.length} Total Deliveries
                    </div>
                  </div>
                  
                  <div className="bg-sec rounded-3xl p-6 border border-main shadow-inner">
                    <div className="flex flex-wrap gap-3">
                      {selectedMatch.ballLog.map((b, i) => (
                        <div 
                          key={i} 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all hover:scale-110 cursor-default shadow-lg ${
                            b.wicket 
                              ? 'bg-red-500 text-main border-red-400 shadow-red-500/20' 
                              : b.run >= 6 
                                ? 'bg-purple-600 text-main border-purple-400 shadow-purple-500/20'
                                : b.run >= 4
                                  ? 'bg-blue-600 text-main border-blue-400 shadow-lg'
                                  : 'bg-sec border-main text-slate-500'
                          }`} 
                          title={`${b.striker} vs ${b.bowler} • ${b.label}`}
                        >
                          {b.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] glass rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center p-12 group">
              <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5">
                 <BarChart2 size={40} className="text-slate-700 opacity-30" />
              </div>
              <h4 className="text-slate-400 font-display font-black text-2xl mb-2">No Match Selected</h4>
              <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">Click on a match from the archives to view deep analytics and ball-by-ball breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
