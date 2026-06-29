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
