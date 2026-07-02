import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { useAssets } from '@/features/assets';
import { useCreateCustomer, useCustomers } from '@/features/customers';
import { toMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import { rentalDays, toDatetimeLocal } from '../lib/rental-meta';
import { useCreateRental } from '../hooks/use-rentals';
import {
  bookingFormSchema,
  bookingFormToInitialPayment,
  bookingFormToRow,
  suggestedTotal,
  type BookingFormInput,
} from '../schemas/rental.schema';

const PAY_METHODS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

export interface BookingPrefill {
  assetId?: string;
  start?: Date;
  end?: Date;
}

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: BookingPrefill;
}

function defaultWindow(prefill?: BookingPrefill): { start: string; end: string } {
  if (prefill?.start) {
    const start = new Date(prefill.start);
    start.setHours(9, 0, 0, 0);
    const end = prefill.end ? new Date(prefill.end) : new Date(start.getTime() + 86_400_000);
    if (!prefill.end) end.setHours(9, 0, 0, 0);
    return { start: toDatetimeLocal(start), end: toDatetimeLocal(end) };
  }
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 86_400_000);
  return { start: toDatetimeLocal(start), end: toDatetimeLocal(end) };
}

// Mounted only while the sheet is open, so state resets on every open.
function BookingBody({ prefill, onDone }: { prefill?: BookingPrefill; onDone: () => void }) {
  const assets = useAssets({});
  const customers = useCustomers({});
  const createRental = useCreateRental();
  const createCustomer = useCreateCustomer();
  const [formError, setFormError] = useState<string | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const totalTouched = useRef(false);

  const window = defaultWindow(prefill);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      asset_id: prefill?.assetId ?? '',
      customer_id: '',
      start_at: window.start,
      end_at: window.end,
      total: '',
      deposit: '',
      paid: '',
      paid_method: 'mpesa',
      paid_reference: '',
      pickup_location: '',
      notes: '',
    },
  });

  const assetId = watch('asset_id');
  const startAt = watch('start_at');
  const endAt = watch('end_at');
  const selectedAsset = assets.data?.find((asset) => asset.id === assetId);
  const suggestion = selectedAsset
    ? suggestedTotal(selectedAsset.daily_rate_amount_minor, startAt, endAt)
    : null;

  // Keep the price synced with car × days until the user edits it manually.
  useEffect(() => {
    if (!totalTouched.current && suggestion !== null) {
      setValue('total', suggestion);
    }
  }, [suggestion, setValue]);

  const days =
    startAt && endAt && new Date(endAt) > new Date(startAt) ? rentalDays(startAt, endAt) : null;

  const saveNewCustomer = async () => {
    if (newName.trim().length < 2) return;
    try {
      const created = await createCustomer.mutateAsync({
        full_name: newName.trim(),
        phone: newPhone.trim() || null,
        type: 'individual',
        status: 'active',
      });
      setValue('customer_id', (created as { id: string }).id, { shouldValidate: true });
      setNewCustomerOpen(false);
    } catch (error) {
      setFormError(toMessage(error));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!selectedAsset) return;
    try {
      await createRental.mutateAsync({
        row: bookingFormToRow(values, selectedAsset.daily_rate_amount_minor),
        initialPayment: bookingFormToInitialPayment(values),
      });
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>New booking</DialogTitle>
        <DialogDescription>Reserve a car for a customer — under a minute.</DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField label="Car" htmlFor="b-car" required error={errors.asset_id?.message}>
          <FormSelect
            control={control}
            name="asset_id"
            id="b-car"
            placeholder="Pick a car"
            options={(assets.data ?? []).map((asset) => ({
              value: asset.id,
              label: `${asset.name}${asset.identifier ? ` · ${asset.identifier}` : ''} — ${formatMoney(asset.daily_rate_amount_minor, asset.currency)}/day`,
            }))}
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <FormField
              label="Customer"
              htmlFor="b-customer"
              required
              className="flex-1"
              error={errors.customer_id?.message}
            >
              <FormSelect
                control={control}
                name="customer_id"
                id="b-customer"
                placeholder="Pick a customer"
                options={(customers.data ?? []).map((customer) => ({
                  value: customer.id,
                  label: customer.phone
                    ? `${customer.full_name} · ${customer.phone}`
                    : customer.full_name,
                }))}
              />
            </FormField>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="New customer"
              onClick={() => setNewCustomerOpen((v) => !v)}
            >
              <UserPlus />
            </Button>
          </div>
          {newCustomerOpen ? (
            <div className="flex flex-col gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3 sm:flex-row">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                aria-label="New customer name"
              />
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+254 7…"
                aria-label="New customer phone"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={saveNewCustomer}
                disabled={createCustomer.isPending || newName.trim().length < 2}
              >
                {createCustomer.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Pickup" htmlFor="b-start" required error={errors.start_at?.message}>
            <Input id="b-start" type="datetime-local" {...register('start_at')} />
          </FormField>
          <FormField label="Return" htmlFor="b-end" required error={errors.end_at?.message}>
            <Input id="b-end" type="datetime-local" {...register('end_at')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Price (KES)" htmlFor="b-total" required error={errors.total?.message}>
            <Input
              id="b-total"
              inputMode="decimal"
              placeholder="0"
              {...register('total', { onChange: () => (totalTouched.current = true) })}
            />
          </FormField>
          <FormField label="Deposit (KES)" htmlFor="b-deposit" error={errors.deposit?.message}>
            <Input id="b-deposit" inputMode="decimal" placeholder="0" {...register('deposit')} />
          </FormField>
          <FormField label="Paid now (KES)" htmlFor="b-paid" error={errors.paid?.message}>
            <Input id="b-paid" inputMode="decimal" placeholder="0" {...register('paid')} />
          </FormField>
        </div>

        {Number(watch('paid') || 0) > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Payment method" htmlFor="b-paymethod">
              <FormSelect
                control={control}
                name="paid_method"
                id="b-paymethod"
                options={PAY_METHODS}
              />
            </FormField>
            <FormField label="Reference" htmlFor="b-payref">
              <Input id="b-payref" placeholder="M-Pesa code…" {...register('paid_reference')} />
            </FormField>
          </div>
        ) : null}
        {days && selectedAsset ? (
          <p className="text-xs text-muted-foreground">
            {days} day{days > 1 ? 's' : ''} ×{' '}
            {formatMoney(selectedAsset.daily_rate_amount_minor, selectedAsset.currency)} ={' '}
            <span className="font-mono tabular-nums">
              {formatMoney(selectedAsset.daily_rate_amount_minor * days, selectedAsset.currency)}
            </span>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Pickup location" htmlFor="b-loc">
            <Input id="b-loc" placeholder="Office / airport…" {...register('pickup_location')} />
          </FormField>
          <FormField label="Notes" htmlFor="b-notes">
            <Input id="b-notes" placeholder="Anything to remember" {...register('notes')} />
          </FormField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={createRental.isPending}>
            {createRental.isPending ? 'Booking…' : 'Reserve car'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function BookingSheet({ open, onOpenChange, prefill }: BookingSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <BookingBody prefill={prefill} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
