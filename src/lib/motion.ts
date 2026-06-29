import { type Transition, type Variants } from 'framer-motion';

// Mirrors the CSS easing token in globals.css (--ease-out-quint).
const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const transitions = {
  fast: { duration: 0.12, ease: easeOutQuint },
  base: { duration: 0.2, ease: easeOutQuint },
  slow: { duration: 0.32, ease: easeOutQuint },
  spring: { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.8 },
} satisfies Record<string, Transition>;

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
