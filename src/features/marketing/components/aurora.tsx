import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';

interface AuroraProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

/**
 * The cinematic stage: deep ink base, drifting brand-coloured aurora, an
 * engineered grid, a cursor-reactive spotlight, and film grain.
 */
export function Aurora({ x, y }: AuroraProps) {
  const reduce = useReducedMotion();
  const mx = useTransform(x, (v) => `${(v * 100).toFixed(2)}%`);
  const my = useTransform(y, (v) => `${(v * 100).toFixed(2)}%`);
  const spotlight = useMotionTemplate`radial-gradient(680px circle at ${mx} ${my}, rgba(0,255,153,0.12), transparent 60%)`;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 120% at 50% -10%, #0c121d 0%, #07090f 52%, #050609 100%)',
        }}
      />

      {/* Drifting aurora */}
      <div
        className="absolute -top-48 left-1/2 size-[62rem] -translate-x-1/2 rounded-full opacity-50 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,153,0.20), transparent 60%)',
          animation: reduce ? undefined : 'aurora-drift-1 24s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[22%] -left-40 size-[46rem] rounded-full opacity-40 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(251,235,5,0.10), transparent 60%)',
          animation: reduce ? undefined : 'aurora-drift-2 28s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[34%] -right-40 size-[42rem] rounded-full opacity-40 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(106,255,128,0.12), transparent 60%)',
          animation: reduce ? undefined : 'aurora-drift-3 32s ease-in-out infinite',
        }}
      />

      {/* Engineered grid, masked to the centre */}
      <div
        className="absolute inset-0 bg-grid"
        style={{
          maskImage: 'radial-gradient(75% 60% at 50% 28%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(75% 60% at 50% 28%, black, transparent)',
        }}
      />

      {/* Cursor-reactive spotlight */}
      {reduce ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(680px circle at 50% 22%, rgba(0,255,153,0.10), transparent 60%)',
          }}
        />
      ) : (
        <motion.div className="absolute inset-0" style={{ backgroundImage: spotlight }} />
      )}

      {/* Film grain + bottom settle */}
      <div className="absolute inset-0 bg-grain opacity-[0.04] mix-blend-overlay" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-[#050609]" />
    </div>
  );
}
