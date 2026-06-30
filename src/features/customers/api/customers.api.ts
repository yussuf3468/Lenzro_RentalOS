import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import { customerSchema, type Customer } from '../schemas/customer.schema';

const COLUMNS =
  'id,organization_id,type,full_name,company_name,email,phone,id_number,license_number,license_expiry,kra_pin,date_of_birth,address,city,country,status,notes,id_front_path,id_back_path,license_path,kra_pin_path,created_at';
const BUCKET = 'customer-documents';

const DOC_FIELD = {
  id_front: 'id_front_path',
  id_back: 'id_back_path',
  license: 'license_path',
  kra_pin: 'kra_pin_path',
} as const;
export type DocKind = keyof typeof DOC_FIELD;

export interface CustomerFilters {
  search?: string;
  status?: string;
}

export async function fetchCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  let query = getSupabaseClient()
    .from('customers')
    .select(COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    const term = filters.search.replace(/[,()%]/g, ' ').trim();
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,phone.ilike.%${term}%,id_number.ilike.%${term}%,email.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return z.array(customerSchema).parse(data);
}

export async function createCustomer(row: Record<string, unknown>): Promise<Customer> {
  const { data, error } = await getSupabaseClient()
    .from('customers')
    .insert(row)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return customerSchema.parse(data);
}

export async function updateCustomer(id: string, row: Record<string, unknown>): Promise<Customer> {
  const { data, error } = await getSupabaseClient()
    .from('customers')
    .update(row)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return customerSchema.parse(data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// --- KYC documents (private bucket, served via signed URLs) ------------------
export async function uploadCustomerDoc(
  organizationId: string,
  customerId: string,
  kind: DocKind,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${organizationId}/${customerId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabaseClient()
    .storage.from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function signedDocUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await getSupabaseClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function setCustomerDoc(
  customerId: string,
  kind: DocKind,
  path: string | null,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('customers')
    .update({ [DOC_FIELD[kind]]: path })
    .eq('id', customerId);
  if (error) throw error;
}

export async function removeStoredDoc(path: string): Promise<void> {
  await getSupabaseClient().storage.from(BUCKET).remove([path]);
}
