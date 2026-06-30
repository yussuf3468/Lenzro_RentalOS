import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo, LogoMark } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PROOF = [
  'Row-level data isolation',
  'Multi-currency, multi-branch',
  'Built for a continent on the move',
];

function AuthBrandPanel() {
  const reduce = useReducedMotion();

  const reveal = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 1, ease: EASE, delay },
  });

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-[#07090f] p-10 text-white lg:flex xl:p-14">
      {/* Cinematic backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 100% at 28% 0%, #0d1320 0%, #07090f 58%, #050609 100%)',
          }}
        />
        <div
          className="absolute -top-40 -left-24 size-[42rem] rounded-full opacity-45 blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,153,0.22), transparent 60%)',
            animation: reduce ? undefined : 'aurora-drift-1 24s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -right-28 bottom-0 size-[34rem] rounded-full opacity-30 blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgba(251,235,5,0.10), transparent 60%)',
            animation: reduce ? undefined : 'aurora-drift-2 30s ease-in-out infinite',
          }}
        />
        <div
          className="absolute inset-0 bg-grid opacity-60"
          style={{
            maskImage: 'radial-gradient(80% 70% at 28% 42%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(80% 70% at 28% 42%, black, transparent)',
          }}
        />
        <div className="absolute inset-0 bg-grain opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* Top — lockup + instrument */}
      <motion.div
        {...reveal(0)}
        className="relative z-10 flex items-center justify-between font-mono text-[11px] text-white/40"
      >
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <LogoMark className="h-7 w-auto" />
          <span className="text-base font-bold">
            Lenzro <span className="font-medium text-white/50">RentalOS</span>
          </span>
        </Link>
        <span className="tracking-[0.24em] uppercase">Nairobi</span>
      </motion.div>

      {/* Center — the statement is the hero, vertically centred */}
      <div className="relative z-10 flex flex-1 flex-col justify-center py-12">
        <motion.span
          {...reveal(0.08)}
          className="mb-7 inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-white/45 uppercase"
        >
          <span className="h-px w-7 bg-gradient-to-r from-transparent to-[#00FF99]/80" />
          Rental Operating System
        </motion.span>
        <motion.h2
          {...reveal(0.16)}
          className="max-w-md text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.02em] text-balance"
        >
          The calm at the center of{' '}
          <span className="text-gradient-brand">everything that moves.</span>
        </motion.h2>
        <motion.p {...reveal(0.24)} className="mt-6 max-w-sm text-white/55">
          Fleet, bookings, customers and finance — one command center, fully isolated and
          beautifully simple.
        </motion.p>
      </div>

      {/* Bottom — proof rails + signature */}
      <motion.div {...reveal(0.34)} className="relative z-10 space-y-5">
        <div className="space-y-2.5">
          {PROOF.map((item) => (
            <div key={item} className="flex items-center gap-3 font-mono text-xs text-white/55">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#00FF99]/80" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-5 font-mono text-[11px] text-white/30">
          <span>01.2864° S · 36.8172° E</span>
          <span>LNZ · EST. 2026</span>
        </div>
      </motion.div>
    </div>
  );
}

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const reduce = useReducedMotion();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <AuthBrandPanel />

      {/* Form side */}
      <div className="flex flex-col bg-background">
        <header className="flex items-center justify-between p-6 lg:justify-end">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <div className="mb-7">
              <h1 className="text-[1.75rem] font-bold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children}
            {footer ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
