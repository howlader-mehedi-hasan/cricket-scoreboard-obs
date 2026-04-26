import { motion, AnimatePresence } from 'framer-motion';

export default function AnimatedNumber({ value, size = 'text-5xl', className = '' }) {
  const digits = String(value).split('');

  return (
    <span className={`inline-flex items-baseline font-display font-black tracking-tight ${size} ${className}`}>
      <AnimatePresence mode="popLayout">
        {digits.map((digit, i) => (
          <motion.span
            key={`${i}-${digit}`}
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
              mass: 0.8,
              delay: i * 0.02,
            }}
            className="inline-block"
            style={{ minWidth: digit === '/' ? '0.35em' : '0.55em', textAlign: 'center' }}
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
