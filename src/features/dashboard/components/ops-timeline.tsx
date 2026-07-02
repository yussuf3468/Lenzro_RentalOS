import { ArrowDownLeft, ArrowUpRight, CalendarClock, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '@/components/os';
import { hoursLate, type Rental } from '@/features/rentals';
import { cn } from '@/lib/utils';
import { type TodayOps } from '../hooks/use-dashboard';

function timeOf(iso: string): string {
  return new Intl.DateTimeFormat('en-KE', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

function OpsRow({
  rental,
  kind,
  now,
}: {
  rental: Rental;
  kind: 'pickup' | 'return' | 'overdue';
  now: number;
}) {
  const tone =
    kind === 'overdue'
      ? 'bg-destructive/15 text-destructive'
      : kind === 'pickup'
        ? 'bg-info/15 text-info'
        : 'bg-success/15 text-success';
  const Icon = kind === 'pickup' ? ArrowUpRight : ArrowDownLeft;
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {rental.customers?.full_name ?? 'Customer'}
          <span className="text-muted-foreground"> · {rental.assets?.name ?? 'Car'}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {kind === 'pickup' ? `Pickup ${timeOf(rental.start_at)}` : null}
          {kind === 'return' ? `Due back ${timeOf(rental.end_at)}` : null}
          {kind === 'overdue' ? (
            <span className="font-medium text-destructive">
              {hoursLate(rental.end_at, now)}h late — call them
            </span>
          ) : null}
        </p>
      </div>
      {rental.customers?.phone ? (
        <a
          href={`tel:${rental.customers.phone}`}
          aria-label={`Call ${rental.customers.full_name}`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Phone className="size-4" />
        </a>
      ) : null}
    </li>
  );
}

export function OpsTimeline({ ops, now }: { ops: TodayOps; now: number }) {
  const total = ops.overdue.length + ops.pickups.length + ops.returns.length;
  return (
    <GlassPanel
      className="h-full"
      eyebrow="Today"
      title="Pickups & returns"
      action={
        <Link to="/app/rentals" className="text-xs font-medium text-primary hover:underline">
          All rentals
        </Link>
      }
    >
      {total === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-foreground/5 text-muted-foreground">
            <CalendarClock className="size-6" />
          </span>
          <p className="text-sm font-medium">Nothing scheduled today</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            New bookings, pickups, returns and overdue rentals show up here, in time order.
          </p>
          <Link
            to="/app/rentals?new=1"
            className="text-xs font-medium text-primary hover:underline"
          >
            Create a booking →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {ops.overdue.map((rental) => (
            <OpsRow key={rental.id} rental={rental} kind="overdue" now={now} />
          ))}
          {ops.pickups.map((rental) => (
            <OpsRow key={rental.id} rental={rental} kind="pickup" now={now} />
          ))}
          {ops.returns.map((rental) => (
            <OpsRow key={rental.id} rental={rental} kind="return" now={now} />
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
