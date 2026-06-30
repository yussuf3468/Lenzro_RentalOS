import { type Pointer } from '../hooks/use-pointer';
import { Eyebrow, GhostCta, LiveClock, PrimaryCta, Reveal } from '../components/primitives';
import { Monolith } from '../components/monolith';

export function Overture({ pointer }: { pointer: Pointer }) {
  return (
    <section className="relative flex min-h-svh flex-col px-6 pt-20 pb-14">
      {/* Instrument line */}
      <Reveal className="flex items-center justify-between font-mono text-[11px] text-white/35">
        <span className="hidden sm:block">01.2864° S · 36.8172° E</span>
        <span className="tracking-[0.24em] uppercase">Nairobi</span>
        <LiveClock className="hidden sm:block" />
      </Reveal>

      {/* Centred hero */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Monolith x={pointer.x} y={pointer.y} className="mb-12 md:mb-14" />

        <Reveal delay={0.1}>
          <Eyebrow>Rental Operating System</Eyebrow>
        </Reveal>

        <Reveal delay={0.18} className="mt-6 max-w-4xl">
          <h1 className="text-[clamp(2.4rem,6.5vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance text-white">
            Everything that moves,
            <br />
            <span className="text-gradient-brand">under control.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.26} className="mt-6 max-w-xl">
          <p className="text-base text-pretty text-white/55 md:text-lg">
            The calm command center for rental companies — fleet, bookings, customers and finance,
            in one place built to scale across a continent.
          </p>
        </Reveal>

        <Reveal delay={0.34} className="mt-9 flex flex-col items-center gap-5 sm:flex-row">
          <PrimaryCta to="/register">Start free trial</PrimaryCta>
          <GhostCta to="/login">Sign in</GhostCta>
        </Reveal>
      </div>

      {/* Scroll cue */}
      <div className="flex justify-center pt-6">
        <div className="flex flex-col items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">
          Scroll
          <span className="h-9 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
