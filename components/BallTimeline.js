import { motion, AnimatePresence } from 'framer-motion';

function getBallStyle(ball) {
  const b = String(ball).toUpperCase();
  if (b === 'EMPTY') return 'ball-empty';
  if (b === 'W') return 'ball-wicket';
  if (b === 'WD' || b === 'WIDE' || b === 'NB' || b === 'NOBALL') return 'ball-extra';
  if (b === '0' || b === '.') return 'ball-dot';
  return 'ball-run';
}

function getBallLabel(ball) {
  const b = String(ball).toUpperCase();
  if (b === 'EMPTY') return '';
  if (b === '0' || b === '.') return '';
  if (b === 'W') return 'W';
  if (b === 'WD' || b === 'WIDE') return 'Wd';
  if (b === 'NB' || b === 'NOBALL') return 'Nb';
  return b;
}

export default function BallTimeline({ balls = [], maxVisible = 6 }) {
  // Take up to 6 balls
  const recent = balls.slice(-6);
  // Pad with empty balls up to 6
  const paddedBalls = [...recent];
  while (paddedBalls.length < 6) {
    paddedBalls.push('EMPTY');
  }

  return (
    <div className="flex items-center gap-[2px] overflow-hidden">
      <AnimatePresence initial={false}>
        {paddedBalls.map((ball, i) => (
          <motion.span
            key={`timeline-ball-${i}-${ball}`}
            initial={ball !== 'EMPTY' ? { scale: 0, opacity: 0, x: 10 } : false}
            animate={{ scale: 1, opacity: 1, x: 0 }}
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
