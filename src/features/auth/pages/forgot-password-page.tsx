import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FormField } from '@/components/form/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toMessage } from '@/lib/errors';
import { AuthLayout } from '../components/auth-layout';
import { useRequestPasswordReset } from '../hooks/use-auth-mutations';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth.schema';

export function ForgotPasswordPage() {
  const reset = useRequestPasswordReset();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await reset.mutateAsync(values.email);
      setSent(true);
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new password."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <Alert variant="success">
          <MailCheck />
          <div>
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>
              If an account exists for {getValues('email')}, a reset link is on its way.
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
