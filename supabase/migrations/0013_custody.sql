-- =============================================================================
-- 0013_custody — handover evidence (Phase C of the product vision)
-- -----------------------------------------------------------------------------
-- The checkout/return flows capture the car's condition at both custody
-- moments: guided walk-around photos, odometer, fuel level and a signature.
-- Evidence lives in a PRIVATE bucket (served via signed URLs) — it is the
-- business's protection in deposit disputes. Idempotent.
-- =============================================================================

alter table public.rentals add column if not exists odometer_out bigint;
alter table public.rentals add column if not exists odometer_in bigint;
alter table public.rentals add column if not exists fuel_out_pct smallint
  check (fuel_out_pct is null or (fuel_out_pct >= 0 and fuel_out_pct <= 100));
alter table public.rentals add column if not exists fuel_in_pct smallint
  check (fuel_in_pct is null or (fuel_in_pct >= 0 and fuel_in_pct <= 100));

create table if not exists public.rental_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade
    default public.auth_org_id(),
  rental_id uuid not null references public.rentals (id) on delete cascade,
  phase text not null check (phase in ('checkout', 'return')),
  -- Guided slots: front / back / left / right / dashboard / extra / signature
  slot text not null default 'extra',
  path text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index if not exists rental_photos_rental_idx
  on public.rental_photos (rental_id, phase);
create index if not exists rental_photos_org_idx
  on public.rental_photos (organization_id);

drop trigger if exists set_actor on public.rental_photos;
create trigger set_actor before insert on public.rental_photos
  for each row execute function public.set_actor();

-- ----------------------------------------------------------------------------
-- RLS — tenant-isolated; evidence follows the bookings:* permissions.
-- ----------------------------------------------------------------------------
alter table public.rental_photos enable row level security;

drop policy if exists rental_photos_select on public.rental_photos;
create policy rental_photos_select on public.rental_photos
  for select to authenticated
  using (organization_id = (select public.auth_org_id()) or public.is_platform_admin());

drop policy if exists rental_photos_write on public.rental_photos;
create policy rental_photos_write on public.rental_photos
  for all to authenticated
  using (organization_id = (select public.auth_org_id()) and public.can('bookings:write'))
  with check (organization_id = (select public.auth_org_id()) and public.can('bookings:write'));

-- ----------------------------------------------------------------------------
-- Storage: PRIVATE rental-photos bucket (evidence is sensitive).
-- Path convention: {organization_id}/{rental_id}/{phase}-{slot}-{uuid}.{ext}
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('rental-photos', 'rental-photos', false)
on conflict (id) do update set public = false;

drop policy if exists rental_photos_storage_read on storage.objects;
create policy rental_photos_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rental-photos'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('bookings:read')
  );
drop policy if exists rental_photos_storage_insert on storage.objects;
create policy rental_photos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'rental-photos'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('bookings:write')
  );
drop policy if exists rental_photos_storage_delete on storage.objects;
create policy rental_photos_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'rental-photos'
    and (storage.foldername(name))[1] = (select public.auth_org_id())::text
    and public.can('bookings:write')
  );
