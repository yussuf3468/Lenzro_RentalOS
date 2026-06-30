import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EASE, REVEAL_VIEWPORT } from '../lib/anim';

/** Blur-resolve entrance — text and elements come into focus as they enter. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 1.1, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Mono uppercase label with a leading gradient tick. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-white/45 uppercase',
        className,
      )}
    >
      <span className="h-px w-7 bg-gradient-to-r from-transparent to-[#00FF99]/80" />
      {children}
    </span>
  );
}

/** Animated hairline divider. */
export function Hairline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { scaleX: 0, opacity: 0 }}
      whileInView={reduce ? undefined : { scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.3, ease: EASE }}
      className={cn(
        'h-px origin-left bg-gradient-to-r from-transparent via-white/15 to-transparent',
        className,
      )}
    />
  );
}

/** Oversized ghost numeral for film-chapter rhythm. */
export function GhostIndex({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none font-mono text-[clamp(4rem,11vw,9rem)] leading-none font-bold text-stroke-soft select-none',
        className,
      )}
    >
      {children}
    </span>
  );
}

type Tone = 'green' | 'amber' | 'red' | 'muted';
const TONE_COLOR: Record<Tone, string> = {
  green: '#00FF99',
  amber: '#e0a93b',
  red: '#f1614f',
  muted: '#8A93A2',
};

export function StatusDot({ tone = 'green', className }: { tone?: Tone; className?: string }) {
  const color = TONE_COLOR[tone];
  return (
    <span className={cn('relative inline-flex size-2 items-center justify-center', className)}>
      <span
        className="absolute size-full rounded-full"
        style={{ background: color, animation: 'pulse-dot 2s ease-in-out infinite' }}
      />
      <span className="relative size-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

/** Glass data chip. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 backdrop-blur-md',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Primary CTA — magnetic white pill with a gradient halo on hover. */
export function PrimaryCta({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const onMove = (event: MouseEvent<HTMLSpanElement>) => {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.25);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.35);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('group relative inline-flex', className)}
    >
      <span
        aria-hidden
        className="absolute -inset-2 rounded-full bg-gradient-brand opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
      />
      <Link
        to={to}
        className="relative inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition-transform duration-300 group-hover:scale-[1.02]"
      >
        {children}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </motion.span>
  );
}

/** Quiet secondary CTA with an underline reveal. */
export function GhostCta({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white',
        className,
      )}
    >
      {children}
      <span className="h-px w-0 bg-white/60 transition-all duration-300 group-hover:w-6" />
    </Link>
  );
}

/** Live Nairobi clock — a small "the system is awake" detail. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Nairobi',
    hour12: false,
  });
  return <span className={cn('font-mono tabular-nums', className)}>{time} EAT</span>;
}
