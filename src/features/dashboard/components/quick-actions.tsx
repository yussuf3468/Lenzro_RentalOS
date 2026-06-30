import { Car, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const ACTIONS = [
  { label: 'Add a vehicle', to: '/app/vehicles', icon: Car },
  { label: 'Add a customer', to: '/app/customers', icon: UserPlus },
  { label: 'Manage staff', to: '/app/staff', icon: Users },
];

export function QuickActions() {
  return (
    <Card className="gap-3 p-4">
      <p className="text-sm font-medium">Quick actions</p>
      <div className="grid gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              {action.label}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
