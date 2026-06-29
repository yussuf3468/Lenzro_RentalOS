# Authorization — Roles & Permissions

**Roles must be expandable.** We therefore use **permission-based RBAC**: code and policies
check _permissions_ (e.g. `bookings:write`), never hard-coded role names. Roles are just named
bundles of permissions, so adding a role — or letting an org customize one — never touches code.

## 1. Two role planes

| Plane            | Roles                                                                | Scope                      | Stored in                                             |
| ---------------- | -------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------- |
| **Platform**     | Super Admin, Lenzro Admin                                            | All tenants (Lenzro staff) | `platform_admins.platform_role` + JWT `platform_role` |
| **Organization** | Owner, Manager, Receptionist, Driver, Mechanic, Accountant, Customer | One org                    | `memberships.role` → `roles`                          |

Separating planes prevents the classic bug where a tenant role accidentally grants cross-tenant
power. Platform power is _only_ the `platform_role` claim, gated by dedicated audited policies.

## 2. Tables

```
roles (catalog; system roles seeded, org-custom roles allowed later)
  key            text pk          -- 'owner','manager','receptionist','driver','mechanic','accountant','customer'
  label          text
  scope          text             -- 'organization' | 'platform'
  is_system      boolean          -- system roles can't be deleted
  organization_id uuid null       -- null = global template; set = org-custom role (future)

permissions (catalog)
  key            text pk          -- '<resource>:<action>'  e.g. 'bookings:write'
  resource       text
  action         text             -- read | write | delete | manage | approve | export
  description    text

role_permissions (mapping)
  role_key       text → roles
  permission_key text → permissions
  (pk: role_key + permission_key)
```

Effective permissions for a request = permissions of the JWT `role` (+ platform overrides).
Cached in memory on the client for UX gating; **authoritatively re-checked server-side**.

## 3. Standard role → capability matrix (seed)

| Capability area         | Owner | Manager | Reception | Accountant |    Mechanic     |    Driver     | Customer |
| ----------------------- | :---: | :-----: | :-------: | :--------: | :-------------: | :-----------: | :------: |
| Org settings & billing  |   ✔   |    –    |     –     |     –      |        –        |       –       |    –     |
| Team / members          |   ✔   | invite  |     –     |     –      |        –        |       –       |    –     |
| Vehicles/Assets         |   ✔   |    ✔    |   read    |    read    |  maint. fields  |     read      |    –     |
| Bookings & reservations |   ✔   |    ✔    |     ✔     |    read    |        –        | assigned only |   own    |
| Customers               |   ✔   |    ✔    |     ✔     |    read    |        –        |       –       |   self   |
| Maintenance & repairs   |   ✔   |    ✔    |   read    |    read    |        ✔        |       –       |    –     |
| Invoices & payments     |   ✔   |    ✔    |  create   |     ✔      |        –        |       –       |   own    |
| Expenses & income       |   ✔   |    ✔    |     –     |     ✔      | log repair cost |       –       |    –     |
| Contracts               |   ✔   |    ✔    |     ✔     |    read    |        –        | sign assigned |   own    |
| Reports & analytics     |   ✔   |    ✔    |     –     |     ✔      |        –        |       –       |    –     |
| Audit logs              |   ✔   |  read   |     –     |     –      |        –        |       –       |    –     |

(✔ = full manage; specific cells note narrower grants. This is the seed; orgs may diverge later.)

## 4. Permission catalog (resource × action)

Resources: `organization, members, roles, billing, assets, asset_categories, bookings,
reservations, customers, drivers, employees, maintenance, expenses, income, invoices, payments,
contracts, reports, analytics, calendar, notifications, messages, documents, settings,
audit_logs, support`.

Actions: `read, write, delete, manage, approve, export` (not every action applies to every
resource). Keys are `resource:action`, e.g. `invoices:approve`, `assets:delete`, `reports:export`.

## 5. Enforcement — defense in depth

Authorization is checked at **three layers**; the deeper the layer, the harder the guarantee:

```
1. UI            hide/disable controls the user can't use      (UX only)
2. API/Edge      re-validate permission before privileged ops  (real check)
3. Database RLS  with-check policies call can(perm)            (last line, unbypassable)
```

The `can()` helper (used in RLS `with check` and RPCs):

```sql
create or replace function can(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from role_permissions rp
    where rp.role_key = (auth.jwt() -> 'app_metadata' ->> 'role')
      and rp.permission_key = perm
  ) or (auth.jwt() -> 'app_metadata' ->> 'platform_role') is not null;
$$;
```

- **Reads** are gated by tenant RLS (you only see your org); fine-grained read limits (e.g.
  Driver sees only assigned bookings) add a secondary policy predicate.
- **Writes/deletes** add `and can('<perm>')` to the `with check` / `using` clause. Hiding a
  button in the UI is never the security control — the policy is.

## 6. Expandability

- **New role:** insert into `roles` + `role_permissions`. No code change.
- **New permission:** insert into `permissions`, map to roles, reference its key in policy/UI.
- **Per-org custom roles (future):** `roles.organization_id` scopes a custom role to one tenant;
  the model already supports it — only an admin UI is added later.
- **Customer portal (future):** the `customer` role + customer-plane policies already reserved.
