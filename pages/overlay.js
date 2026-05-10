import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
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
            <BallTimeline balls={recentBalls} maxVisible={6} />
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function Overlay() {
  const { matchData, styleData, hostId } = useSocket();
  const [show, setShow] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    document.body.classList.add('overlay-body');
    return () => document.body.classList.remove('overlay-body');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (matchData && styleData) setShow(true); }, [matchData, styleData]);

  if (!hostId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/20 text-white font-display">
        <div className="text-center glass p-8 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold mb-2">Overlay Offline</h2>
          <p className="text-slate-400 text-sm">Add <code className="text-emerald-400 px-1 bg-black/20 rounded">?host=ID</code> to your URL to connect.</p>
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
    primaryColor, secondaryColor, bgOpacity, showTimeline, recentBalls, matchData
  };

  return (
    <>
      <Head><title>Cricket Scoreboard Overlay</title></Head>
      {/* Live Header */}
      <div className="fixed top-4 right-6 z-[9999] bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
        <RealTimeClock className="text-white" fontSize={parseInt(styleData.clock_font_size || '18')} />
      </div>

      <div className="fixed w-full" style={{ left: `${xOffset - 50}%`, top: `${yOffset}%`, transform: 'translateY(-100%)', padding: '0 24px', zIndex: 9999 }}>
        <AnimatePresence mode="wait">
          {showMessageOnly ? (
            <motion.div
              key="message-only"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-20 px-10 rounded-3xl border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
              style={{ 
                backgroundColor: msgBgColor,
                opacity: msgBgOpacity,
                backgroundImage: msgBgImage ? `url(${msgBgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Blur Overlay if Image exists */}
              {msgBgImage && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10" />}
              {/* Before Text */}
              {msgBeforeText && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.2 }}
                  className="text-emerald-400 font-black uppercase tracking-[0.4em] mb-4"
                  style={{ fontSize: `${msgBeforeFontSize}px` }}
                >
                  {msgBeforeText}
                </motion.div>
              )}
              
              {!msgBeforeText && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.2 }}
                  className="text-emerald-400 text-sm font-black uppercase tracking-[0.3em] mb-4"
                >
                  {isMatchEnded ? 'Match Completed' : (isInningsBreak ? 'Innings Break' : 'Match Preview')}
                </motion.div>
              )}
              
              {isPreMatch ? (
                <div className="flex flex-col items-center text-center">
                  {!matchData.toss_winner_name ? (
                    <div className="flex items-center gap-16">
                      <div className="flex flex-col items-center">
                        <div className="text-white text-8xl font-black italic tracking-tighter leading-none mb-2">{matchData.team1_name}</div>
                        <div className="text-white text-2xl font-bold tracking-tight opacity-90">{matchData.team1_full}</div>
                        <div className="text-white/60 text-sm font-medium uppercase tracking-widest mt-1">{matchData.team1_dept}</div>
                      </div>
                      <div className="text-emerald-400 text-4xl font-black italic opacity-50">VS</div>
                      <div className="flex flex-col items-center">
                        <div className="text-white text-8xl font-black italic tracking-tighter leading-none mb-2">{matchData.team2_name}</div>
                        <div className="text-white text-2xl font-bold tracking-tight opacity-90">{matchData.team2_full}</div>
                        <div className="text-white/60 text-sm font-medium uppercase tracking-widest mt-1">{matchData.team2_dept}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-white text-6xl font-black italic tracking-tighter mb-4">
                        {matchData.team1_name} VS {matchData.team2_name}
                      </div>
                      <div className="text-emerald-400 text-2xl font-bold tracking-tight opacity-90">
                        {matchData.toss_winner_name} won the toss and decided to {matchData.toss_decision === 'bat' ? 'bat' : 'bowl'} first
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.4 }}
                  className="leading-tight drop-shadow-2xl italic tracking-tighter whitespace-pre-line"
                  style={{ 
                    color: msgFontColor, 
                    fontSize: `${msgFontSize}px`,
                    fontStyle: msgFontStyle === 'italic' ? 'italic' : 'normal',
                    fontWeight: getFontWeight(msgFontStyle),
                    textShadow: msgTextShadow
                  }}
                >
                  {currentDisplayMessage}
                </motion.h1>
              )}

              {/* After Text */}
              {msgAfterText && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.6 }}
                  className="text-white/60 font-medium uppercase tracking-[0.2em] mt-8"
                  style={{ fontSize: `${msgAfterFontSize}px` }}
                >
                  {msgAfterText}
                </motion.div>
              )}

              {!msgAfterText && (
                <div className="mt-8 w-24 h-1 rounded-full" style={{ background: primaryColor }} />
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="scoreboard"
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }} 
              className="max-w-[98%] mx-auto relative"
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
              {layoutType === 't-sports' ? <LayoutTSports {...layoutProps} /> : <LayoutDefault {...layoutProps} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
