import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FormField } from '@/components/form/form-field';
import { PasswordInput } from '@/components/form/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toMessage } from '@/lib/errors';
import { AuthLayout } from '../components/auth-layout';
import { useSignIn } from '../hooks/use-auth-mutations';
import { signInSchema, type SignInInput } from '../schemas/auth.schema';

export function SignInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('returnTo') ?? '/app';
  const signIn = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn.mutateAsync(values);
      navigate(returnTo, { replace: true });
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Lenzro RentalOS account."
      footer={
        <>
          New to Lenzro?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
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
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
