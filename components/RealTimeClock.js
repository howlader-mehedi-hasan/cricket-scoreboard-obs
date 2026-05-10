import { useState, useEffect } from 'react';

export default function RealTimeClock({ className = "", fontSize = 18 }) {
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

  return (
    <div className={`flex flex-col items-end justify-center font-mono ${className}`}>
      <div className="font-bold leading-none tracking-widest" style={{ fontSize: `${fontSize}px` }}>{timeString}</div>
      <div className="text-white/70 uppercase tracking-widest mt-1" style={{ fontSize: `${Math.max(8, fontSize * 0.5)}px` }}>{dateString}</div>
    </div>
  );
}
