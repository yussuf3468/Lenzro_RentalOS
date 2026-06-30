import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  assetCategorySchema,
  assetImageSchema,
  assetSchema,
  type Asset,
  type AssetCategory,
  type AssetImage,
} from '../schemas/asset.schema';

const ASSET_COLUMNS =
  'id,organization_id,category_id,asset_kind,name,identifier,status,attributes,daily_rate_amount_minor,currency,color,year,odometer,notes,primary_image_path,created_at';
const CATEGORY_COLUMNS =
  'id,organization_id,asset_kind,name,code,description,default_daily_rate_amount_minor,currency';
const BUCKET = 'asset-images';

export interface AssetFilters {
  search?: string;
  status?: string;
  categoryId?: string;
}

export async function fetchAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  let query = getSupabaseClient()
    .from('assets')
    .select(ASSET_COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.search) {
    const term = filters.search.replace(/[,()%]/g, ' ').trim();
    if (term) query = query.or(`name.ilike.%${term}%,identifier.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return z.array(assetSchema).parse(data);
}

export async function createAsset(row: Record<string, unknown>): Promise<Asset> {
  const { data, error } = await getSupabaseClient()
    .from('assets')
    .insert(row)
    .select(ASSET_COLUMNS)
    .single();
  if (error) throw error;
  return assetSchema.parse(data);
}

export async function updateAsset(id: string, row: Record<string, unknown>): Promise<Asset> {
  const { data, error } = await getSupabaseClient()
    .from('assets')
    .update(row)
    .eq('id', id)
    .select(ASSET_COLUMNS)
    .single();
  if (error) throw error;
  return assetSchema.parse(data);
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function setPrimaryImage(assetId: string, path: string | null): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('assets')
    .update({ primary_image_path: path })
    .eq('id', assetId);
  if (error) throw error;
}

// --- Categories ---------------------------------------------------------------
export async function fetchCategories(): Promise<AssetCategory[]> {
  const { data, error } = await getSupabaseClient()
    .from('asset_categories')
    .select(CATEGORY_COLUMNS)
    .is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return z.array(assetCategorySchema).parse(data);
}

export async function createCategory(row: Record<string, unknown>): Promise<AssetCategory> {
  const { data, error } = await getSupabaseClient()
    .from('asset_categories')
    .insert(row)
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) throw error;
  return assetCategorySchema.parse(data);
}

export async function updateCategory(
  id: string,
  row: Record<string, unknown>,
): Promise<AssetCategory> {
  const { data, error } = await getSupabaseClient()
    .from('asset_categories')
    .update(row)
    .eq('id', id)
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) throw error;
  return assetCategorySchema.parse(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('asset_categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// --- Images -------------------------------------------------------------------
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return getSupabaseClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function fetchAssetImages(assetId: string): Promise<AssetImage[]> {
  const { data, error } = await getSupabaseClient()
    .from('asset_images')
    .select('id,asset_id,path,sort')
    .eq('asset_id', assetId)
    .order('sort');
  if (error) throw error;
  return z.array(assetImageSchema).parse(data);
}

export async function uploadAssetImage(organizationId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${organizationId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabaseClient()
    .storage.from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function addAssetImage(
  assetId: string,
  path: string,
  sort: number,
): Promise<AssetImage> {
  const { data, error } = await getSupabaseClient()
    .from('asset_images')
    .insert({ asset_id: assetId, path, sort })
    .select('id,asset_id,path,sort')
    .single();
  if (error) throw error;
  return assetImageSchema.parse(data);
}

export async function removeAssetImage(image: AssetImage): Promise<void> {
  await getSupabaseClient().storage.from(BUCKET).remove([image.path]);
  const { error } = await getSupabaseClient().from('asset_images').delete().eq('id', image.id);
  if (error) throw error;
}
