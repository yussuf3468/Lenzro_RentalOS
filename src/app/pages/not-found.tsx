import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/logo';
import { FadeIn } from '@/components/motion-primitives';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <FadeIn className="flex flex-col items-center gap-6">
        <LogoMark className="h-12 w-auto opacity-90" />
        <div>
          <p className="font-mono text-sm text-muted-foreground">404</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="mt-2 text-muted-foreground">
            The page you’re looking for doesn’t exist or has moved.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link to="/">Back home</Link>
        </Button>
      </FadeIn>
    </div>
  );
}
