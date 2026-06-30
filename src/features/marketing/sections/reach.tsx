import { motion, useReducedMotion } from 'framer-motion';
import { useCountUp } from '@/hooks/use-count-up';
import { EASE } from '../lib/anim';
import { Eyebrow, Reveal } from '../components/primitives';

const CITIES = [
  { name: 'Lagos', x: 120, y: 158 },
  { name: 'Accra', x: 235, y: 256 },
  { name: 'Kampala', x: 425, y: 120 },
  { name: 'Kigali', x: 505, y: 224 },
  { name: 'Nairobi', x: 628, y: 158, hq: true },
  { name: 'Dar es Salaam', x: 700, y: 300 },
];

const SEGMENTS = CITIES.slice(0, -1).map((city, index) => {
  const next = CITIES[index + 1];
  const cx = (city.x + next.x) / 2;
  const cy = Math.min(city.y, next.y) - 52;
  return `M ${city.x} ${city.y} Q ${cx} ${cy} ${next.x} ${next.y}`;
});

function Constellation() {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 800 380"
      className="h-auto w-full"
      role="img"
      aria-label="Cities across Africa"
    >
      <defs>
        <linearGradient id="reachGrad" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBEB05" />
          <stop offset="0.5" stopColor="#6AFF80" />
          <stop offset="1" stopColor="#00FF99" />
        </linearGradient>
      </defs>

      <g style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,153,0.32))' }}>
        {SEGMENTS.map((d, index) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="url(#reachGrad)"
            strokeWidth={1.5}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.2 + index * 0.16 }}
          />
        ))}
      </g>

      {CITIES.map((city) => (
        <g key={city.name}>
          <circle
            cx={city.x}
            cy={city.y}
            r={city.hq ? 11 : 8}
            fill="#00FF99"
            opacity={0.18}
            style={{ animation: reduce ? undefined : 'pulse-dot 2.4s ease-in-out infinite' }}
          />
          <circle
            cx={city.x}
            cy={city.y}
            r={city.hq ? 5 : 4}
            fill={city.hq ? '#FBEB05' : '#6AFF80'}
          />
          <text
            x={city.x}
            y={city.y + 32}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="19"
            fill="rgba(255,255,255,0.65)"
          >
            {city.name}
          </text>
          {city.hq ? (
            <text
              x={city.x}
              y={city.y - 20}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              letterSpacing="2"
              fill="#34f5b0"
            >
              HQ
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function Stat({ target, label }: { target: number; label: string }) {
  const { ref, value } = useCountUp(target);
  return (
    <div>
      <p className="font-mono text-3xl font-semibold text-white tabular-nums">
        <span ref={ref}>{Math.round(value)}</span>
      </p>
      <p className="mt-1 text-xs text-white/45">{label}</p>
    </div>
  );
}

export function Reach() {
  return (
    <section id="reach" className="relative px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <Eyebrow>Pan-African by design</Eyebrow>
            <h2 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.02em] text-white">
              Built for a continent
              <br />
              <span className="text-gradient-brand">on the move.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg text-white/55">
              Multi-currency from day one — KES, NGN, GHS and more. Per-company timezones, locales
              and isolation, ready for thousands of businesses across borders.
            </p>
            <div className="mt-10 grid max-w-sm grid-cols-3 gap-6">
              <Stat target={47} label="Cities live" />
              <Stat target={12} label="Currencies" />
              <Stat target={6} label="Countries" />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <Constellation />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
