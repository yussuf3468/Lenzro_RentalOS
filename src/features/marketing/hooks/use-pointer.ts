import { useEffect } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';

export interface Pointer {
  /** Normalised 0..1 across the viewport, spring-smoothed. */
  x: MotionValue<number>;
  y: MotionValue<number>;
}

/**
 * Viewport-normalised, spring-smoothed pointer position for cursor-reactive
 * lighting and parallax tilt. One listener; shared via props.
 */
export function usePointer(): Pointer {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.35);
  const sx = useSpring(x, { stiffness: 50, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 50, damping: 18, mass: 0.6 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      x.set(event.clientX / window.innerWidth);
      y.set(event.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return { x: sx, y: sy };
}
