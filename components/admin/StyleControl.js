import { useState, useEffect } from 'react';
import { Palette, Move, Eye, EyeOff, Save, Trash2, Plus, Layout, Radio, Copy, Info, Check } from 'lucide-react';

export default function StyleControl({ styleData, emit, hostId }) {
  const [ls, setLs] = useState({
    x_offset: '50', y_offset: '85',
    primary_color: '#10b981', secondary_color: '#3b82f6',
    bg_opacity: '0.75', show_timeline: '1',
    active_profile: 'default style',
    layout_type: 'default',
    score_panel_bg: '#1a2744',
    profile_x: '10', profile_y: '24',
    msg_panel_width: '100', msg_panel_height: '100',
    msg_panel_scale: '100', msg_panel_radius: '0',
    overlay_scale: '100',
    text_scale: '100',
    target_bar_theme: 'dark',
    profiles: []
  });
  const [newProfileName, setNewProfileName] = useState('');

  const overlayUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/overlay?host=${hostId}`
    : '';

  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => { 
    if (styleData && !isDragging) setLs(styleData); 
  }, [styleData, isDragging]);

  const [copied, setCopied] = useState(false);

  function copyToClipboard(text) {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function upd(f, v) { setLs(p => ({ ...p, [f]: v })); emit('style:update', { field: f, value: v }); }
  
  function switchProfile(name) { emit('profile:switch', { name }); }
  
  function createProfile() {
    if (!newProfileName) return;
    const settings = {
      x_offset: ls.x_offset, y_offset: ls.y_offset,
      primary_color: ls.primary_color, secondary_color: ls.secondary_color,
      bg_opacity: ls.bg_opacity, show_timeline: ls.show_timeline,
      overlay_scale: ls.overlay_scale,
      text_scale: ls.text_scale
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
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onChange={e => upd(field, e.target.value)}
        className="w-full h-2 cursor-pointer"
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
      {/* Overlay URL (Quick Copy) */}
      <div className="glass rounded-xl p-5 border-l-4 border-blue-500 shadow-xl">
        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Radio size={16} className="text-blue-400" />
          Overlay URL for OBS
        </h4>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            readOnly 
            value={overlayUrl}
            className="input-field text-xs font-mono flex-1 bg-black/20"
          />
          <button 
            onClick={() => copyToClipboard(overlayUrl)}
            className={`btn ${copied ? 'bg-emerald-500 text-white' : 'btn-secondary'} px-3 py-2 flex items-center gap-2 text-xs transition-all duration-300`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <p className="text-slate-500 text-[10px] mt-2 italic flex items-center gap-1">
          <Info size={10} /> Paste this URL as a "Browser Source" in OBS to see the live scoreboard.
        </p>
      </div>

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
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Scoreboard</div>
            <Slider label="X Offset" field="x_offset" />
            <Slider label="Y Offset" field="y_offset" />
            <Slider label="Scoreboard Scale %" field="overlay_scale" min={50} max={200} step={1} />
            <Slider label="Global Text Size %" field="text_scale" min={50} max={150} step={1} />
            
            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Player Intro Card</div>
              <Slider label="Profile X (Left)" field="profile_x" />
              <Slider label="Profile Y (Bottom)" field="profile_y" />
            </div>

            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Big Screen Panel</div>
              <Slider label="Scale (Zoom) %" field="msg_panel_scale" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Slider label="Width %" field="msg_panel_width" />
                <Slider label="Height %" field="msg_panel_height" />
              </div>
              <div className="mt-2">
                <Slider label="Corner Radius (px)" field="msg_panel_radius" />
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5 shadow-lg">
          <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Layout size={16} className="text-blue-400" /> Layout Type
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => upd('layout_type', 'default')}
              className={`px-3 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black border transition-all ${ls.layout_type === 'default' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              Default (Rounded)
            </button>
            <button onClick={() => upd('layout_type', 't-sports')}
              className={`px-3 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black border transition-all ${ls.layout_type === 't-sports' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              T-Sports (Flat)
            </button>
            <button onClick={() => upd('layout_type', 'diamond')}
              className={`px-3 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black border transition-all ${ls.layout_type === 'diamond' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              Diamond (Slanted)
            </button>
            <button onClick={() => upd('layout_type', 'hmh-cs')}
              className={`px-3 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black border transition-all ${ls.layout_type === 'hmh-cs' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              HMH-CS (Pro)
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
          <div className="col-span-2">
             <ColorPicker label="Central Score Panel BG" field="score_panel_bg" />
          </div>
        </div>
        <div className="mt-8 space-y-5">
          <Slider label="Background Opacity" field="bg_opacity" min={0} max={1} step={0.05} />
          <Slider label="Clock Font Size" field="clock_font_size" min={10} max={80} step={1} />
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <label className="text-slate-300 text-xs uppercase tracking-widest font-bold">Clock Theme</label>
            <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
              <button 
                onClick={() => upd('clock_theme', 'dark')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${ls.clock_theme !== 'light' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                DARK
              </button>
              <button 
                onClick={() => upd('clock_theme', 'light')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${ls.clock_theme === 'light' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                LIGHT
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <label className="text-slate-300 text-xs uppercase tracking-widest font-bold">Target Bar Theme</label>
            <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
              <button 
                onClick={() => upd('target_bar_theme', 'dark')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${ls.target_bar_theme !== 'light' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                DARK
              </button>
              <button 
                onClick={() => upd('target_bar_theme', 'light')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${ls.target_bar_theme === 'light' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                LIGHT
              </button>
            </div>
          </div>

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

      {/* Broadcast Message Customization */}
      <div className="glass rounded-xl p-5 shadow-xl border-l-4 border-amber-500">
        <h4 className="text-white font-semibold text-sm mb-6 flex items-center gap-2">
          <Radio size={18} className="text-amber-400" /> 
          Broadcast Message Style (Full Screen)
        </h4>

        <div className="space-y-8">
          {/* Background Settings */}
          <div className="space-y-4">
            <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Background</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker label="Overlay BG Color" field="msg_bg_color" />
              <Slider label="BG Opacity" field="msg_bg_opacity" min={0} max={1} step={0.05} />
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block">Background Image</label>
              <div className="flex gap-2">
                <input type="text" value={ls.msg_bg_image || ''} onChange={e => upd('msg_bg_image', e.target.value)}
                  placeholder="Paste URL or browse..." className="input-field text-xs font-mono flex-1 bg-white/5" />
                <button 
                  onClick={() => document.getElementById('bg-upload').click()}
                  className="btn btn-secondary px-4 py-2 flex items-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus size={14} /> Browse
                </button>
                <input 
                  id="bg-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ image: reader.result, name: file.name })
                        });
                        const data = await res.json();
                        if (data.url) upd('msg_bg_image', data.url);
                      } catch (err) { console.error('Upload failed', err); }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Typography Settings */}
          <div className="space-y-4">
            <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Main Message Typography</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker label="Font Color" field="msg_font_color" />
              <Slider label="Font Size" field="msg_font_size" min={10} max={200} step={1} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-2">Font Style</label>
                <select value={ls.msg_font_style || 'italic'} onChange={e => upd('msg_font_style', e.target.value)}
                  className="input-field w-full text-sm bg-white/5">
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="bold">Bold</option>
                  <option value="black">Black (Extra Bold)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-medium block mb-2">Text Shadow</label>
                <input type="text" value={ls.msg_text_shadow || ''} onChange={e => upd('msg_text_shadow', e.target.value)}
                  placeholder="0 5px 20px rgba(0,0,0,0.8)" className="input-field text-xs font-mono w-full bg-white/5" />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Additional Text Settings */}
          <div className="space-y-4">
            <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Additional Header/Footer</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Header Text (Before)</label>
                <input type="text" value={ls.msg_before_text || ''} onChange={e => upd('msg_before_text', e.target.value)}
                  className="input-field text-sm w-full bg-white/5" placeholder="e.g. BREAKING NEWS" />
                <Slider label="Header Font Size" field="msg_before_font_size" min={10} max={100} step={1} />
              </div>
              <div className="space-y-3">
                <label className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Footer Text (After)</label>
                <input type="text" value={ls.msg_after_text || ''} onChange={e => upd('msg_after_text', e.target.value)}
                  className="input-field text-sm w-full bg-white/5" placeholder="e.g. STAY TUNED" />
                <Slider label="Footer Font Size" field="msg_after_font_size" min={10} max={100} step={1} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
