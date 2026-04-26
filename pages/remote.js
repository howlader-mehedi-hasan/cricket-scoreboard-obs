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
  const { role, token } = router.query;
  const { matchData, connected, emit } = useSocket();
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !role) return;
    const s = getSocket();
    s.emit('token:validate', { token }, (result) => {
      if (result && result.active && result.role === role) {
        setValidated(true);
      } else {
        setError('Invalid or expired access token.');
      }
      setValidating(false);
    });
  }, [token, role]);

  if (!role || !token) {
    return (
      <div className="mobile-bg flex items-center justify-center p-6">
        <Head><title>Cricket Remote</title></Head>
        <div className="glass rounded-2xl p-8 text-center max-w-sm">
          <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-display font-bold text-xl mb-2">Missing Access Info</h2>
          <p className="text-slate-400 text-sm">Scan the QR code from the admin panel to access this page.</p>
        </div>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="mobile-bg flex items-center justify-center p-6">
        <Head><title>Cricket Remote - Connecting</title></Head>
        <div className="glass rounded-2xl p-8 text-center">
          <Loader2 size={40} className="text-emerald-400 mx-auto mb-4 animate-spin" />
          <p className="text-white font-medium">Validating access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-bg flex items-center justify-center p-6">
        <Head><title>Cricket Remote - Error</title></Head>
        <div className="glass rounded-2xl p-8 text-center max-w-sm">
          <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-display font-bold text-xl mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Cricket {role === 'scorer' ? 'Scorer' : 'Manager'}</title></Head>
      <div className="mobile-bg">
        {/* Header */}
        <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
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
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        </header>

        <main className="p-4">
          {role === 'scorer' ? (
            <ScorerPanel matchData={matchData} emit={emit} />
          ) : (
            <ManagerPanel matchData={matchData} emit={emit} />
          )}
        </main>
      </div>
    </>
  );
}
