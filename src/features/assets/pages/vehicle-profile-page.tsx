import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  FileText,
  Pencil,
  Plus,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { GlassPanel, Stat } from '@/components/os';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { useExpenses, usePayments } from '@/features/money';
import { BookingSheet, isOverdue, STATUS_META, useRentals, type Rental } from '@/features/rentals';
import { toMessage } from '@/lib/errors';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { imageUrl } from '../api/assets.api';
import { AssetFormDialog } from '../components/asset-form';
import { AssetStatusBadge } from '../components/asset-status-badge';
import { useAssets, useCategories } from '../hooks/use-assets';

function RentalLine({ rental, now }: { rental: Rental; now: number }) {
  const overdue = isOverdue(rental.status, rental.end_at, now);
  const meta = STATUS_META[rental.status];
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <Link
          to={`/app/customers/${rental.customer_id}`}
          className="truncate text-sm font-medium hover:underline"
        >
          {rental.customers?.full_name ?? 'Customer'}
        </Link>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(rental.start_at)} → {formatDateTime(rental.end_at)}
        </p>
      </div>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {formatMoney(rental.total_amount_minor, rental.currency)}
      </span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-medium',
          overdue ? 'bg-destructive/15 text-destructive' : meta.badge,
        )}
      >
        {overdue ? 'Overdue' : meta.label}
      </span>
    </li>
  );
}

export function VehicleProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { claims } = useAuth();
  const [now] = useState(() => Date.now());
  const [editOpen, setEditOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const assets = useAssets({});
  const categories = useCategories();
  const rentals = useRentals({});
  const payments = usePayments();
  const expenses = useExpenses();

  const asset = assets.data?.find((a) => a.id === id);

  const derived = useMemo(() => {
    const assetRentals = (rentals.data ?? []).filter((r) => r.asset_id === id);
    const active = assetRentals.filter((r) => ['reserved', 'checked_out'].includes(r.status));
    const past = assetRentals.filter((r) =>
      ['returned', 'settled', 'cancelled', 'no_show'].includes(r.status),
    );
    const collected = (payments.data ?? [])
      .filter((p) => p.kind === 'rental_payment' && p.rentals?.asset_id === id)
      .reduce((sum, p) => sum + p.amount_minor, 0);
    const assetExpenses = (expenses.data ?? []).filter((e) => e.asset_id === id);
    const spent = assetExpenses.reduce((sum, e) => sum + e.amount_minor, 0);
    const daysRented = assetRentals
      .filter((r) => ['checked_out', 'returned', 'settled'].includes(r.status))
      .reduce(
        (sum, r) =>
          sum +
          Math.max(
            1,
            Math.ceil((new Date(r.end_at).getTime() - new Date(r.start_at).getTime()) / 86_400_000),
          ),
        0,
      );
    return { active, past, collected, spent, profit: collected - spent, assetExpenses, daysRented };
  }, [rentals.data, payments.data, expenses.data, id]);

  if (assets.isLoading) {
    return (
      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:gap-4 lg:space-y-0">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-panel" />
          <Skeleton className="h-40 rounded-panel" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-panel" />
          <Skeleton className="h-64 rounded-panel" />
        </div>
      </div>
    );
  }
  if (assets.isError || !asset) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't find this vehicle"
        description={assets.isError ? toMessage(assets.error) : 'It may have been removed.'}
        action={
          <Button asChild variant="glass">
            <Link to="/app/vehicles">Back to fleet</Link>
          </Button>
        }
      />
    );
  }

  const photo = imageUrl(asset.primary_image_path);
  const categoryName = categories.data?.find((c) => c.id === asset.category_id)?.name;

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      {/* Left rail — who this car is + what it earns */}
      <div className="space-y-4">
        {/* Identity header — the twin's face */}
        <div className="overflow-hidden rounded-panel glass-panel">
          <div className="flex flex-col">
            <div className="relative aspect-[16/9] w-full shrink-0 bg-white/5">
              {photo ? (
                <img src={photo} alt={asset.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full min-h-40 items-center justify-center text-muted-foreground/40">
                  <Car className="size-12" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon" aria-label="Back to fleet">
                      <Link to="/app/vehicles">
                        <ArrowLeft />
                      </Link>
                    </Button>
                    <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                      {asset.name}
                    </h1>
                  </div>
                  <p className="mt-0.5 ml-11 text-sm text-muted-foreground">
                    {asset.identifier ?? 'No plate'}
                    {categoryName ? ` · ${categoryName}` : ''} ·{' '}
                    <span className="font-mono tabular-nums">
                      {formatMoney(asset.daily_rate_amount_minor, asset.currency)}
                    </span>
                    /day
                  </p>
                </div>
                <AssetStatusBadge status={asset.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="brand" size="sm" onClick={() => setBookingOpen(true)}>
                  <Plus /> Book this car
                </Button>
                <Button variant="glass" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil /> Edit details
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings — is this car worth keeping? */}
        <GlassPanel
          eyebrow="Earnings"
          title="Is this car making money?"
          bodyClassName="grid grid-cols-2 gap-x-4 gap-y-5"
        >
          <Stat label="Collected" value={formatMoney(derived.collected)} accent="text-success" />
          <Stat label="Expenses" value={formatMoney(derived.spent)} />
          <Stat
            label="Profit"
            value={formatMoney(derived.profit)}
            accent={derived.profit >= 0 ? 'text-success' : 'text-destructive'}
          />
          <Stat label="Days rented" value={derived.daysRented} icon={Wallet} />
        </GlassPanel>
      </div>

      {/* Right — the car's life: schedule, costs, history */}
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {/* Bookings — the car's future and present */}
          <GlassPanel
            eyebrow="Schedule"
            title="Active & upcoming"
            action={
              <Link to="/app/calendar" className="text-xs font-medium text-primary hover:underline">
                Calendar
              </Link>
            }
          >
            {derived.active.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing booked.{' '}
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="font-medium text-primary hover:underline"
                >
                  Book it now →
                </button>
              </p>
            ) : (
              <ul className="divide-y divide-white/8">
                {derived.active.map((rental) => (
                  <RentalLine key={rental.id} rental={rental} now={now} />
                ))}
              </ul>
            )}
          </GlassPanel>

          {/* Running costs */}
          <GlassPanel
            eyebrow="Running costs"
            title="Maintenance & expenses"
            action={
              <Link to="/app/money" className="text-xs font-medium text-primary hover:underline">
                Money
              </Link>
            }
          >
            {derived.assetExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expenses recorded for this car yet.
              </p>
            ) : (
              <ul className="divide-y divide-white/8">
                {derived.assetExpenses.slice(0, 6).map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted-foreground">
                      <Wrench className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm capitalize">{expense.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(expense.incurred_at)}
                        {expense.notes ? ` · ${expense.notes}` : ''}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      −{formatMoney(expense.amount_minor, expense.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>
        </div>

        {/* History — every rental this car has lived */}
        <GlassPanel eyebrow="History" title="Past rentals">
          {derived.past.length === 0 ? (
            <p className="text-sm text-muted-foreground">This car hasn't completed a rental yet.</p>
          ) : (
            <ul className="divide-y divide-white/8">
              {derived.past.slice(0, 10).map((rental) => (
                <li
                  key={rental.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/app/customers/${rental.customer_id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {rental.customers?.full_name ?? 'Customer'}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(rental.start_at)} → {formatDate(rental.end_at)}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatMoney(rental.total_amount_minor, rental.currency)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      STATUS_META[rental.status].badge,
                    )}
                  >
                    {STATUS_META[rental.status].label}
                  </span>
                  <Link
                    to={`/app/rentals/${rental.id}/contract`}
                    aria-label="Contract"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <FileText className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      <AssetFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        asset={asset}
        categories={categories.data ?? []}
        organizationId={claims.organizationId}
      />
      <BookingSheet
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        prefill={{ assetId: asset.id }}
      />
    </div>
  );
}
