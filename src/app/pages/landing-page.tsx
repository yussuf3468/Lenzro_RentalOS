import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Car,
  Check,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion-primitives';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Car,
    title: 'Fleet & assets',
    body: 'Vehicles today; motorcycles, equipment and trucks on the same core — no migration.',
  },
  {
    icon: CalendarCheck,
    title: 'Bookings',
    body: 'Reservations, availability and check-in/out with double-booking impossible by design.',
  },
  {
    icon: Users,
    title: 'Customers & staff',
    body: 'Customers, drivers and employees with roles, documents and KYC.',
  },
  {
    icon: Wrench,
    title: 'Maintenance',
    body: 'Service schedules, repairs and downtime tracked against every asset.',
  },
  {
    icon: BarChart3,
    title: 'Finance & reports',
    body: 'Invoices, payments, expenses and revenue analytics in real time.',
  },
  {
    icon: Shield,
    title: 'Secure & isolated',
    body: 'Every company fully isolated with database-enforced row-level security.',
  },
];

const PLANS = [
  {
    name: 'Basic',
    price: '$29',
    period: '/mo',
    tagline: 'For a single branch getting started.',
    features: ['Up to 25 assets', '3 team members', 'Bookings & customers', 'Maintenance'],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/mo',
    tagline: 'For growing rental companies.',
    features: [
      'Up to 150 assets',
      '15 team members',
      'Contracts & analytics',
      'Messaging & reports',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For multi-branch operations.',
    features: ['Unlimited assets', 'Unlimited members', 'Priority support', 'Custom onboarding'],
    cta: 'Contact sales',
    highlighted: false,
  },
];

export function LandingPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-160 w-160 rounded-full bg-gradient-brand opacity-[0.12] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(48rem 24rem at 50% -10%, color-mix(in oklab, var(--primary) 8%, transparent), transparent)',
        }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 md:pt-32">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground shadow-xs">
            <Sparkles className="size-3.5 text-primary" />
            Multi-tenant rental platform · Africa
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance md:text-6xl">
            Run your rental business on <span className="text-gradient-brand">one platform</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            {siteConfig.description} Built for car rental first — ready for motorcycles, equipment,
            machinery and trucks without re-architecting.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link to="/register">
                Start free trial <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            14-day free trial · No credit card required
          </p>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <Card className="group h-full gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-transform duration-200 group-hover:scale-105">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="mt-2">{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-3 text-muted-foreground">
            Start free for 14 days. Upgrade when you're ready — no lock-in.
          </p>
        </div>
        <Stagger className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <StaggerItem key={plan.name}>
              <Card
                className={cn(
                  'h-full',
                  plan.highlighted && 'border-primary/50 shadow-md ring-1 ring-primary/20',
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.highlighted ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        Most popular
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight tabular-nums">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-1">{plan.tagline}</CardDescription>
                </CardHeader>
                <div className="flex flex-1 flex-col gap-4 px-6">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-auto w-full"
                    variant={plan.highlighted ? 'brand' : 'outline'}
                  >
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-border/60 glass px-8 py-14 text-center glass-edge">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-brand opacity-15 blur-3xl"
            />
            <h2 className="text-3xl font-bold tracking-tight">Ready to run a tighter operation?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Set up your fleet, take your first booking, and see the numbers — all in minutes.
            </p>
            <Button asChild size="lg" variant="brand" className="mt-8">
              <Link to="/register">
                Start your free trial <ArrowRight />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
