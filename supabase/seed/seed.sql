-- =============================================================================
-- Seed data — idempotent (safe to re-run). Catalogs only; no tenant data.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Roles
-- ----------------------------------------------------------------------------
insert into public.roles (key, label, scope, rank, description) values
  ('owner', 'Owner', 'organization', 100, 'Full control of the organization'),
  ('manager', 'Manager', 'organization', 80, 'Manage operations and staff'),
  ('accountant', 'Accountant', 'organization', 60, 'Finance and reporting'),
  ('receptionist', 'Receptionist', 'organization', 50, 'Front desk: bookings and customers'),
  ('mechanic', 'Mechanic', 'organization', 40, 'Maintenance and repairs'),
  ('driver', 'Driver', 'organization', 30, 'Assigned trips and contracts'),
  ('customer', 'Customer', 'organization', 10, 'End customer (portal)'),
  ('super_admin', 'Super Admin', 'platform', 1000, 'Lenzro platform super admin'),
  ('lenzro_admin', 'Lenzro Admin', 'platform', 900, 'Lenzro support admin')
on conflict (key) do update
  set label = excluded.label, scope = excluded.scope,
      rank = excluded.rank, description = excluded.description;

-- ----------------------------------------------------------------------------
-- Permissions (resource:action)
-- ----------------------------------------------------------------------------
insert into public.permissions (key, resource, action) values
  ('organization:read', 'organization', 'read'),
  ('organization:manage', 'organization', 'manage'),
  ('members:read', 'members', 'read'),
  ('members:invite', 'members', 'invite'),
  ('members:manage', 'members', 'manage'),
  ('billing:read', 'billing', 'read'),
  ('billing:manage', 'billing', 'manage'),
  ('assets:read', 'assets', 'read'),
  ('assets:write', 'assets', 'write'),
  ('assets:delete', 'assets', 'delete'),
  ('bookings:read', 'bookings', 'read'),
  ('bookings:write', 'bookings', 'write'),
  ('bookings:delete', 'bookings', 'delete'),
  ('customers:read', 'customers', 'read'),
  ('customers:write', 'customers', 'write'),
  ('customers:delete', 'customers', 'delete'),
  ('drivers:read', 'drivers', 'read'),
  ('drivers:write', 'drivers', 'write'),
  ('employees:read', 'employees', 'read'),
  ('employees:write', 'employees', 'write'),
  ('maintenance:read', 'maintenance', 'read'),
  ('maintenance:write', 'maintenance', 'write'),
  ('expenses:read', 'expenses', 'read'),
  ('expenses:write', 'expenses', 'write'),
  ('income:read', 'income', 'read'),
  ('income:write', 'income', 'write'),
  ('invoices:read', 'invoices', 'read'),
  ('invoices:write', 'invoices', 'write'),
  ('invoices:approve', 'invoices', 'approve'),
  ('payments:read', 'payments', 'read'),
  ('payments:write', 'payments', 'write'),
  ('contracts:read', 'contracts', 'read'),
  ('contracts:write', 'contracts', 'write'),
  ('reports:read', 'reports', 'read'),
  ('reports:export', 'reports', 'export'),
  ('analytics:read', 'analytics', 'read'),
  ('documents:read', 'documents', 'read'),
  ('documents:write', 'documents', 'write'),
  ('settings:read', 'settings', 'read'),
  ('settings:manage', 'settings', 'manage'),
  ('audit:read', 'audit', 'read'),
  ('support:read', 'support', 'read'),
  ('support:write', 'support', 'write')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Role → permission mappings
-- ----------------------------------------------------------------------------
-- Owner gets everything.
insert into public.role_permissions (role_key, permission_key)
select 'owner', key from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key) values
  -- Manager: operations + staff, no org/billing/role administration.
  ('manager', 'organization:read'), ('manager', 'members:read'), ('manager', 'members:invite'),
  ('manager', 'billing:read'),
  ('manager', 'assets:read'), ('manager', 'assets:write'), ('manager', 'assets:delete'),
  ('manager', 'bookings:read'), ('manager', 'bookings:write'), ('manager', 'bookings:delete'),
  ('manager', 'customers:read'), ('manager', 'customers:write'), ('manager', 'customers:delete'),
  ('manager', 'drivers:read'), ('manager', 'drivers:write'),
  ('manager', 'employees:read'), ('manager', 'employees:write'),
  ('manager', 'maintenance:read'), ('manager', 'maintenance:write'),
  ('manager', 'expenses:read'), ('manager', 'expenses:write'),
  ('manager', 'income:read'), ('manager', 'income:write'),
  ('manager', 'invoices:read'), ('manager', 'invoices:write'), ('manager', 'invoices:approve'),
  ('manager', 'payments:read'), ('manager', 'payments:write'),
  ('manager', 'contracts:read'), ('manager', 'contracts:write'),
  ('manager', 'reports:read'), ('manager', 'reports:export'), ('manager', 'analytics:read'),
  ('manager', 'documents:read'), ('manager', 'documents:write'),
  ('manager', 'settings:read'), ('manager', 'support:read'), ('manager', 'support:write'),

  -- Receptionist: front desk.
  ('receptionist', 'organization:read'), ('receptionist', 'members:read'),
  ('receptionist', 'assets:read'),
  ('receptionist', 'bookings:read'), ('receptionist', 'bookings:write'),
  ('receptionist', 'customers:read'), ('receptionist', 'customers:write'),
  ('receptionist', 'contracts:read'), ('receptionist', 'contracts:write'),
  ('receptionist', 'invoices:read'), ('receptionist', 'invoices:write'),
  ('receptionist', 'payments:read'),
  ('receptionist', 'documents:read'), ('receptionist', 'documents:write'),

  -- Accountant: finance + reporting.
  ('accountant', 'organization:read'), ('accountant', 'billing:read'),
  ('accountant', 'assets:read'), ('accountant', 'bookings:read'), ('accountant', 'customers:read'),
  ('accountant', 'expenses:read'), ('accountant', 'expenses:write'),
  ('accountant', 'income:read'), ('accountant', 'income:write'),
  ('accountant', 'invoices:read'), ('accountant', 'invoices:write'), ('accountant', 'invoices:approve'),
  ('accountant', 'payments:read'), ('accountant', 'payments:write'),
  ('accountant', 'reports:read'), ('accountant', 'reports:export'), ('accountant', 'analytics:read'),
  ('accountant', 'documents:read'),

  -- Mechanic: maintenance.
  ('mechanic', 'organization:read'), ('mechanic', 'assets:read'),
  ('mechanic', 'maintenance:read'), ('mechanic', 'maintenance:write'),
  ('mechanic', 'documents:read'), ('mechanic', 'documents:write'),

  -- Driver: assigned work.
  ('driver', 'organization:read'), ('driver', 'bookings:read'), ('driver', 'contracts:read'),

  -- Customer (portal): own records.
  ('customer', 'bookings:read'), ('customer', 'invoices:read'), ('customer', 'contracts:read')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Subscription plans
-- ----------------------------------------------------------------------------
insert into public.subscription_plans
  (key, name, tier, price_amount_minor, currency, billing_interval, trial_days, is_public) values
  ('free_trial', 'Free Trial', 0, 0, 'USD', 'month', 14, false),
  ('basic', 'Basic', 1, 2900, 'USD', 'month', 0, true),
  ('professional', 'Professional', 2, 7900, 'USD', 'month', 0, true),
  ('enterprise', 'Enterprise', 3, 0, 'USD', 'month', 0, true)
on conflict (key) do update
  set name = excluded.name, tier = excluded.tier,
      price_amount_minor = excluded.price_amount_minor, trial_days = excluded.trial_days,
      is_public = excluded.is_public;

-- ----------------------------------------------------------------------------
-- Plan entitlements (limit_value null = unlimited)
-- ----------------------------------------------------------------------------
insert into public.plan_entitlements (plan_key, feature_key, enabled, limit_value) values
  -- Free Trial (mirrors Professional for evaluation)
  ('free_trial', 'limit.assets', true, 150),
  ('free_trial', 'limit.users', true, 15),
  ('free_trial', 'limit.storage_gb', true, 20),
  ('free_trial', 'module.maintenance', true, null),
  ('free_trial', 'module.contracts', true, null),
  ('free_trial', 'module.analytics', true, null),
  ('free_trial', 'module.messaging', true, null),

  -- Basic
  ('basic', 'limit.assets', true, 25),
  ('basic', 'limit.users', true, 3),
  ('basic', 'limit.storage_gb', true, 5),
  ('basic', 'module.maintenance', true, null),
  ('basic', 'module.contracts', false, null),
  ('basic', 'module.analytics', false, null),
  ('basic', 'module.messaging', false, null),

  -- Professional
  ('professional', 'limit.assets', true, 150),
  ('professional', 'limit.users', true, 15),
  ('professional', 'limit.storage_gb', true, 50),
  ('professional', 'module.maintenance', true, null),
  ('professional', 'module.contracts', true, null),
  ('professional', 'module.analytics', true, null),
  ('professional', 'module.messaging', true, null),

  -- Enterprise (unlimited)
  ('enterprise', 'limit.assets', true, null),
  ('enterprise', 'limit.users', true, null),
  ('enterprise', 'limit.storage_gb', true, null),
  ('enterprise', 'module.maintenance', true, null),
  ('enterprise', 'module.contracts', true, null),
  ('enterprise', 'module.analytics', true, null),
  ('enterprise', 'module.messaging', true, null)
on conflict (plan_key, feature_key) do update
  set enabled = excluded.enabled, limit_value = excluded.limit_value;
