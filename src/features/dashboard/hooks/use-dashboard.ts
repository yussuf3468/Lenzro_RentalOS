import { useMemo, useState } from 'react';
import { useAssets } from '@/features/assets';
import { useCustomers, type Customer } from '@/features/customers';
import { isOverdue, outstandingMinor, useRentals, type Rental } from '@/features/rentals';

export interface FleetStats {
  total: number;
  available: number;
  onRent: number;
  reserved: number;
  needsService: number;
}

export interface TodayOps {
  /** Reserved rentals starting today — cars to prepare and hand over. */
  pickups: Rental[];
  /** Checked-out rentals due back today (not yet late). */
  returns: Rental[];
  /** Checked-out rentals past their return time — act now. */
  overdue: Rental[];
}

export interface DashboardData {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  fleet: FleetStats;
  utilization: number;
  readiness: number;
  ops: TodayOps;
  /** Rental fees not yet collected across open rentals (minor units). */
  moneyDueMinor: number;
  moneyDueCount: number;
  customerCount: number;
  recentCustomers: Customer[];
}

/** Real operational data for the active organization — the Today command centre. */
export function useDashboard(): DashboardData {
  const [now] = useState(() => Date.now());
  const assets = useAssets({});
  const customers = useCustomers({});
  const rentals = useRentals({ statuses: ['reserved', 'checked_out', 'returned'] });

  const fleet = useMemo<FleetStats>(() => {
    const list = assets.data ?? [];
    const count = (status: string) => list.filter((asset) => asset.status === status).length;
    return {
      total: list.length,
      available: count('available'),
      onRent: count('rented'),
      reserved: count('reserved'),
      needsService: count('maintenance') + count('out_of_service'),
    };
  }, [assets.data]);

  const { ops, moneyDueMinor, moneyDueCount } = useMemo(() => {
    const list = rentals.data ?? [];
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);
    const within = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    };

    const overdue = list.filter((r) => isOverdue(r.status, r.end_at, now));
    const pickups = list.filter((r) => r.status === 'reserved' && new Date(r.start_at) <= dayEnd);
    const returns = list.filter(
      (r) => r.status === 'checked_out' && within(r.end_at) && !isOverdue(r.status, r.end_at, now),
    );

    const open = list.filter((r) =>
      r.status === 'checked_out' || r.status === 'returned'
        ? true
        : r.status === 'reserved' && new Date(r.start_at) <= dayEnd,
    );
    const owed = open
      .map((r) => outstandingMinor(r.total_amount_minor, r.paid_amount_minor))
      .filter((v) => v > 0);

    return {
      ops: { pickups, returns, overdue },
      moneyDueMinor: owed.reduce((sum, v) => sum + v, 0),
      moneyDueCount: owed.length,
    };
  }, [rentals.data, now]);

  const utilization = fleet.total > 0 ? Math.round((fleet.onRent / fleet.total) * 100) : 0;
  const readiness =
    fleet.total > 0 ? Math.round(((fleet.total - fleet.needsService) / fleet.total) * 100) : 0;

  return {
    isLoading: assets.isLoading || customers.isLoading || rentals.isLoading,
    isError: assets.isError || customers.isError || rentals.isError,
    error: assets.error ?? customers.error ?? rentals.error,
    refetch: () => {
      void assets.refetch();
      void customers.refetch();
      void rentals.refetch();
    },
    fleet,
    utilization,
    readiness,
    ops,
    moneyDueMinor,
    moneyDueCount,
    customerCount: customers.data?.length ?? 0,
    recentCustomers: (customers.data ?? []).slice(0, 5),
  };
}
