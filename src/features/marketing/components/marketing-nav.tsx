import { useState } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/logo';
import { cn } from '@/lib/utils';
import { StatusDot } from './primitives';

export function MarketingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 24));

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        scrolled
          ? 'border-b border-white/10 bg-[#07090f]/70 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-auto" />
          <span className="text-sm font-semibold tracking-tight text-white">
            Lenzro <span className="text-white/40">RentalOS</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2.5 font-mono text-[11px] text-white/40 md:flex">
          <StatusDot tone="green" />
          <span className="tracking-[0.22em] uppercase">Systems nominal</span>
        </div>

        <div className="flex items-center gap-5">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
          >
            Start free
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
