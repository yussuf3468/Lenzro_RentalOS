import { z } from 'zod';
import { ASSET_STATUSES, type AssetStatus } from '../lib/asset-meta';

// ---------------------------------------------------------------------------
// Row schemas — validate Supabase responses at the boundary.
// ---------------------------------------------------------------------------
export const assetCategorySchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  asset_kind: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  description: z.string().nullable(),
  default_daily_rate_amount_minor: z.number(),
  currency: z.string(),
});
export type AssetCategory = z.infer<typeof assetCategorySchema>;

export const assetSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  category_id: z.string().nullable(),
  asset_kind: z.string(),
  name: z.string(),
  identifier: z.string().nullable(),
  status: z.string(),
  attributes: z.record(z.string(), z.unknown()),
  daily_rate_amount_minor: z.number(),
  currency: z.string(),
  color: z.string().nullable(),
  year: z.number().nullable(),
  odometer: z.number().nullable(),
  notes: z.string().nullable(),
  primary_image_path: z.string().nullable(),
  created_at: z.string(),
});
export type Asset = z.infer<typeof assetSchema>;

export const assetImageSchema = z.object({
  id: z.string(),
  asset_id: z.string(),
  path: z.string(),
  sort: z.number(),
});
export type AssetImage = z.infer<typeof assetImageSchema>;

// ---------------------------------------------------------------------------
// Form schemas — all fields are strings (what inputs hold); converted on submit.
// ---------------------------------------------------------------------------
export const assetFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  category_id: z.string(),
  identifier: z.string(),
  status: z.enum(ASSET_STATUSES),
  daily_rate: z.string().refine((v) => v !== '' && Number(v) >= 0, 'Enter a valid daily rate'),
  make: z.string(),
  model: z.string(),
  transmission: z.string(),
  fuel: z.string(),
  seats: z.string(),
  year: z.string(),
  color: z.string(),
  odometer: z.string(),
  notes: z.string(),
});
export type AssetFormInput = z.infer<typeof assetFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  default_daily_rate: z.string().refine((v) => v === '' || Number(v) >= 0, 'Enter a valid rate'),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function toNullableInt(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}
function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function assetFormToRow(input: AssetFormInput) {
  return {
    name: input.name.trim(),
    category_id: input.category_id || null,
    identifier: input.identifier.trim() || null,
    status: input.status,
    asset_kind: 'vehicle',
    daily_rate_amount_minor: Math.round(Number(input.daily_rate) * 100),
    color: input.color.trim() || null,
    year: toNullableInt(input.year),
    odometer: toNullableInt(input.odometer),
    notes: input.notes.trim() || null,
    attributes: {
      make: input.make.trim() || null,
      model: input.model.trim() || null,
      transmission: input.transmission || null,
      fuel: input.fuel || null,
      seats: toNullableInt(input.seats),
    },
  };
}

export function assetToFormDefaults(asset?: Asset): AssetFormInput {
  const attributes = asset?.attributes ?? {};
  return {
    name: asset?.name ?? '',
    category_id: asset?.category_id ?? '',
    identifier: asset?.identifier ?? '',
    status: (asset?.status as AssetStatus) ?? 'available',
    daily_rate: asset ? String(asset.daily_rate_amount_minor / 100) : '',
    make: str(attributes.make),
    model: str(attributes.model),
    transmission: str(attributes.transmission),
    fuel: str(attributes.fuel),
    seats: attributes.seats != null ? String(attributes.seats) : '',
    year: asset?.year != null ? String(asset.year) : '',
    color: asset?.color ?? '',
    odometer: asset?.odometer != null ? String(asset.odometer) : '',
    notes: asset?.notes ?? '',
  };
}

export function categoryFormToRow(input: CategoryFormInput) {
  return {
    name: input.name.trim(),
    default_daily_rate_amount_minor: Math.round(Number(input.default_daily_rate || 0) * 100),
    asset_kind: 'vehicle',
  };
}
