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
  
  const Slider = ({ label, field, min=0, max=100, step=1, icon: Icon }) => (
    <div className="bg-sec p-4 rounded-xl border border-main group/slider hover:bg-white/5 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black flex items-center gap-2">
          {Icon && <Icon size={12} className="text-accent-primary" />}
          {label}
        </label>
        <span className="text-main text-xs font-mono font-black bg-black/30 px-2 py-0.5 rounded border border-white/5">
          {field === 'bg_opacity' || field === 'msg_bg_opacity' ? `${Math.round(parseFloat(ls[field]) * 100)}%` : `${ls[field]}%`}
        </span>
      </div>
      <div className="relative flex items-center">
        <input type="range" min={min} max={max} step={step} value={ls[field] || 0}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onChange={e => upd(field, e.target.value)}
          className="w-full h-1.5 bg-card rounded-full appearance-none cursor-pointer accent-accent-primary"
        />
      </div>
    </div>
  );

  const ColorPicker = ({ label, field, icon: Icon }) => (
    <div className="bg-sec p-4 rounded-xl border border-main group/color hover:bg-white/5 transition-colors">
      <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black flex items-center gap-2 mb-3">
        {Icon && <Icon size={12} className="text-accent-primary" />}
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-10 shrink-0">
          <input type="color" value={ls[field] || '#000000'} onChange={e => upd(field, e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="w-full h-full rounded-lg border-2 border-white/10 shadow-inner" style={{ backgroundColor: ls[field] || '#000000' }} />
        </div>
        <div className="relative flex-1">
          <input type="text" value={ls[field] || ''} onChange={e => upd(field, e.target.value)}
            className="w-full bg-card border border-main rounded-lg px-3 py-2 text-main text-xs font-mono outline-none focus:border-accent-primary/50 transition-colors font-bold" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overlay URL (Quick Copy) */}
      <div className="glass rounded-2xl p-4 md:p-6 border-l-4 border-accent-secondary relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Radio size={60} className="text-accent-secondary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary border border-accent-secondary/20">
                <Radio size={20} />
             </div>
             <div>
                <h4 className="text-gradient-nature font-display font-black text-xl">Broadcast Overlay URL</h4>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Connect to OBS, vMix, or Wirecast</p>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                readOnly 
                value={overlayUrl}
                className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main text-xs font-mono outline-none focus:ring-2 ring-accent-secondary/30 transition-all font-bold"
              />
            </div>
            <button 
              onClick={() => copyToClipboard(overlayUrl)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 min-w-[140px] ${
                copied 
                  ? 'bg-accent-primary text-main shadow-lg' 
                  : 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/30 hover:bg-accent-secondary hover:text-main'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} 
              {copied ? 'Copied Link!' : 'Copy to Clipboard'}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-black/20 rounded-lg border border-white/5">
             <Info size={12} className="text-slate-500" />
             <p className="text-slate-500 text-[10px] italic">Paste this as a <strong>Browser Source</strong> in your broadcast software (Width: 1920, Height: 1080).</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Style Profiles */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 border-t-4 border-accent-primary relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
                <Layout size={20} />
              </div>
              <h4 className="text-gradient-vibrant font-display font-black text-xl">Style Profiles</h4>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {ls.profiles?.map(p => (
                <div key={p.name} className="group/item flex items-center gap-2">
                  <button 
                    onClick={() => switchProfile(p.name)}
                    className={`flex-1 text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                      ls.active_profile === p.name 
                        ? 'bg-accent-primary text-main border-accent-primary shadow-lg' 
                        : 'bg-sec text-slate-500 border-main hover:bg-accent-primary/10 hover:text-accent-primary'
                    }`}
                  >
                    {p.name}
                  </button>
                  {p.name !== 'default style' && p.name !== 'T-sports style' && (
                    <button 
                      onClick={() => deleteProfile(p.name)}
                      className="w-10 h-10 shrink-0 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-main rounded-xl transition-all border border-red-500/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <input 
                type="text" 
                value={newProfileName} 
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="Name your profile..." 
                className="w-full bg-sec border border-main rounded-xl px-4 py-3 text-main text-xs outline-none focus:border-accent-primary/50 font-bold" 
              />
              <button 
                onClick={createProfile} 
                disabled={!newProfileName}
                className="w-full bg-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-black border border-accent-primary/30 transition-all font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Save New Profile
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Layout size={20} />
              </div>
              <h4 className="text-gradient-gold font-display font-black text-xl">Layout Presets</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'default', label: 'Pro Curved' },
                { id: 't-sports', label: 'T-Sports' },
                { id: 'diamond', label: 'Slanted' },
                { id: 'hmh-cs', label: 'Modern Pro' }
              ].map(layout => (
                <button 
                  key={layout.id}
                  onClick={() => upd('layout_type', layout.id)}
                  className={`px-3 py-4 rounded-xl text-[9px] uppercase tracking-widest font-black border transition-all flex flex-col items-center gap-2 ${
                    ls.layout_type === layout.id 
                    ? 'bg-accent-secondary text-main border-accent-secondary shadow-lg' 
                    : 'bg-sec border-main text-slate-500 hover:border-accent-secondary hover:text-accent-secondary'
                  }`}
                >
                  <div className={`w-8 h-1 rounded-full ${ls.layout_type === layout.id ? 'bg-white' : 'bg-slate-700'}`} />
                  {layout.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sliders and Colors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Palette size={20} />
                </div>
                <h4 className="text-gradient-vibrant font-display font-black text-xl">Colors & Appearance</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker label="Primary Brand Color" field="primary_color" />
              <ColorPicker label="Secondary Color" field="secondary_color" />
              <div className="md:col-span-2">
                <ColorPicker label="Score Panel Background" field="score_panel_bg" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
               <Slider label="Background Opacity" field="bg_opacity" min={0} max={1} step={0.05} />
               <Slider label="Clock Size" field="clock_font_size" min={10} max={80} step={1} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Clock Theme</label>
                <div className="flex bg-sec rounded-lg p-1 border border-main">
                  <button onClick={() => upd('clock_theme', 'dark')} className={`px-4 py-1.5 rounded-md text-[9px] font-black tracking-widest transition-all ${ls.clock_theme !== 'light' ? 'bg-slate-700 text-main shadow-sm' : 'text-slate-500 hover:text-accent-primary'}`}>DARK</button>
                  <button onClick={() => upd('clock_theme', 'light')} className={`px-4 py-1.5 rounded-md text-[9px] font-black tracking-widest transition-all ${ls.clock_theme === 'light' ? 'bg-white text-black border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-accent-primary'}`}>LIGHT</button>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Timeline</label>
                <button 
                  onClick={() => upd('show_timeline', ls.show_timeline === '1' ? '0' : '1')}
                  className={`flex items-center gap-2 px-6 py-1.5 rounded-lg font-black text-[10px] tracking-widest transition-all border ${
                    ls.show_timeline === '1' ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/30' : 'bg-white/5 text-slate-500 border-white/10'
                  }`}
                >
                  {ls.show_timeline === '1' ? <Eye size={14} /> : <EyeOff size={14} />}
                  {ls.show_timeline === '1' ? 'VISIBLE' : 'HIDDEN'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Move size={20} />
              </div>
              <h4 className="text-gradient-gold font-display font-black text-xl">Position & Scale</h4>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-accent-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" /> Main Scoreboard
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Slider label="Horizontal (X)" field="x_offset" />
                  <Slider label="Vertical (Y)" field="y_offset" />
                  <Slider label="Overall Scale" field="overlay_scale" min={50} max={200} />
                  <Slider label="Text Zoom" field="text_scale" min={50} max={150} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-accent-secondary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary" /> Player Cards
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Slider label="Card X Position" field="profile_x" />
                  <Slider label="Card Y Position" field="profile_y" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Broadcast Style */}
      <div className="glass rounded-2xl p-6 border-l-4 border-amber-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Layout size={80} className="text-amber-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Layout size={20} />
            </div>
            <div>
              <h4 className="text-main font-display font-black text-lg">Broadcast Message Styling</h4>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Overlay & Full-Screen Graphics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Background & Image</h5>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Background Color" field="msg_bg_color" />
                <Slider label="BG Opacity" field="msg_bg_opacity" min={0} max={1} step={0.05} />
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black block mb-3">Background Image URL</label>
                <div className="flex gap-2">
                  <input type="text" value={ls.msg_bg_image || ''} onChange={e => upd('msg_bg_image', e.target.value)}
                    placeholder="https://example.com/bg.jpg" className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-main text-xs font-mono outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Typography</h5>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Text Color" field="msg_font_color" />
                <Slider label="Text Size" field="msg_font_size" min={10} max={200} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black block mb-2">Weight</label>
                  <select value={ls.msg_font_style || 'italic'} onChange={e => upd('msg_font_style', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-main text-xs outline-none">
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                    <option value="bold">Bold</option>
                    <option value="black">Black</option>
                  </select>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <label className="text-slate-500 text-[10px] uppercase tracking-widest font-black block mb-2">Shadow</label>
                  <input type="text" value={ls.msg_text_shadow || ''} onChange={e => upd('msg_text_shadow', e.target.value)}
                    placeholder="0 5px 20px black" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-main text-xs font-mono outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
