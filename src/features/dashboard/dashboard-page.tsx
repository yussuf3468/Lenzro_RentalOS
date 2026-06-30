import { useState } from 'react';
import { Car, UserPlus, Wrench } from 'lucide-react';
import { FadeIn } from '@/components/motion-primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionCenter, type ActionItem } from './components/action-center';
import { FleetSnapshot } from './components/fleet-snapshot';
import { QuickActions } from './components/quick-actions';
import { RecentCustomers } from './components/recent-customers';
import { useDashboard } from './hooks/use-dashboard';

function greetingForHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const [greeting] = useState(greetingForHour);
  const { isLoading, fleet, customerCount, recentCustomers } = useDashboard();

  const actions: ActionItem[] = [];
  if (fleet.total === 0) {
    actions.push({
      id: 'add-vehicle',
      tone: 'primary',
      icon: Car,
      title: 'Add your first vehicle',
      subtitle: 'Build your fleet so you can start renting.',
      to: '/app/vehicles',
      cta: 'Add vehicle',
    });
  } else if (customerCount === 0) {
    actions.push({
      id: 'add-customer',
      tone: 'primary',
      icon: UserPlus,
      title: 'Add your first customer',
      subtitle: 'Capture client details and KYC documents.',
      to: '/app/customers',
      cta: 'Add customer',
    });
  }
  if (fleet.needsService > 0) {
    actions.push({
      id: 'needs-service',
      tone: 'warning',
      icon: Wrench,
      title: `${fleet.needsService} vehicle${fleet.needsService > 1 ? 's' : ''} need attention`,
      subtitle: 'In maintenance or out of service.',
      to: '/app/vehicles',
      cta: 'Review',
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground">Here's your business at a glance.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <FadeIn className="space-y-6">
          <ActionCenter items={actions} />
          <FleetSnapshot fleet={fleet} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentCustomers customers={recentCustomers} />
            </div>
            <QuickActions />
          </div>
        </FadeIn>
      )}
    </div>
  );
}
