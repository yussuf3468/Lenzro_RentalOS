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
