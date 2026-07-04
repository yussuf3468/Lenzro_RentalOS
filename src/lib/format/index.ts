/**
 * Formatting helpers. Money is always stored as integer MINOR units
 * (e.g. cents) + an ISO currency code, then formatted for display here.
 */

const DEFAULT_LOCALE = 'en-KE';
const DEFAULT_CURRENCY = 'KES';

/** Currencies that have no minor unit (whole-number only). */
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'UGX', 'RWF', 'XAF', 'XOF']);

function minorUnitDivisor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100;
}

/**
 * Format minor units as currency, e.g. formatMoney(125000000, 'KES') → "KES 1,250,000".
 * Whole amounts drop the decimals (brand convention); fractional amounts keep them.
 */
export function formatMoney(
  amountMinor: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  const amount = amountMinor / minorUnitDivisor(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(value: string | number | Date, locale: string = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(
  value: string | number | Date,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

/**
 * Build a Lenzro reference id, e.g. referenceId('BKG', 42) → "LNZ-BKG-2026-0042".
 * Matches the brand convention LNZ-<TYPE>-<YYYY>-<SEQ>.
 */
export function referenceId(
  type: string,
  seq: number,
  year: number = new Date().getFullYear(),
): string {
  return `LNZ-${type.toUpperCase()}-${year}-${String(seq).padStart(4, '0')}`;
}
