import { useMemo, useState } from 'react';
import { AlertTriangle, MessageCircle, Plus, Trash2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { GlassPanel, Stat } from '@/components/os';
import { SimpleSelect } from '@/components/form/form-select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { outstandingMinor, useRentals, type Rental } from '@/features/rentals';
import { toMessage } from '@/lib/errors';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ExpenseDialog } from '../components/expense-dialog';
import { RecordPaymentDialog } from '../components/record-payment-dialog';
import { useDeleteExpense, useDeletePayment, useExpenses, usePayments } from '../hooks/use-money';
import {
  CATEGORY_LABEL,
  inPeriod,
  KIND_LABEL,
  METHOD_LABEL,
  PERIOD_LABEL,
  periodRange,
  whatsappNudge,
  type Period,
} from '../lib/money-meta';

const OPEN_STATUSES = ['reserved', 'checked_out', 'returned'];

export function MoneyPage() {
  const [now] = useState(() => Date.now());
  const [period, setPeriod] = useState<Period>('this_month');
  const [paying, setPaying] = useState<Rental | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const payments = usePayments();
  const expenses = useExpenses();
  const rentals = useRentals({ statuses: ['reserved', 'checked_out', 'returned'] });
  const deletePayment = useDeletePayment();
  const deleteExpense = useDeleteExpense();

  const range = periodRange(period, now);

  const stats = useMemo(() => {
    const pays = payments.data ?? [];
    const exps = expenses.data ?? [];
    const open = rentals.data ?? [];

    const collected = pays
      .filter((p) => p.kind === 'rental_payment' && inPeriod(p.received_at, range))
      .reduce((sum, p) => sum + p.amount_minor, 0);

    // Deposits held = received − refunded across OPEN rentals, all-time.
    const heldByRental = new Map<string, number>();
    for (const p of pays) {
      if (!p.rentals || !OPEN_STATUSES.includes(p.rentals.status)) continue;
      const delta =
        p.kind === 'deposit_received'
          ? p.amount_minor
          : p.kind === 'deposit_refund'
            ? -p.amount_minor
            : 0;
      if (delta !== 0) heldByRental.set(p.rental_id, (heldByRental.get(p.rental_id) ?? 0) + delta);
    }
    const depositsHeld = [...heldByRental.values()].filter((v) => v > 0).reduce((a, b) => a + b, 0);

    const outstanding = open.reduce(
      (sum, r) => sum + outstandingMinor(r.total_amount_minor, r.paid_amount_minor),
      0,
    );
    const spent = exps
      .filter((e) => inPeriod(e.incurred_at, range))
      .reduce((sum, e) => sum + e.amount_minor, 0);

    return { collected, depositsHeld, outstanding, spent, profit: collected - spent };
  }, [payments.data, expenses.data, rentals.data, range]);

  const toCollect = useMemo(
    () =>
      (rentals.data ?? [])
        .map((r) => ({
          rental: r,
          owed: outstandingMinor(r.total_amount_minor, r.paid_amount_minor),
        }))
        .filter((x) => x.owed > 0)
        .sort((a, b) => b.owed - a.owed),
    [rentals.data],
  );

  const periodPayments = useMemo(
    () => (payments.data ?? []).filter((p) => inPeriod(p.received_at, range)).slice(0, 25),
    [payments.data, range],
  );
  const periodExpenses = useMemo(
    () => (expenses.data ?? []).filter((e) => inPeriod(e.incurred_at, range)).slice(0, 25),
    [expenses.data, range],
  );

  const perCar = useMemo(() => {
    const rows = new Map<string, { name: string; collected: number; spent: number }>();
    const bump = (key: string, name: string, field: 'collected' | 'spent', amount: number) => {
      const row = rows.get(key) ?? { name, collected: 0, spent: 0 };
      row[field] += amount;
      rows.set(key, row);
    };
    for (const p of payments.data ?? []) {
      if (p.kind !== 'rental_payment' || !inPeriod(p.received_at, range) || !p.rentals) continue;
      bump(p.rentals.asset_id, p.rentals.assets?.name ?? 'Car', 'collected', p.amount_minor);
    }
    for (const e of expenses.data ?? []) {
      if (!inPeriod(e.incurred_at, range)) continue;
      bump(e.asset_id ?? 'general', e.assets?.name ?? 'General', 'spent', e.amount_minor);
    }
    return [...rows.values()].sort((a, b) => b.collected - b.spent - (a.collected - a.spent));
  }, [payments.data, expenses.data, range]);

  const isLoading = payments.isLoading || expenses.isLoading || rentals.isLoading;
  const isError = payments.isError || expenses.isError || rentals.isError;

  const removePayment = (id: string) => {
    if (!window.confirm('Delete this payment record?')) return;
    deletePayment.mutate(id, {
      onSuccess: () => toast.success('Payment deleted'),
      onError: (error) => toast.error(toMessage(error)),
    });
  };
  const removeExpense = (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    deleteExpense.mutate(id, {
      onSuccess: () => toast.success('Expense deleted'),
      onError: (error) => toast.error(toMessage(error)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Money</h1>
          <p className="text-sm text-muted-foreground">In, held, owed and out — per shilling.</p>
        </div>
        <div className="flex items-center gap-2">
          <SimpleSelect
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            ariaLabel="Period"
            className="w-36"
            options={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({
              value: p,
              label: PERIOD_LABEL[p],
            }))}
          />
          <Button variant="glass" onClick={() => setExpenseOpen(true)}>
            <Plus /> Expense
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-48 rounded-panel" />
          <Skeleton className="h-48 rounded-panel" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load your money data"
          description={toMessage(payments.error ?? expenses.error ?? rentals.error)}
        />
      ) : (
        <div className="space-y-4">
          <GlassPanel bodyClassName="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
            <Stat
              label={`Collected · ${PERIOD_LABEL[period]}`}
              value={formatMoney(stats.collected)}
              accent="text-success"
            />
            <Stat
              label="Outstanding now"
              value={formatMoney(stats.outstanding)}
              accent="text-warning"
            />
            <Stat label="Deposits held" value={formatMoney(stats.depositsHeld)} />
            <Stat label={`Expenses · ${PERIOD_LABEL[period]}`} value={formatMoney(stats.spent)} />
            <Stat
              label={`Profit · ${PERIOD_LABEL[period]}`}
              value={formatMoney(stats.profit)}
              accent={stats.profit >= 0 ? 'text-success' : 'text-destructive'}
            />
          </GlassPanel>

          {toCollect.length > 0 ? (
            <GlassPanel eyebrow="Chase it" title="To collect" variant="accent">
              <ul className="divide-y divide-white/8">
                {toCollect.map(({ rental, owed }) => (
                  <li
                    key={rental.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        <Link
                          to={`/app/customers/${rental.customer_id}`}
                          className="hover:underline"
                        >
                          {rental.customers?.full_name ?? 'Customer'}
                        </Link>
                        <span className="text-muted-foreground">
                          {' · '}
                          <Link to={`/app/vehicles/${rental.asset_id}`} className="hover:underline">
                            {rental.assets?.name ?? 'Car'}
                          </Link>
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {rental.status.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-warning tabular-nums">
                      {formatMoney(owed, rental.currency)}
                    </span>
                    <div className="flex gap-1.5">
                      {rental.customers?.phone ? (
                        <Button size="sm" variant="glass" asChild>
                          <a
                            href={whatsappNudge(
                              rental.customers.phone,
                              rental.customers.full_name,
                              formatMoney(owed, rental.currency),
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle /> Nudge
                          </a>
                        </Button>
                      ) : null}
                      <Button size="sm" onClick={() => setPaying(rental)}>
                        Record payment
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <GlassPanel eyebrow="Money in & out" title="Payments">
              {periodPayments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Wallet className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No payments {PERIOD_LABEL[period].toLowerCase()} yet.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/8">
                  {periodPayments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {payment.rentals?.customers?.full_name ?? '—'}
                          <span className="text-muted-foreground">
                            {' '}
                            · {KIND_LABEL[payment.kind]} · {METHOD_LABEL[payment.method]}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(payment.received_at)}
                          {payment.reference ? (
                            <span className="ml-1.5 font-mono">{payment.reference}</span>
                          ) : null}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'font-mono text-sm tabular-nums',
                          payment.kind === 'deposit_refund'
                            ? 'text-muted-foreground'
                            : 'text-success',
                        )}
                      >
                        {payment.kind === 'deposit_refund' ? '−' : '+'}
                        {formatMoney(payment.amount_minor, payment.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePayment(payment.id)}
                        aria-label="Delete payment"
                        className="text-muted-foreground/60 transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </GlassPanel>

            <GlassPanel
              eyebrow="Running costs"
              title="Expenses"
              action={
                <button
                  type="button"
                  onClick={() => setExpenseOpen(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Add
                </button>
              }
            >
              {periodExpenses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Wallet className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No expenses {PERIOD_LABEL[period].toLowerCase()} — add fuel, service or
                    insurance costs to see true profit.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/8">
                  {periodExpenses.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {CATEGORY_LABEL[expense.category]}
                          <span className="text-muted-foreground">
                            {' '}
                            · {expense.assets?.name ?? 'General'}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(expense.incurred_at)}
                          {expense.notes ? ` · ${expense.notes}` : ''}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground tabular-nums">
                        −{formatMoney(expense.amount_minor, expense.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExpense(expense.id)}
                        aria-label="Delete expense"
                        className="text-muted-foreground/60 transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </GlassPanel>
          </div>

          {perCar.length > 0 ? (
            <GlassPanel
              eyebrow="Which car earns"
              title={`Per-car profit · ${PERIOD_LABEL[period]}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b hairline text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Car</th>
                      <th className="py-2 pr-3 text-right font-medium">Collected</th>
                      <th className="py-2 pr-3 text-right font-medium">Expenses</th>
                      <th className="py-2 text-right font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perCar.map((row) => {
                      const profit = row.collected - row.spent;
                      return (
                        <tr key={row.name} className="border-b border-white/5 last:border-0">
                          <td className="py-2.5 pr-3 font-medium">{row.name}</td>
                          <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                            {formatMoney(row.collected)}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono text-muted-foreground tabular-nums">
                            {formatMoney(row.spent)}
                          </td>
                          <td
                            className={cn(
                              'py-2.5 text-right font-mono font-semibold tabular-nums',
                              profit >= 0 ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {formatMoney(profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          ) : null}
        </div>
      )}

      <RecordPaymentDialog rental={paying} onOpenChange={(open) => !open && setPaying(null)} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  );
}
