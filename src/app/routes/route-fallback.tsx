import { LogoMark } from '@/components/logo';

/** Branded fallback shown while a lazily-loaded route chunk resolves. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <LogoMark className="h-10 w-auto animate-pulse opacity-80" />
    </div>
  );
}
