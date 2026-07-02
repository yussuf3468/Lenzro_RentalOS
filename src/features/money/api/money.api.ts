import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import { expenseSchema, paymentSchema, type Expense, type Payment } from '../schemas/money.schema';

const PAYMENT_COLUMNS =
  'id,organization_id,rental_id,kind,method,amount_minor,currency,reference,received_at,notes,' +
  'rentals(asset_id,customer_id,status,assets(name,identifier),customers(full_name,phone))';

const EXPENSE_COLUMNS =
  'id,organization_id,asset_id,category,amount_minor,currency,incurred_at,notes,assets(name)';

/** All payments, newest first. Period filtering happens client-side so the
 *  deposits-held figure (which must ignore periods) stays consistent. */
export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await getSupabaseClient()
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .order('received_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return z.array(paymentSchema).parse(data);
}

export async function createPayment(row: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabaseClient().from('payments').insert(row);
  if (error) throw error;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('payments').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await getSupabaseClient()
    .from('expenses')
    .select(EXPENSE_COLUMNS)
    .order('incurred_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return z.array(expenseSchema).parse(data);
}

export async function createExpense(row: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabaseClient().from('expenses').insert(row);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('expenses').delete().eq('id', id);
  if (error) throw error;
}
