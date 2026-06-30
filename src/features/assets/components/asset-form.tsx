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
import { useCreateAsset, useDeleteAsset, useUpdateAsset } from '../hooks/use-assets';
import {
  ASSET_STATUSES,
  FUEL_TYPES,
  SELECT_CLASS,
  statusMeta,
  titleCase,
  TRANSMISSIONS,
} from '../lib/asset-meta';
import {
  assetFormSchema,
  assetFormToRow,
  assetToFormDefaults,
  type Asset,
  type AssetCategory,
  type AssetFormInput,
} from '../schemas/asset.schema';
import { ImageUploader } from './image-uploader';

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset;
  categories: AssetCategory[];
  organizationId: string | null;
}

interface AssetFormBodyProps {
  asset?: Asset;
  categories: AssetCategory[];
  organizationId: string | null;
  onDone: () => void;
}

// Mounted only while the dialog is open, so form + error state reset every open.
function AssetFormBody({ asset, categories, organizationId, onDone }: AssetFormBodyProps) {
  const isEdit = Boolean(asset);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssetFormInput>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: assetToFormDefaults(asset),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const row = assetFormToRow(values);
    try {
      if (asset) {
        await updateAsset.mutateAsync({ id: asset.id, row });
      } else {
        await createAsset.mutateAsync(row);
      }
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  const onDelete = async () => {
    if (!asset) return;
    if (!window.confirm(`Delete ${asset.name}? This can't be undone.`)) return;
    try {
      await deleteAsset.mutateAsync(asset.id);
      onDone();
    } catch (error) {
      setFormError(toMessage(error));
    }
  };

  const pending = createAsset.isPending || updateAsset.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle>
        <DialogDescription>
          {asset ? `Editing ${asset.name}` : 'Add a vehicle to your fleet.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField label="Name" htmlFor="a-name" required error={errors.name?.message}>
          <Input id="a-name" placeholder="Toyota Prado — KDA 123X" {...register('name')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="a-cat">
            <FormSelect
              control={control}
              name="category_id"
              id="a-cat"
              placeholder="No category"
              emptyLabel="No category"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
          </FormField>
          <FormField label="Status" htmlFor="a-status">
            <FormSelect
              control={control}
              name="status"
              id="a-status"
              options={ASSET_STATUSES.map((status) => ({
                value: status,
                label: statusMeta(status).label,
              }))}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Plate / Identifier" htmlFor="a-id">
            <Input id="a-id" placeholder="KDA 123X" {...register('identifier')} />
          </FormField>
          <FormField
            label="Daily rate (KES)"
            htmlFor="a-rate"
            required
            error={errors.daily_rate?.message}
          >
            <Input id="a-rate" inputMode="decimal" placeholder="6500" {...register('daily_rate')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Make" htmlFor="a-make">
            <Input id="a-make" placeholder="Toyota" {...register('make')} />
          </FormField>
          <FormField label="Model" htmlFor="a-model">
            <Input id="a-model" placeholder="Prado" {...register('model')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Year" htmlFor="a-year">
            <Input id="a-year" inputMode="numeric" placeholder="2022" {...register('year')} />
          </FormField>
          <FormField label="Transmission" htmlFor="a-trans">
            <FormSelect
              control={control}
              name="transmission"
              id="a-trans"
              placeholder="—"
              emptyLabel="—"
              options={TRANSMISSIONS.map((value) => ({ value, label: titleCase(value) }))}
            />
          </FormField>
          <FormField label="Fuel" htmlFor="a-fuel">
            <FormSelect
              control={control}
              name="fuel"
              id="a-fuel"
              placeholder="—"
              emptyLabel="—"
              options={FUEL_TYPES.map((value) => ({ value, label: titleCase(value) }))}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Seats" htmlFor="a-seats">
            <Input id="a-seats" inputMode="numeric" placeholder="7" {...register('seats')} />
          </FormField>
          <FormField label="Color" htmlFor="a-color">
            <Input id="a-color" placeholder="Silver" {...register('color')} />
          </FormField>
          <FormField label="Odometer (km)" htmlFor="a-odo">
            <Input id="a-odo" inputMode="numeric" placeholder="48000" {...register('odometer')} />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="a-notes">
          <textarea
            id="a-notes"
            rows={2}
            className={cn(SELECT_CLASS, 'h-auto py-2')}
            {...register('notes')}
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium">Photos</p>
          {asset && organizationId ? (
            <ImageUploader
              assetId={asset.id}
              organizationId={organizationId}
              primaryPath={asset.primary_image_path}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Save the vehicle, then reopen it to add photos.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {asset ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={deleteAsset.isPending}
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
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}

export function AssetFormDialog({
  open,
  onOpenChange,
  asset,
  categories,
  organizationId,
}: AssetFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <AssetFormBody
          asset={asset}
          categories={categories}
          organizationId={organizationId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
