import { useState, useEffect } from 'react';

export default function RealTimeClock({ className = "", fontSize = 18, theme = 'dark' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
  const dateString = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const isLight = theme === 'light';

  return (
    <div className={`flex flex-col items-end justify-center font-mono ${className}`}>
      <div className={`font-bold leading-none tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`} style={{ fontSize: `${fontSize}px` }}>{timeString}</div>
      <div className={`uppercase tracking-widest mt-1 ${isLight ? 'text-slate-600' : 'text-white/70'}`} style={{ fontSize: `${Math.max(8, fontSize * 0.5)}px` }}>{dateString}</div>
    </div>
  );
}
