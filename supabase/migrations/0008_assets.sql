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
