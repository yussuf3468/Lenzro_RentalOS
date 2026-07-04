import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { GlassPanel, Stat } from '@/components/os';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { usePayments } from '@/features/money';
import {
  BookingSheet,
  isOverdue,
  outstandingMinor,
  STATUS_META,
  useRentals,
} from '@/features/rentals';
import { toMessage } from '@/lib/errors';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CustomerFormDialog } from '../components/customer-form';
import { DocSlot } from '../components/doc-slot';
import { useCustomers } from '../hooks/use-customers';
import { DOC_SLOTS, initials, statusBadge } from '../lib/customer-meta';

const DOC_PATHS = {
  id_front: (c: { id_front_path: string | null }) => c.id_front_path,
  id_back: (c: { id_back_path: string | null }) => c.id_back_path,
  license: (c: { license_path: string | null }) => c.license_path,
  kra_pin: (c: { kra_pin_path: string | null }) => c.kra_pin_path,
} as const;

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { claims } = useAuth();
  const [now] = useState(() => Date.now());
  const [editOpen, setEditOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const customers = useCustomers({});
  const rentals = useRentals({});
  const payments = usePayments();

  const customer = customers.data?.find((c) => c.id === id);

  const derived = useMemo(() => {
    const history = (rentals.data ?? []).filter((r) => r.customer_id === id);
    const open = history.filter((r) => ['reserved', 'checked_out', 'returned'].includes(r.status));
    const totalSpent = (payments.data ?? [])
      .filter((p) => p.kind === 'rental_payment' && p.rentals?.customer_id === id)
      .reduce((sum, p) => sum + p.amount_minor, 0);
    const owed = open.reduce(
      (sum, r) => sum + outstandingMinor(r.total_amount_minor, r.paid_amount_minor),
      0,
    );
    const overdueNow = history.some((r) => isOverdue(r.status, r.end_at, now));
    return { history, totalSpent, owed, overdueNow };
  }, [rentals.data, payments.data, id, now]);

  if (customers.isLoading) {
    return (
      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:gap-4 lg:space-y-0">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-panel" />
          <Skeleton className="h-36 rounded-panel" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-panel" />
        </div>
      </div>
    );
  }
  if (customers.isError || !customer) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't find this customer"
        description={customers.isError ? toMessage(customers.error) : 'They may have been removed.'}
        action={
          <Button asChild variant="glass">
            <Link to="/app/customers">Back to customers</Link>
          </Button>
        }
      />
    );
  }

  const phoneDigits = customer.phone?.replace(/\D/g, '');

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      {/* Left rail — who they are, their standing, their papers */}
      <div className="space-y-4">
        {/* Identity header */}
        <div className="rounded-panel glass-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Button asChild variant="ghost" size="icon" aria-label="Back to customers">
                <Link to="/app/customers">
                  <ArrowLeft />
                </Link>
              </Button>
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/8 text-lg font-semibold">
                {initials(customer.full_name)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                    {customer.full_name}
                  </h1>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                      statusBadge(customer.status),
                    )}
                  >
                    {customer.status}
                  </span>
                  {derived.overdueNow ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      Has overdue rental
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {customer.type === 'company'
                    ? (customer.company_name ?? 'Company')
                    : 'Individual'}
                  {customer.phone ? ` · ${customer.phone}` : ''}
                  {customer.email ? ` · ${customer.email}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {customer.phone ? (
                <>
                  <Button asChild variant="glass" size="icon" aria-label="Call">
                    <a href={`tel:${customer.phone}`}>
                      <Phone />
                    </a>
                  </Button>
                  <Button asChild variant="glass" size="icon" aria-label="WhatsApp">
                    <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">
                      <MessageCircle />
                    </a>
                  </Button>
                </>
              ) : null}
              <Button variant="brand" size="sm" onClick={() => setBookingOpen(true)}>
                <Plus /> New booking
              </Button>
              <Button variant="glass" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil /> Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Standing — should I rent to this person? */}
        <GlassPanel
          eyebrow="Standing"
          title="At a glance"
          bodyClassName="grid grid-cols-2 gap-x-4 gap-y-5"
        >
          <Stat label="Rentals" value={derived.history.length} />
          <Stat label="Total paid" value={formatMoney(derived.totalSpent)} accent="text-success" />
          <Stat
            label="Owes now"
            value={formatMoney(derived.owed)}
            accent={derived.owed > 0 ? 'text-warning' : undefined}
          />
          <Stat
            label="Customer since"
            value={formatDate(customer.created_at)}
            className="[&_span]:text-base"
          />
        </GlassPanel>

        {/* Identity documents — verify in one glance */}
        <GlassPanel eyebrow="Identity" title="Documents">
          {claims.organizationId ? (
            <div className="grid grid-cols-2 gap-3">
              {DOC_SLOTS.map((slot) => (
                <DocSlot
                  key={slot.kind}
                  customerId={customer.id}
                  organizationId={claims.organizationId!}
                  kind={slot.kind}
                  label={slot.label}
                  initialPath={DOC_PATHS[slot.kind](customer)}
                />
              ))}
            </div>
          ) : null}
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {customer.id_number ? <p>ID no. {customer.id_number}</p> : null}
            {customer.license_number ? (
              <p>
                Licence {customer.license_number}
                {customer.license_expiry ? ` · expires ${formatDate(customer.license_expiry)}` : ''}
              </p>
            ) : null}
            {customer.kra_pin ? <p>KRA PIN {customer.kra_pin}</p> : null}
          </div>
        </GlassPanel>
      </div>

      {/* Right — the relationship: every rental, every note */}
      <div className="space-y-4">
        <GlassPanel eyebrow="History" title="Rentals">
          {derived.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rentals yet.{' '}
              <button
                type="button"
                onClick={() => setBookingOpen(true)}
                className="font-medium text-primary hover:underline"
              >
                Create their first →
              </button>
            </p>
          ) : (
            <ul className="divide-y divide-white/8">
              {derived.history.slice(0, 10).map((rental) => {
                const overdue = isOverdue(rental.status, rental.end_at, now);
                const owed = outstandingMinor(rental.total_amount_minor, rental.paid_amount_minor);
                return (
                  <li
                    key={rental.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/app/vehicles/${rental.asset_id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {rental.assets?.name ?? 'Car'}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(rental.start_at)} → {formatDate(rental.end_at)}
                        {owed > 0 ? (
                          <span className="ml-1.5 font-medium text-warning">
                            {formatMoney(owed, rental.currency)} due
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        overdue
                          ? 'bg-destructive/15 text-destructive'
                          : STATUS_META[rental.status].badge,
                      )}
                    >
                      {overdue ? 'Overdue' : STATUS_META[rental.status].label}
                    </span>
                    <Link
                      to={`/app/rentals/${rental.id}/contract`}
                      aria-label="Contract"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <FileText className="size-4" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassPanel>

        {customer.notes ? (
          <GlassPanel eyebrow="Notes" title="Things to remember">
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{customer.notes}</p>
          </GlassPanel>
        ) : null}
      </div>

      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        organizationId={claims.organizationId}
      />
      <BookingSheet
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        prefill={{ customerId: customer.id }}
      />
    </div>
  );
}
