import { CalendarDays, Car, KeyRound, UserPlus, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '@/components/os';

const ACTIONS: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'New booking', to: '/app/rentals?new=1', icon: KeyRound },
  { label: 'Open calendar', to: '/app/calendar', icon: CalendarDays },
  { label: 'Add a vehicle', to: '/app/vehicles', icon: Car },
  { label: 'Add a customer', to: '/app/customers', icon: UserPlus },
];

export function QuickCommands() {
  return (
    <GlassPanel className="h-full" eyebrow="Shortcuts" title="Quick actions">
      <div className="grid gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-3 rounded-xl border border-foreground/8 bg-foreground/[0.03] p-3 text-sm transition-colors hover:border-primary/40 hover:bg-foreground/[0.06]"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
                <Icon className="size-4" />
              </span>
              {action.label}
            </Link>
          );
        })}
      </div>
    </GlassPanel>
  );
}
