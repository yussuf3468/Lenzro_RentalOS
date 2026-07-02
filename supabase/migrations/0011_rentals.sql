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
