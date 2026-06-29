import { useState } from 'react';
import { Building2, Check } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { FadeIn } from '@/components/motion-primitives';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { toMessage } from '@/lib/errors';
import { useAcceptInvitation, useInvitation } from '../hooks/use-organizations';
import { roleLabel } from '../lib/roles';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { status } = useAuth();
  const invitation = useInvitation(token);
  const accept = useAcceptInvitation();
  const [error, setError] = useState<string | null>(null);

  const onAccept = async () => {
    setError(null);
    try {
      await accept.mutateAsync(token);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(toMessage(err));
    }
  };

  const acceptHref = `/accept-invite?token=${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between p-6">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <FadeIn className="w-full max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Building2 className="size-6" />
            </div>
          </div>

          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>This invitation link is missing its token.</AlertDescription>
            </Alert>
          ) : invitation.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="mx-auto h-7 w-64" />
              <Skeleton className="mx-auto h-4 w-48" />
            </div>
          ) : !invitation.data || !invitation.data.valid ? (
            <Alert variant="destructive">
              <AlertDescription>This invitation is invalid or has expired.</AlertDescription>
            </Alert>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Join {invitation.data.organization_name}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                You've been invited as{' '}
                <span className="font-medium text-foreground">
                  {roleLabel(invitation.data.role)}
                </span>
                .
              </p>
              {error ? (
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {status === 'authenticated' ? (
                <Button className="mt-6 w-full" onClick={onAccept} disabled={accept.isPending}>
                  {accept.isPending ? (
                    'Joining…'
                  ) : (
                    <>
                      Accept invitation <Check />
                    </>
                  )}
                </Button>
              ) : (
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sign in or create an account with{' '}
                    <span className="font-medium text-foreground">{invitation.data.email}</span> to
                    accept.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={`/login?returnTo=${encodeURIComponent(acceptHref)}`}>
                      Sign in to continue
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/register">Create an account</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
