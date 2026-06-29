-- =============================================================================
-- 0007_rpc — transactional, security-definer RPCs for auth/org/invite flows
-- -----------------------------------------------------------------------------
-- These run as definer (owner: postgres) so bootstrap writes (creating the very
-- first org + membership before any JWT claim exists) succeed, while still
-- authorizing the caller explicitly via auth.uid() / can().
-- =============================================================================

-- Create an organization; caller becomes Owner on a free trial. Atomic.
create or replace function public.create_organization(
  p_name text,
  p_country char(2) default 'KE',
  p_currency char(3) default 'KES',
  p_timezone text default 'Africa/Nairobi'
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  base_slug text;
  final_slug text;
  n int := 0;
  v_trial_days int;
  new_org public.organizations;
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'LNZ_INVALID_NAME';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := 'org';
  end if;
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n::text;
  end loop;

  insert into public.organizations
    (slug, name, country, default_currency, timezone, created_by, updated_by)
  values (final_slug, trim(p_name), p_country, p_currency, p_timezone, uid, uid)
  returning * into new_org;

  insert into public.memberships
    (organization_id, user_id, role, status, accepted_at, created_by, updated_by)
  values (new_org.id, uid, 'owner', 'active', now(), uid, uid);

  select trial_days into v_trial_days from public.subscription_plans where key = 'free_trial';
  v_trial_days := coalesce(v_trial_days, 14);

  insert into public.subscriptions
    (organization_id, plan_key, status, trial_end, current_period_end, created_by, updated_by)
  values (
    new_org.id, 'free_trial', 'trialing',
    now() + (v_trial_days || ' days')::interval,
    now() + (v_trial_days || ' days')::interval,
    uid, uid
  );

  insert into public.subscription_events (organization_id, type, to_plan, created_by)
  values (new_org.id, 'trial_started', 'free_trial', uid);

  update public.profiles set active_organization_id = new_org.id where id = uid;

  return new_org;
end;
$$;

-- Switch the active organization (caller must be an active member). Refresh the
-- session afterwards so the JWT picks up the new claims.
create or replace function public.set_active_organization(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;
  if not exists (
    select 1 from public.memberships
    where user_id = uid and organization_id = p_org and status = 'active'
  ) then
    raise exception 'LNZ_NOT_A_MEMBER';
  end if;
  update public.profiles set active_organization_id = p_org where id = uid;
end;
$$;

-- Invite a teammate to the active org. Returns the one-time raw token so the app
-- can build a share link / email it (automated email lands when a provider is wired).
create or replace function public.invite_member(p_email text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  org uuid := public.auth_org_id();
  raw_token text;
  inv public.invitations;
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;
  if org is null then
    raise exception 'LNZ_NO_ACTIVE_ORG';
  end if;
  if not public.can('members:invite') then
    raise exception 'LNZ_FORBIDDEN';
  end if;
  if not exists (
    select 1 from public.roles where key = p_role and scope = 'organization'
  ) then
    raise exception 'LNZ_INVALID_ROLE';
  end if;

  raw_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.invitations (organization_id, email, role, token_hash, invited_by)
  values (
    org, lower(trim(p_email)), p_role,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'), uid
  )
  on conflict (organization_id, email) where (status = 'pending')
  do update set
    role = excluded.role,
    token_hash = excluded.token_hash,
    invited_by = excluded.invited_by,
    expires_at = now() + interval '7 days',
    updated_at = now()
  returning * into inv;

  return jsonb_build_object(
    'invitation_id', inv.id,
    'email', inv.email,
    'role', inv.role,
    'token', raw_token,
    'expires_at', inv.expires_at
  );
end;
$$;

-- Safe, pre-membership lookup of an invitation by raw token (for the accept page).
create or replace function public.get_invitation(p_token text)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'email', i.email,
    'role', i.role,
    'organization_name', o.name,
    'organization_slug', o.slug,
    'expires_at', i.expires_at,
    'valid', (i.status = 'pending' and i.expires_at > now())
  )
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  limit 1
$$;

-- Accept an invitation: activates membership for the caller. Enforces email match.
create or replace function public.accept_invitation(p_token text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  inv public.invitations;
  org public.organizations;
begin
  if uid is null then
    raise exception 'LNZ_NOT_AUTHENTICATED';
  end if;

  select * into inv from public.invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and status = 'pending'
    and expires_at > now();
  if inv.id is null then
    raise exception 'LNZ_INVALID_INVITATION';
  end if;

  select email into user_email from auth.users where id = uid;
  if lower(user_email) <> lower(inv.email::text) then
    raise exception 'LNZ_EMAIL_MISMATCH';
  end if;

  insert into public.memberships
    (organization_id, user_id, role, status, invited_by, accepted_at, created_by, updated_by)
  values (inv.organization_id, uid, inv.role, 'active', inv.invited_by, now(), uid, uid)
  on conflict (organization_id, user_id)
  do update set status = 'active', role = excluded.role, accepted_at = now(), updated_at = now();

  update public.invitations
  set status = 'accepted', accepted_at = now(), accepted_by = uid, updated_at = now()
  where id = inv.id;

  update public.profiles set active_organization_id = inv.organization_id
  where id = uid and active_organization_id is null;

  select * into org from public.organizations where id = inv.organization_id;
  return org;
end;
$$;
