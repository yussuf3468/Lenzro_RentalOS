import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BentoItem, BentoStagger } from '@/components/os';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toMessage } from '@/lib/errors';
import { AssistantTile } from './components/assistant-tile';
import { BusinessHealth } from './components/business-health';
import { FleetStatusGrid } from './components/fleet-status-grid';
import { OpsTimeline } from './components/ops-timeline';
import { QuickCommands } from './components/quick-commands';
import { RecentCustomers } from './components/recent-customers';
import { RevenueSnapshot } from './components/revenue-snapshot';
import { TodayStrip } from './components/today-strip';
import { useDashboard } from './hooks/use-dashboard';

function todayInfo() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return { greeting, dateLabel, now: now.getTime() };
}

const BENTO = 'grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6';

export function DashboardPage() {
  const [today] = useState(todayInfo);
  const {
    isLoading,
    isError,
    error,
    refetch,
    fleet,
    utilization,
    readiness,
    ops,
    moneyDueMinor,
    moneyDueCount,
    recentCustomers,
  } = useDashboard();

  if (isLoading) {
    return (
      <div className={BENTO}>
        <Skeleton className="h-40 rounded-panel md:col-span-2 xl:col-span-6" />
        <Skeleton className="h-56 rounded-panel md:col-span-2 xl:col-span-4" />
        <Skeleton className="h-56 rounded-panel xl:col-span-2" />
        <Skeleton className="h-48 rounded-panel md:col-span-2 xl:col-span-3" />
        <Skeleton className="h-48 rounded-panel md:col-span-2 xl:col-span-3" />
        <Skeleton className="h-44 rounded-panel md:col-span-2 xl:col-span-6" />
      </div>
    );
  }

  return (
    <BentoStagger className={BENTO}>
      {isError ? (
        <BentoItem className="md:col-span-2 xl:col-span-6">
          <div className="flex flex-col gap-3 rounded-panel glass-panel p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Some data couldn't load</p>
                <p className="text-xs break-words text-muted-foreground">{toMessage(error)}</p>
              </div>
            </div>
            <Button variant="glass" size="sm" onClick={refetch} className="shrink-0">
              Retry
            </Button>
          </div>
        </BentoItem>
      ) : null}
      <BentoItem className="md:col-span-2 xl:col-span-6">
        <TodayStrip greeting={today.greeting} dateLabel={today.dateLabel} fleet={fleet} ops={ops} />
      </BentoItem>
      <BentoItem className="md:col-span-2 xl:col-span-4">
        <OpsTimeline ops={ops} now={today.now} />
      </BentoItem>
      <BentoItem className="xl:col-span-2">
        <RevenueSnapshot dueMinor={moneyDueMinor} dueCount={moneyDueCount} />
      </BentoItem>
      <BentoItem className="md:col-span-2 xl:col-span-3">
        <FleetStatusGrid fleet={fleet} utilization={utilization} />
      </BentoItem>
      <BentoItem className="xl:col-span-3">
        <BusinessHealth readiness={readiness} utilization={utilization} />
      </BentoItem>
      <BentoItem className="md:col-span-2 xl:col-span-4">
        <RecentCustomers customers={recentCustomers} />
      </BentoItem>
      <BentoItem className="xl:col-span-2">
        <QuickCommands />
      </BentoItem>
      <BentoItem className="md:col-span-2 xl:col-span-6">
        <AssistantTile />
      </BentoItem>
    </BentoStagger>
  );
}
