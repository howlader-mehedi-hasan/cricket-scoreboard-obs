import { motion, AnimatePresence } from 'framer-motion';

function getBallStyle(ball) {
  const b = String(ball).toUpperCase();
  if (b === 'W') return 'ball-wicket';
  if (b === 'WD' || b === 'WIDE') return 'ball-wide';
  if (b === 'NB' || b === 'NOBALL') return 'ball-noball';
  if (b === '0' || b === '.') return 'ball-dot';
  if (b === '4') return 'ball-4';
  if (b === '6') return 'ball-6';
  if (b === '2') return 'ball-2';
  if (b === '3') return 'ball-3';
  if (b === '1') return 'ball-1';
  return 'ball-1';
}

function getBallLabel(ball) {
  const b = String(ball).toUpperCase();
  if (b === 'W') return 'W';
  if (b === 'WD' || b === 'WIDE') return 'Wd';
  if (b === 'NB' || b === 'NOBALL') return 'Nb';
  if (b === '0' || b === '.') return '•';
  return b;
}

export default function BallTimeline({ balls = [], maxVisible = 18 }) {
  const visible = balls.slice(-maxVisible);

  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      <AnimatePresence initial={false}>
        {visible.map((ball, i) => (
          <motion.span
            key={`${balls.length - maxVisible + i}-${ball}`}
            initial={{ scale: 0, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`ball-badge ${getBallStyle(ball)}`}
          >
            {getBallLabel(ball)}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
