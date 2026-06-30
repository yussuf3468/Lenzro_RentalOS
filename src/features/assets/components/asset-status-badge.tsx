import { cn } from '@/lib/utils';
import { statusMeta } from '../lib/asset-meta';

export function AssetStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm',
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
