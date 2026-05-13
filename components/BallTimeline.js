import { motion, AnimatePresence } from 'framer-motion';

function getBallStyle(ball) {
  const label = typeof ball === 'object' && ball !== null ? ball.label : ball;
  const b = String(label).toUpperCase();
  if (b === 'EMPTY') return 'ball-empty';
  if (b === 'W' || (b.startsWith('W') && !b.startsWith('WD'))) return 'ball-wicket';
  if (b.includes('WD') || b.includes('NB')) return 'ball-extra';
  if (b === '0' || b === '.') return 'ball-dot';
  return 'ball-run';
}

function getBallLabel(ball) {
  const label = typeof ball === 'object' && ball !== null ? ball.label : ball;
  const b = String(label || '').toUpperCase();
  if (b === 'EMPTY' || b === '0' || b === '.' || b === '') return '';
  return String(label);
}

export default function BallTimeline({ balls = [], maxVisible = 12 }) {
  // Helper to identify illegal deliveries (Wides and No Balls)
  // These don't count towards the 6 legal balls of an over
  const isIllegal = (ball) => {
    const label = (typeof ball === 'object' && ball !== null ? ball.label : ball).toUpperCase();
    return ['WD', 'WIDE', 'NB', 'NOBALL', 'Wd', 'Nb'].includes(label) || label.includes('WD') || label.includes('NB');
  };

  // Count how many legal balls have been bowled in this over
  const legalBallsCount = balls.filter(b => !isIllegal(b)).length;
  
  // Calculate how many legal balls are remaining to complete the over (standard 6)
  const legalBallsRemaining = Math.max(0, 6 - legalBallsCount);

  // Build the list of balls to display: all bowled balls + empty slots for remaining
  const displayBalls = [...balls];
  for (let i = 0; i < legalBallsRemaining; i++) {
    displayBalls.push('EMPTY');
  }

  // Ensure we don't exceed a reasonable maxVisible if the over gets very long (e.g., 12)
  // But usually an over won't exceed 12 balls.
  const finalBalls = displayBalls.length > maxVisible ? displayBalls.slice(-maxVisible) : displayBalls;

  return (
    <div className="flex items-center gap-[2px] overflow-hidden">
      <AnimatePresence initial={false}>
        {finalBalls.map((ball, i) => (
          <motion.span
            key={`timeline-ball-${i}-${typeof ball === 'object' ? ball.timestamp : ball}`}
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
