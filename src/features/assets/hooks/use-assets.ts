import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import * as api from '../api/assets.api';

export const assetKeys = {
  assets: ['assets'] as const,
  list: (orgId: string | null, filters: api.AssetFilters) => ['assets', orgId, filters] as const,
  categories: (orgId: string | null) => ['asset-categories', orgId] as const,
};

export function useAssets(filters: api.AssetFilters) {
  const { claims } = useAuth();
  return useQuery({
    queryKey: assetKeys.list(claims.organizationId, filters),
    queryFn: () => api.fetchAssets(filters),
    enabled: Boolean(claims.organizationId),
  });
}

export function useCategories() {
  const { claims } = useAuth();
  return useQuery({
    queryKey: assetKeys.categories(claims.organizationId),
    queryFn: () => api.fetchCategories(),
    enabled: Boolean(claims.organizationId),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: assetKeys.assets });
    void queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
  };
}

export function useCreateAsset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown>) => api.createAsset(row),
    onSuccess: invalidate,
  });
}

export function useUpdateAsset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, row }: { id: string; row: Record<string, unknown> }) =>
      api.updateAsset(id, row),
    onSuccess: invalidate,
  });
}

export function useDeleteAsset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deleteAsset(id),
    onSuccess: invalidate,
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: Record<string, unknown>) => api.createCategory(row),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, row }: { id: string; row: Record<string, unknown> }) =>
      api.updateCategory(id, row),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: invalidate,
  });
}
