import { Eyebrow, GhostCta, PrimaryCta, Reveal } from '../components/primitives';

export function Close() {
  return (
    <section className="relative px-6 py-32 text-center md:py-44">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(0,255,153,0.30), transparent 60%)' }}
      />
      <Reveal className="relative mx-auto max-w-3xl">
        <Eyebrow>Take the wheel</Eyebrow>
        <h2 className="mt-6 text-[clamp(2.4rem,7vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance text-white">
          Your fleet is already moving.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-white/55">
          Set it up in minutes. Take your first booking today. Free for 14 days — no card required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <PrimaryCta to="/register">Start free trial</PrimaryCta>
          <GhostCta to="/login">Sign in</GhostCta>
        </div>
        <p className="mt-12 font-mono text-[11px] tracking-[0.24em] text-white/30 uppercase">
          LNZ · Nairobi · Built for Africa
        </p>
      </Reveal>
    </section>
  );
}
