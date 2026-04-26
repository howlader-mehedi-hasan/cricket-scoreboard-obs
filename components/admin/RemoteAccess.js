import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Copy, Trash2, Plus, RefreshCw, Smartphone } from 'lucide-react';

export default function RemoteAccess({ emit }) {
  const [lanIP, setLanIP] = useState('');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfo();
  }, []);

  async function fetchInfo() {
    setLoading(true);
    try {
      const res = await fetch('/api/network-info');
      const data = await res.json();
      setLanIP(data.ip || 'localhost');
      setTokens(data.tokens || []);
    } catch (err) {
      console.error('Failed to fetch network info:', err);
    }
    setLoading(false);
  }

  async function createToken(role) {
    try {
      const res = await fetch('/api/network-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', role }),
      });
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error('Failed to create token:', err);
    }
  }

  async function revokeToken(token) {
    try {
      const res = await fetch('/api/network-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', token }),
      });
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error('Failed to revoke token:', err);
    }
  }

  function getUrl(role, token) {
    return `http://${lanIP}:3000/remote?role=${role}&token=${token}`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  const activeScorer = tokens.find(t => t.role === 'scorer' && t.active);
  const activeManager = tokens.find(t => t.role === 'manager' && t.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-emerald-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Network Info */}
      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Wifi size={16} className="text-emerald-400" />
          Network Info
        </h4>
        <div className="glass-light rounded-lg p-3">
          <span className="text-slate-400 text-xs uppercase tracking-wider">LAN IP Address</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white font-mono text-lg font-bold">{lanIP}</span>
            <button onClick={() => copyToClipboard(lanIP)} className="text-slate-400 hover:text-white transition-colors">
              <Copy size={14} />
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Devices must be on the same WiFi/Hotspot network to connect.
          </p>
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
          {activeScorer ? (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                <QRCodeSVG value={getUrl('scorer', activeScorer.token_string)} size={180} level="M" />
              </div>
              <div className="flex items-center gap-1">
                <input type="text" readOnly value={getUrl('scorer', activeScorer.token_string)}
                  className="input-field text-xs font-mono flex-1" />
                <button onClick={() => copyToClipboard(getUrl('scorer', activeScorer.token_string))}
                  className="btn btn-secondary px-2 py-2"><Copy size={14} /></button>
              </div>
              <button onClick={() => revokeToken(activeScorer.token_string)}
                className="btn btn-danger w-full text-xs py-2">
                <Trash2 size={14} /> Revoke Access
              </button>
            </div>
          ) : (
            <button onClick={() => createToken('scorer')} className="btn btn-primary w-full py-3">
              <Plus size={16} /> Generate Scorer QR
            </button>
          )}
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
          {activeManager ? (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                <QRCodeSVG value={getUrl('manager', activeManager.token_string)} size={180} level="M" />
              </div>
              <div className="flex items-center gap-1">
                <input type="text" readOnly value={getUrl('manager', activeManager.token_string)}
                  className="input-field text-xs font-mono flex-1" />
                <button onClick={() => copyToClipboard(getUrl('manager', activeManager.token_string))}
                  className="btn btn-secondary px-2 py-2"><Copy size={14} /></button>
              </div>
              <button onClick={() => revokeToken(activeManager.token_string)}
                className="btn btn-danger w-full text-xs py-2">
                <Trash2 size={14} /> Revoke Access
              </button>
            </div>
          ) : (
            <button onClick={() => createToken('manager')} className="btn btn-primary w-full py-3">
              <Plus size={16} /> Generate Manager QR
            </button>
          )}
        </div>
      </div>

      {/* All Tokens */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-semibold text-sm">All Access Tokens</h4>
          <button onClick={fetchInfo} className="btn btn-secondary text-xs px-2 py-1">
            <RefreshCw size={14} />
          </button>
        </div>
        {tokens.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No tokens created yet.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map(t => (
              <div key={t.id} className="glass-light rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <span className={`text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                    t.role === 'scorer' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>{t.role}</span>
                  <span className="text-slate-400 text-xs font-mono ml-2">{t.token_string}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${t.active ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.active ? 'Active' : 'Revoked'}
                  </span>
                  {t.active && (
                    <button onClick={() => revokeToken(t.token_string)}
                      className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
