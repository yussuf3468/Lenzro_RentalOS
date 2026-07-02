/** Payment / expense vocabulary + period helpers for the Money module. */

export const PAYMENT_KINDS = ['rental_payment', 'deposit_received', 'deposit_refund'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const KIND_LABEL: Record<PaymentKind, string> = {
  rental_payment: 'Rental fee',
  deposit_received: 'Deposit in',
  deposit_refund: 'Deposit refund',
};

export const PAYMENT_METHODS = ['mpesa', 'cash', 'bank', 'card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  cash: 'Cash',
  bank: 'Bank',
  card: 'Card',
  other: 'Other',
};

export const EXPENSE_CATEGORIES = [
  'fuel',
  'service',
  'repair',
  'insurance',
  'tracker',
  'parking',
  'wash',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  fuel: 'Fuel',
  service: 'Service',
  repair: 'Repair',
  insurance: 'Insurance',
  tracker: 'Tracker',
  parking: 'Parking',
  wash: 'Car wash',
  other: 'Other',
};

export type Period = 'this_month' | 'last_month' | 'all';

export const PERIOD_LABEL: Record<Period, string> = {
  this_month: 'This month',
  last_month: 'Last month',
  all: 'All time',
};

/** Inclusive start / exclusive end for a period, based on `now`. */
export function periodRange(period: Period, now: number): { from: number; to: number } | null {
  if (period === 'all') return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(1);
  if (period === 'this_month') {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { from: start.getTime(), to: end.getTime() };
  }
  const from = new Date(start);
  from.setMonth(from.getMonth() - 1);
  return { from: from.getTime(), to: start.getTime() };
}

export function inPeriod(iso: string, range: { from: number; to: number } | null): boolean {
  if (!range) return true;
  const t = new Date(iso).getTime();
  return t >= range.from && t < range.to;
}

/** WhatsApp deep link with a friendly balance reminder. */
export function whatsappNudge(phone: string, name: string, amountLabel: string): string {
  const digits = phone.replace(/\D/g, '');
  const text = `Hello ${name.split(' ')[0]}, a friendly reminder from the rental office: your balance of ${amountLabel} is due. Thank you!`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
