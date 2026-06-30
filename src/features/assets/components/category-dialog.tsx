import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '../hooks/use-assets';
import {
  categoryFormSchema,
  categoryFormToRow,
  type AssetCategory,
  type CategoryFormInput,
} from '../schemas/asset.schema';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AssetCategory[];
}

const EMPTY: CategoryFormInput = { name: '', default_daily_rate: '' };

export function CategoryDialog({ open, onOpenChange, categories }: CategoryDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [editing, setEditing] = useState<AssetCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const row = categoryFormToRow(values);
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, row });
      } else {
        await createCategory.mutateAsync(row);
      }
      reset(EMPTY);
      setEditing(null);
    } catch (err) {
      setError(toMessage(err));
    }
  });

  const startEdit = (category: AssetCategory) => {
    setEditing(category);
    reset({
      name: category.name,
      default_daily_rate: String(category.default_daily_rate_amount_minor / 100),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset(EMPTY);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vehicle categories</DialogTitle>
          <DialogDescription>
            Group vehicles (e.g. Economy, SUV) with a default daily rate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex items-end gap-2" noValidate>
          <FormField label="Name" htmlFor="c-name" className="flex-1" error={errors.name?.message}>
            <Input id="c-name" placeholder="SUV" {...register('name')} />
          </FormField>
          <FormField
            label="Rate/day"
            htmlFor="c-rate"
            className="w-28"
            error={errors.default_daily_rate?.message}
          >
            <Input
              id="c-rate"
              inputMode="decimal"
              placeholder="8000"
              {...register('default_daily_rate')}
            />
          </FormField>
          <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
            {editing ? 'Save' : 'Add'}
          </Button>
        </form>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {editing ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="self-start text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel edit
          </button>
        ) : null}

        <ul className="max-h-64 divide-y divide-border overflow-y-auto">
          {categories.length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">No categories yet.</li>
          ) : (
            categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatMoney(category.default_daily_rate_amount_minor, category.currency)}/day
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory.mutate(category.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
