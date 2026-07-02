import { CheckCircle2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '@/components/os';
import { formatMoney } from '@/lib/format';

/** Money still to collect across open rentals — the owner's daily money question. */
export function RevenueSnapshot({ dueMinor, dueCount }: { dueMinor: number; dueCount: number }) {
  return (
    <GlassPanel
      className="h-full"
      eyebrow="Money"
      title="To collect"
      action={
        <Link to="/app/money" className="text-xs font-medium text-primary hover:underline">
          Details
        </Link>
      }
    >
      <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
        {dueMinor > 0 ? (
          <>
            <span className="flex size-10 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Wallet className="size-5" />
            </span>
            <p className="font-mono text-3xl font-semibold tabular-nums">{formatMoney(dueMinor)}</p>
            <p className="text-xs text-muted-foreground">
              across {dueCount} rental{dueCount === 1 ? '' : 's'} — collect at pickup or return.
            </p>
          </>
        ) : (
          <>
            <span className="flex size-10 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="text-sm font-medium">All collected</p>
            <p className="max-w-[16rem] text-xs text-muted-foreground">
              No outstanding balances on open rentals right now.
            </p>
          </>
        )}
      </div>
    </GlassPanel>
  );
}
