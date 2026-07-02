import { type PointerEvent, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from 'framer-motion';
import { bentoContainer, bentoItem, springs } from '@/lib/motion';

/** Crisp scale-down on press. The tactile feedback for buttons, tiles, dock icons. */
export function Press({ children, ...props }: HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileTap={reduce ? undefined : { scale: 0.95 }}
      transition={springs.press}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MagneticProps extends HTMLMotionProps<'div'> {
  /** How strongly the element drifts toward the cursor (0–1). */
  strength?: number;
}

/** Subtle cursor attraction — the element leans toward the pointer, then springs back. */
export function Magnetic({ children, strength = 0.3, ...props }: MagneticProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (reduce || !node) return;
    const rect = node.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: reduce ? 0 : sx, y: reduce ? 0 : sy }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Settled spring entrance for a single panel / surface. */
export function SpringIn({ children, ...props }: HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.panel}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Grid container that staggers its `BentoItem` children into view. */
export function BentoStagger({ children, ...props }: HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      animate="visible"
      variants={bentoContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** A single cell inside a `BentoStagger`. */
export function BentoItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={bentoItem} {...props}>
      {children}
    </motion.div>
  );
}
