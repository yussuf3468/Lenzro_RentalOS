import { z } from 'zod';

export const CUSTOMER_TYPES = ['individual', 'company'] as const;
export const CUSTOMER_STATUSES = ['active', 'blocked'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Row schema -------------------------------------------------------------
export const customerSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  type: z.string(),
  full_name: z.string(),
  company_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  id_number: z.string().nullable(),
  license_number: z.string().nullable(),
  license_expiry: z.string().nullable(),
  kra_pin: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  id_front_path: z.string().nullable(),
  id_back_path: z.string().nullable(),
  license_path: z.string().nullable(),
  kra_pin_path: z.string().nullable(),
  created_at: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

// --- Form schema (strings) --------------------------------------------------
export const customerFormSchema = z.object({
  type: z.enum(CUSTOMER_TYPES),
  full_name: z.string().min(2, 'Name is required'),
  company_name: z.string(),
  email: z.string().refine((v) => v === '' || EMAIL_RE.test(v), 'Enter a valid email'),
  phone: z.string(),
  id_number: z.string(),
  license_number: z.string(),
  license_expiry: z.string(),
  kra_pin: z.string(),
  date_of_birth: z.string(),
  address: z.string(),
  city: z.string(),
  status: z.enum(CUSTOMER_STATUSES),
  notes: z.string(),
});
export type CustomerFormInput = z.infer<typeof customerFormSchema>;

function nz(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}

export function customerFormToRow(input: CustomerFormInput) {
  return {
    type: input.type,
    full_name: input.full_name.trim(),
    company_name: input.type === 'company' ? nz(input.company_name) : null,
    email: nz(input.email),
    phone: nz(input.phone),
    id_number: nz(input.id_number),
    license_number: nz(input.license_number),
    license_expiry: nz(input.license_expiry),
    kra_pin: nz(input.kra_pin),
    date_of_birth: nz(input.date_of_birth),
    address: nz(input.address),
    city: nz(input.city),
    status: input.status,
    notes: nz(input.notes),
  };
}

export function customerToFormDefaults(customer?: Customer): CustomerFormInput {
  return {
    type: (customer?.type as (typeof CUSTOMER_TYPES)[number]) ?? 'individual',
    full_name: customer?.full_name ?? '',
    company_name: customer?.company_name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    id_number: customer?.id_number ?? '',
    license_number: customer?.license_number ?? '',
    license_expiry: customer?.license_expiry ?? '',
    kra_pin: customer?.kra_pin ?? '',
    date_of_birth: customer?.date_of_birth ?? '',
    address: customer?.address ?? '',
    city: customer?.city ?? '',
    status: (customer?.status as (typeof CUSTOMER_STATUSES)[number]) ?? 'active',
    notes: customer?.notes ?? '',
  };
}
