import { useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { SimpleSelect } from '@/components/form/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { toMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import { uploadRentalPhoto } from '../api/rentals.api';
import { PhotoCaptureGrid, PhotoStrip } from '../components/photo-evidence';
import { SignaturePad } from '../components/signature-pad';
import { useRental, useRentalAction, useRentalPhotos } from '../hooks/use-rentals';
import { hoursLate, isOverdue, outstandingMinor } from '../lib/rental-meta';
import { FlowStep, FUEL_OPTIONS } from './checkout-flow-page';

const FUEL_LABEL: Record<number, string> = {
  0: 'Empty',
  25: '¼ tank',
  50: '½ tank',
  75: '¾ tank',
  100: 'Full',
};

export function ReturnFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { claims } = useAuth();
  const rental = useRental(id);
  const photos = useRentalPhotos(id);
  const act = useRentalAction();
  const [now] = useState(() => Date.now());

  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('');

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
  if (r.status !== 'checked_out') {
    return (
      <EmptyState
        icon={KeyRound}
        title="This car isn't out"
        description="Returns only apply to rentals that are currently checked out."
        action={
          <Button asChild variant="glass">
            <Link to="/app/rentals">Back to rentals</Link>
          </Button>
        }
      />
    );
  }

  const all = photos.data ?? [];
  const pickupPhotos = all.filter((p) => p.phase === 'checkout' && p.slot !== 'signature');
  const returnPhotos = all.filter((p) => p.phase === 'return');
  const signatureSaved = returnPhotos.some((p) => p.slot === 'signature');

  const late = isOverdue(r.status, r.end_at, now) ? hoursLate(r.end_at, now) : 0;
  const owed = outstandingMinor(r.total_amount_minor, r.paid_amount_minor);
  const odoIn = odometer.trim() === '' ? null : Number(odometer);
  const kmDriven = odoIn != null && r.odometer_out != null ? odoIn - r.odometer_out : null;
  const fuelIn = fuel === '' ? null : Number(fuel);
  const fuelShort = fuelIn != null && r.fuel_out_pct != null && fuelIn < r.fuel_out_pct;

  const saveSignature = async (blob: Blob) => {
    if (!claims.organizationId || !id) return;
    await uploadRentalPhoto(claims.organizationId, id, 'return', 'signature', blob);
    await photos.refetch();
  };

  const confirmReturn = () => {
    act.mutate(
      { rental: r, action: 'return', returnData: { odometerIn: odoIn, fuelInPct: fuelIn } },
      {
        onSuccess: () => {
          toast.success(`${r.assets?.name ?? 'Car'} is back — settle the money to close.`);
          navigate(`/app/rentals?settle=${r.id}`);
        },
        onError: (error) => toast.error(toMessage(error)),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to rentals">
          <Link to="/app/rentals">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Return</h1>
          <p className="text-sm text-muted-foreground">
            {r.customers?.full_name} · {r.assets?.name}
            {r.assets?.identifier ? ` · ${r.assets.identifier}` : ''}
            {late > 0 ? (
              <span className="font-medium text-destructive"> · {late}h late</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FlowStep step={1} title="How it left (at pickup)" className="lg:col-span-2">
          <div className="space-y-2">
            <PhotoStrip photos={pickupPhotos} />
            <p className="text-xs text-muted-foreground">
              Out at{' '}
              {r.odometer_out != null ? `${r.odometer_out.toLocaleString()} km` : 'km not recorded'}
              {' · '}
              {r.fuel_out_pct != null
                ? (FUEL_LABEL[r.fuel_out_pct] ?? `${r.fuel_out_pct}%`)
                : 'fuel not recorded'}
            </p>
          </div>
        </FlowStep>

        <FlowStep step={2} title="How it came back — photos" className="lg:col-span-2">
          <p className="mb-3 text-xs text-muted-foreground">
            Same angles as pickup. New damage? Photograph it up close too.
          </p>
          {claims.organizationId && id ? (
            <PhotoCaptureGrid
              organizationId={claims.organizationId}
              rentalId={id}
              phase="return"
              photos={returnPhotos}
            />
          ) : null}
        </FlowStep>

        <FlowStep step={3} title="Odometer & fuel now">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ret-odo" className="mb-1.5 block text-sm font-medium">
                Odometer (km)
              </label>
              <Input
                id="ret-odo"
                inputMode="numeric"
                placeholder={r.odometer_out != null ? String(r.odometer_out) : '48650'}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
              {kmDriven != null ? (
                <p
                  className={`mt-1 text-xs ${kmDriven < 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {kmDriven < 0
                    ? 'Lower than at pickup — double-check.'
                    : `${kmDriven.toLocaleString()} km driven`}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ret-fuel" className="mb-1.5 block text-sm font-medium">
                Fuel level
              </label>
              <SimpleSelect
                id="ret-fuel"
                value={fuel}
                onChange={setFuel}
                placeholder="Select level"
                options={FUEL_OPTIONS}
                ariaLabel="Fuel level at return"
              />
              {fuelShort ? (
                <p className="mt-1 text-xs text-warning">
                  Lower than at pickup — consider a fuel deduction when settling.
                </p>
              ) : null}
            </div>
          </div>
        </FlowStep>

        <FlowStep step={4} title="Customer signature">
          <SignaturePad onSave={saveSignature} saved={signatureSaved} />
        </FlowStep>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-dock glass-dock p-3 print:hidden">
        <p className="hidden text-xs sm:block">
          {owed > 0 ? (
            <span className="font-medium text-warning">
              {formatMoney(owed, r.currency)} still due — settle next.
            </span>
          ) : (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3.5" /> Fully paid
            </span>
          )}
        </p>
        <Button
          variant="brand"
          className="w-full sm:w-auto"
          onClick={confirmReturn}
          disabled={act.isPending}
        >
          <KeyRound /> {act.isPending ? 'Confirming…' : 'Confirm return'}
        </Button>
      </div>
    </div>
  );
}
