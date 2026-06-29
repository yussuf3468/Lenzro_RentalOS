import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { FadeIn } from '@/components/motion-primitives';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { OrgSwitcher, UserMenu, useActiveSubscription } from '@/features/organizations';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', to: '/app', end: true },
  { label: 'Team', to: '/app/team', end: false },
];

// Modules that arrive in later phases — shown disabled so the shape is visible.
const COMING_SOON = [
  'Vehicles',
  'Bookings',
  'Customers',
  'Maintenance',
  'Finance',
  'Reports',
  'Settings',
];

function TrialBadge() {
  const { data: subscription } = useActiveSubscription();
  // Capture "now" once at mount (a days-left badge needn't tick mid-session).
  const [now] = useState(() => Date.now());
  if (!subscription || subscription.status !== 'trialing' || !subscription.trial_end) return null;
  const days = Math.max(
    0,
    Math.ceil((new Date(subscription.trial_end).getTime() - now) / 86_400_000),
  );
  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
      <span className="size-1.5 rounded-full bg-gradient-brand" />
      Trial · {days} {days === 1 ? 'day' : 'days'} left
    </span>
  );
}

export function AppShell() {
  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-brand" />
                  ) : null}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
          <p className="px-3 pt-4 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Coming soon
          </p>
          {COMING_SOON.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              className="cursor-default rounded-md px-3 py-2 text-sm text-sidebar-foreground/40"
            >
              {label}
            </span>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 glass px-4 glass-edge sm:px-6">
          <OrgSwitcher />
          <Button
            variant="outline"
            size="sm"
            className="ml-1 hidden gap-2 text-muted-foreground lg:inline-flex"
            aria-label="Search (coming soon)"
          >
            <Search />
            <span>Search…</span>
            <kbd className="ml-2 rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
          </Button>
          <div className="ml-auto flex items-center gap-1.5">
            <TrialBadge />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <FadeIn>
            <Outlet />
          </FadeIn>
        </main>
      </div>
    </div>
  );
}
