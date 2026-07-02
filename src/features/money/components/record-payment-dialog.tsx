import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '@/components/form/form-field';
import { FormSelect } from '@/components/form/form-select';
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
import { Input } from '@/components/ui/input';
import { outstandingMinor, type Rental } from '@/features/rentals';
import { toMessage } from '@/lib/errors';
import { useCreatePayment } from '../hooks/use-money';
import {
  KIND_LABEL,
  METHOD_LABEL,
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  type PaymentKind,
} from '../lib/money-meta';
import {
  paymentFormSchema,
  paymentFormToRow,
  type PaymentFormInput,
} from '../schemas/money.schema';

function defaultAmount(kind: PaymentKind, rental: Rental): string {
  if (kind === 'rental_payment') {
    const owed = outstandingMinor(rental.total_amount_minor, rental.paid_amount_minor);
    return owed > 0 ? String(owed / 100) : '';
  }
  if (kind === 'deposit_received' && rental.deposit_amount_minor > 0) {
    return String(rental.deposit_amount_minor / 100);
  }
  return '';
}

function PaymentBody({ rental, onDone }: { rental: Rental; onDone: () => void }) {
  const createPayment = useCreatePayment();
  const [formError, setFormError] = useState<string | null>(null);
  const amountTouched = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      kind: 'rental_payment',
      method: 'mpesa',
      amount: defaultAmount('rental_payment', rental),
      reference: '',
      notes: '',
    },
  });

  const kind = watch('kind');

  // Re-suggest the amount when the kind changes, until the user edits it.
  useEffect(() => {
    if (!amountTouched.current) setValue('amount', defaultAmount(kind, rental));
  }, [kind, rental, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createPayment.mutateAsync(paymentFormToRow(values, rental.id));
      toast.success('Payment recorded');
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          {rental.customers?.full_name} · {rental.assets?.name}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="What is it for?" htmlFor="p-kind">
            <FormSelect
              control={control}
              name="kind"
              id="p-kind"
              options={PAYMENT_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
            />
          </FormField>
          <FormField label="Method" htmlFor="p-method">
            <FormSelect
              control={control}
              name="method"
              id="p-method"
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Amount (KES)"
            htmlFor="p-amount"
            required
            error={errors.amount?.message}
          >
            <Input
              id="p-amount"
              inputMode="decimal"
              placeholder="0"
              {...register('amount', { onChange: () => (amountTouched.current = true) })}
            />
          </FormField>
          <FormField label="Reference" htmlFor="p-ref">
            <Input id="p-ref" placeholder="M-Pesa code…" {...register('reference')} />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="p-notes">
          <Input id="p-notes" placeholder="Optional" {...register('notes')} />
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={createPayment.isPending}>
            {createPayment.isPending ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function RecordPaymentDialog({
  rental,
  onOpenChange,
}: {
  rental: Rental | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(rental)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {rental ? <PaymentBody rental={rental} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
