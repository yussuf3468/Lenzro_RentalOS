import { type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon?: LucideIcon;
  /** Text-color utility for the figure, e.g. `text-success`. */
  accent?: string;
  delta?: { label: string; tone: 'up' | 'down' | 'flat' };
  className?: string;
}

/** A dense metric: small label, large tabular figure, optional delta + caption. */
export function Stat({ label, value, caption, icon: Icon, accent, delta, className }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            'min-w-0 font-mono text-xl leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-2xl',
            accent,
          )}
        >
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              delta.tone === 'up'
                ? 'text-success'
                : delta.tone === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground',
            )}
          >
            {delta.tone === 'up' ? (
              <ArrowUpRight className="size-3" />
            ) : delta.tone === 'down' ? (
              <ArrowDownRight className="size-3" />
            ) : null}
            {delta.label}
          </span>
        ) : null}
      </div>
      {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
