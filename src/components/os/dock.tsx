import {
  CalendarDays,
  Car,
  Home,
  KeyRound,
  Plus,
  UserPlus,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { layoutTransition, springs } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface DockItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: DockItem[] = [
  { to: '/app', label: 'Today', icon: Home, end: true },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/rentals', label: 'Rentals', icon: KeyRound },
  { to: '/app/vehicles', label: 'Fleet', icon: Car },
  { to: '/app/money', label: 'Money', icon: Wallet },
];

function isActive(pathname: string, item: DockItem): boolean {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** The floating Apple-style dock — primary navigation on every breakpoint. */
export function Dock() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const direction = useScrollDirection();
  const hidden = !reduce && direction === 'down';

  return (
    <motion.div
      initial={false}
      animate={{ y: hidden ? 120 : 0, opacity: hidden ? 0 : 1 }}
      transition={springs.dock}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 sm:p-6"
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex items-center gap-1 rounded-dock glass-dock p-1.5"
      >
        {ITEMS.map((item) => {
          const active = isActive(location.pathname, item);
          const Icon = item.icon;
          return (
            <motion.button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              whileTap={reduce ? undefined : { scale: 0.9 }}
              transition={springs.press}
              className={cn(
                'group relative flex h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active ? (
                <motion.span
                  layoutId="dock-active"
                  transition={layoutTransition}
                  className="absolute inset-0 rounded-2xl bg-primary/15 ring-1 ring-primary/30"
                />
              ) : null}
              <motion.span
                animate={reduce ? undefined : { scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={springs.dock}
                className="relative z-10"
              >
                <Icon className="size-5" />
              </motion.span>
              <span
                className={cn(
                  'relative z-10 text-[10px] leading-none font-medium transition-opacity',
                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70',
                )}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}

        <span className="mx-0.5 h-7 w-px bg-foreground/10" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              aria-label="Create new"
              whileTap={reduce ? undefined : { scale: 0.9 }}
              transition={springs.press}
              className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Plus className="size-5" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={14} className="mb-1 w-52">
            <DropdownMenuLabel>Create</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/app/rentals?new=1')}>
              <KeyRound /> New booking
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/vehicles')}>
              <Car /> New vehicle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/customers')}>
              <UserPlus /> New customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </motion.div>
  );
}
