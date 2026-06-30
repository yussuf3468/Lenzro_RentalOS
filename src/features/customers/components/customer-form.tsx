import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
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
import { toMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { type DocKind } from '../api/customers.api';
import { useCreateCustomer, useDeleteCustomer, useUpdateCustomer } from '../hooks/use-customers';
import { DOC_SLOTS, SELECT_CLASS } from '../lib/customer-meta';
import {
  customerFormSchema,
  customerFormToRow,
  customerToFormDefaults,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  type Customer,
  type CustomerFormInput,
} from '../schemas/customer.schema';
import { DocSlot } from './doc-slot';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  organizationId: string | null;
}

const DOC_PATH: Record<DocKind, (customer: Customer) => string | null> = {
  id_front: (c) => c.id_front_path,
  id_back: (c) => c.id_back_path,
  license: (c) => c.license_path,
  kra_pin: (c) => c.kra_pin_path,
};

function CustomerFormBody({
  customer,
  organizationId,
  onDone,
}: {
  customer?: Customer;
  organizationId: string | null;
  onDone: () => void;
}) {
  const isEdit = Boolean(customer);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customerToFormDefaults(customer),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const row = customerFormToRow(values);
    try {
      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, row });
      } else {
        await createCustomer.mutateAsync(row);
      }
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  const onDelete = async () => {
    if (!customer) return;
    if (!window.confirm(`Delete ${customer.full_name}? This can't be undone.`)) return;
    try {
      await deleteCustomer.mutateAsync(customer.id);
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  };

  const pending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit customer' : 'Add customer'}</DialogTitle>
        <DialogDescription>
          {customer ? `Editing ${customer.full_name}` : 'Add a client and capture their KYC.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type" htmlFor="c-type">
            <FormSelect
              control={control}
              name="type"
              id="c-type"
              options={CUSTOMER_TYPES.map((value) => ({
                value,
                label: value === 'company' ? 'Company' : 'Individual',
              }))}
            />
          </FormField>
          <FormField label="Status" htmlFor="c-status">
            <FormSelect
              control={control}
              name="status"
              id="c-status"
              options={CUSTOMER_STATUSES.map((value) => ({
                value,
                label: value === 'blocked' ? 'Blocked' : 'Active',
              }))}
            />
          </FormField>
        </div>

        <FormField label="Full name" htmlFor="c-name" required error={errors.full_name?.message}>
          <Input id="c-name" placeholder="Amina Yusuf" {...register('full_name')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Company name" htmlFor="c-company">
            <Input
              id="c-company"
              placeholder="Acme Ltd (if company)"
              {...register('company_name')}
            />
          </FormField>
          <FormField label="Phone" htmlFor="c-phone">
            <Input id="c-phone" placeholder="+254 7…" {...register('phone')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" htmlFor="c-email" error={errors.email?.message}>
            <Input id="c-email" type="email" placeholder="amina@email.com" {...register('email')} />
          </FormField>
          <FormField label="Date of birth" htmlFor="c-dob">
            <Input id="c-dob" type="date" {...register('date_of_birth')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="National ID number" htmlFor="c-id">
            <Input id="c-id" placeholder="12345678" {...register('id_number')} />
          </FormField>
          <FormField label="KRA PIN" htmlFor="c-kra">
            <Input id="c-kra" placeholder="A012345678X" {...register('kra_pin')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Driving licence no." htmlFor="c-lic">
            <Input id="c-lic" placeholder="DL-00112233" {...register('license_number')} />
          </FormField>
          <FormField label="Licence expiry" htmlFor="c-lic-exp">
            <Input id="c-lic-exp" type="date" {...register('license_expiry')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Address" htmlFor="c-addr">
            <Input id="c-addr" placeholder="123 Ngong Rd" {...register('address')} />
          </FormField>
          <FormField label="City" htmlFor="c-city">
            <Input id="c-city" placeholder="Nairobi" {...register('city')} />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="c-notes">
          <textarea
            id="c-notes"
            rows={2}
            className={cn(SELECT_CLASS, 'h-auto py-2')}
            {...register('notes')}
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium">Documents</p>
          {customer && organizationId ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {DOC_SLOTS.map((slot) => (
                <DocSlot
                  key={slot.kind}
                  customerId={customer.id}
                  organizationId={organizationId}
                  kind={slot.kind}
                  label={slot.label}
                  initialPath={DOC_PATH[slot.kind](customer)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save the customer, then reopen to upload ID, licence and KRA documents.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {customer ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={deleteCustomer.isPending}
            >
              <Trash2 /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add customer'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  organizationId,
}: CustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <CustomerFormBody
          customer={customer}
          organizationId={organizationId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
