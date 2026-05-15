import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Radio, Shield } from 'lucide-react';
import { useSocket } from '@/lib/socket';
import AnimatedNumber from '@/components/AnimatedNumber';
import BallTimeline from '@/components/BallTimeline';
import RealTimeClock from '@/components/RealTimeClock';

const LayoutDefault = ({ 
  teamName, runs, wickets, innings, strikerName, strikerRuns, strikerBalls, 
  nonStrikerName, bowlerName, bowlerFigs, bowlerOvers, oversDisplay, 
  target, primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls, matchStatus, matchData, matchName
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
              {matchName && (
                <span className="text-[10px] text-white/40 ml-2 border-l border-white/10 pl-2 font-medium">
                  {matchName}
                </span>
              )}
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
            {nonStrikerName && (
              <div className="flex items-center gap-3 opacity-60">
                <span className="text-slate-400 font-medium text-sm whitespace-nowrap">{nonStrikerName}</span>
                <span className="text-slate-500 text-xs font-mono whitespace-nowrap">
                  {matchData.non_striker_runs || 0}({matchData.non_striker_balls || 0})
                </span>
              </div>
            )}
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
  totalBalls, showTimeline, recentBalls, matchData, matchName
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
        <span className="text-[11px] text-white/70 font-bold tracking-widest uppercase">{target > 0 && innings > 1 ? 'TARGET' : (matchName || 'VENUE')}</span>
        <span className="text-sm font-black text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
          {target > 0 && innings > 1 ? target : (matchStatus && matchStatus !== 'Yet to begin' ? matchStatus : 'LIVE')}
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
          {nonStrikerName && (
            <div className="flex items-center gap-2 opacity-90">
              <span className="font-bold text-[17px] tracking-tight">{nonStrikerName}</span>
              <span className="font-black text-lg opacity-70">{matchData.non_striker_runs || 0}</span>
              <span className="text-xs text-white/50 not-italic font-mono font-medium">{matchData.non_striker_balls || 0}</span>
            </div>
          )}
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
              <BallTimeline balls={recentBalls} maxVisible={12} />
            </div>
        )}
      </div>
    </div>
  </div>
);

const LayoutDiamond = ({
  teamName, runs, wickets, bowlingTeam, oversDisplay, totalBalls, target, innings, matchStatus, matchName,
  strikerName, strikerRuns, strikerBalls, nonStrikerName, bowlerName, bowlerFigs, bowlerOvers,
  primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls, matchData
}) => {
  const rr = totalBalls > 0 ? ((parseInt(runs) / totalBalls) * 6).toFixed(2) : '0.00';
  
  return (
    <div className="flex items-center h-16 w-full font-display select-none shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Left Logo */}
      <div className="bg-white h-full px-5 flex items-center justify-center shrink-0 z-20" 
           style={{ clipPath: 'polygon(0 0, 85% 0, 100% 100%, 0 100%)' }}>
        <img src={matchData.team1_logo || "/logo-placeholder.svg"} className="h-10 w-10 object-contain" alt="L" />
      </div>

      {/* Batsman Section */}
      <div className="flex bg-white h-full flex-grow -ml-4 pl-10 pr-12 relative z-10"
           style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}>
        {/* Purple Accent Arrow */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#2B1A64]" 
             style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
        
        <div className="flex flex-col justify-center w-full text-black">
          <div className="flex items-center justify-between gap-4">
            <span className="uppercase font-black text-[15px] italic tracking-tight truncate max-w-[140px]">{strikerName}</span>
            <div className="flex items-baseline gap-1.5 min-w-[50px] justify-end">
              <span className="text-[18px] font-black">{strikerRuns}</span>
              <span className="text-[11px] opacity-60 font-bold font-mono">{strikerBalls}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 opacity-75">
            <span className="uppercase font-bold text-[14px] italic tracking-tight truncate max-w-[140px]">{nonStrikerName}</span>
            <div className="flex items-baseline gap-1.5 min-w-[50px] justify-end">
              <span className="text-[17px] font-black">{matchData.non_striker_runs || 0}</span>
              <span className="text-[11px] opacity-60 font-bold font-mono">{matchData.non_striker_balls || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Score Section */}
      <div className="bg-[#2B1A64] h-full flex flex-col items-center justify-center px-12 -ml-6 relative z-30"
           style={{ clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0% 100%)' }}>
        <div className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] -mt-1 italic">
          {matchName || `${matchData.team1_name} V ${matchData.team2_name}`}
        </div>
        <div className="flex items-center gap-3 my-0.5">
          <div className="bg-[#D81B60] px-5 py-1 flex items-center justify-center shadow-lg"
               style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}>
            <div className="text-3xl font-black text-white italic tracking-tighter leading-none flex items-center">
              <AnimatedNumber value={runs} size="text-3xl" className="text-white" />
              <span className="mx-0.5">-</span>
              <AnimatedNumber value={wickets} size="text-2xl" className="text-white/90" />
            </div>
          </div>
          <div className="bg-[#FDD835] text-black px-2.5 py-0.5 text-[13px] font-black italic flex items-center justify-center shadow-md"
               style={{ clipPath: 'polygon(0 0, 85% 0, 100% 100%, 15% 100%)' }}>
            P2
          </div>
          <div className="text-white text-[12px] font-black uppercase italic ml-1 whitespace-nowrap">
             <AnimatedNumber value={oversDisplay} size="text-sm" className="text-white" /> OVERS
          </div>
        </div>
        <div className="text-[11px] text-white font-black uppercase tracking-widest leading-none">
          RUN RATE {rr}
        </div>
      </div>

      {/* Bowler Section */}
      <div className="bg-white h-full flex-grow -ml-6 pl-12 pr-10 flex items-center justify-between relative z-10"
           style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)' }}>
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-black font-black uppercase text-[15px] italic tracking-tight truncate max-w-[160px]">
              {bowlerName}
            </span>
            <span className="text-black font-black text-[16px] italic">
              {bowlerFigs} <span className="text-[11px] opacity-60 not-italic font-bold font-mono ml-0.5">({bowlerOvers})</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            {recentBalls.slice(-6).map((ball, idx) => {
               const rawLabel = typeof ball === 'object' && ball !== null ? ball.label : ball;
               const label = String(rawLabel || '');
               const isWicket = label.toLowerCase().includes('w') && !label.toLowerCase().includes('wd');
               return (
                <div key={idx} 
                     className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${isWicket ? 'bg-red-600' : 'bg-[#2B1A64]'} text-white`}>
                  {label === '.' ? '•' : label}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Right Arrow */}
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-[#2B1A64]" 
             style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }} />
      </div>

      {/* Right Logo */}
      <div className="bg-white h-full px-5 flex items-center justify-center shrink-0 -ml-4 z-20" 
           style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}>
        <img src={matchData.team2_logo || "/logo-placeholder.svg"} className="h-10 w-10 object-contain" alt="R" />
      </div>
    </div>
  );
};

const LayoutHMHCS = ({
  teamName, runs, wickets, bowlingTeam, oversDisplay, totalBalls, target, innings, matchStatus, matchName,
  strikerName, strikerRuns, strikerBalls, nonStrikerName, bowlerName, bowlerFigs, bowlerOvers,
  primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls, matchData, styleData
}) => {
  const rr = totalBalls > 0 ? ((parseInt(runs) / totalBalls) * 6).toFixed(2) : '0.00';
  const battingTeamKey = matchData.batting_team || 'team1';
  const battingLogo = battingTeamKey === 'team1' ? matchData.team1_logo : matchData.team2_logo;
  const bowlingLogo = battingTeamKey === 'team1' ? matchData.team2_logo : matchData.team1_logo;
  const currentPowerplay = matchData.powerplay || 'P2';

  const textScale = parseFloat(styleData.text_scale || '100') / 100;
  const fs = (size) => `${Math.round(size * textScale)}px`;

  // Fill empty slots for the over (6 legal balls)
  const isIllegal = (ball) => {
    const lbl = String(typeof ball === 'object' && ball !== null ? ball.label : ball || '').toUpperCase();
    return lbl.includes('WD') || lbl.includes('NB');
  };
  const legalCount = recentBalls.filter(b => !isIllegal(b)).length;
  const remaining = Math.max(0, 6 - legalCount);
  const displayBalls = [...recentBalls];
  for (let i = 0; i < remaining; i++) displayBalls.push('EMPTY');

  const bowlerWickets = matchData.bowler_wickets || '0';
  const bowlerRuns = matchData.bowler_runs || '0';

  const runsNeeded = Math.max(0, target - parseInt(runs));
  const ballsRemaining = Math.max(0, (parseInt(matchData.total_overs || 20) * 6) - totalBalls);
  const rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

  return (
    <div className="flex items-center w-full select-none" style={{ height: '54px', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      
      {/* ── Batting Team Logo (far left, overlapping bar) ── */}
      <div className="shrink-0 z-30 -mr-2 relative" style={{ width: '104px', height: '104px', marginTop: '-25px' }}>
        <div style={{
          width: '104px', height: '104px', borderRadius: '50%',
          background: '#fff', border: `4px solid ${primaryColor}`,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src={battingLogo || "/logo-placeholder.svg"} style={{ width: '85px', height: '85px', objectFit: 'contain' }} alt="" />
        </div>
      </div>

      {/* ── Main Scoreboard Bar ── */}
      <div style={{
        flexGrow: 1, height: '100%', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(180deg, #eaeaea 0%, #ffffff 12%, #ffffff 88%, #eaeaea 100%)',
        borderTop: `2.5px solid ${primaryColor}`,
        borderBottom: `2.5px solid ${primaryColor}`,
        boxShadow: '0 3px 15px rgba(0,0,0,0.25)',
        position: 'relative', overflow: 'visible'
      }}>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, paddingLeft: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '12px', shrink: 0, borderRight: '1px solid rgba(0,0,0,0.1)', marginRight: '10px' }}>
            <div style={{
              width: '40px', height: '40px',
              background: '#fff',
              border: `2px solid ${primaryColor}`,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}>
              <img src="/bat-icon.png" style={{ width: '32px', height: '32px', objectFit: 'contain', transform: 'rotate(45deg)' }} alt="Bat" />
            </div>
            <span style={{ color: '#222', fontWeight: 900, fontSize: fs(20), textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{teamName}</span>
          </div>

          {(() => {
            const onTop = matchData.striker_on_top === 'false' ? false : true;
            const b1 = onTop 
              ? { name: strikerName, runs: strikerRuns, balls: strikerBalls, onStrike: true }
              : { name: nonStrikerName, runs: matchData.non_striker_runs || 0, balls: matchData.non_striker_balls || 0, onStrike: false };
            const b2 = onTop
              ? { name: nonStrikerName, runs: matchData.non_striker_runs || 0, balls: matchData.non_striker_balls || 0, onStrike: false }
              : { name: strikerName, runs: strikerRuns, balls: strikerBalls, onStrike: true };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '12px', lineHeight: '1.15', shrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: b1.onStrike ? '#22c55e' : '#94a3b8', fontWeight: 800, fontSize: fs(13), textTransform: 'uppercase' }}>
                    {b1.name || '—'}
                  </span>
                  <span style={{ color: b1.onStrike ? '#22c55e' : '#94a3b8', fontWeight: 900, fontSize: fs(13) }}>{b1.runs}</span>
                  <span style={{ color: b1.onStrike ? '#22c55e' : '#94a3b8', opacity: 0.7, fontSize: fs(10), fontFamily: 'monospace', fontWeight: 700 }}>({b1.balls})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: b2.onStrike ? '#22c55e' : '#94a3b8', fontWeight: 800, fontSize: fs(12), textTransform: 'uppercase' }}>
                    {b2.name || '—'}
                  </span>
                  <span style={{ color: b2.onStrike ? '#22c55e' : '#94a3b8', fontWeight: 900, fontSize: fs(12) }}>{b2.runs}</span>
                  <span style={{ color: b2.onStrike ? '#22c55e' : '#94a3b8', opacity: 0.7, fontSize: fs(10), fontFamily: 'monospace', fontWeight: 700 }}>({b2.balls})</span>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '10px', shrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.1' }}>
              <span style={{ color: '#555', fontSize: fs(9), fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRR</span>
              <span style={{ color: '#222', fontWeight: 900, fontSize: fs(13) }}>{rr}</span>
            </div>
            {innings > 1 && (
              <>
                <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.1' }}>
                  <span style={{ color: '#555', fontSize: fs(9), fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>RRR</span>
                  <span style={{ color: '#dc2626', fontWeight: 900, fontSize: fs(13) }}>{rrr}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: PowerPlay, Score Panel & Overs */}
        <div style={{ flex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {/* Powerplay & Free Hit Badges */}
          <div style={{ shrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Free Hit */}
            {matchData.free_hit === 'true' && (
              <div style={{
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                color: '#000', fontSize: fs(12), fontWeight: 900,
                padding: '4px 12px', borderRadius: '4px',
                letterSpacing: '0.5px', textTransform: 'uppercase',
                boxShadow: '0 2px 10px rgba(245,158,11,0.5)',
                border: '1px solid rgba(255,255,255,0.4)',
                animation: 'pulse 1.5s infinite',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                Free Hit
              </div>
            )}

            {/* Powerplay */}
            <div style={{
              background: secondaryColor,
              color: '#fff', fontSize: fs(11), fontWeight: 900,
              padding: '4px 12px', borderRadius: '4px',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              boxShadow: `0 2px 6px ${secondaryColor}44`,
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              {currentPowerplay}
            </div>
          </div>

          {/* Dark Score Panel (Overlapping Bar) */}
          <div style={{
            background: styleData.score_panel_bg || 'linear-gradient(180deg, #2a3f5f 0%, #1a2744 30%, #0f1d32 100%)',
            borderRadius: '12px',
            padding: '2px 24px',
            height: '70px',
            marginTop: '-8px', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 25px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.15)',
            minWidth: '170px',
            shrink: 0,
            zIndex: 40
          }}>
            {/* Runs - Wickets */}
            <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1, marginTop: '2px' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: fs(42), letterSpacing: '-2px', fontFamily: "'Outfit', sans-serif" }}>
                {runs}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: fs(34), margin: '0 4px' }}>-</span>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: fs(34), letterSpacing: '-1px', fontFamily: "'Outfit', sans-serif" }}>
                {wickets}
              </span>
            </div>
          </div>

          {/* Overs Box */}
          <div style={{ shrink: 0 }}>
            <div style={{
              background: '#f8fafc',
              border: `2px solid ${primaryColor}`,
              borderRadius: '6px',
              padding: '4px 12px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <span style={{ color: '#1e293b', fontWeight: 900, fontSize: fs(18), fontFamily: "'Outfit', sans-serif" }}>
                {oversDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Bowler Info & Timeline + Bowling Team Logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0, paddingRight: '10px', gap: '2px' }}>
            {/* Row 1: Bowler Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', shrink: 0, borderRight: '1px solid rgba(0,0,0,0.1)', marginRight: '4px' }}>
              <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: fs(11) }}>{bowlerName}</span>
              <span style={{ color: '#222', fontWeight: 900, fontSize: fs(12) }}>{bowlerOvers}</span>
              <div style={{ width: '1px', height: fs(10), background: '#ccc' }} />
              <span style={{ color: '#222', fontWeight: 900, fontSize: fs(12) }}>{bowlerRuns}-{bowlerWickets}</span>
            </div>

            {/* Row 2: Ball-by-ball Timeline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '0 10px', shrink: 0 }}>
              {displayBalls.map((ball, idx) => {
                const rawLabel = typeof ball === 'object' && ball !== null ? ball.label : ball;
                const label = String(rawLabel || '');
                const upper = label.toUpperCase();
                const isEmpty = upper === 'EMPTY';
                const isWicket = upper.includes('W') && !upper.includes('WD');
                const isDot = label === '0' || label === '.';

                let bg = '#F59E0B';
                let fg = '#000';
                if (isEmpty) { bg = '#d4d4d4'; fg = 'transparent'; }
                else if (isWicket) { bg = '#dc2626'; fg = '#fff'; }
                else if (isDot) { bg = '#F59E0B'; fg = 'transparent'; }

                return (
                  <div key={idx} style={{
                    minWidth: fs(16), height: fs(16), borderRadius: '2px',
                    background: bg, color: fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: fs(9), fontWeight: 900,
                    padding: '0 2px',
                    border: isEmpty ? '1px solid #bbb' : '1px solid rgba(0,0,0,0.15)'
                  }}>
                    {isDot && !isEmpty ? (
                      <div style={{ width: fs(4), height: fs(4), borderRadius: '50%', background: '#000' }} />
                    ) : (isEmpty ? '' : label)}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ paddingLeft: '8px', paddingRight: '4px', shrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#222', fontWeight: 900, fontSize: fs(20), textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{bowlingTeam}</span>
              {/* Ball Logo with Rounded Square Container */}
              <div style={{
                width: '40px', height: '40px',
                background: '#fff',
                border: `2px solid ${primaryColor}`,
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }}>
                <img src="/ball-icon.png" style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="Ball" />
              </div>
          </div>
        </div>
      </div>

      {/* ── Bowling Team Logo (far right, overlapping bar) ── */}
      <div className="shrink-0 z-30 -ml-2 relative" style={{ width: '104px', height: '104px', marginTop: '-25px' }}>
        <div style={{
          width: '104px', height: '104px', borderRadius: '50%',
          background: '#fff', border: `4px solid ${primaryColor}`,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src={bowlingLogo || "/logo-placeholder.svg"} style={{ width: '85px', height: '85px', objectFit: 'contain' }} alt="" />
        </div>
      </div>
    </div>
  );
};





export default function Overlay() {
  const router = useRouter();
  const { matchData, styleData, emit, socket, hostId } = useSocket();
  const [teams, setTeams] = useState([]);
  const [show, setShow] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [profileQueue, setProfileQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => setTeams(data))
      .catch(err => console.error('Error fetching teams:', err));
  }, []);

  useEffect(() => {
    document.body.classList.add('overlay-body');
    return () => document.body.classList.remove('overlay-body');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [showFreeHitBanner, setShowFreeHitBanner] = useState(false);
  const [prevFreeHit, setPrevFreeHit] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null); // 'four' | 'six' | 'wicket'
  const prevRecentBallsRef = useRef([]);
  const prevInningsRef = useRef(null);
  const prevStrikerRef = useRef('');
  const prevNonStrikerRef = useRef('');
  const prevBowlerRef = useRef('');
  
  const [profileToShow, setProfileToShow] = useState(null); // { type: 'striker' | 'non-striker' | 'bowler', data: playerObj }

  useEffect(() => {
    const isFH = matchData?.free_hit === 'true';
    if (prevFreeHit !== null && isFH && !prevFreeHit) {
      const delayTimer = setTimeout(() => setShowFreeHitBanner(true), 7000);
      const hideTimer = setTimeout(() => setShowFreeHitBanner(false), 12000);
      return () => {
        clearTimeout(delayTimer);
        clearTimeout(hideTimer);
        setShowFreeHitBanner(false);
      };
    }
    setPrevFreeHit(isFH);
  }, [matchData?.free_hit, prevFreeHit]);

  // Batsman Profile Auto-Trigger
  useEffect(() => {
    if (!matchData || !teams.length) return;

    const innings = parseInt(matchData.innings || '1');
    const striker = matchData.striker_name;
    const nonStriker = matchData.non_striker_name;
    const bowler = matchData.bowler_name;

    // Helper to get player data (Batsmen)
    const getPlayerData = (name) => {
      if (!name) return null;
      console.log('[Overlay] Fetching data for batsman:', name);
      const teamId = matchData.batting_team === 'team1' ? matchData.team1_id : matchData.team2_id;
      const team = teams.find(t => t.id === teamId);
      const player = team?.players?.find(p => p.name === name);
      if (!player) return null;
      return {
        ...player,
        teamFull: team.fullName,
        teamShort: team.shortName,
        teamDept: team.department,
        teamLogo: team.logo
      };
    };

    // Helper to get bowler data
    const getBowlerData = (name) => {
      if (!name) return null;
      const teamId = matchData.batting_team === 'team1' ? matchData.team2_id : matchData.team1_id;
      const team = teams.find(t => t.id === teamId);
      const player = team?.players?.find(p => p.name === name);
      if (!player) return null;
      return {
        ...player,
        teamFull: team.fullName,
        teamShort: team.shortName,
        teamDept: team.department,
        teamLogo: team.logo
      };
    };

    // 1. Queue Striker (Only if truly a NEW player, not a swap)
    if (striker && striker !== prevStrikerRef.current && striker !== prevNonStrikerRef.current) {
      const pData = getPlayerData(striker);
      if (pData) setProfileQueue(prev => [...prev, { type: 'striker', ...pData }]);
    }

    // 2. Queue Non-Striker (Only if truly a NEW player)
    if (nonStriker && nonStriker !== prevNonStrikerRef.current && nonStriker !== prevStrikerRef.current) {
      const pData = getPlayerData(nonStriker);
      if (pData) setProfileQueue(prev => [...prev, { type: 'non-striker', ...pData }]);
    }

    // 3. Queue Bowler
    if (bowler && bowler !== prevBowlerRef.current) {
      const pData = getBowlerData(bowler);
      if (pData) setProfileQueue(prev => [...prev, { type: 'bowler', ...pData }]);
    }

    prevStrikerRef.current = striker;
    prevNonStrikerRef.current = nonStriker;
    prevBowlerRef.current = bowler;
  }, [matchData?.striker_name, matchData?.non_striker_name, matchData?.bowler_name, teams, matchData?.batting_team]);

  // Queue Processor
  useEffect(() => {
    if (profileQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true);
      const nextProfile = profileQueue[0];

      // Initial Delay: 2s (Snappier)
      setTimeout(() => {
        setProfileToShow(nextProfile);
        
        // Show Duration: 5s
        setTimeout(() => {
          setProfileToShow(null);
          
          // Gap/Break Duration: 4s
          setTimeout(() => {
            setProfileQueue(prev => prev.slice(1));
            setIsProcessingQueue(false);
          }, 4000);
        }, 5000);
      }, 5000);
    }
  }, [profileQueue, isProcessingQueue]);

  // Event Animations (4, 6, W)
  useEffect(() => {
    if (!matchData) return;
    let recentBalls = [];
    try {
      recentBalls = JSON.parse(matchData.recent_balls || '[]');
    } catch (e) {
      console.error('[Overlay] Error parsing recent_balls:', e);
      recentBalls = [];
    }
    
    // Detect if a new ball was added
    if (recentBalls.length > 0) {
      const lastBall = recentBalls[recentBalls.length - 1];
      const prevBalls = prevRecentBallsRef.current;
      const lastPrevBall = prevBalls[prevBalls.length - 1];

      // Compare labels or check if length increased (and not cleared)
      const isNewBall = prevBalls.length === 0 || 
                       (recentBalls.length > prevBalls.length) ||
                       (lastBall.timestamp !== lastPrevBall?.timestamp);

      if (isNewBall) {
        const label = String(lastBall.label || lastBall).toUpperCase();
        if (label === '4') {
          setActiveEvent('four');
          setTimeout(() => setActiveEvent(null), 4000);
        } else if (label === '6') {
          setActiveEvent('six');
          setTimeout(() => setActiveEvent(null), 4500);
        } else if (label.includes('W') && !label.includes('WD') && !label.includes('WIDE')) {
          setActiveEvent('wicket');
          setTimeout(() => setActiveEvent(null), 4500);
        } else if (label.includes('WD') && (label.includes('4') || label.includes('5'))) {
          setActiveEvent('wide4');
          setTimeout(() => setActiveEvent(null), 4500);
        } else if (label.includes('NB') && label.includes('4')) {
          setActiveEvent('nb4');
          setTimeout(() => setActiveEvent(null), 4500);
        } else if (label.includes('LB') && (label.includes('4') || label.includes('5'))) {
          setActiveEvent('lb4');
          setTimeout(() => setActiveEvent(null), 4500);
        } else if (label.includes('NB') && label.includes('6')) {
          setActiveEvent('nb6');
          setTimeout(() => setActiveEvent(null), 5000);
        }
      }
    }
    prevRecentBallsRef.current = recentBalls;
  }, [matchData?.recent_balls]);

  useEffect(() => { if (matchData && styleData) setShow(true); }, [matchData, styleData]);

  // Wicket Card Logic
  const showWicketCard = matchData?.show_wicket_card === 'true';
  const wicketCardAt = parseInt(matchData?.wicket_card_at || '0');
  const secondsSinceWicket = (now - wicketCardAt) / 1000;
  
  // New Logic: Show card ONLY between 8s and 18s after wicket
  const isWicketCardVisible = showWicketCard && secondsSinceWicket >= 8 && secondsSinceWicket <= 18;

  useEffect(() => {
    // Auto-hide the trigger after 20 seconds to be safe
    if (showWicketCard && secondsSinceWicket > 20) {
      socket?.emit('match:update', { field: 'show_wicket_card', value: 'false' });
    }
  }, [showWicketCard, secondsSinceWicket, socket]);

  const isPreview = router.query.preview === 'true';

  // We only show the "Connection Required" screen if we have NO data and NO hostId.
  // If we have matchData (from Socket.IO), we show the overlay regardless of hostId.
  if (!hostId && !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white font-sans overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md w-full px-8">
          <div className="glass p-10 rounded-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] text-center backdrop-blur-2xl">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <Radio size={40} className="text-emerald-500 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Connection Required
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              The overlay needs to sync with your Admin Panel. Please use the complete URL provided in your 
              <span className="text-white font-bold"> Style & Position</span> tab.
            </p>

            <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Troubleshooting</div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-400">1</span>
                </div>
                <p className="text-xs text-slate-300">Open your <b>Admin Panel</b></p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-400">2</span>
                </div>
                <p className="text-xs text-slate-300">Go to <b>Style & Position</b> tab</p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-400">3</span>
                </div>
                <p className="text-xs text-slate-300 font-medium text-emerald-400">Copy the "Overlay URL for OBS" and paste it into your browser source.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Shield size={12} className="text-slate-600" />
              HMH-CS Broadcast System v1.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/10 text-white font-display">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 animate-pulse">Connecting to Host: {hostId}...</p>
        </div>
      </div>
    );
  }

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
  const overlayScale = parseFloat(styleData.overlay_scale || '100') / 100;
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
  const bowlerName = matchData.bowler_name || '';
  const bowlerFigs = `${matchData.bowler_wickets || '0'}-${matchData.bowler_runs || '0'}`;
  const bowlerOvers = matchData.bowler_overs || '0';
  const matchName = matchData.match_name || '';

  const isMatchEnded = matchData.is_match_ended === 'true';
  const isInningsBreak = matchData.is_innings_break === 'true';
  const isPreMatch = matchData.is_pre_match === 'true';

  const textScale = parseFloat(styleData.text_scale || '100') / 100;
  const fs = (size) => `${Math.round(size * textScale)}px`;

  const runsNeeded = Math.max(0, target - parseInt(runs));
  const ballsRemaining = Math.max(0, (parseInt(matchData.total_overs || 20) * 6) - totalBalls);

  const t1Data = teams.find(t => t.id === matchData?.team1_id);
  const t2Data = teams.find(t => t.id === matchData?.team2_id);
  const team1Logo = t1Data?.logo || matchData?.team1_logo;
  const team2Logo = t2Data?.logo || matchData?.team2_logo;
  const winningTeamName = matchData.final_result_message?.split(' won')[0] || '';
  
  const endAt = isMatchEnded ? parseInt(matchData.match_ended_at || '0') : 
                (isInningsBreak ? parseInt(matchData.innings_break_at || '0') : 
                (isPreMatch ? parseInt(matchData.pre_match_at || '0') : 0));
  
  const secondsSinceEvent = (isMatchEnded || isInningsBreak || isPreMatch) ? (now - endAt) / 1000 : 0;
  

  // Requirement: Pre-match stays for at least 20 seconds
  const minPreMatchTime = 20; 
  const showMessageOnly = isMatchEnded ? (secondsSinceEvent > 10) : 
                         (isInningsBreak ? (secondsSinceEvent > 10) : 
                         isPreMatch); // Pre-match jumps straight to full screen

  let currentDisplayMessage = '';
  if (isMatchEnded) {
    currentDisplayMessage = matchData.final_result_message || '';
  } else if (isInningsBreak) {
    currentDisplayMessage = matchData.innings_break_message || '';
  } else if (isPreMatch) {
    const tossWinner = matchData.toss_winner_name;
    const tossDecision = matchData.toss_decision === 'bat' ? 'bat' : 'bowl';
    const baseMsg = matchData.opening_message || '';
    if (tossWinner) {
      currentDisplayMessage = `${baseMsg} \n ${tossWinner} won the toss and decided to ${tossDecision} first`;
    } else {
      currentDisplayMessage = baseMsg;
    }
  }

  const showFloatingBanner = (isMatchEnded || isInningsBreak) && !showMessageOnly;

  // Message Styles
  const msgBgColor = styleData.msg_bg_color || '#0f172a';
  const msgBgOpacity = parseFloat(styleData.msg_bg_opacity || '0.95');
  const msgBgImage = styleData.msg_bg_image || '';
  const msgFontColor = styleData.msg_font_color || '#ffffff';
  const msgFontSize = styleData.msg_font_size || '60';
  const msgFontStyle = styleData.msg_font_style || 'italic';
  const msgTextShadow = styleData.msg_text_shadow || '0 10px 30px rgba(0,0,0,0.5)';
  
  const msgBeforeText = styleData.msg_before_text || '';
  const msgAfterText = styleData.msg_after_text || '';
  const msgBeforeFontSize = styleData.msg_before_font_size || '14';
  const msgAfterFontSize = styleData.msg_after_font_size || '14';

  const getFontWeight = (style) => {
    if (style === 'bold') return 700;
    if (style === 'black') return 900;
    return 400;
  };

  const layoutProps = {
    teamName, runs, wickets, bowlingTeam, oversDisplay, totalBalls, target, innings, matchStatus, matchName,
    strikerName, strikerRuns, strikerBalls, nonStrikerName, bowlerName, bowlerFigs, bowlerOvers,
    primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls, matchData, styleData
  };

  if (isPreview) {
    const ActiveLayout = layoutType === 'hmh-cs' ? LayoutHMHCS :
                         layoutType === 'diamond' ? LayoutDiamond : 
                         layoutType === 't-sports' ? LayoutTSports : 
                         LayoutDefault;

    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
        <Head><title>Scoreboard Mirror</title></Head>
        <div className="w-full max-w-[1400px]">
          <ActiveLayout {...layoutProps} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Cricket Scoreboard Overlay</title></Head>
      {/* Live Header */}
      <div className={`fixed top-4 right-6 z-[9999] backdrop-blur-md px-4 py-2 rounded-xl border transition-all duration-500 shadow-2xl ${
        styleData.clock_theme === 'light' 
          ? 'bg-white/80 border-slate-200' 
          : 'bg-black/60 border-white/10'
      }`}>
        <RealTimeClock 
          theme={styleData.clock_theme || 'dark'} 
          fontSize={parseInt(styleData.clock_font_size || '18')} 
        />
      </div>

        <AnimatePresence>
          {showMessageOnly && (
            <motion.div
              key="message-only"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[10002] flex items-center justify-center p-10 overflow-hidden"
              style={{ 
                width: `${styleData.msg_panel_width || 100}%`,
                height: `${styleData.msg_panel_height || 100}%`,
                left: `${(100 - (styleData.msg_panel_width || 100)) / 2}%`,
                top: `${(100 - (styleData.msg_panel_height || 100)) / 2}%`,
                borderRadius: `${styleData.msg_panel_radius || 0}px`,
                boxShadow: (styleData.msg_panel_width < 100 || styleData.msg_panel_height < 100) ? '0 0 100px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              {/* Specialized Event Backgrounds */}
              <div className="absolute inset-0 transition-all duration-1000">
                {isMatchEnded ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-amber-900 opacity-95" />
                ) : isInningsBreak ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 opacity-95" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 opacity-95" />
                )}
                
                {/* Dynamic Patterns / Particles */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [-40, 40, -40], 
                        x: [-40, 40, -40],
                        opacity: [0.05, 0.2, 0.05],
                        rotate: [0, 360]
                      }}
                      transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, ease: "linear" }}
                      className="absolute bg-white/10 blur-3xl rounded-full"
                      style={{ 
                        width: Math.random() * 500 + 200, 
                        height: Math.random() * 500 + 200,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* CONTENT AREA (Zoomable) */}
              <motion.div 
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ 
                  scale: (parseFloat(styleData.msg_panel_scale || '100')) / 100, 
                  y: 0, 
                  opacity: 1 
                }}
                className="relative z-10 w-full max-w-7xl flex flex-col items-center origin-center"
              >
                {/* ─── CASE 1: MATCH ENDED ─── */}
                {isMatchEnded && (
                  <div className="flex flex-col items-center gap-16 w-full">
                    <div className="flex items-center gap-12 justify-center w-full">
                      <motion.div 
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="w-64 h-64 bg-white/10 rounded-[50px] flex items-center justify-center border-4 border-white/20 p-10 shadow-2xl backdrop-blur-xl">
                          <img src={team1Logo || "/api/placeholder/400/400"} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white text-4xl font-black uppercase tracking-widest">{matchData.team1_name}</span>
                      </motion.div>

                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center gap-8 px-16"
                      >
                        <div className="bg-amber-500 text-amber-950 px-12 py-3 rounded-full text-3xl font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(245,158,11,0.5)]">
                          Winner
                        </div>
                        <div className="text-white text-9xl font-black italic uppercase tracking-tighter drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] text-center leading-none">
                          {winningTeamName || "COMPLETED"}
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="w-64 h-64 bg-white/10 rounded-[50px] flex items-center justify-center border-4 border-white/20 p-10 shadow-2xl backdrop-blur-xl">
                          <img src={team2Logo || "/api/placeholder/400/400"} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white text-4xl font-black uppercase tracking-widest">{matchData.team2_name}</span>
                      </motion.div>
                    </div>

                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/5 backdrop-blur-2xl px-20 py-8 rounded-[40px] border border-white/10 shadow-2xl max-w-4xl text-center"
                    >
                      <p className="text-slate-300 text-4xl font-bold italic leading-relaxed">{matchData.final_result_message}</p>
                    </motion.div>
                  </div>
                )}

                {/* ─── CASE 2: INNINGS BREAK ─── */}
                {isInningsBreak && !isMatchEnded && (
                  <div className="flex flex-col items-center gap-16 w-full">
                    <div className="flex items-center gap-12 justify-center w-full">
                      <motion.div 
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="w-56 h-56 bg-white/10 rounded-[40px] flex items-center justify-center border-4 border-white/20 p-8 shadow-2xl backdrop-blur-xl">
                          <img src={team1Logo || "/api/placeholder/400/400"} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white text-3xl font-black uppercase tracking-widest">{matchData.team1_name}</span>
                      </motion.div>

                      <div className="flex flex-col items-center gap-4 px-8">
                         <h2 className="text-blue-400 text-3xl font-black uppercase tracking-[0.5em] italic">Innings Completed</h2>
                         <div className="text-white text-7xl font-black italic opacity-40">VS</div>
                      </div>

                      <motion.div 
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <div className="w-56 h-56 bg-white/10 rounded-[40px] flex items-center justify-center border-4 border-white/20 p-8 shadow-2xl backdrop-blur-xl">
                          <img src={team2Logo || "/api/placeholder/400/400"} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white text-3xl font-black uppercase tracking-widest">{matchData.team2_name}</span>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-16 w-full max-w-6xl">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/5 backdrop-blur-2xl p-12 rounded-[50px] border border-white/10 text-center flex flex-col justify-center shadow-2xl"
                      >
                        <span className="text-slate-400 text-2xl font-black uppercase tracking-[0.3em] mb-4">Total Score</span>
                        <div className="text-white text-[10rem] font-black tabular-nums leading-none">
                          {matchData.first_innings_total || 0}<span className="text-blue-500 text-6xl ml-2">/{matchData.first_innings_wickets || 0}</span>
                        </div>
                        <span className="text-slate-500 text-3xl font-bold mt-6 italic">({matchData.first_innings_overs || 0}.{matchData.first_innings_balls || 0} Overs)</span>
                      </motion.div>

                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 backdrop-blur-2xl p-12 rounded-[50px] border-4 border-blue-500/40 text-center flex flex-col justify-center shadow-2xl relative"
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 px-8 py-2 rounded-full text-white font-black text-xl shadow-lg uppercase tracking-wider">Target</div>
                        <div className="text-white text-[14rem] font-black leading-none drop-shadow-2xl">
                          {matchData.target || 0}
                        </div>
                        <span className="text-blue-300 text-3xl font-black mt-4 italic uppercase tracking-widest">{matchData.team2_name} Needs</span>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* ─── CASE 3: PRE-MATCH / INITIALIZING ─── */}
                {!isMatchEnded && !isInningsBreak && isPreMatch && (
                  <div className="flex flex-col items-center gap-16 w-full">
                    <div className="flex items-center gap-24 justify-center w-full">
                      <motion.div 
                        initial={{ x: -150, opacity: 0, rotate: -10 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        className="flex flex-col items-center gap-8"
                      >
                        <div className="w-80 h-80 bg-slate-800/60 rounded-[60px] flex items-center justify-center border-4 border-white/20 p-12 shadow-[0_40px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl relative group overflow-hidden">
                           <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                           <img src={team1Logo || "/api/placeholder/400/400"} className="w-full h-full object-contain relative z-10" />
                        </div>
                        <div className="text-center">
                           <h3 className="text-white text-7xl font-black italic tracking-tighter uppercase leading-none mb-2">{matchData.team1_name}</h3>
                           <p className="text-emerald-400 font-bold tracking-[0.4em] uppercase opacity-80 text-xl">Challenger</p>
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-40 animate-pulse" />
                        <div className="w-44 h-44 bg-white rounded-full flex items-center justify-center text-emerald-950 text-7xl font-black italic relative z-10 border-[12px] border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                          VS
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ x: 150, opacity: 0, rotate: 10 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        className="flex flex-col items-center gap-8"
                      >
                        <div className="w-80 h-80 bg-slate-800/60 rounded-[60px] flex items-center justify-center border-4 border-white/20 p-12 shadow-[0_40px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl relative group overflow-hidden">
                           <div className="absolute inset-0 bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors" />
                           <img src={team2Logo || "/api/placeholder/400/400"} className="w-full h-full object-contain relative z-10" />
                        </div>
                        <div className="text-center">
                           <h3 className="text-white text-7xl font-black italic tracking-tighter uppercase leading-none mb-2">{matchData.team2_name}</h3>
                           <p className="text-teal-400 font-bold tracking-[0.4em] uppercase opacity-80 text-xl">Defender</p>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div 
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, type: 'spring' }}
                      className="bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20 backdrop-blur-2xl px-24 py-10 rounded-[60px] border-2 border-emerald-500/30 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
                      <h2 className="text-emerald-400 text-3xl font-black uppercase tracking-[0.6em] mb-4">Official Toss</h2>
                      <div className="text-white text-5xl font-black italic tracking-wide drop-shadow-lg">
                        {matchData.toss_winner_name ? (
                          <>
                            {matchData.toss_winner_name.toUpperCase()} WON & ELECTED TO <span className="text-emerald-300 underline underline-offset-8 decoration-4">{matchData.toss_decision === 'bat' ? 'BAT' : 'BOWL'}</span>
                          </>
                        ) : (
                          "WARMING UP • MATCH STARTING"
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed w-full" style={{ left: `${xOffset - 50}%`, top: `${yOffset}%`, transform: 'translateY(-100%)', padding: '0 24px', zIndex: 9999 }}>
          <AnimatePresence mode="wait">
            {!showMessageOnly && !isWicketCardVisible && matchData.show_scoreboard !== 'false' && (
              <motion.div 
                key="scoreboard"
                initial={{ y: 50, opacity: 0, scale: overlayScale }} 
                animate={{ y: 0, opacity: 1, scale: overlayScale }} 
                exit={{ y: -50, opacity: 0, scale: overlayScale }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }} 
                className="max-w-[98%] mx-auto relative"
                style={{ 
                  transformOrigin: 'bottom center'
                }}
              >
                {showFloatingBanner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-16 left-0 right-0 flex justify-center z-[100]"
                  >
                    <div className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-2xl border border-white/20 animate-bounce whitespace-pre-line text-center">
                      {isPreMatch ? '🏏' : '🎉'} {currentDisplayMessage}
                    </div>
                  </motion.div>
                )}
                {layoutType === 'hmh-cs' ? <LayoutHMHCS {...layoutProps} /> :
                  layoutType === 'diamond' ? <LayoutDiamond {...layoutProps} /> : 
                  layoutType === 't-sports' ? <LayoutTSports {...layoutProps} /> : 
                  <LayoutDefault {...layoutProps} />}

                {/* ── New Target Message Bar (Middle Line) ── */}
                {innings > 1 && !isMatchEnded && !isInningsBreak && !isPreMatch && (
                  <div className="flex justify-center w-full">
                    <motion.div 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      style={{
                        background: styleData.target_bar_theme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(12px)',
                        marginTop: '4px',
                        padding: '4px 40px',
                        borderRadius: '0 0 12px 12px',
                        border: styleData.target_bar_theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                        borderTop: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: styleData.target_bar_theme === 'light' ? '#334155' : '#cbd5e1',
                        fontSize: fs(12),
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        boxShadow: styleData.target_bar_theme === 'light' ? '0 10px 25px rgba(0,0,0,0.08)' : '0 10px 30px rgba(0,0,0,0.4)',
                        minWidth: '400px'
                      }}
                    >
                      NEED <span style={{ color: primaryColor, fontSize: fs(24), fontWeight: 900, fontStyle: 'italic' }}>{runsNeeded}</span> RUNS 
                      <div style={{ width: '1px', height: '16px', background: styleData.target_bar_theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }} />
                      FROM <span style={{ color: '#facc15', fontSize: fs(24), fontWeight: 900, fontStyle: 'italic' }}>{ballsRemaining}</span> BALLS
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      {/* Free Hit Big Screen Animation */}
      <AnimatePresence>
        {showFreeHitBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              {/* Outer Glow */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500 blur-[80px] rounded-full"
              />
              
              {/* Main Content */}
              <motion.div 
                className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-24 py-12 rounded-[40px] border-8 border-white shadow-[0_0_100px_rgba(245,158,11,0.6)]"
                style={{ skewX: '-10deg' }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    animate={{ rotate: [0, -2, 2, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Zap size={80} className="text-white fill-white mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
                  </motion.div>
                  <h1 className="text-white text-9xl font-black italic tracking-tighter leading-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
                    FREE HIT
                  </h1>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-1.5 w-20 bg-white/40 rounded-full" />
                    <span className="text-white text-2xl font-black uppercase tracking-[0.4em] drop-shadow-md">High Stakes</span>
                    <div className="h-1.5 w-20 bg-white/40 rounded-full" />
                  </div>
                </div>
              </motion.div>

              {/* Particle Sprinkles (Small squares) */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 800, 
                    y: (Math.random() - 0.5) * 800,
                    opacity: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
                  className="absolute w-3 h-3 bg-amber-200 rounded-sm"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BIG EVENT ANIMATIONS (4, 6, WICKET) */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none"
            style={{ perspective: '1000px' }}
          >
            {/* FOUR ANIMATION */}
            {activeEvent === 'four' && (
              <motion.div
                initial={{ scale: 0.5, rotateY: 90 }}
                animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 1.5, opacity: 0, rotateY: -90 }}
                className="relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-emerald-500 blur-[120px] opacity-40 rounded-full" />
                <motion.div 
                  className="relative bg-emerald-600 px-20 py-8 border-[6px] border-white shadow-2xl rounded-tr-[40px] rounded-bl-[40px]"
                  style={{ skewX: '-12deg' }}
                >
                  <h2 className="text-white text-9xl font-black italic tracking-tighter drop-shadow-2xl">
                    FOUR!
                  </h2>
                  <div className="absolute -top-6 -right-6 bg-white text-emerald-600 px-6 py-2 rounded-xl font-black text-2xl shadow-lg">
                    4 RUNS
                  </div>
                </motion.div>
                <motion.div 
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-6 flex gap-4"
                >
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-12 h-2 bg-emerald-400/50 rounded-full" />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* SIX ANIMATION */}
            {activeEvent === 'six' && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 2, opacity: 0 }}
                className="relative flex flex-col items-center"
              >
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute inset-0 bg-purple-500 blur-[150px] rounded-full" 
                />
                <motion.div 
                  className="relative bg-gradient-to-r from-purple-600 to-indigo-600 px-24 py-10 border-[8px] border-white shadow-[0_0_80px_rgba(168,85,247,0.6)] rounded-[60px]"
                >
                  <h2 className="text-white text-[10rem] font-black italic tracking-tight leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    SIX!!
                  </h2>
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute -bottom-4 right-10 bg-white text-purple-700 px-8 py-2 rounded-full font-black text-3xl shadow-xl border-4 border-purple-200"
                  >
                    MAXIMUM
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* WICKET ANIMATION */}
            {activeEvent === 'wicket' && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                className="relative flex flex-col items-center"
              >
                <motion.div 
                  animate={{ x: [-10, 10, -10] }}
                  transition={{ duration: 0.1, repeat: 10 }}
                  className="absolute inset-0 bg-red-600 blur-[100px] opacity-30" 
                />
                <div className="relative bg-red-700 px-20 py-10 border-x-[12px] border-white shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
                  <h2 className="text-white text-9xl font-black italic tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.7)] text-center">
                    OUT!
                  </h2>
                  <div className="mt-4 text-white/80 text-xl font-black uppercase tracking-[0.8em] text-center">
                    WICKET DOWN
                  </div>
                </div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-2 bg-white mt-4"
                />
              </motion.div>
            )}

            {/* WIDE + 4 ANIMATION */}
            {activeEvent === 'wide4' && (
              <motion.div
                initial={{ rotateX: 90 }}
                animate={{ rotateX: 0 }}
                exit={{ rotateX: -90, opacity: 0 }}
                className="relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-blue-500 blur-[120px] opacity-40 rounded-full" />
                <motion.div 
                  className="relative bg-gradient-to-b from-blue-600 to-blue-800 px-24 py-10 border-[6px] border-amber-400 shadow-2xl rounded-2xl"
                >
                  <h2 className="text-white text-8xl font-black italic tracking-tighter drop-shadow-2xl text-center leading-none">
                    WIDE + 4
                  </h2>
                  <div className="mt-2 text-amber-400 text-3xl font-black uppercase tracking-[0.3em] text-center">
                    5 RUNS ADDED
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* NO BALL + 4 ANIMATION */}
            {activeEvent === 'nb4' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-yellow-500 blur-[150px] opacity-40" />
                <motion.div 
                  className="relative bg-slate-900 px-20 py-12 border-y-8 border-yellow-400 shadow-[0_0_60px_rgba(234,179,8,0.5)]"
                >
                  <h2 className="text-yellow-400 text-8xl font-black italic tracking-tighter text-center">
                    NO BALL + 4
                  </h2>
                  <div className="mt-4 bg-yellow-400 text-slate-900 px-6 py-2 rounded font-black text-2xl uppercase tracking-widest text-center">
                    FREE HIT REMAINS
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* LEG BYE + 4 ANIMATION */}
            {activeEvent === 'lb4' && (
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 200, opacity: 0 }}
                className="relative flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-slate-400 blur-[100px] opacity-20" />
                <div className="relative bg-slate-200 px-20 py-8 border-b-[10px] border-slate-800 shadow-2xl">
                  <h2 className="text-slate-800 text-8xl font-black italic tracking-tighter text-center uppercase">
                    Leg Bye 4
                  </h2>
                  <div className="mt-2 h-1 bg-slate-400 w-full" />
                </div>
              </motion.div>
            )}

            {/* NO BALL + 6 ANIMATION */}
            {activeEvent === 'nb6' && (
              <motion.div
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative flex flex-col items-center"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 blur-[150px] opacity-50 rounded-full" 
                />
                <motion.div 
                  className="relative bg-black px-28 py-14 border-[10px] border-amber-400 shadow-[0_0_100px_rgba(245,158,11,0.8)] rounded-none"
                  style={{ skewX: '-5deg' }}
                >
                  <h2 className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 text-[9rem] font-black italic tracking-tighter text-center leading-none">
                    NB + 6!!
                  </h2>
                  <div className="mt-4 text-white text-4xl font-black uppercase tracking-[0.5em] text-center border-t-4 border-white/20 pt-4">
                    7 RUNS DAMAGE
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {profileToShow && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="fixed z-[100] flex items-center"
            style={{ 
              bottom: `${styleData.profile_y || 24}%`, 
              left: `${styleData.profile_x || 10}%` 
            }}
          >
            {/* Logo Section */}
            <div className="w-24 h-24 bg-white rounded-l-2xl flex items-center justify-center p-3 shadow-2xl border-y border-l border-white/20">
              {profileToShow.teamLogo ? (
                <img src={profileToShow.teamLogo} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <Users size={40} className="text-slate-300" />
              )}
            </div>

            {/* Content Section */}
            <div 
              className={`h-24 px-8 flex flex-col justify-center shadow-2xl border-y border-r border-white/20 rounded-r-2xl min-w-[400px] relative overflow-hidden ${
                profileToShow.type === 'striker' 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' 
                  : profileToShow.type === 'non-striker'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-800'
                    : 'bg-gradient-to-r from-slate-700 to-slate-900'
              }`}
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[30deg] translate-x-16" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <span className="bg-white text-slate-900 px-2 py-0.5 rounded font-black text-sm shadow-lg">
                    #{profileToShow.jersey || '00'}
                  </span>
                  <h3 className="text-white text-3xl font-black italic uppercase tracking-tighter drop-shadow-lg">
                    {profileToShow.name}
                  </h3>
                </div>
                
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded border border-white/10">
                    {profileToShow.type === 'bowler' ? 'BOWLING' : (profileToShow.teamDept || 'BATTING')}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-white/90 text-sm font-black uppercase tracking-wider">
                    {profileToShow.teamFull} <span className="text-white/50 font-medium">({profileToShow.teamShort})</span>
                  </span>
                </div>
              </div>

              {/* Profile Type Label */}
              <div className="absolute bottom-1 right-4 text-white/5 text-5xl font-black italic pointer-events-none uppercase tracking-tighter">
                {profileToShow.type}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wicket Card Popup ── */}
      <AnimatePresence>
        {isWicketCardVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className="fixed inset-0 flex items-center justify-center z-[1000] pointer-events-none"
          >
            <div className="w-[800px] bg-slate-900/90 backdrop-blur-3xl rounded-[60px] border-4 border-red-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
               {/* Animated Background Glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-red-600/10" />
               <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 blur-[100px] animate-pulse rounded-full" />
               <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/20 blur-[100px] animate-pulse delay-1000 rounded-full" />

               <div className="relative p-12 flex flex-col items-center gap-10">
                  {/* Header */}
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      initial={{ rotate: -10, scale: 0.5 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="bg-red-600 text-white px-12 py-3 rounded-full text-4xl font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(220,38,38,0.5)] border-4 border-white/20"
                    >
                      WICKET
                    </motion.div>
                  </div>

                  {/* Player & Team Info */}
                  <div className="flex items-center gap-16 w-full justify-center">
                     <div className="w-48 h-48 bg-white/5 rounded-[40px] flex items-center justify-center border-2 border-white/10 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                        <img src={matchData.last_out_logo || "/api/placeholder/400/400"} className="w-full h-full object-contain relative z-10" />
                     </div>

                     <div className="flex flex-col gap-2">
                        <h2 className="text-white text-7xl font-black italic uppercase tracking-tighter leading-none drop-shadow-lg">
                          {matchData.last_out_name}
                        </h2>
                        <p className="text-red-400 text-2xl font-bold tracking-[0.4em] uppercase opacity-80 italic">
                          {matchData.last_out_team}
                        </p>
                     </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="flex gap-12 w-full justify-center">
                     <div className="bg-white/5 backdrop-blur-xl px-12 py-6 rounded-[30px] border border-white/10 flex flex-col items-center shadow-xl">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Runs</span>
                        <span className="text-white text-7xl font-black italic tabular-nums leading-none">{matchData.last_out_runs}</span>
                     </div>
                     <div className="bg-white/5 backdrop-blur-xl px-12 py-6 rounded-[30px] border border-white/10 flex flex-col items-center shadow-xl">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Balls</span>
                        <span className="text-white text-7xl font-black italic tabular-nums leading-none">{matchData.last_out_balls}</span>
                     </div>
                     <div className="bg-white/5 backdrop-blur-xl px-12 py-6 rounded-[30px] border border-white/10 flex flex-col items-center shadow-xl">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">SR</span>
                        <span className="text-white text-7xl font-black italic tabular-nums leading-none">
                          {matchData.last_out_balls > 0 ? ((matchData.last_out_runs / matchData.last_out_balls) * 100).toFixed(1) : '0.0'}
                        </span>
                     </div>
                  </div>

                  {/* Bottom Line Decor */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {matchData.show_partnership === 'true' && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="fixed bottom-[18%] left-1/2 -translate-x-1/2 z-[50]"
          >
            <div className="relative group">
              {/* Outer Glow / Ambient Light */}
              <div className="absolute -inset-4 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse opacity-50" />
              
              <div className="bg-slate-950/80 backdrop-blur-3xl border-2 border-white/10 rounded-[40px] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex items-center gap-16 min-w-[850px] relative overflow-hidden">
                {/* Decorative Patterns */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                
                {/* Batsman 1 (Left) */}
                <div className="flex flex-col items-end flex-1 relative z-10">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-emerald-400 font-black text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                       #{matchData.striker_jersey || '--'}
                     </span>
                     <span className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none">{matchData.striker_name || '—'}</span>
                   </div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-emerald-400 text-5xl font-black drop-shadow-lg">{matchData.striker_runs || 0}</span>
                     <span className="text-slate-500 text-xl font-black font-mono opacity-80">({matchData.striker_balls || 0})</span>
                   </div>
                </div>

                {/* Partnership Center (The Star) */}
                <div className="flex flex-col items-center shrink-0 relative z-10 px-4">
                   <div className="flex flex-col items-center">
                     <span className="text-emerald-400 text-sm font-black uppercase tracking-[0.6em] mb-4 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">PARTNERSHIP</span>
                     
                     <div className="relative">
                        {/* Team Logo in Hexagon/Circle Frame */}
                        <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center border-2 border-white/10 p-5 shadow-2xl backdrop-blur-md relative overflow-hidden mb-4">
                           <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                           <img 
                             src={matchData.batting_team === 'team1' ? matchData.team1_logo : matchData.team2_logo} 
                             className="w-full h-full object-contain relative z-10" 
                             alt="Team" 
                           />
                        </div>
                        
                        {/* Total Runs Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-8 py-1.5 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.5)] border-2 border-white/20">
                           <span className="text-3xl font-black italic tracking-tighter leading-none tabular-nums">
                             {parseInt(matchData.striker_runs || '0') + parseInt(matchData.non_striker_runs || '0')}
                           </span>
                        </div>
                     </div>
                     
                     <span className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] mt-8 opacity-60">
                       FROM {parseInt(matchData.striker_balls || '0') + parseInt(matchData.non_striker_balls || '0')} BALLS
                     </span>
                   </div>
                </div>

                {/* Batsman 2 (Right) */}
                <div className="flex flex-col items-start flex-1 relative z-10">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none">{matchData.non_striker_name || '—'}</span>
                     <span className="text-emerald-400 font-black text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                       #{matchData.non_striker_jersey || '--'}
                     </span>
                   </div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-emerald-400 text-5xl font-black drop-shadow-lg">{matchData.non_striker_runs || 0}</span>
                     <span className="text-slate-500 text-xl font-black font-mono opacity-80">({matchData.non_striker_balls || 0})</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
