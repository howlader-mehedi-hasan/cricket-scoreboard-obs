import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import AnimatedNumber from '@/components/AnimatedNumber';
import BallTimeline from '@/components/BallTimeline';

const LayoutDefault = ({ 
  teamName, runs, wickets, innings, strikerName, strikerRuns, strikerBalls, 
  nonStrikerName, bowlerName, bowlerFigs, bowlerOvers, oversDisplay, 
  target, primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls, matchStatus 
}) => (
  <div
    className="rounded-xl overflow-hidden shadow-2xl"
    style={{
      background: `rgba(15, 23, 42, ${bgOpacity})`,
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
    <div className="px-6 py-2.5">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full" style={{ background: primaryColor }} />
            <div>
              <h2 className="text-white font-display font-bold text-xl tracking-tight leading-tight">{teamName}</h2>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {innings > 1 ? `${innings}nd Inn` : 'Batting'}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 px-5 border-l border-white/10">
            <AnimatedNumber value={runs} size="text-4xl" className="text-white" />
            <span className="text-slate-400 text-xl font-display font-bold">/</span>
            <AnimatedNumber value={wickets} size="text-2xl" className="text-slate-300" />
          </div>
        </div>
        <div className="flex items-center gap-8 flex-grow justify-center px-6 border-x border-white/10 overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm whitespace-nowrap">{strikerName}*</span>
              <span className="text-slate-300 text-sm font-mono whitespace-nowrap">{strikerRuns}({strikerBalls})</span>
            </div>
            {nonStrikerName && <span className="text-slate-400 font-medium text-sm whitespace-nowrap opacity-60">{nonStrikerName}</span>}
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-white/5">
            <span className="text-slate-300 text-sm font-medium whitespace-nowrap">{bowlerName}</span>
            <span className="text-slate-400 text-sm font-mono whitespace-nowrap">{bowlerFigs} ({bowlerOvers})</span>
          </div>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Overs</span>
              <AnimatedNumber value={oversDisplay} size="text-2xl" className="text-white font-display" />
            </div>
            {target > 0 && innings > 1 && <div className="text-[10px] font-bold text-right" style={{ color: secondaryColor }}>Target: {target}</div>}
          </div>
        </div>
      </div>
      {(showTimeline && recentBalls.length > 0) || (matchStatus && matchStatus !== 'Yet to begin') ? (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div className="flex-grow overflow-hidden"><BallTimeline balls={recentBalls} maxVisible={24} /></div>
          {matchStatus && matchStatus !== 'Yet to begin' && (
            <div className="ml-4 shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border" 
                 style={{ background: `${primaryColor}10`, color: primaryColor, borderColor: `${primaryColor}20` }}>
              {matchStatus}
            </div>
          )}
        </div>
      ) : null}
    </div>
  </div>
);

const LayoutTSports = ({
  teamName, runs, wickets, bowlingTeam, oversDisplay, target, innings, matchStatus,
  strikerName, strikerRuns, strikerBalls, nonStrikerName, bowlerName, bowlerFigs, bowlerOvers,
  totalBalls, showTimeline, recentBalls
}) => (
  <div className="flex flex-col shadow-2xl drop-shadow-2xl font-display italic tracking-tight"
       style={{ clipPath: 'polygon(1% 0, 100% 0, 99% 100%, 0 100%)' }}>
    <div className="flex h-14 w-full text-white uppercase overflow-hidden">
      <div className="flex items-center justify-between px-6 bg-broadcast-green w-[42%] border-r-[3px] border-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-10 bg-white/10 rounded-b-md border border-white/20 flex items-center justify-center overflow-hidden">
            <span className="text-[12px] opacity-70 not-italic">🛡️</span>
          </div>
          <h2 className="text-[22px] font-black tracking-tighter">{teamName}</h2>
          <span className="bg-broadcast-yellow text-black text-[10px] font-black px-1.5 py-0.5 ml-1 not-italic rounded-sm">P2</span>
        </div>
        <div className="flex items-baseline gap-1 text-broadcast-yellow font-black">
          <AnimatedNumber value={runs} size="text-5xl" className="text-broadcast-yellow" />
          <span className="text-3xl font-bold ml-1 mr-1 text-broadcast-yellow/90">-</span>
          <AnimatedNumber value={wickets} size="text-4xl" className="text-broadcast-yellow" />
        </div>
      </div>
      <div className="flex items-center justify-between px-6 bg-broadcast-green w-[43%] border-r-[3px] border-black/40">
        <AnimatedNumber value={oversDisplay} size="text-3xl" className="text-broadcast-yellow font-black" />
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-black text-white/95 tracking-tighter">{bowlingTeam}</h2>
          <div className="w-8 h-10 flex items-center justify-center opacity-50 not-italic"><span className="text-[14px]">🌿</span></div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-broadcast-red w-[15%] leading-tight px-2">
        <span className="text-[11px] text-white/70 font-bold tracking-widest uppercase">{target > 0 && innings > 1 ? 'TARGET' : 'VENUE'}</span>
        <span className="text-sm font-black text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
          {target > 0 && innings > 1 ? target : (matchStatus && matchStatus !== 'Yet to begin' ? matchStatus : 'CHATTOGRAM')}
        </span>
      </div>
    </div>
    <div className="flex h-10 w-full text-white uppercase overflow-hidden border-t border-black/50">
      <div className="flex items-center px-6 bg-broadcast-red w-[42%] border-r-[3px] border-black/40">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[17px] tracking-tight">{strikerName}</span>
            <span className="font-black text-lg">{strikerRuns}</span>
            <span className="text-xs text-white/70 not-italic font-mono font-medium">{strikerBalls}</span>
          </div>
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[6px] border-l-broadcast-yellow border-b-[5px] border-b-transparent shadow-sm"></div>
          {nonStrikerName && <div className="flex items-center gap-2 opacity-90"><span className="font-bold text-[17px] tracking-tight">{nonStrikerName}</span></div>}
        </div>
      </div>
      <div className="flex items-center justify-center px-6 bg-broadcast-red w-[25%] border-r-[3px] border-black/40">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[17px] tracking-tight">{bowlerName}</span>
          <span className="font-black text-lg tracking-tight">{bowlerFigs}</span>
          <span className="text-xs text-white/70 not-italic font-mono font-medium">{bowlerOvers}</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-5 bg-broadcast-green w-[33%]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-white/80">CURRENT RUN RATE</span>
          <span className="font-black text-[17px] tracking-tight">{totalBalls > 0 ? ((parseInt(runs) / totalBalls) * 6).toFixed(2) : '0.00'}</span>
        </div>
        {showTimeline && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-widest text-white/80">THIS OVER</span>
            <BallTimeline balls={recentBalls} maxVisible={6} />
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function Overlay() {
  const { matchData, styleData } = useSocket();
  const [show, setShow] = useState(false);

  useEffect(() => {
    document.body.classList.add('overlay-body');
    return () => document.body.classList.remove('overlay-body');
  }, []);

  useEffect(() => { if (matchData && styleData) setShow(true); }, [matchData, styleData]);

  if (!show) return null;

  const team1 = matchData.team1_name || 'Team A';
  const team2 = matchData.team2_name || 'Team B';
  const battingTeamKey = matchData.batting_team || 'team1';
  const teamName = battingTeamKey === 'team1' ? team1 : team2;
  const bowlingTeam = battingTeamKey === 'team1' ? team2 : team1;

  const runs = matchData.runs || '0';
  const wickets = matchData.wickets || '0';
  const overs = matchData.overs || '0';
  const balls = matchData.balls || '0';
  const recentBalls = JSON.parse(matchData.recent_balls || '[]');

  const primaryColor = styleData.primary_color || '#10b981';
  const secondaryColor = styleData.secondary_color || '#3b82f6';
  const bgOpacity = parseFloat(styleData.bg_opacity || '0.75');
  const xOffset = parseFloat(styleData.x_offset || '50');
  const yOffset = parseFloat(styleData.y_offset || '85');
  const showTimeline = styleData.show_timeline !== '0';
  const layoutType = styleData.layout_type || 'default';

  const oversDisplay = `${overs}.${balls}`;
  const totalBalls = (parseInt(overs) * 6) + parseInt(balls);
  const target = parseInt(matchData.target || '0');
  const innings = parseInt(matchData.innings || '1');
  const matchStatus = matchData.match_status || '';

  const strikerName = matchData.striker_name || 'Batsman';
  const strikerRuns = matchData.striker_runs || '0';
  const strikerBalls = matchData.striker_balls || '0';
  const nonStrikerName = matchData.non_striker_name || '';
  const bowlerName = matchData.bowler_name || 'Bowler';
  const bowlerFigs = `${matchData.bowler_wickets || '0'}-${matchData.bowler_runs || '0'}`;
  const bowlerOvers = matchData.bowler_overs || '0';

  const layoutProps = {
    teamName, runs, wickets, bowlingTeam, oversDisplay, totalBalls, target, innings, matchStatus,
    strikerName, strikerRuns, strikerBalls, nonStrikerName, bowlerName, bowlerFigs, bowlerOvers,
    primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls
  };

  return (
    <>
      <Head><title>Cricket Scoreboard Overlay</title></Head>
      <div className="fixed w-full" style={{ left: `${xOffset - 50}%`, top: `${yOffset}%`, transform: 'translateY(-100%)', padding: '0 24px', zIndex: 9999 }}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} className="max-w-[98%] mx-auto">
          {layoutType === 't-sports' ? <LayoutTSports {...layoutProps} /> : <LayoutDefault {...layoutProps} />}
        </motion.div>
      </div>
    </>
  );
}
