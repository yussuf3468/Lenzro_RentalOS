import { CalendarDays, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { type FleetStats, type TodayOps } from '../hooks/use-dashboard';

interface TodayStripProps {
  greeting: string;
  dateLabel: string;
  fleet: FleetStats;
  ops: TodayOps;
}

function summarise(fleet: FleetStats, ops: TodayOps): string {
  if (fleet.total === 0) {
    return "Let's get your fleet set up — add your first vehicle to start renting.";
  }
  const parts: string[] = [];
  if (ops.overdue.length > 0) {
    parts.push(`${ops.overdue.length} overdue return${ops.overdue.length > 1 ? 's' : ''}`);
  }
  if (ops.pickups.length > 0)
    parts.push(`${ops.pickups.length} pickup${ops.pickups.length > 1 ? 's' : ''}`);
  if (ops.returns.length > 0)
    parts.push(`${ops.returns.length} return${ops.returns.length > 1 ? 's' : ''} due`);
  if (parts.length === 0) {
    return `Quiet day so far — ${fleet.available} available, ${fleet.onRent} on rent.`;
  }
  return `Today: ${parts.join('  ·  ')}.`;
}

export function TodayStrip({ greeting, dateLabel, fleet, ops }: TodayStripProps) {
  return (
    <div className="relative h-full overflow-hidden rounded-panel glass-panel p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgb(var(--os-glow-a) / 0.07), transparent 65%)',
        }}
      />
      <p className="text-sm text-muted-foreground">{dateLabel}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
        {summarise(fleet, ops)}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="brand">
          <Link to="/app/rentals?new=1">
            <Plus /> New booking
          </Link>
        </Button>
        {fleet.total === 0 ? (
          <Button asChild variant="glass">
            <Link to="/app/vehicles">Add vehicle</Link>
          </Button>
        ) : (
          <Button asChild variant="glass">
            <Link to="/app/calendar">
              <CalendarDays /> Open calendar
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
