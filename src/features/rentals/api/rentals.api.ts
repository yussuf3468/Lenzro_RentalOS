import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type RentalStatus } from '../lib/rental-meta';
import { rentalSchema, type Rental } from '../schemas/rental.schema';

const RENTAL_COLUMNS =
  'id,organization_id,asset_id,customer_id,status,start_at,end_at,actual_out_at,actual_return_at,' +
  'daily_rate_amount_minor,total_amount_minor,deposit_amount_minor,paid_amount_minor,currency,' +
  'pickup_location,return_location,notes,created_at,' +
  'assets(name,identifier),customers(full_name,phone)';

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

/** Keys are handed over — the car leaves the yard. */
export async function checkOutRental(rental: Rental): Promise<void> {
  await updateRental(rental.id, {
    status: 'checked_out',
    actual_out_at: new Date().toISOString(),
  });
  await setAssetStatus(rental.asset_id, 'rented');
}

/** The car is back — inspection and settlement happen next. */
export async function returnRental(rental: Rental): Promise<void> {
  await updateRental(rental.id, {
    status: 'returned',
    actual_return_at: new Date().toISOString(),
  });
  await setAssetStatus(rental.asset_id, 'available');
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
