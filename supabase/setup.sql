-- =============================================================================
-- Lenzro RentalOS — one-paste FRESH setup for the Supabase SQL Editor.
-- Generated from supabase/migrations/* + supabase/seed/seed.sql (the source of truth).
-- For a NEW project: run this whole file once, then enable the auth hook.
-- Already set up? Only run the NEW migration file(s) (e.g. 0012_money.sql).
-- =============================================================================


-- >>> supabase/migrations/0000_extensions.sql
-- =============================================================================
-- 0000_extensions — required Postgres extensions
-- =============================================================================
-- pgcrypto   : cryptographic functions (token hashing, gen_random_uuid fallback)
-- btree_gist : composite GiST indexes → exclusion constraints (no double-booking)
-- pg_trgm    : trigram fuzzy search (customers, assets)
-- citext     : case-insensitive text (emails, slugs)
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists citext with schema extensions;


-- >>> supabase/migrations/0001_core_helpers.sql
-- =============================================================================
-- 0001_core_helpers — tenant / JWT helpers + shared triggers
-- -----------------------------------------------------------------------------
-- These helpers have NO table dependencies, so they can exist before any domain
-- tables. Table-dependent helpers (e.g. can(perm) over role_permissions) and the
-- audit trigger are introduced alongside their tables in later phases.
--
-- All functions pin search_path = '' and schema-qualify references for safety.
-- =============================================================================

-- Active organization id from the JWT (stamped by the Custom Access Token Hook).
create or replace function public.auth_org_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'organization_id', '')::uuid
$$;

comment on function public.auth_org_id() is
  'Active tenant (organization) id from the JWT app_metadata claim.';

-- Active organization role from the JWT.
create or replace function public.auth_role()
returns text
language sql
stable
set search_path = ''
as $$
  select auth.jwt() -> 'app_metadata' ->> 'role'
$$;

comment on function public.auth_role() is
  'Active organization role from the JWT app_metadata claim.';

-- Is the caller a Lenzro platform admin (cross-tenant)?
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'platform_role') is not null, false)
$$;

comment on function public.is_platform_admin() is
  'True when the JWT carries a platform_role (Super Admin / Lenzro Admin).';

-- BEFORE UPDATE trigger: keep updated_at current. Never trust the client value.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at = now().';

-- BEFORE INSERT/UPDATE trigger: stamp the acting user. Attach only to tables
-- that carry created_by / updated_by (all tenant tables).
create or replace function public.set_actor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_by := auth.uid();
  return new;
end;
$$;

comment on function public.set_actor() is
  'BEFORE INSERT/UPDATE trigger: stamps created_by/updated_by from auth.uid().';


-- >>> supabase/migrations/0002_rbac.sql
-- =============================================================================
-- 0002_rbac — permission-based RBAC catalog (global, seeded)
-- -----------------------------------------------------------------------------
-- Code and policies check PERMISSIONS, never role names, so roles stay expandable.
-- Roles are named bundles of permissions. These tables are global catalogs:
-- readable by any authenticated user, writable only by Lenzro platform admins.
-- =============================================================================

create table public.roles (
  key text primary key,
  label text not null,
  scope text not null default 'organization' check (scope in ('organization', 'platform')),
  description text,
  is_system boolean not null default true,
  rank integer not null default 0
);

create table public.permissions (
  key text primary key, -- '<resource>:<action>'
  resource text not null,
  action text not null,
  description text
);

create table public.role_permissions (
  role_key text not null references public.roles (key) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

create index role_permissions_permission_idx on public.role_permissions (permission_key);

-- Effective permission check used in RLS write policies and RPCs.
create or replace function public.can(perm text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1
      from public.role_permissions rp
      where rp.role_key = (auth.jwt() -> 'app_metadata' ->> 'role')
        and rp.permission_key = perm
    )
$$;

comment on function public.can(text) is
  'True when the active JWT role grants <resource>:<action>, or the caller is a platform admin.';

-- RLS: catalogs are world-readable to authenticated; only platform admins write.
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy roles_read on public.roles
  for select to authenticated using (true);
create policy roles_admin_write on public.roles
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy permissions_read on public.permissions
  for select to authenticated using (true);
create policy permissions_admin_write on public.permissions
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy role_permissions_read on public.role_permissions
  for select to authenticated using (true);
create policy role_permissions_admin_write on public.role_permissions
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());


-- >>> supabase/migrations/0003_identity.sql
-- =============================================================================
-- 0003_identity — organizations (tenants), profiles, platform admins
-- =============================================================================

-- App projection of auth.users (auth.users itself is never exposed).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_path text,
  active_organization_id uuid, -- FK added after organizations exists
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The tenant root.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  legal_name text,
  country char(2) not null default 'KE',
  default_currency char(3) not null default 'KES',
  timezone text not null default 'Africa/Nairobi',
  logo_path text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

alter table public.profiles
  add constraint profiles_active_org_fkey
  foreign key (active_organization_id) references public.organizations (id) on delete set null;

create index profiles_active_org_idx on public.profiles (active_organization_id);
create index organizations_status_idx on public.organizations (status) where deleted_at is null;

-- Lenzro staff (cross-tenant). The hook reads platform_role from here into the JWT.
create table public.platform_admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  platform_role text not null check (platform_role in ('super_admin', 'lenzro_admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The set of organizations the caller belongs to, read from the JWT org_ids claim
-- (stamped by the access-token hook). No table access → no RLS recursion, fast.
create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select (
    jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'org_ids', '[]'::jsonb))
  )::uuid
$$;

comment on function public.user_organization_ids() is
  'Organizations the caller is an active member of, from the JWT app_metadata.org_ids claim.';

-- updated_at triggers
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.platform_admins enable row level security;

-- profiles: self now; co-member visibility is added in 0004 (after memberships).
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_platform_admin());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organizations: members see their orgs (via JWT org_ids); owners/managers update.
create policy organizations_select on public.organizations
  for select to authenticated
  using (id in (select public.user_organization_ids()) or public.is_platform_admin());

create policy organizations_update on public.organizations
  for update to authenticated
  using (id = (select public.auth_org_id()) and public.can('organization:manage'))
  with check (id = (select public.auth_org_id()) and public.can('organization:manage'));

create policy organizations_admin_all on public.organizations
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- platform_admins: a user may read their own row; only platform admins manage.
create policy platform_admins_self_read on public.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_admin());

create policy platform_admins_admin_write on public.platform_admins
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());


-- >>> supabase/migrations/0004_membership.sql
-- =============================================================================
-- 0004_membership — memberships (user ↔ org ↔ role) and invitations
-- =============================================================================

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null references public.roles (key),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  invited_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (organization_id, user_id)
);

create index memberships_user_active_idx on public.memberships (user_id) where status = 'active';
create index memberships_org_idx on public.memberships (organization_id, status);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email citext not null,
  role text not null references public.roles (key),
  token_hash text not null, -- sha256 of the raw token; raw token only lives in the email link
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references public.profiles (id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index invitations_unique_pending
  on public.invitations (organization_id, email) where status = 'pending';
create index invitations_token_idx on public.invitations (token_hash);
create index invitations_email_pending_idx on public.invitations (email) where status = 'pending';

-- triggers
create trigger set_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();
create trigger set_actor before insert or update on public.memberships
  for each row execute function public.set_actor();
create trigger set_updated_at before update on public.invitations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

-- Members see the roster of any org they belong to.
create policy memberships_select on public.memberships
  for select to authenticated
  using (organization_id in (select public.user_organization_ids()) or public.is_platform_admin());

-- Direct roster management requires members:manage in the active org (most flows use RPCs).
create policy memberships_manage on public.memberships
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('members:manage'))
  with check (organization_id = (select public.auth_org_id()) and public.can('members:manage'));

-- Now that memberships exists, let users see profiles of people they share an org with.
create policy profiles_select_comembers on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.user_id = public.profiles.id
        and m.organization_id in (select public.user_organization_ids())
        and m.status = 'active'
    )
  );

-- Invitations: members with invite permission manage them for the active org.
-- (Invitees read/accept via SECURITY DEFINER RPCs, not direct table access.)
create policy invitations_manage on public.invitations
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('members:invite'))
  with check (organization_id = (select public.auth_org_id()) and public.can('members:invite'));

create policy invitations_admin_read on public.invitations
  for select to authenticated
  using (public.is_platform_admin());


-- >>> supabase/migrations/0005_billing.sql
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


-- >>> supabase/migrations/0006_auth_hook.sql
-- =============================================================================
-- 0006_auth_hook — Custom Access Token Hook
-- -----------------------------------------------------------------------------
-- Runs on every token issue/refresh (as role supabase_auth_admin). Stamps the
-- active tenant + role + platform role + org list into JWT app_metadata, which
-- RLS reads via auth_org_id() / auth_role() / is_platform_admin() / user_organization_ids().
-- Enable in config.toml: [auth.hook.custom_access_token].
-- =============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  app_meta jsonb := coalesce(claims -> 'app_metadata', '{}'::jsonb);
  uid uuid := (event ->> 'user_id')::uuid;
  active_org uuid;
  active_role text;
  plat_role text;
  org_ids jsonb;
begin
  select active_organization_id into active_org from public.profiles where id = uid;
  select platform_role into plat_role from public.platform_admins where user_id = uid;

  -- The stored active org is authoritative only if it is still an active membership.
  if active_org is not null then
    select role into active_role
    from public.memberships
    where user_id = uid and organization_id = active_org and status = 'active';
    if active_role is null then
      active_org := null;
    end if;
  end if;

  -- Fall back to the user's first active membership.
  if active_org is null then
    select organization_id, role into active_org, active_role
    from public.memberships
    where user_id = uid and status = 'active'
    order by created_at
    limit 1;
  end if;

  select coalesce(jsonb_agg(organization_id), '[]'::jsonb) into org_ids
  from public.memberships
  where user_id = uid and status = 'active';

  app_meta := app_meta || jsonb_build_object('org_ids', org_ids);
  if active_org is not null then
    app_meta := app_meta || jsonb_build_object('organization_id', active_org, 'role', active_role);
  end if;
  if plat_role is not null then
    app_meta := app_meta || jsonb_build_object('platform_role', plat_role);
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_meta);
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Grants: only supabase_auth_admin may run the hook; it must read the source tables.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.profiles, public.memberships, public.platform_admins to supabase_auth_admin;

-- supabase_auth_admin is not bypassrls, so it needs explicit read policies.
create policy auth_admin_read_profiles on public.profiles
  for select to supabase_auth_admin using (true);
create policy auth_admin_read_memberships on public.memberships
  for select to supabase_auth_admin using (true);
create policy auth_admin_read_platform_admins on public.platform_admins
  for select to supabase_auth_admin using (true);


-- >>> supabase/migrations/0007_rpc.sql
-- =============================================================================
-- 0007_rpc — transactional, security-definer RPCs for auth/org/invite flows
-- -----------------------------------------------------------------------------
-- These run as definer (owner: postgres) so bootstrap writes (creating the very
-- first org + membership before any JWT claim exists) succeed, while still
-- authorizing the caller explicitly via auth.uid() / can().
-- =============================================================================

-- Create an organization; caller becomes Owner on a free trial. Atomic.
create or replace function public.create_organization(
  p_name text,
  p_country char(2) default 'KE',
  p_currency char(3) default 'KES',
  p_timezone text default 'Africa/Nairobi'
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  base_slug text;
  final_slug text;
  n int := 0;
  v_trial_days int;
  new_org public.organizations;
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'LNZ_INVALID_NAME';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := 'org';
  end if;
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n::text;
  end loop;

  insert into public.organizations
    (slug, name, country, default_currency, timezone, created_by, updated_by)
  values (final_slug, trim(p_name), p_country, p_currency, p_timezone, uid, uid)
  returning * into new_org;

  insert into public.memberships
    (organization_id, user_id, role, status, accepted_at, created_by, updated_by)
  values (new_org.id, uid, 'owner', 'active', now(), uid, uid);

  select trial_days into v_trial_days from public.subscription_plans where key = 'free_trial';
  v_trial_days := coalesce(v_trial_days, 14);

  insert into public.subscriptions
    (organization_id, plan_key, status, trial_end, current_period_end, created_by, updated_by)
  values (
    new_org.id, 'free_trial', 'trialing',
    now() + (v_trial_days || ' days')::interval,
    now() + (v_trial_days || ' days')::interval,
    uid, uid
  );

  insert into public.subscription_events (organization_id, type, to_plan, created_by)
  values (new_org.id, 'trial_started', 'free_trial', uid);

  update public.profiles set active_organization_id = new_org.id where id = uid;

  return new_org;
end;
$$;

-- Switch the active organization (caller must be an active member). Refresh the
-- session afterwards so the JWT picks up the new claims.
create or replace function public.set_active_organization(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;
  if not exists (
    select 1 from public.memberships
    where user_id = uid and organization_id = p_org and status = 'active'
  ) then
    raise exception 'LNZ_NOT_A_MEMBER';
  end if;
  update public.profiles set active_organization_id = p_org where id = uid;
end;
$$;

-- Invite a teammate to the active org. Returns the one-time raw token so the app
-- can build a share link / email it (automated email lands when a provider is wired).
create or replace function public.invite_member(p_email text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  org uuid := public.auth_org_id();
  raw_token text;
  inv public.invitations;
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;
  if org is null then
    raise exception 'LNZ_NO_ACTIVE_ORG';
  end if;
  if not public.can('members:invite') then
    raise exception 'LNZ_FORBIDDEN';
  end if;
  if not exists (
    select 1 from public.roles where key = p_role and scope = 'organization'
  ) then
    raise exception 'LNZ_INVALID_ROLE';
  end if;

  raw_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.invitations (organization_id, email, role, token_hash, invited_by)
  values (
    org, lower(trim(p_email)), p_role,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'), uid
  )
  on conflict (organization_id, email) where (status = 'pending')
  do update set
    role = excluded.role,
    token_hash = excluded.token_hash,
    invited_by = excluded.invited_by,
    expires_at = now() + interval '7 days',
    updated_at = now()
  returning * into inv;

  return jsonb_build_object(
    'invitation_id', inv.id,
    'email', inv.email,
    'role', inv.role,
    'token', raw_token,
    'expires_at', inv.expires_at
  );
end;
$$;

-- Safe, pre-membership lookup of an invitation by raw token (for the accept page).
create or replace function public.get_invitation(p_token text)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'email', i.email,
    'role', i.role,
    'organization_name', o.name,
    'organization_slug', o.slug,
    'expires_at', i.expires_at,
    'valid', (i.status = 'pending' and i.expires_at > now())
  )
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  limit 1
$$;

-- Accept an invitation: activates membership for the caller. Enforces email match.
create or replace function public.accept_invitation(p_token text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  inv public.invitations;
  org public.organizations;
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;

  select * into inv from public.invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and status = 'pending'
    and expires_at > now();
  if inv.id is null then
    raise exception 'LNZ_INVALID_INVITATION';
  end if;

  select email into user_email from auth.users where id = uid;
  if lower(user_email) <> lower(inv.email::text) then
    raise exception 'LNZ_EMAIL_MISMATCH';
  end if;

  insert into public.memberships
    (organization_id, user_id, role, status, invited_by, accepted_at, created_by, updated_by)
  values (inv.organization_id, uid, inv.role, 'active', inv.invited_by, now(), uid, uid)
  on conflict (organization_id, user_id)
  do update set status = 'active', role = excluded.role, accepted_at = now(), updated_at = now();

  update public.invitations
  set status = 'accepted', accepted_at = now(), accepted_by = uid, updated_at = now()
  where id = inv.id;

  update public.profiles set active_organization_id = inv.organization_id
  where id = uid and active_organization_id is null;

  select * into org from public.organizations where id = inv.organization_id;
  return org;
end;
$$;


-- >>> supabase/migrations/0008_assets.sql
-- =============================================================================
-- 0008_assets — the generic rentable-asset model (Phase 4)
-- -----------------------------------------------------------------------------
-- "Vehicle" is the car-rental presentation of a generic `asset`. The same tables
-- serve motorcycles, equipment, machinery and trucks — only configuration differs.
-- Written idempotently so it is safe to paste into the SQL Editor more than once.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- asset_kinds — global catalog of rental verticals
-- ----------------------------------------------------------------------------
create table if not exists public.asset_kinds (
  key text primary key,
  label text not null,
  icon text,
  sort integer not null default 0,
  is_active boolean not null default true
);

insert into public.asset_kinds (key, label, icon, sort) values
  ('vehicle', 'Vehicles', 'car', 10),
  ('motorcycle', 'Motorcycles', 'bike', 20),
  ('equipment', 'Equipment', 'wrench', 30),
  ('machinery', 'Machinery', 'tractor', 40),
  ('truck', 'Trucks', 'truck', 50)
on conflict (key) do update
  set label = excluded.label, icon = excluded.icon, sort = excluded.sort;

alter table public.asset_kinds enable row level security;
drop policy if exists asset_kinds_read on public.asset_kinds;
create policy asset_kinds_read on public.asset_kinds
  for select to authenticated using (true);
drop policy if exists asset_kinds_admin on public.asset_kinds;
create policy asset_kinds_admin on public.asset_kinds
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- asset_categories — per-org grouping (e.g. Economy, SUV, Excavators)
-- ----------------------------------------------------------------------------
create table if not exists public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  asset_kind text not null references public.asset_kinds (key) default 'vehicle',
  name text not null,
  code text,
  description text,
  default_daily_rate_amount_minor bigint not null default 0,
  currency char(3) not null default 'KES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create index if not exists asset_categories_org_idx
  on public.asset_categories (organization_id) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- assets — the rentable units
-- ----------------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  category_id uuid references public.asset_categories (id) on delete set null,
  asset_kind text not null references public.asset_kinds (key) default 'vehicle',
  name text not null,
  identifier text, -- plate / VIN / serial number
  status text not null default 'available'
    check (status in ('available', 'rented', 'reserved', 'maintenance', 'out_of_service', 'retired')),
  attributes jsonb not null default '{}'::jsonb, -- type-specific fields (make, seats, …)
  daily_rate_amount_minor bigint not null default 0,
  currency char(3) not null default 'KES',
  color text,
  year integer,
  odometer integer,
  notes text,
  primary_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,
  unique (organization_id, identifier)
);

create index if not exists assets_org_status_idx
  on public.assets (organization_id, status) where deleted_at is null;
create index if not exists assets_category_idx on public.assets (category_id);
create index if not exists assets_kind_idx
  on public.assets (organization_id, asset_kind) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- asset_images — gallery (files live in the asset-images storage bucket)
-- ----------------------------------------------------------------------------
create table if not exists public.asset_images (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  path text not null,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists asset_images_asset_idx on public.asset_images (asset_id, sort);

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.asset_categories;
create trigger set_updated_at before update on public.asset_categories
  for each row execute function public.set_updated_at();
drop trigger if exists set_actor on public.asset_categories;
create trigger set_actor before insert or update on public.asset_categories
  for each row execute function public.set_actor();

drop trigger if exists set_updated_at on public.assets;
create trigger set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
drop trigger if exists set_actor on public.assets;
create trigger set_actor before insert or update on public.assets
  for each row execute function public.set_actor();

-- Enforce the plan's asset limit in the database (feature locking, server-side).
create or replace function public.enforce_asset_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  lim integer;
  cnt integer;
begin
  lim := public.entitlement_limit('limit.assets');
  if lim is null then
    return new; -- unlimited
  end if;
  select count(*) into cnt
  from public.assets
  where organization_id = new.organization_id and deleted_at is null;
  if cnt >= lim then
    raise exception 'LNZ_PLAN_LIMIT_REACHED' using detail = 'limit.assets';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_asset_limit on public.assets;
create trigger enforce_asset_limit before insert on public.assets
  for each row execute function public.enforce_asset_limit();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.asset_categories enable row level security;
alter table public.assets enable row level security;
alter table public.asset_images enable row level security;

drop policy if exists asset_categories_select on public.asset_categories;
create policy asset_categories_select on public.asset_categories
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());
drop policy if exists asset_categories_write on public.asset_categories;
create policy asset_categories_write on public.asset_categories
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('assets:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('assets:write'));

drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());
drop policy if exists assets_insert on public.assets;
create policy assets_insert on public.assets
  for insert to authenticated
  with check (organization_id = (select public.auth_org_id()) and public.can('assets:write'));
drop policy if exists assets_update on public.assets;
create policy assets_update on public.assets
  for update to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('assets:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('assets:write'));
drop policy if exists assets_delete on public.assets;
create policy assets_delete on public.assets
  for delete to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('assets:delete'));

drop policy if exists asset_images_select on public.asset_images;
create policy asset_images_select on public.asset_images
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());
drop policy if exists asset_images_write on public.asset_images;
create policy asset_images_write on public.asset_images
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('assets:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('assets:write'));

-- ----------------------------------------------------------------------------
-- Storage: public asset-images bucket (vehicle photos are not sensitive).
-- Writes are restricted to org members with assets:write; reads are public.
-- Path convention: {organization_id}/{uuid}.{ext}
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('asset-images', 'asset-images', true)
on conflict (id) do update set public = true;

drop policy if exists asset_images_storage_insert on storage.objects;
create policy asset_images_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'asset-images'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('assets:write')
  );
drop policy if exists asset_images_storage_update on storage.objects;
create policy asset_images_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'asset-images'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('assets:write')
  );
drop policy if exists asset_images_storage_delete on storage.objects;
create policy asset_images_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'asset-images'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('assets:write')
  );


-- >>> supabase/migrations/0009_customers.sql
-- =============================================================================
-- 0009_customers — customers / clients with KYC (Phase 5)
-- -----------------------------------------------------------------------------
-- Stores the people (and companies) you rent to, plus their identity documents
-- (national ID front/back, driving licence, KRA PIN). Documents live in a PRIVATE
-- storage bucket and are served via short-lived signed URLs. Tenant-isolated via RLS.
-- Idempotent — safe to paste into the SQL Editor more than once.
-- =============================================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  type text not null default 'individual' check (type in ('individual', 'company')),
  full_name text not null,
  company_name text,
  email text,
  phone text,
  id_number text,
  license_number text,
  license_expiry date,
  kra_pin text,
  date_of_birth date,
  address text,
  city text,
  country char(2) default 'KE',
  status text not null default 'active' check (status in ('active', 'blocked')),
  notes text,
  id_front_path text,
  id_back_path text,
  license_path text,
  kra_pin_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);

create index if not exists customers_org_idx
  on public.customers (organization_id) where deleted_at is null;
create index if not exists customers_name_idx
  on public.customers (organization_id, full_name) where deleted_at is null;

-- Additional / overflow documents beyond the four named slots above.
create table if not exists public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  kind text not null default 'other',
  label text,
  path text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists customer_documents_customer_idx
  on public.customer_documents (customer_id);

-- Triggers
drop trigger if exists set_updated_at on public.customers;
create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
drop trigger if exists set_actor on public.customers;
create trigger set_actor before insert or update on public.customers
  for each row execute function public.set_actor();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.customer_documents enable row level security;

drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());
drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers
  for insert to authenticated
  with check (organization_id = (select public.auth_org_id()) and public.can('customers:write'));
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers
  for update to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('customers:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('customers:write'));
drop policy if exists customers_delete on public.customers;
create policy customers_delete on public.customers
  for delete to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('customers:delete'));

drop policy if exists customer_documents_select on public.customer_documents;
create policy customer_documents_select on public.customer_documents
  for select to authenticated
  using (
    (organization_id = (select public.auth_org_id()) and public.can('customers:read'))
    or public.is_platform_admin()
  );
drop policy if exists customer_documents_write on public.customer_documents;
create policy customer_documents_write on public.customer_documents
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('customers:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('customers:write'));

-- ----------------------------------------------------------------------------
-- Storage: PRIVATE customer-documents bucket (KYC is sensitive).
-- Reads require customers:read (served via signed URLs); writes need customers:write.
-- Path convention: {organization_id}/{customer_id}/{kind}-{uuid}.{ext}
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do update set public = false;

drop policy if exists customer_docs_storage_read on storage.objects;
create policy customer_docs_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('customers:read')
  );
drop policy if exists customer_docs_storage_insert on storage.objects;
create policy customer_docs_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('customers:write')
  );
drop policy if exists customer_docs_storage_update on storage.objects;
create policy customer_docs_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('customers:write')
  );
drop policy if exists customer_docs_storage_delete on storage.objects;
create policy customer_docs_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('customers:write')
  );


-- >>> supabase/migrations/0010_staff.sql
-- =============================================================================
-- 0010_staff — manage staff: change a member's role, remove a member
-- -----------------------------------------------------------------------------
-- Security-definer RPCs gated by members:manage (Owner only, per the seed). They
-- enforce safeguards RLS can't: never demote/remove the last Owner, never remove
-- yourself. Idempotent (create or replace).
-- =============================================================================

create or replace function public.update_member_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  org uuid := public.auth_org_id();
  owner_count int;
begin
  if not public.can('members:manage') then
    raise exception 'LNZ_FORBIDDEN';
  end if;
  if org is null then
    raise exception 'LNZ_NO_ACTIVE_ORG';
  end if;
  if not exists (select 1 from public.roles where key = p_role and scope = 'organization') then
    raise exception 'LNZ_INVALID_ROLE';
  end if;
  if not exists (
    select 1 from public.memberships
    where organization_id = org and user_id = p_user_id and status = 'active'
  ) then
    raise exception 'LNZ_NOT_A_MEMBER';
  end if;

  -- Don't demote the last remaining owner.
  if p_role <> 'owner' then
    select count(*) into owner_count
    from public.memberships
    where organization_id = org and role = 'owner' and status = 'active';
    if owner_count <= 1 and exists (
      select 1 from public.memberships
      where organization_id = org and user_id = p_user_id and role = 'owner' and status = 'active'
    ) then
      raise exception 'LNZ_LAST_OWNER';
    end if;
  end if;

  update public.memberships
  set role = p_role, updated_at = now()
  where organization_id = org and user_id = p_user_id;
end;
$$;

create or replace function public.remove_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  org uuid := public.auth_org_id();
  uid uuid := auth.uid();
  owner_count int;
begin
  if not public.can('members:manage') then
    raise exception 'LNZ_FORBIDDEN';
  end if;
  if org is null then
    raise exception 'LNZ_NO_ACTIVE_ORG';
  end if;
  if p_user_id = uid then
    raise exception 'LNZ_CANNOT_REMOVE_SELF';
  end if;
  if not exists (
    select 1 from public.memberships
    where organization_id = org and user_id = p_user_id and status = 'active'
  ) then
    raise exception 'LNZ_NOT_A_MEMBER';
  end if;

  -- Don't remove the last remaining owner.
  if exists (
    select 1 from public.memberships
    where organization_id = org and user_id = p_user_id and role = 'owner' and status = 'active'
  ) then
    select count(*) into owner_count
    from public.memberships
    where organization_id = org and role = 'owner' and status = 'active';
    if owner_count <= 1 then
      raise exception 'LNZ_LAST_OWNER';
    end if;
  end if;

  delete from public.memberships where organization_id = org and user_id = p_user_id;
  update public.profiles
  set active_organization_id = null
  where id = p_user_id and active_organization_id = org;
end;
$$;


-- >>> supabase/migrations/0011_rentals.sql
-- =============================================================================
-- 0011_rentals — the rental lifecycle (Phase A of the product vision)
-- -----------------------------------------------------------------------------
-- A rental is one pass through the core state machine:
--   quote → reserved → checked_out → returned → settled
--   (branches: cancelled, no_show; "overdue" is derived: checked_out + past end)
-- The exclusion constraint below is the double-booking killer: one asset can
-- never hold two overlapping active rentals. btree_gist was installed in 0000
-- for exactly this. Idempotent — safe to paste into the SQL Editor twice.
-- =============================================================================

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  asset_id uuid not null references public.assets (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,

  status text not null default 'reserved' check (
    status in ('quote', 'reserved', 'checked_out', 'returned', 'settled', 'cancelled', 'no_show')
  ),

  -- Planned window (what was booked) and actual custody timestamps.
  start_at timestamptz not null,
  end_at timestamptz not null,
  actual_out_at timestamptz,
  actual_return_at timestamptz,

  -- Money (integer minor units + ISO code, per platform convention).
  daily_rate_amount_minor bigint not null default 0 check (daily_rate_amount_minor >= 0),
  total_amount_minor bigint not null default 0 check (total_amount_minor >= 0),
  deposit_amount_minor bigint not null default 0 check (deposit_amount_minor >= 0),
  paid_amount_minor bigint not null default 0 check (paid_amount_minor >= 0),
  currency char(3) not null default 'KES',

  pickup_location text,
  return_location text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz,

  constraint rentals_window_valid check (end_at > start_at)
);

-- The double-booking killer: no two active rentals may overlap on one asset.
-- Applies while a rental holds the asset (reserved / checked_out) and is live.
alter table public.rentals drop constraint if exists rentals_no_overlap;
alter table public.rentals add constraint rentals_no_overlap
  exclude using gist (
    asset_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status in ('reserved', 'checked_out') and deleted_at is null);

create index if not exists rentals_org_idx
  on public.rentals (organization_id) where deleted_at is null;
create index if not exists rentals_org_status_idx
  on public.rentals (organization_id, status) where deleted_at is null;
create index if not exists rentals_asset_idx
  on public.rentals (asset_id) where deleted_at is null;
create index if not exists rentals_customer_idx
  on public.rentals (customer_id) where deleted_at is null;
create index if not exists rentals_window_idx
  on public.rentals (organization_id, start_at, end_at) where deleted_at is null;

-- Triggers (shared helpers from 0001).
drop trigger if exists set_updated_at on public.rentals;
create trigger set_updated_at before update on public.rentals
  for each row execute function public.set_updated_at();
drop trigger if exists set_actor on public.rentals;
create trigger set_actor before insert or update on public.rentals
  for each row execute function public.set_actor();

-- ----------------------------------------------------------------------------
-- RLS — tenant-isolated; uses the bookings:* permissions seeded in Phase 0.
-- ----------------------------------------------------------------------------
alter table public.rentals enable row level security;

drop policy if exists rentals_select on public.rentals;
create policy rentals_select on public.rentals
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());

drop policy if exists rentals_insert on public.rentals;
create policy rentals_insert on public.rentals
  for insert to authenticated
  with check (organization_id = (select public.auth_org_id()) and public.can('bookings:write'));

drop policy if exists rentals_update on public.rentals;
create policy rentals_update on public.rentals
  for update to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('bookings:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('bookings:write'));

drop policy if exists rentals_delete on public.rentals;
create policy rentals_delete on public.rentals
  for delete to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('bookings:delete'));


-- >>> supabase/migrations/0012_money.sql
-- =============================================================================
-- 0012_money — payments, deposits and expenses (Phase B of the product vision)
-- -----------------------------------------------------------------------------
-- Every shilling attached to a rental. `payments` records actual money
-- movements (M-Pesa / cash / bank / card) against a rental: rental fees in,
-- deposits in, deposit refunds out. Deposit held = received − refunded.
-- `expenses` records per-vehicle (or general) running costs for the P&L.
-- rentals.paid_amount_minor is kept in sync by trigger so the whole app agrees
-- on balances. Idempotent — safe to paste into the SQL Editor twice.
-- =============================================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  rental_id uuid not null references public.rentals (id) on delete cascade,
  kind text not null default 'rental_payment' check (
    kind in ('rental_payment', 'deposit_received', 'deposit_refund')
  ),
  method text not null default 'mpesa' check (
    method in ('mpesa', 'cash', 'bank', 'card', 'other')
  ),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'KES',
  reference text,
  received_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists payments_org_idx on public.payments (organization_id);
create index if not exists payments_rental_idx on public.payments (rental_id);
create index if not exists payments_org_received_idx
  on public.payments (organization_id, received_at desc);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  asset_id uuid references public.assets (id) on delete set null,
  category text not null default 'other' check (
    category in ('fuel', 'service', 'repair', 'insurance', 'tracker', 'parking', 'wash', 'other')
  ),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'KES',
  incurred_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists expenses_org_idx on public.expenses (organization_id);
create index if not exists expenses_asset_idx on public.expenses (asset_id);
create index if not exists expenses_org_incurred_idx
  on public.expenses (organization_id, incurred_at desc);

drop trigger if exists set_actor on public.payments;
create trigger set_actor before insert on public.payments
  for each row execute function public.set_actor();
drop trigger if exists set_actor on public.expenses;
create trigger set_actor before insert on public.expenses
  for each row execute function public.set_actor();

-- ----------------------------------------------------------------------------
-- Keep rentals.paid_amount_minor = sum of that rental's fee payments.
-- SECURITY DEFINER: an accountant with payments:write may lack bookings:write,
-- so the sync must bypass the rentals RLS update policy safely.
-- ----------------------------------------------------------------------------
create or replace function public.sync_rental_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rental uuid;
begin
  v_rental := coalesce(new.rental_id, old.rental_id);
  update public.rentals r
     set paid_amount_minor = coalesce((
       select sum(p.amount_minor) from public.payments p
        where p.rental_id = v_rental and p.kind = 'rental_payment'
     ), 0)
   where r.id = v_rental;

  -- If a payment was moved between rentals, recompute the old one too.
  if tg_op = 'UPDATE' and old.rental_id is distinct from new.rental_id then
    update public.rentals r
       set paid_amount_minor = coalesce((
         select sum(p.amount_minor) from public.payments p
          where p.rental_id = old.rental_id and p.kind = 'rental_payment'
       ), 0)
     where r.id = old.rental_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_rental_paid on public.payments;
create trigger sync_rental_paid after insert or update or delete on public.payments
  for each row execute function public.sync_rental_paid();

-- ----------------------------------------------------------------------------
-- RLS — tenant-isolated; payments:* / expenses:* permissions seeded in Phase 0.
-- ----------------------------------------------------------------------------
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert to authenticated
  with check (organization_id = (select public.auth_org_id()) and public.can('payments:write'));

drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments
  for update to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('payments:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('payments:write'));

drop policy if exists payments_delete on public.payments;
create policy payments_delete on public.payments
  for delete to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('payments:write'));

drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert to authenticated
  with check (organization_id = (select public.auth_org_id()) and public.can('expenses:write'));

drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  for update to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('expenses:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('expenses:write'));

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('expenses:write'));


-- >>> supabase/seed/seed.sql
-- =============================================================================
-- Seed data — idempotent (safe to re-run). Catalogs only; no tenant data.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Roles
-- ----------------------------------------------------------------------------
insert into public.roles (key, label, scope, rank, description) values
  ('owner', 'Owner', 'organization', 100, 'Full control of the organization'),
  ('manager', 'Manager', 'organization', 80, 'Manage operations and staff'),
  ('accountant', 'Accountant', 'organization', 60, 'Finance and reporting'),
  ('receptionist', 'Receptionist', 'organization', 50, 'Front desk: bookings and customers'),
  ('mechanic', 'Mechanic', 'organization', 40, 'Maintenance and repairs'),
  ('driver', 'Driver', 'organization', 30, 'Assigned trips and contracts'),
  ('customer', 'Customer', 'organization', 10, 'End customer (portal)'),
  ('super_admin', 'Super Admin', 'platform', 1000, 'Lenzro platform super admin'),
  ('lenzro_admin', 'Lenzro Admin', 'platform', 900, 'Lenzro support admin')
on conflict (key) do update
  set label = excluded.label, scope = excluded.scope,
      rank = excluded.rank, description = excluded.description;

-- ----------------------------------------------------------------------------
-- Permissions (resource:action)
-- ----------------------------------------------------------------------------
insert into public.permissions (key, resource, action) values
  ('organization:read', 'organization', 'read'),
  ('organization:manage', 'organization', 'manage'),
  ('members:read', 'members', 'read'),
  ('members:invite', 'members', 'invite'),
  ('members:manage', 'members', 'manage'),
  ('billing:read', 'billing', 'read'),
  ('billing:manage', 'billing', 'manage'),
  ('assets:read', 'assets', 'read'),
  ('assets:write', 'assets', 'write'),
  ('assets:delete', 'assets', 'delete'),
  ('bookings:read', 'bookings', 'read'),
  ('bookings:write', 'bookings', 'write'),
  ('bookings:delete', 'bookings', 'delete'),
  ('customers:read', 'customers', 'read'),
  ('customers:write', 'customers', 'write'),
  ('customers:delete', 'customers', 'delete'),
  ('drivers:read', 'drivers', 'read'),
  ('drivers:write', 'drivers', 'write'),
  ('employees:read', 'employees', 'read'),
  ('employees:write', 'employees', 'write'),
  ('maintenance:read', 'maintenance', 'read'),
  ('maintenance:write', 'maintenance', 'write'),
  ('expenses:read', 'expenses', 'read'),
  ('expenses:write', 'expenses', 'write'),
  ('income:read', 'income', 'read'),
  ('income:write', 'income', 'write'),
  ('invoices:read', 'invoices', 'read'),
  ('invoices:write', 'invoices', 'write'),
  ('invoices:approve', 'invoices', 'approve'),
  ('payments:read', 'payments', 'read'),
  ('payments:write', 'payments', 'write'),
  ('contracts:read', 'contracts', 'read'),
  ('contracts:write', 'contracts', 'write'),
  ('reports:read', 'reports', 'read'),
  ('reports:export', 'reports', 'export'),
  ('analytics:read', 'analytics', 'read'),
  ('documents:read', 'documents', 'read'),
  ('documents:write', 'documents', 'write'),
  ('settings:read', 'settings', 'read'),
  ('settings:manage', 'settings', 'manage'),
  ('audit:read', 'audit', 'read'),
  ('support:read', 'support', 'read'),
  ('support:write', 'support', 'write')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Role → permission mappings
-- ----------------------------------------------------------------------------
-- Owner gets everything.
insert into public.role_permissions (role_key, permission_key)
select 'owner', key from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key) values
  -- Manager: operations + staff, no org/billing/role administration.
  ('manager', 'organization:read'), ('manager', 'members:read'), ('manager', 'members:invite'),
  ('manager', 'billing:read'),
  ('manager', 'assets:read'), ('manager', 'assets:write'), ('manager', 'assets:delete'),
  ('manager', 'bookings:read'), ('manager', 'bookings:write'), ('manager', 'bookings:delete'),
  ('manager', 'customers:read'), ('manager', 'customers:write'), ('manager', 'customers:delete'),
  ('manager', 'drivers:read'), ('manager', 'drivers:write'),
  ('manager', 'employees:read'), ('manager', 'employees:write'),
  ('manager', 'maintenance:read'), ('manager', 'maintenance:write'),
  ('manager', 'expenses:read'), ('manager', 'expenses:write'),
  ('manager', 'income:read'), ('manager', 'income:write'),
  ('manager', 'invoices:read'), ('manager', 'invoices:write'), ('manager', 'invoices:approve'),
  ('manager', 'payments:read'), ('manager', 'payments:write'),
  ('manager', 'contracts:read'), ('manager', 'contracts:write'),
  ('manager', 'reports:read'), ('manager', 'reports:export'), ('manager', 'analytics:read'),
  ('manager', 'documents:read'), ('manager', 'documents:write'),
  ('manager', 'settings:read'), ('manager', 'support:read'), ('manager', 'support:write'),

  -- Receptionist: front desk.
  ('receptionist', 'organization:read'), ('receptionist', 'members:read'),
  ('receptionist', 'assets:read'),
  ('receptionist', 'bookings:read'), ('receptionist', 'bookings:write'),
  ('receptionist', 'customers:read'), ('receptionist', 'customers:write'),
  ('receptionist', 'contracts:read'), ('receptionist', 'contracts:write'),
  ('receptionist', 'invoices:read'), ('receptionist', 'invoices:write'),
  ('receptionist', 'payments:read'),
  ('receptionist', 'documents:read'), ('receptionist', 'documents:write'),

  -- Accountant: finance + reporting.
  ('accountant', 'organization:read'), ('accountant', 'billing:read'),
  ('accountant', 'assets:read'), ('accountant', 'bookings:read'), ('accountant', 'customers:read'),
  ('accountant', 'expenses:read'), ('accountant', 'expenses:write'),
  ('accountant', 'income:read'), ('accountant', 'income:write'),
  ('accountant', 'invoices:read'), ('accountant', 'invoices:write'), ('accountant', 'invoices:approve'),
  ('accountant', 'payments:read'), ('accountant', 'payments:write'),
  ('accountant', 'reports:read'), ('accountant', 'reports:export'), ('accountant', 'analytics:read'),
  ('accountant', 'documents:read'),

  -- Mechanic: maintenance.
  ('mechanic', 'organization:read'), ('mechanic', 'assets:read'),
  ('mechanic', 'maintenance:read'), ('mechanic', 'maintenance:write'),
  ('mechanic', 'documents:read'), ('mechanic', 'documents:write'),

  -- Driver: assigned work.
  ('driver', 'organization:read'), ('driver', 'bookings:read'), ('driver', 'contracts:read'),

  -- Customer (portal): own records.
  ('customer', 'bookings:read'), ('customer', 'invoices:read'), ('customer', 'contracts:read')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Subscription plans
-- ----------------------------------------------------------------------------
insert into public.subscription_plans
  (key, name, tier, price_amount_minor, currency, billing_interval, trial_days, is_public) values
  ('free_trial', 'Free Trial', 0, 0, 'USD', 'month', 14, false),
  ('basic', 'Basic', 1, 2900, 'USD', 'month', 0, true),
  ('professional', 'Professional', 2, 7900, 'USD', 'month', 0, true),
  ('enterprise', 'Enterprise', 3, 0, 'USD', 'month', 0, true)
on conflict (key) do update
  set name = excluded.name, tier = excluded.tier,
      price_amount_minor = excluded.price_amount_minor, trial_days = excluded.trial_days,
      is_public = excluded.is_public;

-- ----------------------------------------------------------------------------
-- Plan entitlements (limit_value null = unlimited)
-- ----------------------------------------------------------------------------
insert into public.plan_entitlements (plan_key, feature_key, enabled, limit_value) values
  -- Free Trial (mirrors Professional for evaluation)
  ('free_trial', 'limit.assets', true, 150),
  ('free_trial', 'limit.users', true, 15),
  ('free_trial', 'limit.storage_gb', true, 20),
  ('free_trial', 'module.maintenance', true, null),
  ('free_trial', 'module.contracts', true, null),
  ('free_trial', 'module.analytics', true, null),
  ('free_trial', 'module.messaging', true, null),

  -- Basic
  ('basic', 'limit.assets', true, 25),
  ('basic', 'limit.users', true, 3),
  ('basic', 'limit.storage_gb', true, 5),
  ('basic', 'module.maintenance', true, null),
  ('basic', 'module.contracts', false, null),
  ('basic', 'module.analytics', false, null),
  ('basic', 'module.messaging', false, null),

  -- Professional
  ('professional', 'limit.assets', true, 150),
  ('professional', 'limit.users', true, 15),
  ('professional', 'limit.storage_gb', true, 50),
  ('professional', 'module.maintenance', true, null),
  ('professional', 'module.contracts', true, null),
  ('professional', 'module.analytics', true, null),
  ('professional', 'module.messaging', true, null),

  -- Enterprise (unlimited)
  ('enterprise', 'limit.assets', true, null),
  ('enterprise', 'limit.users', true, null),
  ('enterprise', 'limit.storage_gb', true, null),
  ('enterprise', 'module.maintenance', true, null),
  ('enterprise', 'module.contracts', true, null),
  ('enterprise', 'module.analytics', true, null),
  ('enterprise', 'module.messaging', true, null)
on conflict (plan_key, feature_key) do update
  set enabled = excluded.enabled, limit_value = excluded.limit_value;
