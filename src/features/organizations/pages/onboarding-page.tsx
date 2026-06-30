import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Logo } from '@/components/logo';
import { FadeIn } from '@/components/motion-primitives';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toMessage } from '@/lib/errors';
import { useCreateOrganization } from '../hooks/use-organizations';

const schema = z.object({ name: z.string().min(2, 'Enter your business name') });
type FormInput = z.infer<typeof schema>;

export function OnboardingPage() {
  const navigate = useNavigate();
  const createBusiness = useCreateOrganization();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  const onSubmit = handleSubmit(async ({ name }) => {
    setFormError(null);
    try {
      // Smart defaults — the owner never sees country/currency/timezone questions.
      await createBusiness.mutateAsync({
        name,
        country: 'KE',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
      });
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
      <div className="flex flex-1 items-center justify-center px-6 pb-20">
        <FadeIn className="w-full max-w-xl text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Welcome to Lenzro
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            What's your business called?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            It's the name your customers will see. You can change it — and everything else — anytime.
          </p>

          <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-md space-y-3" noValidate>
            {formError ? (
              <Alert variant="destructive" className="text-left">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <Input
              autoFocus
              placeholder="e.g. Savanna Car Hire"
              aria-label="Business name"
              aria-invalid={Boolean(errors.name)}
              className="h-12 text-center text-base"
              {...register('name')}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={createBusiness.isPending}>
              {createBusiness.isPending ? (
                'Setting up…'
              ) : (
                <>
                  Create my business <ArrowRight />
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">Takes 10 seconds · Free for 14 days</p>
        </FadeIn>
      </div>
    </div>
  );
}
