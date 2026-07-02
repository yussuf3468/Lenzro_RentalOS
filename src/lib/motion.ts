import { type Transition, type Variants } from 'framer-motion';

// Mirrors the CSS easing token in globals.css (--ease-out-quint).
const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const transitions = {
  fast: { duration: 0.12, ease: easeOutQuint },
  base: { duration: 0.2, ease: easeOutQuint },
  slow: { duration: 0.32, ease: easeOutQuint },
  spring: { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.8 },
} satisfies Record<string, Transition>;

/**
 * Physical spring presets for the OS shell. `dock` is snappy (active indicator,
 * dock reveal), `press` is crisp (button/tile press), `panel` is settled (bento
 * entrance). Tuned for a 60fps, expensive-but-fast feel.
 */
export const springs = {
  dock: { type: 'spring' as const, stiffness: 520, damping: 30, mass: 0.7 },
  press: { type: 'spring' as const, stiffness: 600, damping: 26, mass: 0.5 },
  panel: { type: 'spring' as const, stiffness: 280, damping: 28, mass: 0.9 },
} satisfies Record<string, Transition>;

/** Shared-layout glide (dock active pill, reflowing tiles). */
export const layoutTransition: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 38,
  mass: 0.8,
};

/** Bento grid entrance — container staggers its `BentoItem` children. */
export const bentoContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const bentoItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: transitions.base },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
