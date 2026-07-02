import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { applyThemeClass, getStoredTheme } from '@/app/providers/theme-context';
import { AmbientCanvas, CommandPalette, Dock, SpringIn, StatusCapsule } from '@/components/os';

/**
 * The authenticated "operating system" shell. A dark, spatial canvas with floating
 * glass chrome (status capsule + dock) layered over a centered content column.
 *
 * The dark surface is scoped to this subtree via the local `dark` class, so the
 * public marketing/auth pages keep their own theming untouched.
 */
export function AppShell() {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The authenticated app is a dark OS. Force dark on <html> while the shell is
  // mounted so portaled overlays (command palette, menus, dialogs) match, then
  // restore the user's stored theme on leave — public pages stay untouched.
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    return () => {
      applyThemeClass(getStoredTheme());
    };
  }, []);

  return (
    <div
      className="dark relative isolate min-h-svh os-canvas text-foreground"
      style={{ colorScheme: 'dark' }}
    >
      <AmbientCanvas />
      <StatusCapsule onOpenCommand={() => setCommandOpen(true)} />

      <main className="mx-auto w-full max-w-[1280px] px-4 pt-20 pb-32 min-[1920px]:max-w-[1760px] sm:px-6 sm:pt-24 xl:max-w-[1440px] 2xl:max-w-[1600px]">
        <SpringIn key={location.pathname}>
          <Outlet />
        </SpringIn>
      </main>

      <Dock />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
