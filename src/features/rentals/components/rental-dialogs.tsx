import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/form/form-field';
import { SimpleSelect } from '@/components/form/form-select';
import { Input } from '@/components/ui/input';
import { useCreatePayment, usePayments } from '@/features/money';
import { toMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import { computeTotalMinor, outstandingMinor, toDatetimeLocal } from '../lib/rental-meta';
import { useExtendRental, useSettleRental } from '../hooks/use-rentals';
import { type Rental } from '../schemas/rental.schema';

const PAY_METHODS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Extend — 3 taps: new return time, price updates itself, confirm.
// ---------------------------------------------------------------------------
function ExtendBody({ rental, onDone }: { rental: Rental; onDone: () => void }) {
  const extend = useExtendRental();
  const [error, setError] = useState<string | null>(null);
  const [newEnd, setNewEnd] = useState(() =>
    toDatetimeLocal(new Date(new Date(rental.end_at).getTime() + 86_400_000)),
  );

  const valid = newEnd !== '' && new Date(newEnd) > new Date(rental.start_at);
  const newTotal = valid
    ? computeTotalMinor(rental.daily_rate_amount_minor, rental.start_at, newEnd)
    : rental.total_amount_minor;

  const onConfirm = async () => {
    setError(null);
    try {
      await extend.mutateAsync({ rental, newEndAt: newEnd, newTotalMinor: newTotal });
      onDone();
    } catch (err) {
      setError(toMessage(err));
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Extend rental</DialogTitle>
        <DialogDescription>
          {rental.customers?.full_name} · {rental.assets?.name}
        </DialogDescription>
      </DialogHeader>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="New return time" htmlFor="x-end" required>
        <Input
          id="x-end"
          type="datetime-local"
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">
        New price:{' '}
        <span className="font-mono font-medium text-foreground tabular-nums">
          {formatMoney(newTotal, rental.currency)}
        </span>{' '}
        (was {formatMoney(rental.total_amount_minor, rental.currency)})
      </p>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!valid || extend.isPending}>
          {extend.isPending ? 'Extending…' : 'Extend'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function ExtendDialog({
  rental,
  onOpenChange,
}: {
  rental: Rental | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(rental)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {rental ? <ExtendBody rental={rental} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Settle — collect the balance, close the rental.
// ---------------------------------------------------------------------------
function SettleBody({ rental, onDone }: { rental: Rental; onDone: () => void }) {
  const settle = useSettleRental();
  const createPayment = useCreatePayment();
  const payments = usePayments();
  const [error, setError] = useState<string | null>(null);
  const owed = outstandingMinor(rental.total_amount_minor, rental.paid_amount_minor);
  const [collect, setCollect] = useState(() => String(owed / 100));
  const [method, setMethod] = useState('mpesa');
  const [reference, setReference] = useState('');
  const [refundTouched, setRefundTouched] = useState(false);
  const [refund, setRefund] = useState('');

  // Deposit actually held for this rental = received − already refunded.
  const depositHeld = (payments.data ?? [])
    .filter((p) => p.rental_id === rental.id)
    .reduce(
      (sum, p) =>
        p.kind === 'deposit_received'
          ? sum + p.amount_minor
          : p.kind === 'deposit_refund'
            ? sum - p.amount_minor
            : sum,
      0,
    );
  const refundValue = refundTouched ? refund : depositHeld > 0 ? String(depositHeld / 100) : '';

  const collectMinor = Math.round(Number(collect || 0) * 100);
  const refundMinor = Math.round(Number(refundValue || 0) * 100);

  const onConfirm = async () => {
    setError(null);
    try {
      if (collectMinor > 0) {
        await createPayment.mutateAsync({
          rental_id: rental.id,
          kind: 'rental_payment',
          method,
          amount_minor: collectMinor,
          reference: reference.trim() || null,
        });
      }
      if (refundMinor > 0) {
        await createPayment.mutateAsync({
          rental_id: rental.id,
          kind: 'deposit_refund',
          method,
          amount_minor: refundMinor,
          reference: null,
        });
      }
      await settle.mutateAsync({ rental });
      onDone();
    } catch (err) {
      setError(toMessage(err));
    }
  };

  const pending = settle.isPending || createPayment.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Settle & close</DialogTitle>
        <DialogDescription>
          {rental.customers?.full_name} · {rental.assets?.name}
        </DialogDescription>
      </DialogHeader>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-1.5 rounded-xl border border-foreground/10 bg-foreground/3 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rental price</span>
          <span className="font-mono tabular-nums">
            {formatMoney(rental.total_amount_minor, rental.currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paid so far</span>
          <span className="font-mono tabular-nums">
            {formatMoney(rental.paid_amount_minor, rental.currency)}
          </span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Balance due</span>
          <span className="font-mono tabular-nums">{formatMoney(owed, rental.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposit held</span>
          <span className="font-mono tabular-nums">
            {formatMoney(depositHeld, rental.currency)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Collect now (KES)" htmlFor="s-collect">
          <Input
            id="s-collect"
            inputMode="decimal"
            value={collect}
            onChange={(e) => setCollect(e.target.value)}
          />
        </FormField>
        <FormField label="Refund deposit (KES)" htmlFor="s-refund">
          <Input
            id="s-refund"
            inputMode="decimal"
            value={refundValue}
            onChange={(e) => {
              setRefundTouched(true);
              setRefund(e.target.value);
            }}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Method" htmlFor="s-method">
          <SimpleSelect
            id="s-method"
            value={method}
            onChange={setMethod}
            options={PAY_METHODS}
            ariaLabel="Payment method"
          />
        </FormField>
        <FormField label="Reference" htmlFor="s-ref">
          <Input
            id="s-ref"
            placeholder="M-Pesa code…"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </FormField>
      </div>
      {depositHeld > refundMinor ? (
        <p className="text-xs text-muted-foreground">
          Keeping {formatMoney(depositHeld - refundMinor, rental.currency)} of the deposit (late
          fees, fuel or damage deductions).
        </p>
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={pending}>
          {pending ? 'Settling…' : 'Settle & close'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function SettleDialog({
  rental,
  onOpenChange,
}: {
  rental: Rental | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(rental)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {rental ? <SettleBody rental={rental} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
