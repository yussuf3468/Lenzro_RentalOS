import { Car, CheckCircle2, KeyRound, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel, Press, Stat } from '@/components/os';
import { type FleetStats } from '../hooks/use-dashboard';

const TILES = [
  { key: 'total', label: 'Vehicles', icon: Car, accent: '' },
  { key: 'available', label: 'Available', icon: CheckCircle2, accent: 'text-success' },
  { key: 'onRent', label: 'On rent', icon: KeyRound, accent: 'text-info' },
  { key: 'needsService', label: 'Needs service', icon: Wrench, accent: 'text-warning' },
] as const;

export function FleetStatusGrid({
  fleet,
  utilization,
}: {
  fleet: FleetStats;
  utilization: number;
}) {
  const navigate = useNavigate();
  return (
    <GlassPanel
      className="h-full"
      eyebrow="Fleet"
      title="Status at a glance"
      action={
        <button
          type="button"
          onClick={() => navigate('/app/vehicles')}
          className="text-xs font-medium text-primary hover:underline"
        >
          Manage
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Press key={tile.key}>
            <button
              type="button"
              onClick={() => navigate('/app/vehicles')}
              className="w-full rounded-xl border border-foreground/8 bg-foreground/[0.03] p-4 text-left transition-colors hover:border-primary/40 hover:bg-foreground/[0.06]"
            >
              <Stat
                label={tile.label}
                icon={tile.icon}
                accent={tile.accent}
                value={fleet[tile.key]}
              />
            </button>
          </Press>
        ))}
      </div>
      {fleet.total > 0 ? (
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-gradient-brand"
              style={{ width: `${utilization}%` }}
            />
          </div>
          <span className="font-mono tabular-nums">{utilization}% on rent</span>
        </div>
      ) : null}
    </GlassPanel>
  );
}
