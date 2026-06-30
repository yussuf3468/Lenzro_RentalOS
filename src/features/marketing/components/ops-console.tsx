import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, Lock } from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';
import { EASE } from '../lib/anim';
import { StatusDot } from './primitives';

const FLEET = [
  { plate: 'KDA 482J', model: 'Toyota Prado', status: 'On rental', tone: 'green' as const },
  { plate: 'KCY 119X', model: 'Land Cruiser 300', status: 'Available', tone: 'muted' as const },
  { plate: 'KDG 770M', model: 'Hilux Double Cab', status: 'On rental', tone: 'green' as const },
  { plate: 'KBZ 905A', model: 'Mazda CX-5', status: 'Maintenance', tone: 'amber' as const },
  { plate: 'KDE 233T', model: 'Nissan X-Trail', status: 'Reserved', tone: 'green' as const },
];

const TONE_TEXT: Record<'green' | 'amber' | 'red' | 'muted', string> = {
  green: 'text-[#34f5b0]',
  amber: 'text-[#e0a93b]',
  red: 'text-[#f1614f]',
  muted: 'text-white/45',
};

const BOOKINGS = [
  { ref: 'LNZ-BKG-2026-0488', amount: 'KES 18,400', asset: 'KDE 233T' },
  { ref: 'LNZ-BKG-2026-0489', amount: 'KES 42,900', asset: 'KDG 770M' },
  { ref: 'LNZ-BKG-2026-0490', amount: 'KES 9,750', asset: 'KCY 119X' },
];

function Kpi({
  label,
  target,
  format,
  delta,
}: {
  label: string;
  target: number;
  format: (value: number) => string;
  delta: string;
}) {
  const { ref, value } = useCountUp(target);
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">{label}</p>
      <p className="mt-2 font-mono text-xl font-semibold tracking-tight text-white tabular-nums md:text-2xl">
        <span ref={ref}>{format(value)}</span>
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#34f5b0]">
        <ArrowUpRight className="size-3" />
        {delta}
      </p>
    </div>
  );
}

export function OpsConsole() {
  const reduce = useReducedMotion();
  const [bookingIndex, setBookingIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let hide: number;
    let next: number;
    const cycle = () => {
      setShowBooking(true);
      hide = window.setTimeout(() => setShowBooking(false), 3400);
      next = window.setTimeout(() => {
        setBookingIndex((index) => (index + 1) % BOOKINGS.length);
        cycle();
      }, 6200);
    };
    const start = window.setTimeout(cycle, 1600);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(hide);
      window.clearTimeout(next);
    };
  }, [reduce]);

  const booking = BOOKINGS[bookingIndex];

  return (
    <div className="relative mx-auto w-full max-w-3xl" style={{ perspective: 1600 }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 48, rotateX: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.3, ease: EASE }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/50 backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="size-4 rounded-[5px] bg-gradient-brand" />
            <span className="font-mono text-xs tracking-[0.2em] text-white/70 uppercase">
              Lenzro <span className="text-white/35">/ Operations</span>
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
            <StatusDot tone="green" />
            <span className="tracking-[0.18em] uppercase">Live</span>
            <span className="text-white/25">·</span>
            <span>NBO-01</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-6">
          <Kpi
            label="Revenue · KES"
            target={1284500}
            delta="12.4%"
            format={(value) => Math.round(value).toLocaleString('en-KE')}
          />
          <Kpi
            label="Utilization"
            target={98.6}
            delta="3.1%"
            format={(value) => `${value.toFixed(1)}%`}
          />
          <Kpi
            label="Active rentals"
            target={47}
            delta="6"
            format={(value) => `${Math.round(value)}`}
          />
        </div>

        {/* Fleet board */}
        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-[1fr_auto] items-center px-1 pb-2 font-mono text-[10px] tracking-[0.18em] text-white/30 uppercase">
            <span>Fleet</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-white/[0.015]">
            {FLEET.map((unit) => (
              <li
                key={unit.plate}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025]"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-medium text-white">{unit.plate}</span>
                  <span className="truncate text-sm text-white/45">{unit.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot tone={unit.tone} />
                  <span className={`text-xs font-medium ${TONE_TEXT[unit.tone]}`}>
                    {unit.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Floating satellites */}
      <div
        className="absolute -top-6 -left-6 hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl md:block"
        style={{ animation: reduce ? undefined : 'float-slow 8s ease-in-out infinite' }}
      >
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">Uptime</p>
        <p className="font-mono text-lg font-semibold text-white tabular-nums">99.98%</p>
      </div>

      <div
        className="absolute -right-8 bottom-10 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 backdrop-blur-xl md:flex"
        style={{ animation: reduce ? undefined : 'float-slow 9s ease-in-out infinite' }}
      >
        <Lock className="size-3.5 text-[#34f5b0]" />
        <span className="font-mono text-xs text-white/70">RLS-isolated</span>
      </div>

      {/* Live booking confirmation (desktop-only floating detail) */}
      <div className="pointer-events-none absolute -top-4 right-2 hidden sm:block md:right-6">
        <AnimatePresence>
          {showBooking ? (
            <motion.div
              key={booking.ref}
              initial={reduce ? false : { opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1018]/90 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur-xl"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-gradient-brand text-ink-900">
                <Check className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-white">Booking confirmed</p>
                <p className="font-mono text-[11px] text-white/45">
                  {booking.amount} · {booking.asset}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
