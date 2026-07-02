import { useMemo, useState } from 'react';
import { AlertTriangle, Car, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { GlassPanel } from '@/components/os';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssets } from '@/features/assets';
import { toMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { BookingSheet, type BookingPrefill } from '../components/booking-sheet';
import { useRentals } from '../hooks/use-rentals';
import { isOverdue, STATUS_META } from '../lib/rental-meta';
import { type Rental } from '../schemas/rental.schema';

const DAY_MS = 86_400_000;
const DAYS_SHOWN = 14;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function coversDay(rental: Rental, dayStart: Date): boolean {
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);
  return new Date(rental.start_at) < dayEnd && new Date(rental.end_at) > dayStart;
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  const [windowStart, setWindowStart] = useState(() =>
    startOfDay(new Date(Date.now() - 2 * DAY_MS)),
  );
  const [booking, setBooking] = useState<BookingPrefill | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_SHOWN }, (_, i) => new Date(windowStart.getTime() + i * DAY_MS)),
    [windowStart],
  );
  const windowEnd = new Date(windowStart.getTime() + DAYS_SHOWN * DAY_MS);

  const assets = useAssets({});
  const rentals = useRentals({
    statuses: ['reserved', 'checked_out'],
    from: windowStart.toISOString(),
    to: windowEnd.toISOString(),
  });

  const byAsset = useMemo(() => {
    const map = new Map<string, Rental[]>();
    for (const rental of rentals.data ?? []) {
      const list = map.get(rental.asset_id) ?? [];
      list.push(rental);
      map.set(rental.asset_id, list);
    }
    return map;
  }, [rentals.data]);

  const todayStart = startOfDay(new Date(now)).getTime();
  const shift = (daysDelta: number) =>
    setWindowStart((prev) => startOfDay(new Date(prev.getTime() + daysDelta * DAY_MS)));

  const monthLabel = new Intl.DateTimeFormat('en-KE', { month: 'long', year: 'numeric' }).format(
    days[Math.floor(DAYS_SHOWN / 2)],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Every car, every day. Tap an open day to book it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full glass-panel p-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous week"
              className="rounded-full"
              onClick={() => shift(-7)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setWindowStart(startOfDay(new Date(now - 2 * DAY_MS)))}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next week"
              className="rounded-full"
              onClick={() => shift(7)}
            >
              <ChevronRight />
            </Button>
          </div>
          <Button variant="brand" onClick={() => setBooking({})}>
            <Plus /> New booking
          </Button>
        </div>
      </div>

      {assets.isLoading || rentals.isLoading ? (
        <Skeleton className="h-96 rounded-panel" />
      ) : assets.isError || rentals.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the calendar"
          description={toMessage(assets.error ?? rentals.error)}
        />
      ) : (assets.data ?? []).length === 0 ? (
        <EmptyState
          icon={Car}
          title="No cars in your fleet yet"
          description="Add your first vehicle — it becomes a row on this calendar."
          action={
            <Button variant="brand" asChild>
              <Link to="/app/vehicles">
                <Plus /> Add vehicle
              </Link>
            </Button>
          }
        />
      ) : (
        <GlassPanel bodyClassName="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              {/* Header: month + day columns */}
              <div
                className="grid border-b hairline"
                style={{
                  gridTemplateColumns: `minmax(10rem, 12rem) repeat(${DAYS_SHOWN}, minmax(3.4rem, 1fr))`,
                }}
              >
                <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  {monthLabel}
                </div>
                {days.map((day) => {
                  const isToday = day.getTime() === todayStart;
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'flex flex-col items-center py-2 text-[11px]',
                        isToday ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      <span>
                        {new Intl.DateTimeFormat('en-KE', { weekday: 'short' }).format(day)}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 flex size-6 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums',
                          isToday && 'bg-primary/20 text-primary',
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* One row per car */}
              {(assets.data ?? []).map((asset) => {
                const assetRentals = byAsset.get(asset.id) ?? [];
                return (
                  <div
                    key={asset.id}
                    className="grid border-b hairline last:border-0"
                    style={{
                      gridTemplateColumns: `minmax(10rem, 12rem) repeat(${DAYS_SHOWN}, minmax(3.4rem, 1fr))`,
                    }}
                  >
                    <div className="min-w-0 px-4 py-3">
                      <p className="truncate text-sm font-medium">{asset.name}</p>
                      {asset.identifier ? (
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {asset.identifier}
                        </p>
                      ) : null}
                    </div>
                    {days.map((day) => {
                      const rental = assetRentals.find((r) => coversDay(r, day));
                      const isPast = day.getTime() < todayStart;
                      if (!rental) {
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            aria-label={`Book ${asset.name} on ${day.toDateString()}`}
                            onClick={() => setBooking({ assetId: asset.id, start: day })}
                            className={cn(
                              'group relative border-l border-foreground/5 transition-colors hover:bg-primary/10',
                              isPast && 'opacity-50',
                            )}
                          >
                            <Plus className="mx-auto size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                        );
                      }
                      const overdue = isOverdue(rental.status, rental.end_at, now);
                      const startsToday =
                        coversDay(rental, day) &&
                        !coversDay(rental, new Date(day.getTime() - DAY_MS));
                      const endsToday =
                        coversDay(rental, day) &&
                        !coversDay(rental, new Date(day.getTime() + DAY_MS));
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          title={`${rental.customers?.full_name ?? 'Booked'} · ${STATUS_META[rental.status].label}`}
                          aria-label={`${asset.name}: ${rental.customers?.full_name ?? 'booked'}`}
                          onClick={() => navigate('/app/rentals')}
                          className="relative border-l border-foreground/5 py-3"
                        >
                          <span
                            className={cn(
                              'absolute inset-y-3 right-0 left-0 flex items-center overflow-hidden text-[10px] font-medium text-background',
                              overdue ? 'bg-destructive/80' : STATUS_META[rental.status].bar,
                              startsToday && 'ml-1 rounded-l-md',
                              endsToday && 'mr-1 rounded-r-md',
                            )}
                          >
                            {startsToday ? (
                              <span className="truncate px-1.5">
                                {rental.customers?.full_name?.split(' ')[0] ?? ''}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t hairline px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-info/70" /> Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-primary/70" /> Out
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-destructive/80" /> Overdue
            </span>
            <span className="ml-auto hidden sm:inline">Tap an open day to book it</span>
          </div>
        </GlassPanel>
      )}

      <BookingSheet
        open={Boolean(booking)}
        onOpenChange={(open) => !open && setBooking(null)}
        prefill={booking ?? undefined}
      />
    </div>
  );
}
