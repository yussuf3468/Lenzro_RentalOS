import { ArrowUpRight, Car } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import { imageUrl } from '../api/assets.api';
import { type Asset } from '../schemas/asset.schema';
import { AssetStatusBadge } from './asset-status-badge';

interface AssetCardProps {
  asset: Asset;
  categoryName?: string;
  onEdit: () => void;
}

export function AssetCard({ asset, categoryName, onEdit }: AssetCardProps) {
  const image = imageUrl(asset.primary_image_path);

  return (
    <button type="button" onClick={onEdit} className="group block w-full text-left">
      <Card className="gap-0 overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={asset.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/40">
              <Car className="size-10" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <AssetStatusBadge status={asset.status} />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{asset.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {asset.identifier ?? '—'}
                {categoryName ? ` · ${categoryName}` : ''}
              </p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-3 font-mono text-sm font-semibold tabular-nums">
            {formatMoney(asset.daily_rate_amount_minor, asset.currency)}
            <span className="text-xs font-normal text-muted-foreground">/day</span>
          </p>
        </div>
      </Card>
    </button>
  );
}
