import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FormField } from '@/components/form/form-field';
import { Logo } from '@/components/logo';
import { FadeIn } from '@/components/motion-primitives';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toMessage } from '@/lib/errors';
import { useCreateOrganization } from '../hooks/use-organizations';
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from '../schemas/organization.schema';

export function OnboardingPage() {
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: '', country: 'KE', currency: 'KES', timezone: 'Africa/Nairobi' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createOrg.mutateAsync(values);
      navigate('/app', { replace: true });
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between p-6">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <FadeIn className="w-full max-w-lg">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Building2 className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create your organization</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This is your company workspace — you'll be the owner, on a 14-day free trial.
            </p>
          </div>
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
            noValidate
          >
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <FormField label="Company name" htmlFor="name" required error={errors.name?.message}>
              <Input
                id="name"
                autoFocus
                placeholder="Acme Car Rental"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Country" htmlFor="country" error={errors.country?.message}>
                <Input
                  id="country"
                  maxLength={2}
                  className="uppercase"
                  aria-invalid={Boolean(errors.country)}
                  {...register('country')}
                />
              </FormField>
              <FormField label="Currency" htmlFor="currency" error={errors.currency?.message}>
                <Input
                  id="currency"
                  maxLength={3}
                  className="uppercase"
                  aria-invalid={Boolean(errors.currency)}
                  {...register('currency')}
                />
              </FormField>
            </div>
            <FormField label="Timezone" htmlFor="timezone" error={errors.timezone?.message}>
              <Input
                id="timezone"
                aria-invalid={Boolean(errors.timezone)}
                {...register('timezone')}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={createOrg.isPending}>
              {createOrg.isPending ? (
                'Creating…'
              ) : (
                <>
                  Create organization <ArrowRight />
                </>
              )}
            </Button>
          </form>
        </FadeIn>
      </div>
    </div>
  );
}
