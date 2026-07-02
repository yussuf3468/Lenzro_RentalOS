import { Fragment, type KeyboardEvent, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  CalendarDays,
  Car,
  CornerDownLeft,
  FileBarChart,
  Home,
  KeyRound,
  Plus,
  Search,
  Settings,
  UserCog,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Group = 'Go to' | 'Create' | 'Coming soon';

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  group: Group;
  action?: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K command palette — jump to any destination or start a create flow. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery('');
      setActiveIndex(0);
    }
    onOpenChange(next);
  };

  const go = (to: string) => {
    navigate(to);
    handleOpenChange(false);
  };

  const commands: Command[] = [
    { id: 'go-today', label: 'Today', icon: Home, group: 'Go to', action: () => go('/app') },
    {
      id: 'go-cal',
      label: 'Calendar',
      icon: CalendarDays,
      group: 'Go to',
      action: () => go('/app/calendar'),
    },
    {
      id: 'go-rentals',
      label: 'Rentals',
      icon: KeyRound,
      group: 'Go to',
      action: () => go('/app/rentals'),
    },
    {
      id: 'go-fleet',
      label: 'Fleet',
      icon: Car,
      group: 'Go to',
      action: () => go('/app/vehicles'),
    },
    {
      id: 'go-cus',
      label: 'Customers',
      icon: Users,
      group: 'Go to',
      action: () => go('/app/customers'),
    },
    {
      id: 'go-money',
      label: 'Money',
      icon: Wallet,
      group: 'Go to',
      action: () => go('/app/money'),
    },
    {
      id: 'go-staff',
      label: 'Team',
      icon: UserCog,
      group: 'Go to',
      action: () => go('/app/staff'),
    },
    {
      id: 'new-booking',
      label: 'New booking',
      icon: Plus,
      group: 'Create',
      action: () => go('/app/rentals?new=1'),
    },
    {
      id: 'new-veh',
      label: 'New vehicle',
      icon: Plus,
      group: 'Create',
      action: () => go('/app/vehicles'),
    },
    {
      id: 'new-cus',
      label: 'New customer',
      icon: Plus,
      group: 'Create',
      action: () => go('/app/customers'),
    },
    {
      id: 'new-staff',
      label: 'Invite staff',
      icon: Plus,
      group: 'Create',
      action: () => go('/app/staff'),
    },
    {
      id: 'soon-maint',
      label: 'Maintenance',
      icon: Wrench,
      group: 'Coming soon',
      disabled: true,
    },
    {
      id: 'soon-reports',
      label: 'Reports',
      icon: FileBarChart,
      group: 'Coming soon',
      disabled: true,
    },
    {
      id: 'soon-settings',
      label: 'Settings',
      icon: Settings,
      group: 'Coming soon',
      disabled: true,
    },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;

  const onQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const runIndex = (index: number) => {
    const cmd = filtered[index];
    if (cmd && !cmd.disabled) cmd.action?.();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runIndex(activeIndex);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-[14vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-panel glass-overlay p-0 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for a page or action, then press Enter.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b hairline px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search or jump to…"
              aria-label="Search or jump to"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              esc
            </kbd>
          </div>

          <ul className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results for “{query}”.
              </li>
            ) : (
              filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                const showGroup = i === 0 || filtered[i - 1].group !== cmd.group;
                const isActive = i === activeIndex;
                return (
                  <Fragment key={cmd.id}>
                    {showGroup ? (
                      <li className="px-3 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase first:pt-1">
                        {cmd.group}
                      </li>
                    ) : null}
                    <li>
                      <button
                        type="button"
                        disabled={cmd.disabled}
                        onMouseMove={() => setActiveIndex(i)}
                        onClick={() => runIndex(i)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          isActive && !cmd.disabled
                            ? 'bg-primary/15 text-foreground'
                            : 'text-foreground/90',
                          cmd.disabled && 'cursor-default opacity-45',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-md',
                            isActive && !cmd.disabled
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="flex-1 truncate">{cmd.label}</span>
                        {cmd.disabled ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Soon
                          </span>
                        ) : isActive ? (
                          <CornerDownLeft className="size-3.5 text-muted-foreground" />
                        ) : null}
                      </button>
                    </li>
                  </Fragment>
                );
              })
            )}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
