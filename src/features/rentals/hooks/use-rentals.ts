import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import * as api from '../api/rentals.api';
import { type Rental } from '../schemas/rental.schema';

export const rentalKeys = {
  all: ['rentals'] as const,
  list: (orgId: string | null, filters: api.RentalFilters) => ['rentals', orgId, filters] as const,
};

export function useRentals(filters: api.RentalFilters = {}) {
  const { claims } = useAuth();
  return useQuery({
    queryKey: rentalKeys.list(claims.organizationId, filters),
    queryFn: () => api.fetchRentals(filters),
    enabled: Boolean(claims.organizationId),
  });
}

/** All rentals currently holding a car (the working set for Today + Calendar). */
export function useActiveRentals() {
  return useRentals({ statuses: ['reserved', 'checked_out'] });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['assets'] });
    void queryClient.invalidateQueries({ queryKey: ['payments'] });
  };
}

export function useCreateRental() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      row,
      initialPayment,
    }: {
      row: Record<string, unknown>;
      initialPayment?: api.InitialPayment | null;
    }) => api.createRental(row, initialPayment),
    onSuccess: invalidate,
  });
}

export type RentalAction = 'check_out' | 'return' | 'cancel' | 'no_show';

export function useRentalAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ rental, action }: { rental: Rental; action: RentalAction }) => {
      switch (action) {
        case 'check_out':
          return api.checkOutRental(rental);
        case 'return':
          return api.returnRental(rental);
        case 'cancel':
          return api.cancelRental(rental);
        case 'no_show':
          return api.markNoShow(rental);
      }
    },
    onSuccess: invalidate,
  });
}

export function useSettleRental() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ rental }: { rental: Rental }) => api.settleRental(rental),
    onSuccess: invalidate,
  });
}

export function useExtendRental() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      rental,
      newEndAt,
      newTotalMinor,
    }: {
      rental: Rental;
      newEndAt: string;
      newTotalMinor: number;
    }) => api.extendRental(rental, newEndAt, newTotalMinor),
    onSuccess: invalidate,
  });
}
