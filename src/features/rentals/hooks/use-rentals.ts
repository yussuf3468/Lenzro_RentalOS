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

export function useRental(id: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'detail', id],
    queryFn: () => api.fetchRental(id!),
    enabled: Boolean(id),
  });
}

export function useRentalPhotos(rentalId: string | undefined) {
  return useQuery({
    queryKey: ['rental-photos', rentalId],
    queryFn: () => api.fetchRentalPhotos(rentalId!),
    enabled: Boolean(rentalId),
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
    void queryClient.invalidateQueries({ queryKey: ['rental-photos'] });
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
    mutationFn: ({
      rental,
      action,
      checkOutData,
      returnData,
    }: {
      rental: Rental;
      action: RentalAction;
      checkOutData?: api.CheckOutData;
      returnData?: api.ReturnData;
    }) => {
      switch (action) {
        case 'check_out':
          return api.checkOutRental(rental, checkOutData);
        case 'return':
          return api.returnRental(rental, returnData);
        case 'cancel':
          return api.cancelRental(rental);
        case 'no_show':
          return api.markNoShow(rental);
      }
    },
    onSuccess: invalidate,
  });
}

export function useUploadRentalPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      rentalId,
      phase,
      slot,
      file,
    }: {
      organizationId: string;
      rentalId: string;
      phase: 'checkout' | 'return';
      slot: string;
      file: File | Blob;
    }) => api.uploadRentalPhoto(organizationId, rentalId, phase, slot, file),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['rental-photos', vars.rentalId] });
    },
  });
}

export function useDeleteRentalPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: Parameters<typeof api.deleteRentalPhoto>[0]) =>
      api.deleteRentalPhoto(photo),
    onSuccess: (_data, photo) => {
      void queryClient.invalidateQueries({ queryKey: ['rental-photos', photo.rental_id] });
    },
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
