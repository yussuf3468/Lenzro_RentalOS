import { z } from 'zod';
import { computeTotalMinor, RENTAL_STATUSES } from '../lib/rental-meta';

// ---------------------------------------------------------------------------
// Row schema — validates Supabase responses (with joined asset/customer names).
// ---------------------------------------------------------------------------
export const rentalSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  asset_id: z.string(),
  customer_id: z.string(),
  status: z.enum(RENTAL_STATUSES),
  start_at: z.string(),
  end_at: z.string(),
  actual_out_at: z.string().nullable(),
  actual_return_at: z.string().nullable(),
  daily_rate_amount_minor: z.number(),
  total_amount_minor: z.number(),
  deposit_amount_minor: z.number(),
  paid_amount_minor: z.number(),
  currency: z.string(),
  pickup_location: z.string().nullable(),
  return_location: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  assets: z.object({ name: z.string(), identifier: z.string().nullable() }).nullable(),
  customers: z.object({ full_name: z.string(), phone: z.string().nullable() }).nullable(),
});
export type Rental = z.infer<typeof rentalSchema>;

// ---------------------------------------------------------------------------
// Booking form — strings (what inputs hold), converted on submit.
// ---------------------------------------------------------------------------
export const bookingFormSchema = z
  .object({
    asset_id: z.string().min(1, 'Pick a car'),
    customer_id: z.string().min(1, 'Pick a customer'),
    start_at: z.string().min(1, 'Pickup time is required'),
    end_at: z.string().min(1, 'Return time is required'),
    total: z.string().refine((v) => v !== '' && Number(v) >= 0, 'Enter the rental price'),
    deposit: z.string().refine((v) => v === '' || Number(v) >= 0, 'Enter a valid deposit'),
    paid: z.string().refine((v) => v === '' || Number(v) >= 0, 'Enter a valid amount'),
    paid_method: z.string(),
    paid_reference: z.string(),
    pickup_location: z.string(),
    notes: z.string(),
  })
  .refine((v) => !v.start_at || !v.end_at || new Date(v.end_at) > new Date(v.start_at), {
    path: ['end_at'],
    message: 'Return must be after pickup',
  });
export type BookingFormInput = z.infer<typeof bookingFormSchema>;

export function bookingFormToRow(input: BookingFormInput, dailyRateMinor: number) {
  return {
    asset_id: input.asset_id,
    customer_id: input.customer_id,
    status: 'reserved',
    start_at: new Date(input.start_at).toISOString(),
    end_at: new Date(input.end_at).toISOString(),
    daily_rate_amount_minor: dailyRateMinor,
    total_amount_minor: Math.round(Number(input.total) * 100),
    deposit_amount_minor: Math.round(Number(input.deposit || 0) * 100),
    pickup_location: input.pickup_location.trim() || null,
    notes: input.notes.trim() || null,
  };
}

/** The "paid now" amount, recorded as a real payment alongside the booking. */
export function bookingFormToInitialPayment(input: BookingFormInput) {
  const amountMinor = Math.round(Number(input.paid || 0) * 100);
  if (amountMinor <= 0) return null;
  return {
    amountMinor,
    method: input.paid_method || 'mpesa',
    reference: input.paid_reference.trim() || null,
  };
}

/** Suggested price for the current form state (KES major units, as a string). */
export function suggestedTotal(
  dailyRateMinor: number,
  startAt: string,
  endAt: string,
): string | null {
  if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) return null;
  return String(computeTotalMinor(dailyRateMinor, startAt, endAt) / 100);
}
