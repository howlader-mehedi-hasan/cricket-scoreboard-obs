import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import AnimatedNumber from '@/components/AnimatedNumber';
import BallTimeline from '@/components/BallTimeline';

export default function Overlay() {
  const { matchData, styleData } = useSocket();
  const [recentBalls, setRecentBalls] = useState([]);

  useEffect(() => {
    document.body.classList.add('overlay-body');
    return () => document.body.classList.remove('overlay-body');
  }, []);

  useEffect(() => {
    if (matchData?.recent_balls) {
      try {
        setRecentBalls(JSON.parse(matchData.recent_balls));
      } catch {
        setRecentBalls([]);
      }
    }
  }, [matchData?.recent_balls]);

  if (!matchData || !styleData) {
    return (
      <>
        <Head>
          <title>Cricket Overlay - Loading</title>
        </Head>
        <div className="overlay-body" />
      </>
    );
  }

  const primaryColor = styleData.primary_color || '#10b981';
  const secondaryColor = styleData.secondary_color || '#3b82f6';
  const bgOpacity = parseFloat(styleData.bg_opacity || '0.75');
  const xOffset = parseFloat(styleData.x_offset || '50');
  const yOffset = parseFloat(styleData.y_offset || '85');
  const showTimeline = styleData.show_timeline !== '0';

  const runs = matchData.runs || '0';
  const wickets = matchData.wickets || '0';
  const overs = matchData.overs || '0';
  const balls = matchData.balls || '0';
  const team1 = matchData.team1_name || 'Team A';
  const team2 = matchData.team2_name || 'Team B';
  const battingTeam = matchData.batting_team || 'team1';
  const teamName = battingTeam === 'team1' ? team1 : team2;
  const bowlingTeam = battingTeam === 'team1' ? team2 : team1;
  const oversDisplay = `${overs}.${balls}`;
  const target = parseInt(matchData.target || '0');
  const innings = parseInt(matchData.innings || '1');
  const matchStatus = matchData.match_status || '';

  const strikerName = matchData.striker_name || 'Batsman';
  const strikerRuns = matchData.striker_runs || '0';
  const strikerBalls = matchData.striker_balls || '0';
  const nonStrikerName = matchData.non_striker_name || '';
  const bowlerName = matchData.bowler_name || 'Bowler';
  const bowlerFigs = `${matchData.bowler_wickets || '0'}/${matchData.bowler_runs || '0'}`;
  const bowlerOvers = matchData.bowler_overs || '0';

  return (
    <>
      <Head>
        <title>Cricket Scoreboard Overlay</title>
      </Head>

      <div
        className="fixed w-full"
        style={{
          left: `${xOffset - 50}%`,
          top: `${yOffset}%`,
          transform: 'translateY(-100%)',
          padding: '0 24px',
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="max-w-[900px] mx-auto"
        >
          {/* Main Scoreboard Card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: `rgba(15, 23, 42, ${bgOpacity})`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-[3px]"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
              }}
            />

            <div className="px-5 py-3">
              {/* Row 1: Team & Score */}
              <div className="flex items-center justify-between">
                {/* Left: Team Badge + Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{ background: primaryColor }}
                  />
                  <div>
                    <motion.h2
                      key={teamName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-white font-display font-bold text-lg tracking-wide leading-tight"
                    >
                      {teamName}
                    </motion.h2>
                    <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                      {innings > 1 ? `${innings}nd Innings` : 'Batting'}
                    </span>
                  </div>
                </div>

                {/* Center: Score */}
                <div className="flex items-baseline gap-1">
                  <AnimatedNumber value={runs} size="text-5xl" className="text-white" />
                  <span className="text-slate-400 text-2xl font-display font-bold">/</span>
                  <AnimatedNumber value={wickets} size="text-3xl" className="text-slate-300" />
                </div>

                {/* Right: Overs + Target */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Overs</span>
                    <AnimatedNumber value={oversDisplay} size="text-xl" className="text-white font-display" />
                  </div>
                  {target > 0 && innings > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] mt-0.5 font-medium"
                      style={{ color: secondaryColor }}
                    >
                      Target: {target} | Need {Math.max(0, target - parseInt(runs))} off{' '}
                      {/* remaining balls estimation */}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Row 2: Player Info */}
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                {/* Striker */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-semibold text-sm">{strikerName}</span>
                  </div>
                  <span className="text-slate-300 text-sm font-mono">
                    {strikerRuns}<span className="text-slate-500">({strikerBalls})</span>
                  </span>

                  {nonStrikerName && (
                    <>
                      <span className="text-slate-600 mx-1">|</span>
                      <span className="text-slate-400 text-sm">{nonStrikerName}</span>
                    </>
                  )}
                </div>

                {/* Bowler */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Bowl</span>
                  <span className="text-slate-300 text-sm font-medium">{bowlerName}</span>
                  <span className="text-slate-400 text-sm font-mono">
                    {bowlerFigs} <span className="text-slate-600">({bowlerOvers}ov)</span>
                  </span>
                </div>
              </div>

              {/* Row 3: Ball Timeline */}
              <AnimatePresence>
                {showTimeline && recentBalls.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2.5 pt-2.5 border-t border-white/5"
                  >
                    <BallTimeline balls={recentBalls} maxVisible={18} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Match Status */}
              <AnimatePresence>
                {matchStatus && matchStatus !== 'Yet to begin' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-center"
                  >
                    <span
                      className="text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full"
                      style={{
                        background: `${primaryColor}20`,
                        color: primaryColor,
                      }}
                    >
                      {matchStatus}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
