import { Eyebrow, Reveal } from '../components/primitives';
import { OpsConsole } from '../components/ops-console';

export function Pulse() {
  return (
    <section className="relative px-6 py-28 md:py-36">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>Live operations</Eyebrow>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.02em] text-white">
            See the whole business <span className="text-gradient-brand">breathe.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-white/50">
            Every vehicle, booking and shilling in one real-time view. No spreadsheets. No
            guesswork. Just the truth, updating as it happens.
          </p>
        </Reveal>
        <OpsConsole />
      </div>
    </section>
  );
}
