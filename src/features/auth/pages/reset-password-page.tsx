import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FormField } from '@/components/form/form-field';
import { PasswordInput } from '@/components/form/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toMessage } from '@/lib/errors';
import { AuthLayout } from '../components/auth-layout';
import { useUpdatePassword } from '../hooks/use-auth-mutations';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas/auth.schema';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const update = useUpdatePassword();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await update.mutateAsync(values.password);
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you don't use elsewhere."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <FormField label="New password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm)}
            {...register('confirm')}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
