export const ASSET_STATUSES = [
  'available',
  'rented',
  'reserved',
  'maintenance',
  'out_of_service',
  'retired',
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const STATUS_META: Record<AssetStatus, { label: string; badge: string }> = {
  available: { label: 'Available', badge: 'bg-success/10 text-success' },
  rented: { label: 'On rental', badge: 'bg-info/10 text-info' },
  reserved: { label: 'Reserved', badge: 'bg-primary/10 text-primary' },
  maintenance: { label: 'Maintenance', badge: 'bg-warning/10 text-warning' },
  out_of_service: { label: 'Out of service', badge: 'bg-destructive/10 text-destructive' },
  retired: { label: 'Retired', badge: 'bg-muted text-muted-foreground' },
};

export function statusMeta(status: string) {
  return (
    STATUS_META[status as AssetStatus] ?? { label: status, badge: 'bg-muted text-muted-foreground' }
  );
}

export const TRANSMISSIONS = ['automatic', 'manual'] as const;
export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const;

export const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

export function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
