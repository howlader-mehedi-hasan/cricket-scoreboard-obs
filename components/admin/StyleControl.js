import { useState, useEffect } from 'react';
import { Palette, Move, Eye, EyeOff, Save, Trash2, Plus, Layout } from 'lucide-react';

export default function StyleControl({ styleData, emit }) {
  const [ls, setLs] = useState({
    x_offset: '50', y_offset: '85',
    primary_color: '#10b981', secondary_color: '#3b82f6',
    bg_opacity: '0.75', show_timeline: '1',
    active_profile: 'default style',
    layout_type: 'default',
    profiles: []
  });
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => { if (styleData) setLs(styleData); }, [styleData]);

  function upd(f, v) { setLs(p => ({ ...p, [f]: v })); emit('style:update', { field: f, value: v }); }
  
  function switchProfile(name) { emit('profile:switch', { name }); }
  
  function createProfile() {
    if (!newProfileName) return;
    const settings = {
      x_offset: ls.x_offset, y_offset: ls.y_offset,
      primary_color: ls.primary_color, secondary_color: ls.secondary_color,
      bg_opacity: ls.bg_opacity, show_timeline: ls.show_timeline
    };
    emit('profile:create', { name: newProfileName, layout_type: ls.layout_type, settings });
    setNewProfileName('');
  }

  function deleteProfile(name) {
    if (name === 'default style' || name === 'T-sports style') return;
    if (confirm(`Delete profile "${name}"?`)) {
      emit('profile:delete', { name });
    }
  }

  const Slider = ({ label, field, min=0, max=100, step=1 }) => (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-slate-400 text-xs uppercase tracking-wider font-medium">{label}</label>
        <span className="text-white text-sm font-mono">
          {field === 'bg_opacity' ? `${Math.round(parseFloat(ls[field]) * 100)}%` : `${ls[field]}%`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={ls[field] || 0}
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
        <input type="color" value={ls[field] || '#000000'} onChange={e => upd(field, e.target.value)}
          className="w-10 h-10 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent" />
        <input type="text" value={ls[field] || ''} onChange={e => upd(field, e.target.value)}
          className="input-field text-sm font-mono flex-1" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Profile Manager */}
      <div className="glass rounded-xl p-5 border-l-4 border-emerald-500 shadow-xl">
        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Layout size={16} className="text-emerald-400" /> Style Profiles
        </h4>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ls.profiles?.map(p => (
              <div key={p.name} className="flex items-center">
                <button onClick={() => switchProfile(p.name)}
                  className={`px-4 py-2 rounded-l-lg text-sm font-medium transition-all ${
                    ls.active_profile === p.name ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}>
                  {p.name}
                </button>
                {p.name !== 'default style' && p.name !== 'T-sports style' ? (
                  <button onClick={() => deleteProfile(p.name)}
                    className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-r-lg border-l border-white/10 transition-colors border border-white/5">
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="px-3 py-2 bg-white/5 text-slate-700 rounded-r-lg border-l border-white/10 cursor-not-allowed border border-white/5">
                     <Save size={14} className="opacity-30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
              placeholder="New profile name..." className="input-field text-sm flex-1 bg-white/5" />
            <button onClick={createProfile} className="btn-primary flex items-center gap-2 py-2 px-4 whitespace-nowrap">
              <Plus size={16} /> Save New
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass rounded-xl p-5 shadow-lg">
          <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Move size={16} className="text-emerald-400" /> Position
          </h4>
          <div className="space-y-4">
            <Slider label="X Offset" field="x_offset" />
            <Slider label="Y Offset" field="y_offset" />
          </div>
        </div>

        <div className="glass rounded-xl p-5 shadow-lg">
          <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Layout size={16} className="text-blue-400" /> Layout Type
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => upd('layout_type', 'default')}
              className={`px-3 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black border transition-all ${ls.layout_type === 'default' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              Default (Rounded)
            </button>
            <button onClick={() => upd('layout_type', 't-sports')}
              className={`px-3 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black border transition-all ${ls.layout_type === 't-sports' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              T-Sports (Flat)
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 shadow-lg">
        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Palette size={16} className="text-purple-400" /> Appearance
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker label="Primary Color" field="primary_color" />
          <ColorPicker label="Secondary Color" field="secondary_color" />
        </div>
        <div className="mt-8 space-y-5">
          <Slider label="Background Opacity" field="bg_opacity" min={0} max={1} step={0.05} />
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <label className="text-slate-300 text-xs uppercase tracking-widest font-bold">Ball Timeline</label>
            <button onClick={() => upd('show_timeline', ls.show_timeline === '1' ? '0' : '1')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${ls.show_timeline === '1' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-500'}`}>
              {ls.show_timeline === '1' ? <Eye size={14} /> : <EyeOff size={14} />}
              {ls.show_timeline === '1' ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
