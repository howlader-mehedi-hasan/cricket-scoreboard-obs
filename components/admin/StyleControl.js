import { useState, useEffect } from 'react';
import { Palette, Move, Eye, EyeOff } from 'lucide-react';

export default function StyleControl({ styleData, emit }) {
  const [ls, setLs] = useState({
    x_offset: '50', y_offset: '85',
    primary_color: '#10b981', secondary_color: '#3b82f6',
    bg_opacity: '0.75', show_timeline: '1',
  });

  useEffect(() => { if (styleData) setLs(styleData); }, [styleData]);

  function upd(f, v) { setLs(p => ({ ...p, [f]: v })); emit('style:update', { field: f, value: v }); }

  const presets = [
    { name: 'Emerald', p: '#10b981', s: '#3b82f6' },
    { name: 'Royal Blue', p: '#3b82f6', s: '#f59e0b' },
    { name: 'Red Hot', p: '#ef4444', s: '#f97316' },
    { name: 'Purple', p: '#8b5cf6', s: '#ec4899' },
    { name: 'Gold', p: '#f59e0b', s: '#84cc16' },
    { name: 'Cyan', p: '#06b6d4', s: '#8b5cf6' },
  ];

  const Slider = ({ label, field, min=0, max=100, step=1 }) => (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-slate-400 text-xs uppercase tracking-wider font-medium">{label}</label>
        <span className="text-white text-sm font-mono">
          {field === 'bg_opacity' ? `${Math.round(parseFloat(ls[field]) * 100)}%` : `${ls[field]}%`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={ls[field]}
        onChange={e => upd(field, e.target.value)}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(90deg, #10b981 ${field === 'bg_opacity' ? parseFloat(ls[field])*100 : ls[field]}%, rgba(255,255,255,0.1) ${field === 'bg_opacity' ? parseFloat(ls[field])*100 : ls[field]}%)` }}
      />
    </div>
  );

  const ColorPicker = ({ label, field }) => (
    <div>
      <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={ls[field]} onChange={e => upd(field, e.target.value)}
          className="w-10 h-10 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent" />
        <input type="text" value={ls[field]} onChange={e => upd(field, e.target.value)}
          className="input-field text-sm font-mono flex-1" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Move size={16} className="text-emerald-400" /> Position on Screen
        </h4>
        <div className="space-y-4">
          <Slider label="X Offset (Horizontal)" field="x_offset" />
          <Slider label="Y Offset (Vertical)" field="y_offset" />
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Palette size={16} className="text-blue-400" /> Colors
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker label="Primary Color" field="primary_color" />
          <ColorPicker label="Secondary Color" field="secondary_color" />
        </div>
        <div className="mt-4">
          <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-2">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            {presets.map(pr => (
              <button key={pr.name} onClick={() => { upd('primary_color', pr.p); upd('secondary_color', pr.s); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${pr.p}, ${pr.s})` }} />
                {pr.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-4">Appearance</h4>
        <div className="space-y-4">
          <Slider label="Background Opacity" field="bg_opacity" min={0} max={1} step={0.05} />
          <div className="flex items-center justify-between">
            <label className="text-slate-400 text-xs uppercase tracking-wider font-medium">Show Ball Timeline</label>
            <button onClick={() => upd('show_timeline', ls.show_timeline === '1' ? '0' : '1')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${ls.show_timeline === '1' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
              {ls.show_timeline === '1' ? <Eye size={16} /> : <EyeOff size={16} />}
              {ls.show_timeline === '1' ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h4 className="text-white font-semibold text-sm mb-3">Live Preview</h4>
        <div className="rounded-lg overflow-hidden relative"
          style={{ background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px', height: '120px' }}>
          <div className="absolute rounded-lg px-3 py-2"
            style={{ left: `${ls.x_offset - 50}%`, top: `${ls.y_offset}%`, transform: 'translateY(-100%) translateX(50%)',
              background: `rgba(15, 23, 42, ${ls.bg_opacity})`, backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)', maxWidth: '200px' }}>
            <div className="h-[2px] rounded-full mb-1.5" style={{ background: `linear-gradient(90deg, ${ls.primary_color}, ${ls.secondary_color})` }} />
            <div className="text-white text-xs font-bold">Team A</div>
            <div className="text-white text-sm font-bold font-display">125/3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
