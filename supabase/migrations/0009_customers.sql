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
