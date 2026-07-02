import { z } from 'zod';
import { EXPENSE_CATEGORIES, PAYMENT_KINDS, PAYMENT_METHODS } from '../lib/money-meta';

// ---------------------------------------------------------------------------
// Row schemas — validate Supabase responses at the boundary.
// ---------------------------------------------------------------------------
export const paymentSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  rental_id: z.string(),
  kind: z.enum(PAYMENT_KINDS),
  method: z.enum(PAYMENT_METHODS),
  amount_minor: z.number(),
  currency: z.string(),
  reference: z.string().nullable(),
  received_at: z.string(),
  notes: z.string().nullable(),
  rentals: z
    .object({
      asset_id: z.string(),
      customer_id: z.string(),
      status: z.string(),
      assets: z.object({ name: z.string(), identifier: z.string().nullable() }).nullable(),
      customers: z.object({ full_name: z.string(), phone: z.string().nullable() }).nullable(),
    })
    .nullable(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const expenseSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  asset_id: z.string().nullable(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount_minor: z.number(),
  currency: z.string(),
  incurred_at: z.string(),
  notes: z.string().nullable(),
  assets: z.object({ name: z.string() }).nullable(),
});
export type Expense = z.infer<typeof expenseSchema>;

// ---------------------------------------------------------------------------
// Form schemas
// ---------------------------------------------------------------------------
export const paymentFormSchema = z.object({
  kind: z.enum(PAYMENT_KINDS),
  method: z.enum(PAYMENT_METHODS),
  amount: z.string().refine((v) => v !== '' && Number(v) > 0, 'Enter the amount'),
  reference: z.string(),
  notes: z.string(),
});
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;

export function paymentFormToRow(input: PaymentFormInput, rentalId: string) {
  return {
    rental_id: rentalId,
    kind: input.kind,
    method: input.method,
    amount_minor: Math.round(Number(input.amount) * 100),
    reference: input.reference.trim() || null,
    notes: input.notes.trim() || null,
  };
}

export const expenseFormSchema = z.object({
  asset_id: z.string(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.string().refine((v) => v !== '' && Number(v) > 0, 'Enter the amount'),
  incurred_at: z.string().min(1, 'Pick a date'),
  notes: z.string(),
});
export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;

export function expenseFormToRow(input: ExpenseFormInput) {
  return {
    asset_id: input.asset_id || null,
    category: input.category,
    amount_minor: Math.round(Number(input.amount) * 100),
    incurred_at: input.incurred_at,
    notes: input.notes.trim() || null,
  };
}
