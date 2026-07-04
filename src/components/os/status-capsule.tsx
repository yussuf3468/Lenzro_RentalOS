import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrgSwitcher, UserMenu, useActiveSubscription } from '@/features/organizations';

function TrialBadge() {
  const { data: subscription } = useActiveSubscription();
  // Capture "now" once at mount — a days-left badge needn't tick mid-session.
  const [now] = useState(() => Date.now());
  if (!subscription || subscription.status !== 'trialing' || !subscription.trial_end) return null;
  const days = Math.max(
    0,
    Math.ceil((new Date(subscription.trial_end).getTime() - now) / 86_400_000),
  );
  return (
    <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
      <span className="size-1.5 rounded-full bg-gradient-brand" />
      Trial · {days} {days === 1 ? 'day' : 'days'} left
    </span>
  );
}

/** Floating top chrome — org switcher (left) and controls (right) as glass pills. */
export function StatusCapsule({ onOpenCommand }: { onOpenCommand: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-2 p-3 sm:p-4 print:hidden">
      <div className="pointer-events-auto flex items-center rounded-full glass-panel p-1">
        <OrgSwitcher />
      </div>
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full glass-panel p-1">
        <TrialBadge />
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCommand}
          className="gap-2 rounded-full text-muted-foreground"
          aria-label="Open command palette"
        >
          <Search />
          <span className="hidden lg:inline">Search…</span>
          <kbd className="ml-1 hidden rounded border bg-muted px-1.5 font-mono text-[10px] lg:inline">
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
          <Bell />
        </Button>
        <UserMenu />
      </div>
    </div>
  );
}
