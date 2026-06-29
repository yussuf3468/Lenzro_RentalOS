-- =============================================================================
-- 0005_billing — platform subscriptions & entitlements
-- -----------------------------------------------------------------------------
-- This is the SaaS layer (org → Lenzro). It is SEPARATE from operational billing
-- (org → its own customers), which arrives with the finance module.
-- =============================================================================

-- Global plan catalog.
create table public.subscription_plans (
  key text primary key, -- 'free_trial' | 'basic' | 'professional' | 'enterprise'
  name text not null,
  tier integer not null default 0,
  price_amount_minor bigint not null default 0,
  currency char(3) not null default 'USD',
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  trial_days integer not null default 0,
  is_public boolean not null default true
);

-- One row per (plan, feature). feature_key is a flag ('module.analytics') or a
-- limit ('limit.assets'); limit_value null = unlimited.
create table public.plan_entitlements (
  plan_key text not null references public.subscription_plans (key) on delete cascade,
  feature_key text not null,
  enabled boolean not null default true,
  limit_value integer,
  primary key (plan_key, feature_key)
);

-- Exactly one current subscription per organization.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  plan_key text not null references public.subscription_plans (key),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'grace', 'canceled', 'expired')),
  trial_end timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  grace_until timestamptz,
  cancel_at_period_end boolean not null default false,
  billing_customer_id text, -- provider-agnostic; unused until payments land
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id)
);

-- Append-only lifecycle log.
create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type text not null,
  from_plan text,
  to_plan text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index subscription_events_org_idx on public.subscription_events (organization_id, created_at desc);

create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger set_actor before insert or update on public.subscriptions
  for each row execute function public.set_actor();

-- Entitlement resolvers for the active org (used by future limit checks + UI gating).
create or replace function public.has_feature(feature text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((
    select pe.enabled
    from public.subscriptions s
    join public.plan_entitlements pe
      on pe.plan_key = s.plan_key and pe.feature_key = feature
    where s.organization_id = public.auth_org_id()
  ), false)
$$;

create or replace function public.entitlement_limit(feature text)
returns integer
language sql
stable
set search_path = ''
as $$
  select pe.limit_value
  from public.subscriptions s
  join public.plan_entitlements pe
    on pe.plan_key = s.plan_key and pe.feature_key = feature
  where s.organization_id = public.auth_org_id()
$$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.subscription_plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

create policy plans_read on public.subscription_plans
  for select to authenticated using (true);
create policy plans_admin_write on public.subscription_plans
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy plan_entitlements_read on public.plan_entitlements
  for select to authenticated using (true);
create policy plan_entitlements_admin_write on public.plan_entitlements
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (organization_id in (select public.user_organization_ids()) or public.is_platform_admin());
create policy subscriptions_manage on public.subscriptions
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('billing:manage'))
  with check (organization_id = (select public.auth_org_id()) and public.can('billing:manage'));

create policy subscription_events_select on public.subscription_events
  for select to authenticated
  using (
    (organization_id = (select public.auth_org_id()) and public.can('billing:read'))
    or public.is_platform_admin()
  );
