import { GlassPanel } from '@/components/os';

function Bar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function BusinessHealth({
  readiness,
  utilization,
}: {
  readiness: number;
  utilization: number;
}) {
  return (
    <GlassPanel className="h-full" eyebrow="Business health" title="How you're running">
      <div className="space-y-4">
        <Bar label="Fleet readiness" value={readiness} hint="Vehicles operational and rentable." />
        <Bar label="Utilisation" value={utilization} hint="Share of fleet currently on rent." />
        <p className="rounded-lg border border-white/8 bg-white/[0.03] p-3 text-xs text-muted-foreground">
          Revenue & on-time health activate when Bookings goes live.
        </p>
      </div>
    </GlassPanel>
  );
}
