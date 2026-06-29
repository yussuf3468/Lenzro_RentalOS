import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toMessage } from '@/lib/errors';
import { AuthLayout } from '../components/auth-layout';
import { useAuth } from '../hooks/use-auth';
import { useResendVerification } from '../hooks/use-auth-mutations';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { status, isEmailVerified, claims } = useAuth();
  const resend = useResendVerification();
  const email = params.get('email') ?? '';
  const [notice, setNotice] = useState<string | null>(null);

  // Once verified, move the user forward automatically.
  useEffect(() => {
    if (status === 'authenticated' && isEmailVerified) {
      navigate(claims.organizationId ? '/app' : '/onboarding', { replace: true });
    }
  }, [status, isEmailVerified, claims.organizationId, navigate]);

  const onResend = async () => {
    setNotice(null);
    if (!email) {
      setNotice('Open the link from your inbox, or sign in to resend.');
      return;
    }
    try {
      await resend.mutateAsync(email);
      setNotice('Verification email sent.');
    } catch (error) {
      setNotice(toMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email ? `We sent a verification link to ${email}.` : 'We sent you a verification link.'
      }
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Alert variant="info">
        <MailCheck />
        <div>
          <AlertTitle>Almost there</AlertTitle>
          <AlertDescription>
            Click the link in the email to activate your account, then continue.
          </AlertDescription>
        </div>
      </Alert>
      {notice ? <p className="mt-4 text-sm text-muted-foreground">{notice}</p> : null}
      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={onResend}
        disabled={resend.isPending}
      >
        {resend.isPending ? 'Sending…' : 'Resend verification email'}
      </Button>
    </AuthLayout>
  );
}
