import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSocket } from '@/lib/socket';
import MatchControl from '@/components/admin/MatchControl';
import StyleControl from '@/components/admin/StyleControl';
import RemoteAccess from '@/components/admin/RemoteAccess';
import TeamSetup from '@/components/admin/TeamSetup';
import MatchHistory from '@/components/admin/MatchHistory';
import { Gamepad2, Palette, Wifi, Radio, Shield, History, Sun, Moon } from 'lucide-react';

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
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error('Failed to fetch teams in admin:', err);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className={isLightMode ? 'light-theme' : ''}>
      <Head>
        <title>Cricket Admin Panel</title>
        <meta name="description" content="Master control panel for cricket scoreboard overlay" />
      </Head>

      <div className="admin-bg transition-colors duration-300">
        {/* Header */}
        <header className="border-b border-white/5 sticky top-0 z-50 glass">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏏</div>
              <div>
                <h1 className="text-main font-display font-bold text-lg leading-tight">Cricket Scoreboard</h1>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Admin Panel</span>
                  {hostId && (
                    <span className="text-slate-500 text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      ID: {hostId}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button 
                onClick={() => setIsLightMode(!isLightMode)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg"
                title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                <Radio size={12} className={connected ? 'animate-pulse' : ''} />
                {connected ? 'P2P Host Active' : 'Connecting...'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-4xl mx-auto px-4 flex gap-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                  }`}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          {activeTab === 'setup' && <TeamSetup emit={emit} matchData={matchData} />}
          {activeTab === 'match' && <MatchControl matchData={matchData} emit={emit} teams={teams} />}
          {activeTab === 'history' && <MatchHistory />}
          {activeTab === 'style' && <StyleControl styleData={styleData} emit={emit} hostId={hostId} />}
          {activeTab === 'remote' && <RemoteAccess emit={emit} hostId={hostId} />}
        </main>
      </div>
    </div>
  );
}
