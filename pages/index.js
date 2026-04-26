import Head from 'next/head';
import Link from 'next/link';
import { Monitor, Gamepad2, Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>Cricket Scoreboard for OBS</title>
        <meta name="description" content="Broadcast-quality local cricket scoreboard overlay for OBS Studio" />
      </Head>

      <div className="admin-bg flex items-center justify-center min-h-screen p-6">
        <div className="max-w-lg w-full text-center space-y-8">
          <div>
            <div className="text-6xl mb-4">🏏</div>
            <h1 className="text-white font-display font-black text-3xl mb-2">Cricket Scoreboard</h1>
            <p className="text-slate-400 text-sm">Broadcast-quality overlay for OBS Studio</p>
          </div>

          <div className="space-y-3">
            <Link href="/admin"
              className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer block">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Gamepad2 className="text-emerald-400" size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-white font-semibold">Admin Panel</h2>
                <p className="text-slate-400 text-xs">Control scoring, styles, and remote access</p>
              </div>
            </Link>

            <Link href="/overlay"
              className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer block">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Monitor className="text-blue-400" size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-white font-semibold">OBS Overlay</h2>
                <p className="text-slate-400 text-xs">Add as Browser Source in OBS</p>
              </div>
            </Link>

            <Link href="/remote?role=scorer&token=demo"
              className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer block">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Smartphone className="text-purple-400" size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-white font-semibold">Remote Controls</h2>
                <p className="text-slate-400 text-xs">Scan QR from admin to connect</p>
              </div>
            </Link>
          </div>

          <p className="text-slate-600 text-xs">
            All data is stored locally. No internet required.
          </p>
        </div>
      </div>
    </>
  );
}
