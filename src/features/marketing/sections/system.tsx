import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE } from '../lib/anim';
import { Chip, Eyebrow, GhostIndex, Reveal } from '../components/primitives';

interface BeatData {
  n: string;
  title: string;
  body: string;
  meta: string[];
  morph?: string[];
}

const BEATS: BeatData[] = [
  {
    n: '01',
    title: 'One core for every machine.',
    body: 'Cars today. Motorcycles, equipment, machinery and trucks tomorrow — on the exact same system. New verticals are configuration, never a rebuild.',
    meta: ['Asset model', 'JSONB attributes'],
    morph: ['vehicles', 'motorcycles', 'equipment', 'trucks'],
  },
  {
    n: '02',
    title: 'Never double-book. Ever.',
    body: 'Availability is enforced in the database itself — two overlapping rentals of the same asset are physically impossible, not merely discouraged.',
    meta: ['Exclusion constraint', 'No race conditions'],
  },
  {
    n: '03',
    title: 'Money, fully accounted for.',
    body: 'Invoices, payments, expenses and revenue — in KES and beyond, reconciled the moment they happen. The numbers are always right.',
    meta: ['Multi-currency', 'Real-time'],
  },
  {
    n: '04',
    title: 'Roles that fit your floor.',
    body: 'Owners, managers, reception, mechanics, drivers and accountants each see exactly what they should — and nothing they shouldn’t.',
    meta: ['Permission-scoped', 'Audit trail'],
  },
];

function MorphWord({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 2000);
    return () => window.clearInterval(id);
  }, [reduce, words.length]);

  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm text-[#34f5b0]">
      <span className="text-white/30">rentals.kind</span>
      <span className="text-white/30">=</span>
      <span className="relative inline-block h-5 min-w-40 overflow-hidden text-left align-middle">
        <AnimatePresence mode="wait">
          <motion.span
            key={words[index]}
            initial={reduce ? false : { y: '110%', opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={reduce ? undefined : { y: '-110%', opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0"
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

function Beat({ beat, flip }: { beat: BeatData; flip: boolean }) {
  return (
    <Reveal>
      <div className={cn('relative max-w-xl', flip && 'md:ml-auto md:text-right')}>
        <GhostIndex className={cn('absolute -top-12 -left-2', flip && 'md:-right-2 md:left-auto')}>
          {beat.n}
        </GhostIndex>
        <div className="relative">
          <h3 className="text-3xl leading-tight font-semibold tracking-tight text-white md:text-[2.5rem]">
            {beat.title}
          </h3>
          <p className="mt-4 text-lg text-white/55">{beat.body}</p>
          {beat.morph ? (
            <div className={cn('mt-5 flex', flip && 'justify-end')}>
              <MorphWord words={beat.morph} />
            </div>
          ) : null}
          <div className={cn('mt-5 flex flex-wrap gap-2', flip && 'justify-end')}>
            {beat.meta.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function System() {
  return (
    <section id="system" className="relative px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-24 max-w-2xl">
          <Eyebrow>The system</Eyebrow>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.02em] text-white">
            A platform with nothing
            <br />
            out of place.
          </h2>
        </Reveal>
        <div className="flex flex-col gap-28 md:gap-36">
          {BEATS.map((beat, index) => (
            <Beat key={beat.n} beat={beat} flip={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
