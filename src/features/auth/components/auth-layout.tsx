import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo, LogoMark } from '@/components/logo';
import { FadeIn } from '@/components/motion-primitives';
import { ThemeToggle } from '@/components/theme-toggle';

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel (always dark — a premium auth signature). */}
      <div className="relative hidden flex-col overflow-hidden bg-ink-900 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 h-160 w-160 rounded-full bg-gradient-brand opacity-20 blur-3xl"
        />
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <LogoMark className="h-7 w-auto" />
          <span className="text-base font-bold">
            Lenzro <span className="font-medium text-white/60">RentalOS</span>
          </span>
        </Link>
        <div className="relative z-10 mt-auto max-w-md">
          <p className="text-2xl leading-snug font-semibold text-balance">
            The operating system for rental businesses.
          </p>
          <p className="mt-3 text-white/60">
            Fleet, bookings, customers and finance — fully isolated, beautifully simple.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6 lg:justify-end">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <FadeIn className="w-full max-w-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children}
            {footer ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
