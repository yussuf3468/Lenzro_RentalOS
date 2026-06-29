-- pgTAP: the security-critical JWT claim readers + RBAC.
-- Run with `supabase test db` (requires migrations + seed applied).
-- Full multi-user RLS isolation tests (real auth.users via supabase_test_helpers)
-- are added as the suite grows; these cover the claim/permission core.

begin;
select plan(8);

-- Simulate a Manager in org 1111…
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'app_metadata', json_build_object(
      'organization_id', '11111111-1111-1111-1111-111111111111',
      'role', 'manager',
      'org_ids', json_build_array('11111111-1111-1111-1111-111111111111')
    )
  )::text,
  true
);

select is(
  public.auth_org_id(), '11111111-1111-1111-1111-111111111111'::uuid,
  'auth_org_id() reads organization_id from the claim'
);
select is(public.auth_role(), 'manager', 'auth_role() reads role from the claim');
select is(public.is_platform_admin(), false, 'no platform_role claim → not a platform admin');
select ok(
  public.auth_org_id() = any (array(select public.user_organization_ids())),
  'active org is present in user_organization_ids()'
);
select ok(public.can('bookings:write'), 'manager can bookings:write');
select ok(not public.can('organization:manage'), 'manager cannot organization:manage');

-- Simulate a platform admin.
select set_config(
  'request.jwt.claims',
  json_build_object('app_metadata', json_build_object('platform_role', 'super_admin'))::text,
  true
);

select ok(public.is_platform_admin(), 'platform_role claim → is_platform_admin()');
select ok(public.can('organization:manage'), 'platform admin can() is permissive');

select * from finish();
rollback;
