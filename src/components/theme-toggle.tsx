import { Monitor, Moon, Sun } from 'lucide-react';
import { type Theme } from '@/app/providers/theme-context';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const ORDER: Theme[] = ['light', 'dark', 'system'];
const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = ICONS[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
      onClick={() => setTheme(next)}
    >
      <Icon />
    </Button>
  );
}
