import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, FileText, KeyRound, Phone, Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { GlassPanel } from '@/components/os';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toMessage } from '@/lib/errors';
import { formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { RecordPaymentDialog } from '@/features/money';
import { BookingSheet } from '../components/booking-sheet';
import { ExtendDialog, SettleDialog } from '../components/rental-dialogs';
import { useRentalAction, useRentals } from '../hooks/use-rentals';
import { hoursLate, isOverdue, outstandingMinor, STATUS_META } from '../lib/rental-meta';
import { type Rental } from '../schemas/rental.schema';

function RentalRow({ rental, now, actions }: { rental: Rental; now: number; actions?: ReactNode }) {
  const overdue = isOverdue(rental.status, rental.end_at, now);
  const owed = outstandingMinor(rental.total_amount_minor, rental.paid_amount_minor);
  const meta = STATUS_META[rental.status];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <Link to={`/app/customers/${rental.customer_id}`} className="hover:underline">
            {rental.customers?.full_name ?? 'Customer'}
          </Link>
          <span className="text-muted-foreground">
            {' · '}
            <Link to={`/app/vehicles/${rental.asset_id}`} className="hover:underline">
              {rental.assets?.name ?? 'Car'}
            </Link>
          </span>
          {rental.assets?.identifier ? (
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {rental.assets.identifier}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(rental.start_at)} → {formatDateTime(rental.end_at)}
          {overdue ? (
            <span className="ml-2 font-medium text-destructive">
              {hoursLate(rental.end_at, now)}h late
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {owed > 0 ? (
          <span className="font-mono text-xs text-warning tabular-nums">
            {formatMoney(owed, rental.currency)} due
          </span>
        ) : null}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium',
            overdue ? 'bg-destructive/15 text-destructive' : meta.badge,
          )}
        >
          {overdue ? 'Overdue' : meta.label}
        </span>
        {rental.customers?.phone ? (
          <a
            href={`tel:${rental.customers.phone}`}
            aria-label={`Call ${rental.customers.full_name}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="size-4" />
          </a>
        ) : null}
        {actions}
      </div>
    </li>
  );
}

function Section({
  title,
  eyebrow,
  accent,
  children,
}: {
  title: string;
  eyebrow: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <GlassPanel eyebrow={eyebrow} title={title} variant={accent ? 'accent' : 'panel'}>
      <ul className="divide-y divide-white/8">{children}</ul>
    </GlassPanel>
  );
}

export function RentalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookingOpen, setBookingOpen] = useState(() => searchParams.get('new') === '1');
  const [extending, setExtending] = useState<Rental | null>(null);
  const [settling, setSettling] = useState<Rental | null>(null);
  const [paying, setPaying] = useState<Rental | null>(null);
  const [now] = useState(() => Date.now());
  const rentals = useRentals({});
  const act = useRentalAction();

  const openBooking = () => setBookingOpen(true);
  const closeBooking = (open: boolean) => {
    setBookingOpen(open);
    if (!open && searchParams.get('new')) setSearchParams({}, { replace: true });
  };

  // Arriving from the return flow (?settle=<id>) opens the settle dialog directly.
  const settleParam = searchParams.get('settle');
  const settleTarget =
    settling ?? (settleParam ? (rentals.data?.find((r) => r.id === settleParam) ?? null) : null);
  const closeSettle = (open: boolean) => {
    if (open) return;
    setSettling(null);
    if (settleParam) setSearchParams({}, { replace: true });
  };

  const groups = useMemo(() => {
    const list = rentals.data ?? [];
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return {
      overdue: list.filter((r) => isOverdue(r.status, r.end_at, now)),
      out: list.filter((r) => r.status === 'checked_out' && !isOverdue(r.status, r.end_at, now)),
      pickups: list.filter((r) => r.status === 'reserved' && new Date(r.start_at) <= endOfToday),
      upcoming: list.filter((r) => r.status === 'reserved' && new Date(r.start_at) > endOfToday),
      settlement: list.filter((r) => r.status === 'returned'),
      history: list
        .filter((r) => ['settled', 'cancelled', 'no_show'].includes(r.status))
        .slice(0, 10),
    };
  }, [rentals.data, now]);

  // Cancel / no-show stay one-tap; checkout & return go through the guided flows.
  const run = (rental: Rental, action: 'cancel' | 'no_show') => {
    if (action === 'cancel' && !window.confirm('Cancel this booking?')) return;
    if (action === 'no_show' && !window.confirm('Mark this booking as a no-show?')) return;
    act.mutate(
      { rental, action },
      {
        onSuccess: () =>
          toast.success(action === 'cancel' ? 'Booking cancelled' : 'Marked as no-show'),
        onError: (error) => toast.error(toMessage(error)),
      },
    );
  };

  const contractLink = (rental: Rental) => (
    <Button
      asChild
      size="sm"
      variant="ghost"
      aria-label="Contract"
      className="text-muted-foreground"
    >
      <Link to={`/app/rentals/${rental.id}/contract`}>
        <FileText />
      </Link>
    </Button>
  );

  const isEmpty = (rentals.data ?? []).length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rentals</h1>
          <p className="text-sm text-muted-foreground">
            Every booking, from reservation to settled.
          </p>
        </div>
        <Button variant="brand" onClick={openBooking}>
          <Plus /> New booking
        </Button>
      </div>

      {rentals.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-panel" />
          <Skeleton className="h-40 rounded-panel" />
        </div>
      ) : rentals.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load rentals"
          description={toMessage(rentals.error)}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={KeyRound}
          title="No rentals yet"
          description="Create your first booking — pick a car, a customer and the dates."
          action={
            <Button variant="brand" onClick={openBooking}>
              <Plus /> New booking
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.overdue.length > 0 ? (
            <Section eyebrow="Act now" title="Overdue returns" accent>
              {groups.overdue.map((rental) => (
                <RentalRow
                  key={rental.id}
                  rental={rental}
                  now={now}
                  actions={
                    <div className="flex gap-1.5">
                      {contractLink(rental)}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => setPaying(rental)}
                      >
                        Payment
                      </Button>
                      <Button size="sm" variant="glass" onClick={() => setExtending(rental)}>
                        Extend
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/app/rentals/${rental.id}/return`)}
                      >
                        Return
                      </Button>
                    </div>
                  }
                />
              ))}
            </Section>
          ) : null}

          {groups.out.length > 0 ? (
            <Section eyebrow="On the road" title="Out now">
              {groups.out.map((rental) => (
                <RentalRow
                  key={rental.id}
                  rental={rental}
                  now={now}
                  actions={
                    <div className="flex gap-1.5">
                      {contractLink(rental)}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => setPaying(rental)}
                      >
                        Payment
                      </Button>
                      <Button size="sm" variant="glass" onClick={() => setExtending(rental)}>
                        Extend
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/app/rentals/${rental.id}/return`)}
                      >
                        Return
                      </Button>
                    </div>
                  }
                />
              ))}
            </Section>
          ) : null}

          {groups.pickups.length > 0 ? (
            <Section eyebrow="Today" title="Ready for pickup">
              {groups.pickups.map((rental) => (
                <RentalRow
                  key={rental.id}
                  rental={rental}
                  now={now}
                  actions={
                    <div className="flex gap-1.5">
                      {contractLink(rental)}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => run(rental, 'no_show')}
                      >
                        No show
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => setPaying(rental)}
                      >
                        Payment
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/app/rentals/${rental.id}/checkout`)}
                      >
                        <KeyRound /> Check out
                      </Button>
                    </div>
                  }
                />
              ))}
            </Section>
          ) : null}

          {groups.upcoming.length > 0 ? (
            <Section eyebrow="Booked ahead" title="Upcoming">
              {groups.upcoming.map((rental) => (
                <RentalRow
                  key={rental.id}
                  rental={rental}
                  now={now}
                  actions={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => run(rental, 'cancel')}
                    >
                      Cancel
                    </Button>
                  }
                />
              ))}
            </Section>
          ) : null}

          {groups.settlement.length > 0 ? (
            <Section eyebrow="Money" title="Awaiting settlement">
              {groups.settlement.map((rental) => (
                <RentalRow
                  key={rental.id}
                  rental={rental}
                  now={now}
                  actions={
                    <Button size="sm" onClick={() => setSettling(rental)}>
                      Settle
                    </Button>
                  }
                />
              ))}
            </Section>
          ) : null}

          {groups.history.length > 0 ? (
            <Section eyebrow="Done" title="Recent history">
              {groups.history.map((rental) => (
                <RentalRow key={rental.id} rental={rental} now={now} />
              ))}
            </Section>
          ) : null}
        </div>
      )}

      <BookingSheet open={bookingOpen} onOpenChange={closeBooking} />
      <ExtendDialog rental={extending} onOpenChange={(open) => !open && setExtending(null)} />
      <SettleDialog rental={settleTarget} onOpenChange={closeSettle} />
      <RecordPaymentDialog rental={paying} onOpenChange={(open) => !open && setPaying(null)} />
    </div>
  );
}
