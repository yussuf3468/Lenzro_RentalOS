import { type ComponentType, type ReactNode } from 'react';
import { type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Beautiful, reusable empty state — icon + title + guidance + primary action. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
