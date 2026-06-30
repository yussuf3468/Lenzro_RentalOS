-- =============================================================================
-- Lenzro RentalOS — one-paste FRESH setup for the Supabase SQL Editor.
-- Generated from supabase/migrations/* + supabase/seed/seed.sql (the source of truth).
-- For a NEW project: run this whole file once, then enable the auth hook.
-- Already set up? Only run the NEW migration file(s) (e.g. 0010_staff.sql).
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
