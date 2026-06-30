import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import * as api from '../api/customers.api';

export const customerKeys = {
  all: ['customers'] as const,
  list: (orgId: string | null, filters: api.CustomerFilters) =>
    ['customers', orgId, filters] as const,
};

export function useCustomers(filters: api.CustomerFilters) {
  const { claims } = useAuth();
  return useQuery({
    queryKey: customerKeys.list(claims.organizationId, filters),
    queryFn: () => api.fetchCustomers(filters),
    enabled: Boolean(claims.organizationId),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: customerKeys.all });
}

export function useCreateCustomer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown>) => api.createCustomer(row),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, row }: { id: string; row: Record<string, unknown> }) =>
      api.updateCustomer(id, row),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deleteCustomer(id),
    onSuccess: invalidate,
  });
}
