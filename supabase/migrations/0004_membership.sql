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
