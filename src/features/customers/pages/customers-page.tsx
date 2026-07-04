import { useState } from 'react';
import { AlertTriangle, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { SimpleSelect } from '@/components/form/form-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { toMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { CustomerFormDialog } from '../components/customer-form';
import { useCustomers } from '../hooks/use-customers';
import { initials, statusBadge } from '../lib/customer-meta';
import { CUSTOMER_STATUSES, type Customer } from '../schemas/customer.schema';

export function CustomersPage() {
  const { claims } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const customers = useCustomers({ status: status || undefined });
  const hasFilters = Boolean(search || status);
  const query = search.trim().toLowerCase();
  const visible = (customers.data ?? []).filter(
    (customer) =>
      !query ||
      customer.full_name.toLowerCase().includes(query) ||
      (customer.phone ?? '').toLowerCase().includes(query) ||
      (customer.id_number ?? '').toLowerCase().includes(query),
  );

  const openCreate = () => setFormOpen(true);
  // Rows open the customer's living profile — editing lives there.
  const openProfile = (customer: Customer) => navigate(`/app/customers/${customer.id}`);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Your clients{customers.data ? ` — ${customers.data.length}` : ''}.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add customer
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone or ID…"
            className="pl-9"
          />
        </div>
        <SimpleSelect
          value={status}
          onChange={setStatus}
          ariaLabel="Filter by status"
          allLabel="All statuses"
          className="sm:w-44"
          options={CUSTOMER_STATUSES.map((value) => ({
            value,
            label: value === 'blocked' ? 'Blocked' : 'Active',
          }))}
        />
      </div>

      {customers.isLoading ? (
        <Card>
          <CardContent className="space-y-3 py-5">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : customers.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load customers"
          description={toMessage(customers.error)}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No customers match your filters' : 'No customers yet'}
          description={
            hasFilters
              ? 'Try clearing your search or filters.'
              : 'Add your first client to start renting.'
          }
          action={
            hasFilters ? undefined : (
              <Button onClick={openCreate}>
                <Plus /> Add customer
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">ID number</th>
                    <th className="px-3 py-3 font-medium">Licence</th>
                    <th className="px-3 py-3 font-medium">KRA PIN</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => openProfile(customer)}
                      className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {initials(customer.full_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{customer.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {customer.type === 'company'
                                ? (customer.company_name ?? 'Company')
                                : 'Individual'}
                              {customer.email ? ` · ${customer.email}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{customer.phone ?? '—'}</td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                        {customer.id_number ?? '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                        {customer.license_number ?? '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                        {customer.kra_pin ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                            statusBadge(customer.status),
                          )}
                        >
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        organizationId={claims.organizationId}
      />
    </div>
  );
}
