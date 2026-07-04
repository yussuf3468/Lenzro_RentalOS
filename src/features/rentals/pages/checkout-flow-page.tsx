import { useState } from 'react';
import { AlertTriangle, ArrowLeft, FileText, KeyRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { GlassPanel } from '@/components/os';
import { SimpleSelect } from '@/components/form/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { RecordPaymentDialog } from '@/features/money';
import { toMessage } from '@/lib/errors';
import { formatDateTime, formatMoney } from '@/lib/format';
import { uploadRentalPhoto } from '../api/rentals.api';
import { PhotoCaptureGrid } from '../components/photo-evidence';
import { SignaturePad } from '../components/signature-pad';
import { useRental, useRentalAction, useRentalPhotos } from '../hooks/use-rentals';
import { outstandingMinor } from '../lib/rental-meta';
import { type Rental } from '../schemas/rental.schema';

export const FUEL_OPTIONS = [
  { value: '0', label: 'Empty' },
  { value: '25', label: '¼ tank' },
  { value: '50', label: '½ tank' },
  { value: '75', label: '¾ tank' },
  { value: '100', label: 'Full' },
];

export function FlowStep({
  step,
  title,
  className,
  children,
}: {
  step: number;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassPanel eyebrow={`Step ${step}`} title={title} className={className}>
      {children}
    </GlassPanel>
  );
}

export function CheckoutFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { claims } = useAuth();
  const rental = useRental(id);
  const photos = useRentalPhotos(id);
  const act = useRentalAction();

  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('');
  const [paying, setPaying] = useState<Rental | null>(null);

  if (rental.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Skeleton className="h-24 rounded-panel" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-panel lg:col-span-2" />
          <Skeleton className="h-40 rounded-panel" />
          <Skeleton className="h-40 rounded-panel" />
        </div>
      </div>
    );
  }
  if (rental.isError || !rental.data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this rental"
        description={toMessage(rental.error)}
      />
    );
  }
  const r = rental.data;
  if (r.status !== 'reserved') {
    return (
      <EmptyState
        icon={KeyRound}
        title="This rental is already underway"
        description="Checkout only applies to reserved bookings."
        action={
          <Button asChild variant="glass">
            <Link to="/app/rentals">Back to rentals</Link>
          </Button>
        }
      />
    );
  }

  const checkoutPhotos = (photos.data ?? []).filter((p) => p.phase === 'checkout');
  const signatureSaved = checkoutPhotos.some((p) => p.slot === 'signature');
  const owed = outstandingMinor(r.total_amount_minor, r.paid_amount_minor);

  const saveSignature = async (blob: Blob) => {
    if (!claims.organizationId || !id) return;
    await uploadRentalPhoto(claims.organizationId, id, 'checkout', 'signature', blob);
    await photos.refetch();
  };

  const handOver = () => {
    act.mutate(
      {
        rental: r,
        action: 'check_out',
        checkOutData: {
          odometerOut: odometer.trim() === '' ? null : Number(odometer),
          fuelOutPct: fuel === '' ? null : Number(fuel),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `${r.assets?.name ?? 'Car'} checked out to ${r.customers?.full_name ?? 'customer'}`,
          );
          navigate('/app/rentals');
        },
        onError: (error) => toast.error(toMessage(error)),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to rentals">
            <Link to="/app/rentals">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {r.customers?.full_name} · {r.assets?.name}
              {r.assets?.identifier ? ` · ${r.assets.identifier}` : ''} · until{' '}
              {formatDateTime(r.end_at)}
            </p>
          </div>
        </div>
        <Button asChild variant="glass" size="sm">
          <Link to={`/app/rentals/${r.id}/contract`}>
            <FileText /> Contract
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FlowStep step={1} title="Walk-around photos" className="lg:col-span-2">
          <p className="mb-3 text-xs text-muted-foreground">
            Photograph every side plus the dashboard. Existing scratches photographed now can't be
            argued about later.
          </p>
          {claims.organizationId && id ? (
            <PhotoCaptureGrid
              organizationId={claims.organizationId}
              rentalId={id}
              phase="checkout"
              photos={checkoutPhotos}
            />
          ) : null}
        </FlowStep>

        <FlowStep step={2} title="Odometer & fuel">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-odo" className="mb-1.5 block text-sm font-medium">
                Odometer (km)
              </label>
              <Input
                id="co-odo"
                inputMode="numeric"
                placeholder="48200"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="co-fuel" className="mb-1.5 block text-sm font-medium">
                Fuel level
              </label>
              <SimpleSelect
                id="co-fuel"
                value={fuel}
                onChange={setFuel}
                placeholder="Select level"
                options={FUEL_OPTIONS}
                ariaLabel="Fuel level"
              />
            </div>
          </div>
        </FlowStep>

        <FlowStep step={3} title="Money check">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-sm">
              <p>
                Price:{' '}
                <span className="font-mono font-medium tabular-nums">
                  {formatMoney(r.total_amount_minor, r.currency)}
                </span>
                <span className="text-muted-foreground"> · Paid: </span>
                <span className="font-mono tabular-nums">
                  {formatMoney(r.paid_amount_minor, r.currency)}
                </span>
              </p>
              <p className={owed > 0 ? 'font-medium text-warning' : 'font-medium text-success'}>
                {owed > 0 ? `Balance due: ${formatMoney(owed, r.currency)}` : 'Fully paid'}
                {r.deposit_amount_minor > 0
                  ? ` · Deposit agreed: ${formatMoney(r.deposit_amount_minor, r.currency)}`
                  : ''}
              </p>
            </div>
            <Button variant="glass" size="sm" onClick={() => setPaying(r)}>
              Record payment
            </Button>
          </div>
        </FlowStep>

        <FlowStep step={4} title="Customer signature" className="lg:col-span-2">
          <SignaturePad onSave={saveSignature} saved={signatureSaved} />
        </FlowStep>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-dock glass-dock p-3 print:hidden">
        <p className="hidden text-xs text-muted-foreground sm:block">
          Everything captured? Hand over the keys.
        </p>
        <Button
          variant="brand"
          className="w-full sm:w-auto"
          onClick={handOver}
          disabled={act.isPending}
        >
          <KeyRound /> {act.isPending ? 'Checking out…' : 'Hand over keys'}
        </Button>
      </div>

      <RecordPaymentDialog rental={paying} onOpenChange={(open) => !open && setPaying(null)} />
    </div>
  );
}
