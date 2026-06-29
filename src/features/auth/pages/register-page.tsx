import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '@/components/form/form-field';
import { PasswordInput } from '@/components/form/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toMessage } from '@/lib/errors';
import { AuthLayout } from '../components/auth-layout';
import { useSignUp } from '../hooks/use-auth-mutations';
import { signUpSchema, type SignUpInput } from '../schemas/auth.schema';

export function RegisterPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signUp.mutateAsync(values);
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { replace: true });
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your 14-day free trial. No credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
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
        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Amina Yusuf"
            aria-invalid={Boolean(errors.fullName)}
            {...register('fullName')}
          />
        </FormField>
        <FormField label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          description="At least 8 characters."
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={signUp.isPending}>
          {signUp.isPending ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to Lenzro's Terms and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
