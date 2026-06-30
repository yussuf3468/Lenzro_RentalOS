export const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

export function statusBadge(status: string): string {
  return status === 'blocked' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success';
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export const DOC_SLOTS = [
  { kind: 'id_front', label: 'National ID — front' },
  { kind: 'id_back', label: 'National ID — back' },
  { kind: 'license', label: 'Driving licence' },
  { kind: 'kra_pin', label: 'KRA PIN certificate' },
] as const;
