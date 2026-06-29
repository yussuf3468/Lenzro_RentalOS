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
