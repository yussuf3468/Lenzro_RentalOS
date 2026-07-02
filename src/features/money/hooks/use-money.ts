import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import * as api from '../api/money.api';

export const moneyKeys = {
  payments: (orgId: string | null) => ['payments', orgId] as const,
  expenses: (orgId: string | null) => ['expenses', orgId] as const,
};

export function usePayments() {
  const { claims } = useAuth();
  return useQuery({
    queryKey: moneyKeys.payments(claims.organizationId),
    queryFn: () => api.fetchPayments(),
    enabled: Boolean(claims.organizationId),
  });
}

export function useExpenses() {
  const { claims } = useAuth();
  return useQuery({
    queryKey: moneyKeys.expenses(claims.organizationId),
    queryFn: () => api.fetchExpenses(),
    enabled: Boolean(claims.organizationId),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['payments'] });
    void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    // The paid-sync trigger changes rentals rows too.
    void queryClient.invalidateQueries({ queryKey: ['rentals'] });
  };
}

export function useCreatePayment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown>) => api.createPayment(row),
    onSuccess: invalidate,
  });
}

export function useDeletePayment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: invalidate,
  });
}

export function useCreateExpense() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown>) => api.createExpense(row),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: invalidate,
  });
}
