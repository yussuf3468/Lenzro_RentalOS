import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type RentalStatus } from '../lib/rental-meta';
import {
  rentalPhotoSchema,
  rentalSchema,
  type Rental,
  type RentalPhoto,
} from '../schemas/rental.schema';

const RENTAL_COLUMNS =
  'id,organization_id,asset_id,customer_id,status,start_at,end_at,actual_out_at,actual_return_at,' +
  'daily_rate_amount_minor,total_amount_minor,deposit_amount_minor,paid_amount_minor,currency,' +
  'pickup_location,return_location,notes,odometer_out,odometer_in,fuel_out_pct,fuel_in_pct,' +
  'created_at,assets(name,identifier),customers(full_name,phone)';

const PHOTO_BUCKET = 'rental-photos';

export interface RentalFilters {
  statuses?: RentalStatus[];
  /** Overlap window: rentals where start_at < to AND end_at > from. */
  from?: string;
  to?: string;
  limit?: number;
}

/** Postgres exclusion-constraint violation → the double-booking guard fired. */
function friendly(error: { code?: string; message?: string }): Error {
  if (error.code === '23P01') {
    return new Error('That car is already booked for those dates. Pick another car or time.');
  }
  return Object.assign(new Error(error.message ?? 'Something went wrong'), error);
}

export async function fetchRentals(filters: RentalFilters = {}): Promise<Rental[]> {
  let query = getSupabaseClient()
    .from('rentals')
    .select(RENTAL_COLUMNS)
    .is('deleted_at', null)
    .order('start_at', { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.statuses?.length) query = query.in('status', filters.statuses);
  if (filters.to) query = query.lt('start_at', filters.to);
  if (filters.from) query = query.gt('end_at', filters.from);

  const { data, error } = await query;
  if (error) throw error;
  return z.array(rentalSchema).parse(data);
}

export interface InitialPayment {
  amountMinor: number;
  method: string;
  reference: string | null;
}

export async function createRental(
  row: Record<string, unknown>,
  initialPayment?: InitialPayment | null,
): Promise<Rental> {
  const { data, error } = await getSupabaseClient()
    .from('rentals')
    .insert(row)
    .select(RENTAL_COLUMNS)
    .single();
  if (error) throw friendly(error);
  const rental = rentalSchema.parse(data);

  if (initialPayment && initialPayment.amountMinor > 0) {
    const { error: payError } = await getSupabaseClient().from('payments').insert({
      rental_id: rental.id,
      kind: 'rental_payment',
      method: initialPayment.method,
      amount_minor: initialPayment.amountMinor,
      reference: initialPayment.reference,
    });
    if (payError) throw payError;
  }
  return rental;
}

async function updateRental(id: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabaseClient().from('rentals').update(row).eq('id', id);
  if (error) throw friendly(error);
}

async function setAssetStatus(assetId: string, status: string): Promise<void> {
  const { error } = await getSupabaseClient().from('assets').update({ status }).eq('id', assetId);
  if (error) throw error;
}

export interface CheckOutData {
  odometerOut?: number | null;
  fuelOutPct?: number | null;
}

/** Keys are handed over — the car leaves the yard. */
export async function checkOutRental(rental: Rental, data: CheckOutData = {}): Promise<void> {
  await updateRental(rental.id, {
    status: 'checked_out',
    actual_out_at: new Date().toISOString(),
    ...(data.odometerOut != null ? { odometer_out: data.odometerOut } : {}),
    ...(data.fuelOutPct != null ? { fuel_out_pct: data.fuelOutPct } : {}),
  });
  await setAssetStatus(rental.asset_id, 'rented');
}

export interface ReturnData {
  odometerIn?: number | null;
  fuelInPct?: number | null;
}

/** The car is back — inspection and settlement happen next. */
export async function returnRental(rental: Rental, data: ReturnData = {}): Promise<void> {
  await updateRental(rental.id, {
    status: 'returned',
    actual_return_at: new Date().toISOString(),
    ...(data.odometerIn != null ? { odometer_in: data.odometerIn } : {}),
    ...(data.fuelInPct != null ? { fuel_in_pct: data.fuelInPct } : {}),
  });
  await setAssetStatus(rental.asset_id, 'available');
}

/** Single rental by id — powers the checkout/return/contract screens. */
export async function fetchRental(id: string): Promise<Rental> {
  const { data, error } = await getSupabaseClient()
    .from('rentals')
    .select(RENTAL_COLUMNS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return rentalSchema.parse(data);
}

// --- Evidence photos (private bucket, served via signed URLs) ----------------
export async function fetchRentalPhotos(rentalId: string): Promise<RentalPhoto[]> {
  const { data, error } = await getSupabaseClient()
    .from('rental_photos')
    .select('id,rental_id,phase,slot,path')
    .eq('rental_id', rentalId)
    .order('created_at');
  if (error) throw error;
  return z.array(rentalPhotoSchema).parse(data);
}

export async function uploadRentalPhoto(
  organizationId: string,
  rentalId: string,
  phase: 'checkout' | 'return',
  slot: string,
  file: File | Blob,
): Promise<RentalPhoto> {
  const ext = file instanceof File ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'png';
  const path = `${organizationId}/${rentalId}/${phase}-${slot}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await getSupabaseClient()
    .storage.from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await getSupabaseClient()
    .from('rental_photos')
    .insert({ rental_id: rentalId, phase, slot, path })
    .select('id,rental_id,phase,slot,path')
    .single();
  if (error) throw error;
  return rentalPhotoSchema.parse(data);
}

export async function signedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await getSupabaseClient()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteRentalPhoto(photo: RentalPhoto): Promise<void> {
  await getSupabaseClient().storage.from(PHOTO_BUCKET).remove([photo.path]);
  const { error } = await getSupabaseClient().from('rental_photos').delete().eq('id', photo.id);
  if (error) throw error;
}

/** Money squared away — payments are recorded separately; this closes the file. */
export async function settleRental(rental: Rental): Promise<void> {
  await updateRental(rental.id, { status: 'settled' });
}

export async function cancelRental(rental: Rental): Promise<void> {
  await updateRental(rental.id, { status: 'cancelled' });
}

export async function markNoShow(rental: Rental): Promise<void> {
  await updateRental(rental.id, { status: 'no_show' });
}

export async function extendRental(
  rental: Rental,
  newEndAt: string,
  newTotalMinor: number,
): Promise<void> {
  await updateRental(rental.id, {
    end_at: new Date(newEndAt).toISOString(),
    total_amount_minor: newTotalMinor,
  });
}
