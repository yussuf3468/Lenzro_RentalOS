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
