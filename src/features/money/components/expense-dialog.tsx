import { useState } from 'react';
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
import { useAssets } from '@/features/assets';
import { toMessage } from '@/lib/errors';
import { useCreateExpense } from '../hooks/use-money';
import { CATEGORY_LABEL, EXPENSE_CATEGORIES } from '../lib/money-meta';
import {
  expenseFormSchema,
  expenseFormToRow,
  type ExpenseFormInput,
} from '../schemas/money.schema';

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ExpenseBody({ onDone }: { onDone: () => void }) {
  const assets = useAssets({});
  const createExpense = useCreateExpense();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      asset_id: '',
      category: 'fuel',
      amount: '',
      incurred_at: todayISO(),
      notes: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createExpense.mutateAsync(expenseFormToRow(values));
      toast.success('Expense recorded');
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add expense</DialogTitle>
        <DialogDescription>Fuel, service, insurance — attach it to a car.</DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Car" htmlFor="e-car">
            <FormSelect
              control={control}
              name="asset_id"
              id="e-car"
              placeholder="General (no car)"
              emptyLabel="General (no car)"
              options={(assets.data ?? []).map((asset) => ({
                value: asset.id,
                label: asset.name,
              }))}
            />
          </FormField>
          <FormField label="Category" htmlFor="e-cat">
            <FormSelect
              control={control}
              name="category"
              id="e-cat"
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Amount (KES)"
            htmlFor="e-amount"
            required
            error={errors.amount?.message}
          >
            <Input id="e-amount" inputMode="decimal" placeholder="0" {...register('amount')} />
          </FormField>
          <FormField label="Date" htmlFor="e-date" required error={errors.incurred_at?.message}>
            <Input id="e-date" type="date" {...register('incurred_at')} />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="e-notes">
          <Input id="e-notes" placeholder="Optional" {...register('notes')} />
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending ? 'Saving…' : 'Add expense'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open ? <ExpenseBody onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
