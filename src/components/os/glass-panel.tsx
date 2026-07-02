import { type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** `panel` (default), `interactive` (hover lift), or `accent` (brand ring). */
  variant?: 'panel' | 'interactive' | 'accent';
  eyebrow?: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  bodyClassName?: string;
}

/**
 * The workhorse surface for the OS shell — a frosted glass panel with an optional
 * header (eyebrow + title + action). Bento modules compose from this.
 */
export function GlassPanel({
  variant = 'panel',
  eyebrow,
  title,
  action,
  className,
  bodyClassName,
  children,
  ...props
}: GlassPanelProps) {
  const hasHeader = Boolean(eyebrow || title || action);
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-panel glass-panel',
        variant === 'interactive' && 'transition-all duration-200 hover:glass-panel-hover',
        variant === 'accent' && 'ring-1 ring-primary/25',
        className,
      )}
      {...props}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="truncate text-sm font-semibold">{title}</h2> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn('flex-1', hasHeader ? 'px-5 pb-5' : 'p-5', bodyClassName)}>{children}</div>
    </div>
  );
}
