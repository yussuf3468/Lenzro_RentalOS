import { Link } from 'react-router-dom';
import { GlassPanel } from '@/components/os';
import { type Customer } from '@/features/customers';
import { getInitials } from '@/lib/utils';

export function RecentCustomers({ customers }: { customers: Customer[] }) {
  return (
    <GlassPanel
      className="h-full"
      eyebrow="Customers"
      title="Recently added"
      action={
        <Link to="/app/customers" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      }
    >
      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No customers yet — add your first to start renting.
        </p>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {customers.map((customer) => (
            <li key={customer.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/8 text-xs font-medium">
                {getInitials(customer.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{customer.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {customer.phone ?? customer.email ?? '—'}
                </p>
              </div>
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                {customer.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
