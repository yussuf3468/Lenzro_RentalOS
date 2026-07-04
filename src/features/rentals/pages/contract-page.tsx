import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { useMyOrganizations } from '@/features/organizations';
import { toMessage } from '@/lib/errors';
import { formatDateTime, formatMoney } from '@/lib/format';
import { signedPhotoUrl } from '../api/rentals.api';
import { useRental, useRentalPhotos } from '../hooks/use-rentals';
import { rentalDays } from '../lib/rental-meta';

const TERMS = [
  'The vehicle must be returned on the agreed date and time. Late returns are billed per started day at the daily rate unless agreed otherwise.',
  'The vehicle is returned with the same fuel level as at pickup; shortfalls are deducted from the deposit.',
  'The hirer is responsible for traffic fines, tolls and parking charges incurred during the rental.',
  'Any new damage beyond the photographed pickup condition is charged to the hirer, up to the deposit and beyond where applicable.',
  'The vehicle may not leave the country or be sub-let / used for hire without written permission.',
  'The deposit is refunded at return after deductions, if any.',
];

function SignatureImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void signedPhotoUrl(path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [path]);
  if (!url) return null;
  return <img src={url} alt="Customer signature" className="h-16 object-contain" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-neutral-200 py-1.5 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const { claims } = useAuth();
  const orgs = useMyOrganizations();
  const rental = useRental(id);
  const photos = useRentalPhotos(id);

  if (rental.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24 rounded-panel" />
        <Skeleton className="h-96 rounded-panel" />
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
  const orgName = orgs.data?.find((org) => org.id === claims.organizationId)?.name ?? 'The Company';
  const signature = (photos.data ?? []).find(
    (p) => p.phase === 'checkout' && p.slot === 'signature',
  );
  const days = rentalDays(r.start_at, r.end_at);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="icon" aria-label="Back">
          <Link to="/app/rentals">
            <ArrowLeft />
          </Link>
        </Button>
        <Button variant="brand" onClick={() => window.print()}>
          <Printer /> Print / save PDF
        </Button>
      </div>

      {/* The document is intentionally light — it prints. */}
      <div className="rounded-panel bg-white p-8 text-neutral-900 shadow-lg sm:p-10 print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-neutral-900 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Rental Agreement</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {orgName} · Agreement ref {r.id.slice(0, 8).toUpperCase()}
          </p>
        </header>

        <section className="mb-6 grid gap-x-10 gap-y-1 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Hirer
            </h2>
            <Row label="Name" value={r.customers?.full_name ?? '—'} />
            <Row label="Phone" value={r.customers?.phone ?? '—'} />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Vehicle
            </h2>
            <Row label="Vehicle" value={r.assets?.name ?? '—'} />
            <Row label="Registration" value={r.assets?.identifier ?? '—'} />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Rental period & charges
          </h2>
          <div className="grid gap-x-10 sm:grid-cols-2">
            <div>
              <Row label="Pickup" value={formatDateTime(r.start_at)} />
              <Row label="Return" value={formatDateTime(r.end_at)} />
              <Row label="Duration" value={`${days} day${days > 1 ? 's' : ''}`} />
            </div>
            <div>
              <Row label="Daily rate" value={formatMoney(r.daily_rate_amount_minor, r.currency)} />
              <Row label="Total" value={formatMoney(r.total_amount_minor, r.currency)} />
              <Row label="Deposit" value={formatMoney(r.deposit_amount_minor, r.currency)} />
            </div>
          </div>
          {(r.odometer_out != null || r.fuel_out_pct != null) && (
            <div className="mt-2 grid gap-x-10 sm:grid-cols-2">
              <Row
                label="Odometer at pickup"
                value={r.odometer_out != null ? `${r.odometer_out.toLocaleString()} km` : '—'}
              />
              <Row
                label="Fuel at pickup"
                value={r.fuel_out_pct != null ? `${r.fuel_out_pct}%` : '—'}
              />
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Terms
          </h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            {TERMS.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </section>

        <section className="grid gap-10 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Hirer signature
            </p>
            {signature ? (
              <SignatureImage path={signature.path} />
            ) : (
              <div className="h-16 border-b border-neutral-400" />
            )}
            <p className="mt-1 text-sm">{r.customers?.full_name ?? ''}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              For {orgName}
            </p>
            <div className="h-16 border-b border-neutral-400" />
            <p className="mt-1 text-sm text-neutral-500">Name & signature</p>
          </div>
        </section>
      </div>
    </div>
  );
}
