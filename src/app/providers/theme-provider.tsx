import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyThemeClass,
  getStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  ThemeProviderContext,
  type ResolvedTheme,
  type Theme,
} from './theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredTheme()),
  );

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
    setResolvedTheme(applyThemeClass(next));
  }, []);

  // Follow OS changes while in 'system' mode.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolvedTheme(applyThemeClass('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeProviderContext value={value}>{children}</ThemeProviderContext>;
}
