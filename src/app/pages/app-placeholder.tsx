import { Stagger, StaggerItem } from '@/components/motion-primitives';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const KPIS = ['Revenue', 'Active bookings', 'Fleet utilization'];

export function AppPlaceholderPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your command center — KPIs, revenue and fleet availability arrive in Phase 3.
        </p>
      </div>

      <Stagger className="grid gap-4 sm:grid-cols-3">
        {KPIS.map((label) => (
          <StaggerItem key={label}>
            <Card className="gap-3">
              <CardHeader>
                <CardDescription>{label}</CardDescription>
                <Skeleton className="h-7 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Card className="glass-edge">
        <CardHeader>
          <CardTitle>Foundation ready</CardTitle>
          <CardDescription>
            Design system, Liquid Glass, motion, state primitives, providers, routing and Supabase
            scaffolding are in place. Authentication and the marketing site come next in Phase 2.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
