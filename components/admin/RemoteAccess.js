import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Smartphone, Info, Globe, Shield } from 'lucide-react';

export default function RemoteAccess({ hostId }) {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  function getRemoteUrl(role) {
    return `${baseUrl}/remote?role=${role}&host=${hostId}`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  if (!hostId) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Info className="mx-auto text-slate-500 mb-3" size={32} />
        <h4 className="text-white font-semibold">Initializing P2P...</h4>
        <p className="text-slate-400 text-sm mt-2">Waiting for Host ID to be generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* P2P Status */}
      <div className="glass rounded-xl p-5 border-l-4 border-emerald-500">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <Globe size={20} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Vercel P2P Sync Active</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Your application is running in database-less mode. Your Main PC acts as the server.
              Remote devices will connect directly to this browser tab.
            </p>
          </div>
        </div>
      </div>

      {/* QR Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scorer QR */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <Smartphone size={16} className="text-blue-400" />
              Scorer Remote
            </h4>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
              Scorer
            </span>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-3 flex items-center justify-center">
              <QRCodeSVG value={getRemoteUrl('scorer')} size={180} level="M" />
            </div>
            <div className="flex items-center gap-1">
              <input type="text" readOnly value={getRemoteUrl('scorer')}
                className="input-field text-xs font-mono flex-1" />
              <button onClick={() => copyToClipboard(getRemoteUrl('scorer'))}
                className="btn btn-secondary px-2 py-2"><Copy size={14} /></button>
            </div>
          </div>
        </div>

        {/* Manager QR */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <Smartphone size={16} className="text-purple-400" />
              Manager Remote
            </h4>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
              Manager
            </span>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-3 flex items-center justify-center">
              <QRCodeSVG value={getRemoteUrl('manager')} size={180} level="M" />
            </div>
            <div className="flex items-center gap-1">
              <input type="text" readOnly value={getRemoteUrl('manager')}
                className="input-field text-xs font-mono flex-1" />
              <button onClick={() => copyToClipboard(getRemoteUrl('manager'))}
                className="btn btn-secondary px-2 py-2"><Copy size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="glass-light rounded-xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-slate-400 mt-0.5" />
        <div className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-300">Privacy Note:</strong> This connection is Peer-to-Peer. 
          Scoring data is sent directly from your phone to this browser tab. 
          No data is stored on external servers or databases.
        </div>
      </div>
    </div>
  );
}
