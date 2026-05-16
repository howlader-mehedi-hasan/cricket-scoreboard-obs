import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import MatchControl from '@/components/admin/MatchControl';
import StyleControl from '@/components/admin/StyleControl';
import RemoteAccess from '@/components/admin/RemoteAccess';
import TeamSetup from '@/components/admin/TeamSetup';
import MatchHistory from '@/components/admin/MatchHistory';
import { Gamepad2, Palette, Wifi, Radio, Shield, History, Sun, Moon, Zap } from 'lucide-react';

const tabs = [
  { id: 'setup', label: 'Team Setup', icon: Shield },
  { id: 'match', label: 'Match Control', icon: Gamepad2 },
  { id: 'history', label: 'Match History', icon: History },
  { id: 'style', label: 'Style & Position', icon: Palette },
  { id: 'remote', label: 'LAN Remote', icon: Wifi },
];

export default function Admin() {
  const { matchData, styleData, connected, emit, hostId } = useSocket();
  const [activeTab, setActiveTab] = useState('match');
  const [teams, setTeams] = useState([]);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [showMirror, setShowMirror] = useState(true);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error('Failed to fetch teams in admin:', err);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div data-theme={theme} className={theme === 'light' ? 'light-theme' : ''}>
      <Head>
        <title>Cricket Admin Panel</title>
        <meta name="description" content="Master control panel for cricket scoreboard overlay" />
      </Head>

      <div className="admin-bg transition-colors duration-500 overflow-x-hidden">
        {/* Header */}
        <header className="border-b border-white/5 sticky top-0 z-50 glass">
          <div className="max-w-full mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
            {/* Brand Section */}
            <div className="flex items-center gap-3 min-w-0 flex-shrink-0 lg:w-[240px]">
              <div className="text-2xl flex-shrink-0">🏏</div>
              <div className="truncate">
                <h1 className="text-main font-display font-black text-base md:text-lg leading-tight truncate">Cricket Scoreboard</h1>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Admin Dashboard</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center gap-1 bg-black/20 rounded-2xl p-1 border border-white/5 backdrop-blur-md">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl relative group ${
                      isActive ? 'nav-item-active bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 nav-item-hover'
                    }`}>
                    <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabDesktop"
                        className="absolute inset-0 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* Actions Section */}
            <div className="flex items-center gap-2 flex-shrink-0 lg:w-[240px] justify-end">
              {/* Mirror Toggle */}
              <button 
                onClick={() => setShowMirror(!showMirror)}
                className={`p-2 rounded-xl border transition-all duration-300 flex items-center gap-2 px-3 ${
                  showMirror 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
                title="Toggle Broadcast Preview"
              >
                <Radio size={16} className={showMirror ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden xl:block">Preview</span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 shadow-lg group relative"
              >
                {theme === 'light' ? (
                  <Moon size={18} className="text-indigo-400" />
                ) : (
                  <Sun size={18} className="text-amber-400" />
                )}
              </button>

              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="hidden xl:inline">{connected ? 'Active' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Mirror View Container */}
          {showMirror && (
            <div className="max-w-full mx-auto px-4 md:px-8 pb-4">
              <div className="relative w-full h-[140px] md:h-[180px] bg-black/40 rounded-2xl border border-white/10 overflow-x-auto overflow-y-hidden shadow-2xl group transition-all custom-scrollbar">
                <div className="absolute top-2 left-3 z-10 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-emerald-400 border border-emerald-500/30 flex items-center gap-2 uppercase tracking-widest sticky left-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   Broadcast Mirror
                </div>
                
                <div className="h-full flex items-center px-4" style={{ minWidth: '100%' }}>
                  <div className="w-full h-full min-w-[800px] md:min-w-[1200px] lg:min-w-full">
                    <iframe 
                      src={`/overlay?hostId=${hostId}&preview=true`}
                      className="w-full h-full border-none pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile/Tablet Navigation - Scrollable */}
          <div className="lg:hidden max-w-full mx-auto px-4 md:px-8 flex gap-1 overflow-x-auto no-scrollbar border-t border-white/5 bg-black/5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap relative flex-shrink-0 group ${
                    isActive ? 'nav-item-active' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabMobile"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Content */}
        <main className="max-w-full mx-auto px-4 md:px-8 py-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'setup' && <TeamSetup emit={emit} matchData={matchData} teams={teams} onTeamsUpdate={fetchTeams} />}
            {activeTab === 'match' && <MatchControl matchData={matchData} emit={emit} teams={teams} />}
            {activeTab === 'history' && <MatchHistory matchData={matchData} />}
            {activeTab === 'style' && <StyleControl styleData={styleData} emit={emit} hostId={hostId} />}
            {activeTab === 'remote' && <RemoteAccess emit={emit} hostId={hostId} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
