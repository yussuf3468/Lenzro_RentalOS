import { useMemo } from 'react';
import { useAssets } from '@/features/assets';
import { useCustomers } from '@/features/customers';

export interface FleetStats {
  total: number;
  available: number;
  onRent: number;
  reserved: number;
  needsService: number;
}

/**
 * Real operational data for the active organization. Pickups / returns / overdue
 * rentals and outstanding invoices join here once the Rentals + Finance modules land.
 */
export function useDashboard() {
  const assets = useAssets({});
  const customers = useCustomers({});

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

  return {
    isLoading: assets.isLoading || customers.isLoading,
    fleet,
    customerCount: customers.data?.length ?? 0,
    recentCustomers: (customers.data ?? []).slice(0, 5),
  };
}
