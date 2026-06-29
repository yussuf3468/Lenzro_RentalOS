import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Sign in', href: '/login' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/' },
      { label: 'Contact', href: '/' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/' },
      { label: 'Terms', href: '/' },
    ],
  },
];

export function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 glass glass-edge">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link
            to="/"
            aria-label={siteConfig.name}
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="/#features"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="/#pricing"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="brand">
              <Link to="/register">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          {FOOTER_LINKS.map((column) => (
            <div key={column.heading}>
              <p className="text-sm font-semibold">{column.heading}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {siteConfig.company}
            </p>
            <p className="font-mono text-xs">{siteConfig.name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
