import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion';

/** Entrance fade + subtle rise. Renders static when the user prefers reduced motion. */
export function FadeIn({ children, ...props }: HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      animate="visible"
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its `StaggerItem` children into view. */
export function Stagger({ children, ...props }: HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      animate="visible"
      variants={staggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Item inside a `Stagger`. */
export function StaggerItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={fadeInUp} {...props}>
      {children}
    </motion.div>
  );
}
