-- =============================================================================
-- 0006_auth_hook — Custom Access Token Hook
-- -----------------------------------------------------------------------------
-- Runs on every token issue/refresh (as role supabase_auth_admin). Stamps the
-- active tenant + role + platform role + org list into JWT app_metadata, which
-- RLS reads via auth_org_id() / auth_role() / is_platform_admin() / user_organization_ids().
-- Enable in config.toml: [auth.hook.custom_access_token].
-- =============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  app_meta jsonb := coalesce(claims -> 'app_metadata', '{}'::jsonb);
  uid uuid := (event ->> 'user_id')::uuid;
  active_org uuid;
  active_role text;
  plat_role text;
  org_ids jsonb;
begin
  select active_organization_id into active_org from public.profiles where id = uid;
  select platform_role into plat_role from public.platform_admins where user_id = uid;

  -- The stored active org is authoritative only if it is still an active membership.
  if active_org is not null then
    select role into active_role
    from public.memberships
    where user_id = uid and organization_id = active_org and status = 'active';
    if active_role is null then
      active_org := null;
    end if;
  end if;

  -- Fall back to the user's first active membership.
  if active_org is null then
    select organization_id, role into active_org, active_role
    from public.memberships
    where user_id = uid and status = 'active'
    order by created_at
    limit 1;
  end if;

  select coalesce(jsonb_agg(organization_id), '[]'::jsonb) into org_ids
  from public.memberships
  where user_id = uid and status = 'active';

  app_meta := app_meta || jsonb_build_object('org_ids', org_ids);
  if active_org is not null then
    app_meta := app_meta || jsonb_build_object('organization_id', active_org, 'role', active_role);
  end if;
  if plat_role is not null then
    app_meta := app_meta || jsonb_build_object('platform_role', plat_role);
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_meta);
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Grants: only supabase_auth_admin may run the hook; it must read the source tables.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.profiles, public.memberships, public.platform_admins to supabase_auth_admin;

-- supabase_auth_admin is not bypassrls, so it needs explicit read policies.
create policy auth_admin_read_profiles on public.profiles
  for select to supabase_auth_admin using (true);
create policy auth_admin_read_memberships on public.memberships
  for select to supabase_auth_admin using (true);
create policy auth_admin_read_platform_admins on public.platform_admins
  for select to supabase_auth_admin using (true);
