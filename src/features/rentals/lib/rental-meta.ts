/** Rental lifecycle metadata + derived business math (days, totals, balances). */

export const RENTAL_STATUSES = [
  'quote',
  'reserved',
  'checked_out',
  'returned',
  'settled',
  'cancelled',
  'no_show',
] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const STATUS_META: Record<RentalStatus, { label: string; badge: string; bar: string }> = {
  quote: {
    label: 'Quote',
    badge: 'bg-muted text-muted-foreground',
    bar: 'bg-muted-foreground/40',
  },
  reserved: { label: 'Reserved', badge: 'bg-info/15 text-info', bar: 'bg-info/70' },
  checked_out: { label: 'Out', badge: 'bg-primary/15 text-primary', bar: 'bg-primary/70' },
  returned: { label: 'Returned', badge: 'bg-success/15 text-success', bar: 'bg-success/60' },
  settled: { label: 'Settled', badge: 'bg-muted text-muted-foreground', bar: 'bg-muted' },
  cancelled: { label: 'Cancelled', badge: 'bg-muted text-muted-foreground', bar: 'bg-muted' },
  no_show: { label: 'No show', badge: 'bg-warning/15 text-warning', bar: 'bg-warning/50' },
};

const DAY_MS = 86_400_000;

/** Chargeable days for a window — any started day counts, minimum one. */
export function rentalDays(startAt: string | Date, endAt: string | Date): number {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

export function computeTotalMinor(
  dailyRateMinor: number,
  startAt: string | Date,
  endAt: string | Date,
): number {
  return dailyRateMinor * rentalDays(startAt, endAt);
}

export function isOverdue(status: RentalStatus, endAt: string, now: number): boolean {
  return status === 'checked_out' && new Date(endAt).getTime() < now;
}

export function hoursLate(endAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(endAt).getTime()) / 3_600_000));
}

/** Rental fee still owed (deposit is tracked separately as refundable). */
export function outstandingMinor(totalMinor: number, paidMinor: number): number {
  return Math.max(0, totalMinor - paidMinor);
}

/** Format a Date for a datetime-local input (local time, minute precision). */
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
