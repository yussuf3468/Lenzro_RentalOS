import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

const DEFAULT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface CountUpOptions {
  duration?: number;
  ease?: [number, number, number, number];
}

/** Count a number up from 0 when it scrolls into view (reduced-motion aware). */
export function useCountUp(target: number, options?: CountUpOptions) {
  const duration = options?.duration ?? 1.6;
  const ease = options?.ease ?? DEFAULT_EASE;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: reduce ? 0 : duration,
      ease,
      onUpdate: (latest) => setValue(latest),
    });
    return () => controls.stop();
  }, [inView, target, duration, ease, reduce]);

  return { ref, value };
}
