import { useState, useEffect } from 'react';
import { History, Calendar, Trophy, ChevronRight, BarChart2 } from 'lucide-react';

export default function MatchHistory() {
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

  if (loading) return <div className="p-4 text-white text-center">Loading match history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <History className="text-blue-400" size={20} />
        <h2 className="text-xl font-bold text-white">Match History & Recordings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match List */}
        <div className="lg:col-span-1 space-y-3">
          {matches.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border border-white/5">
              <History size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No recorded matches found.</p>
            </div>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`glass rounded-xl p-4 border cursor-pointer transition-all ${
                  selectedMatch?.id === m.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                    <Calendar size={10} />
                    {new Date(m.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                    FINISHED
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm leading-tight">{m.team1} vs {m.team2}</span>
                    <span className="text-slate-400 text-xs mt-1">{m.score} ({m.overs} ov)</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Match Details */}
        <div className="lg:col-span-2">
          {selectedMatch ? (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/5">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Trophy size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Match Result</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-1">
                  {selectedMatch.team1} vs {selectedMatch.team2}
                </h3>
                <p className="text-slate-400 text-sm font-medium">{selectedMatch.result}</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Score Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Final Score</span>
                    <div className="text-2xl font-black text-white">{selectedMatch.score}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Total Overs</span>
                    <div className="text-2xl font-black text-white">{selectedMatch.overs}</div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-white font-bold">
                    <BarChart2 size={16} className="text-purple-400" />
                    Player Performance
                  </div>
                  
                  <div className="space-y-6">
                    {/* Batting Stats */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 uppercase tracking-wider border-b border-white/5">
                            <th className="pb-2 font-bold">Batsman</th>
                            <th className="pb-2 font-bold text-center">Runs</th>
                            <th className="pb-2 font-bold text-center">Balls</th>
                            <th className="pb-2 font-bold text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {Object.entries(selectedMatch.performances.batsmen || {}).map(([name, stats]) => (
                            <tr key={name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 font-medium text-white">{name}</td>
                              <td className="py-3 text-center">{stats.runs}</td>
                              <td className="py-3 text-center">{stats.balls}</td>
                              <td className="py-3 text-right text-blue-400 font-mono">{stats.strikeRate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bowling Stats */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 uppercase tracking-wider border-b border-white/5">
                            <th className="pb-2 font-bold">Bowler</th>
                            <th className="pb-2 font-bold text-center">O</th>
                            <th className="pb-2 font-bold text-center">R</th>
                            <th className="pb-2 font-bold text-center">W</th>
                            <th className="pb-2 font-bold text-right">ECON</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {Object.entries(selectedMatch.performances.bowlers || {}).map(([name, stats]) => (
                            <tr key={name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 font-medium text-white">{name}</td>
                              <td className="py-3 text-center">{stats.overs}</td>
                              <td className="py-3 text-center">{stats.runs}</td>
                              <td className="py-3 text-center font-bold text-emerald-400">{stats.wickets}</td>
                              <td className="py-3 text-right text-blue-400 font-mono">{stats.economy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Ball by Ball View */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-white font-bold">
                    <History size={16} className="text-emerald-400" />
                    Ball-by-Ball Log
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5 max-h-60 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.ballLog.map((b, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                          b.wicket ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                          b.run >= 4 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                          'bg-white/5 border-white/10 text-slate-400'
                        }`} title={`${b.striker} faced ${b.bowler}`}>
                          {b.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full glass rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center text-slate-500 p-12 text-center">
              <BarChart2 size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Select a match from the list to view detailed statistics and ball-by-ball logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
