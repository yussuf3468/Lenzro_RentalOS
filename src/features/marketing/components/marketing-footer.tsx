import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/logo';
import { GhostCta, PrimaryCta } from './primitives';

const LINKS = [
  {
    heading: 'Product',
    items: [
      { label: 'Live operations', href: '#system' },
      { label: 'Start free', to: '/register' },
      { label: 'Sign in', to: '/login' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-auto" />
              <span className="text-lg font-semibold text-white">Lenzro RentalOS</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/50">
              The operating system for rental businesses. Built in Nairobi, for a continent on the
              move.
            </p>
            <div className="mt-7 flex items-center gap-5">
              <PrimaryCta to="/register">Start free trial</PrimaryCta>
              <GhostCta to="/login">Sign in</GhostCta>
            </div>
          </div>

          <nav className="flex gap-14 font-mono text-xs">
            {LINKS.map((column) => (
              <div key={column.heading} className="space-y-3.5">
                <p className="tracking-[0.2em] text-white/30 uppercase">{column.heading}</p>
                <ul className="space-y-2.5">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      {item.to ? (
                        <Link
                          to={item.to}
                          className="text-white/55 transition-colors hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="text-white/55 transition-colors hover:text-white"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* End-credits wordmark */}
        <div className="mt-16 overflow-hidden select-none">
          <p className="text-[clamp(3rem,16vw,12rem)] leading-[0.8] font-extrabold tracking-tighter text-stroke-soft">
            LENZRO
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Lenzro Software Solutions</span>
          <span>01.2864° S · 36.8172° E · Nairobi</span>
        </div>
      </div>
    </footer>
  );
}
