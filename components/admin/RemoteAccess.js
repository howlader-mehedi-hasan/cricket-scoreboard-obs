import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Smartphone, Info, Globe, Shield, Check } from 'lucide-react';

export default function RemoteAccess({ hostId }) {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  function getRemoteUrl(role) {
    return `${baseUrl}/remote?role=${role}&host=${hostId}`;
  }

  const [copied, setCopied] = useState(null);

  function copyToClipboard(text, id) {
    const performCopy = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
        return Promise.resolve();
      }
    };

    performCopy().then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (!hostId) {
    return (
      <div className="glass rounded-3xl p-12 text-center border-2 border-dashed border-white/5 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
           <Info className="text-slate-500 animate-pulse" size={32} />
        </div>
        <h4 className="text-main font-display font-black text-xl mb-2">Initializing P2P Sync Engine</h4>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">Establishing secure handshake for mobile remote control.</p>
        <div className="mt-8 flex justify-center">
           <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-accent-primary animate-progress" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2P Status */}
      <div className="glass rounded-2xl p-6 border-l-4 border-accent-primary relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Globe size={80} className="text-accent-primary" />
        </div>
        <div className="flex items-start gap-5 relative z-10">
          <div className="bg-accent-primary/10 p-3 rounded-2xl border border-accent-primary/20 text-accent-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Globe size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-main font-display font-black text-lg">P2P Network Active</h4>
              <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Main PC acting as server. Remote devices connect directly via secure WebSocket.
            </p>
          </div>
        </div>
      </div>

      {/* QR Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scorer QR */}
        <div className="glass rounded-2xl p-6 border border-white/5 relative group overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary border border-accent-secondary/20">
                <Smartphone size={20} />
              </div>
              <h4 className="text-main font-display font-black text-lg">Scorer Control</h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
              Full Control
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 flex items-center justify-center shadow-2xl relative overflow-hidden group/qr transition-transform hover:scale-[1.02]">
              <QRCodeSVG value={getRemoteUrl('scorer')} size={220} level="H" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                 <p className="text-main font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 bg-black/80 rounded-full border border-white/20">Scan with Camera</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input type="text" readOnly value={getRemoteUrl('scorer')}
                  className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main text-[10px] font-mono outline-none focus:border-accent-secondary/50 font-bold" />
              </div>
              <button 
                onClick={() => copyToClipboard(getRemoteUrl('scorer'), 'scorer')}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-500 border ${
                  copied === 'scorer' 
                    ? 'bg-accent-primary text-main border-accent-primary shadow-lg' 
                    : 'bg-sec text-slate-500 border-main hover:bg-accent-secondary/10 hover:text-accent-secondary'
                }`}
              >
                {copied === 'scorer' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Manager QR */}
        <div className="glass rounded-2xl p-6 border border-white/5 relative group overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Smartphone size={20} />
              </div>
              <h4 className="text-main font-display font-black text-lg">Manager View</h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Read Only
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 flex items-center justify-center shadow-2xl relative overflow-hidden group/qr transition-transform hover:scale-[1.02]">
              <QRCodeSVG value={getRemoteUrl('manager')} size={220} level="H" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                 <p className="text-main font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 bg-black/80 rounded-full border border-white/20">Scan with Camera</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input type="text" readOnly value={getRemoteUrl('manager')}
                  className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main text-[10px] font-mono outline-none focus:border-purple-500/50 font-bold" />
              </div>
              <button 
                onClick={() => copyToClipboard(getRemoteUrl('manager'), 'manager')}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-500 border ${
                  copied === 'manager' 
                    ? 'bg-accent-primary text-main border-accent-primary shadow-lg' 
                    : 'bg-sec text-slate-500 border-main hover:bg-purple-500/10 hover:text-purple-500'
                }`}
              >
                {copied === 'manager' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-sec rounded-2xl p-6 border border-main flex items-start gap-4">
        <div className="bg-slate-800/50 p-2 rounded-lg text-slate-500">
           <Shield size={20} />
        </div>
        <div className="space-y-1">
          <h5 className="text-main font-black text-[10px] uppercase tracking-widest">P2P Privacy Protocol</h5>
          <p className="text-slate-500 text-xs font-bold leading-relaxed">
            Direct Peer-to-Peer connection. Data is synchronized instantly between devices without intermediate storage.
            Keep this tab open on your main computer to maintain the connection.
          </p>
        </div>
      </div>
    </div>
  );
}
