import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSocket } from '@/lib/socket';
import ScorerPanel from '@/components/remote/ScorerPanel';
import ManagerPanel from '@/components/remote/ManagerPanel';
import { getSocket } from '@/lib/socket';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function Remote() {
  const router = useRouter();
  const { role, host } = router.query;
  const { matchData, connected, emit } = useSocket();

  if (!role || !host) {
    return (
      <div className="mobile-bg flex items-center justify-center p-6">
        <Head><title>Cricket Remote</title></Head>
        <div className="glass rounded-2xl p-8 text-center max-w-sm border border-white/5">
          <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-display font-bold text-xl mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm">Please scan the QR code from the Main PC admin panel to connect.</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mobile-bg flex items-center justify-center p-6">
        <Head><title>Cricket Remote - Connecting</title></Head>
        <div className="glass rounded-2xl p-8 text-center">
          <Loader2 size={40} className="text-emerald-400 mx-auto mb-4 animate-spin" />
          <p className="text-white font-medium">Connecting to Host...</p>
          <p className="text-slate-500 text-xs mt-2">Make sure the Main PC tab is open.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Cricket {role === 'scorer' ? 'Scorer' : 'Manager'}</title></Head>
      <div className="mobile-bg min-h-screen">
        {/* Header */}
        <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <div>
              <h1 className="text-white font-display font-bold text-sm leading-tight">
                {role === 'scorer' ? 'Scorer Panel' : 'Info Manager'}
              </h1>
              <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${
                role === 'scorer' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
              }`}>{role}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] font-mono">ID: {host.slice(0, 8)}</span>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          </div>
        </header>

        <main className="p-4">
          {matchData ? (
            role === 'scorer' ? (
              <ScorerPanel matchData={matchData} emit={emit} />
            ) : (
              <ManagerPanel matchData={matchData} emit={emit} />
            )
          ) : (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-slate-500 mx-auto mb-2" size={24} />
              <p className="text-slate-400 text-sm">Synchronizing Match Data...</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
