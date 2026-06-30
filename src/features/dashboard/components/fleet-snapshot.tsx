import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type FleetStats } from '../hooks/use-dashboard';

const TILES = [
  { key: 'total', label: 'Vehicles', accent: '' },
  { key: 'available', label: 'Available', accent: 'text-success' },
  { key: 'onRent', label: 'On rent', accent: 'text-info' },
  { key: 'needsService', label: 'Needs service', accent: 'text-warning' },
] as const;

export function FleetSnapshot({ fleet }: { fleet: FleetStats }) {
  const navigate = useNavigate();
  const onRentPct = fleet.total > 0 ? Math.round((fleet.onRent / fleet.total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Card
            key={tile.key}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/app/vehicles')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') navigate('/app/vehicles');
            }}
            className="cursor-pointer gap-1 p-4 transition-colors hover:border-primary/40"
          >
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className={cn('font-mono text-2xl font-semibold tabular-nums', tile.accent)}>
              {fleet[tile.key]}
            </p>
          </Card>
        ))}
      </div>
      {fleet.total > 0 ? (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="bg-gradient-brand h-full rounded-full" style={{ width: `${onRentPct}%` }} />
          </div>
          <span className="font-mono tabular-nums">{onRentPct}% on rent</span>
        </div>
      ) : null}
    </div>
  );
}
