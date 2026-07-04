import { Sparkles } from 'lucide-react';

/** AI assistant placeholder — represents the vision; no backend wired yet. */
export function AssistantTile() {
  return (
    <div className="relative h-full overflow-hidden rounded-panel glass-panel p-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-ink-900">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Ask RentalOS</p>
            <p className="text-xs text-muted-foreground">
              “Which cars are idle this week?” · “Who's overdue?” — coming soon.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs whitespace-nowrap text-muted-foreground">
          Coming soon
        </span>
      </div>
    </div>
  );
}
