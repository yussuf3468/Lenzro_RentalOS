import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Customer } from '@/features/customers';
import { getInitials } from '@/lib/utils';

export function RecentCustomers({ customers }: { customers: Customer[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent customers</CardTitle>
        <Link to="/app/customers" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers yet — add your first to start renting.</p>
        ) : (
          <ul className="space-y-2.5">
            {customers.map((customer) => (
              <li key={customer.id} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {getInitials(customer.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{customer.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {customer.phone ?? customer.email ?? '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
