import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';

// Master mark path (mirrors /assets/logo.svg).
const MARK =
  'M30.4742 3.63054C32.2745 -0.200807 37.7245 -0.200598 39.525 3.63054L59.1031 45.2966L69.1168 66.6071C70.9745 70.5607 67.2249 74.8291 63.065 73.4958L34.9996 64.4997L6.93417 73.4958C2.77451 74.8285 -0.974254 70.5606 0.883392 66.6071L10.8971 45.2966L30.4742 3.63054ZM39.5289 25.6745C37.7313 21.8341 32.2689 21.8341 30.4713 25.6745L21.4029 45.0475L17.8658 52.6051C16.0143 56.5607 19.7678 60.8226 23.9254 59.485L34.9996 55.9216L46.0748 59.485C50.2323 60.8225 53.9859 56.5607 52.1344 52.6051L48.5963 45.0475L39.5289 25.6745Z';

// Sized to viewport height so the hero always fits, capped for large screens.
const MARK_SIZE = 'h-[clamp(7rem,23vh,14rem)] w-auto';

interface MonolithProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  className?: string;
}

/** The luminous, cursor-tilting brand monolith with bloom and (out-of-flow) reflection. */
export function Monolith({ x, y, className }: MonolithProps) {
  const reduce = useReducedMotion();
  const rotateX = useTransform(y, (v) => (0.5 - v) * 10);
  const rotateY = useTransform(x, (v) => (v - 0.5) * 12);

  return (
    <div className={className} style={{ perspective: 1200 }}>
      <div className="relative flex justify-center">
        {/* Bloom */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(0,255,153,0.32), transparent 60%)' }}
        />

        <motion.div
          style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative"
        >
          <div
            className="relative"
            style={{ animation: reduce ? undefined : 'float-slow 7s ease-in-out infinite' }}
          >
            <svg
              viewBox="0 0 70 74"
              className={MARK_SIZE}
              style={{ filter: 'drop-shadow(0 24px 64px rgba(0,255,153,0.30))' }}
              role="img"
              aria-label="Lenzro"
            >
              <defs>
                <linearGradient
                  id="monolithGrad"
                  x1="65.853"
                  y1="0.7575"
                  x2="-1.985"
                  y2="69.3275"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.5" stopColor="#FBEB05" />
                  <stop offset="1" stopColor="#00FF99" />
                </linearGradient>
              </defs>
              <path d={MARK} fill="url(#monolithGrad)" />
            </svg>

            {/* Reflection — absolute, so it never adds layout height */}
            <svg
              viewBox="0 0 70 74"
              aria-hidden
              className={`pointer-events-none absolute top-full left-0 -scale-y-100 opacity-[0.16] blur-[2px] ${MARK_SIZE}`}
              style={{
                maskImage: 'linear-gradient(to bottom, black, transparent 52%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 52%)',
              }}
            >
              <path d={MARK} fill="url(#monolithGrad)" />
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
