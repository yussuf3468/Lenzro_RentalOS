# Database tests

RLS isolation and policy tests (pgTAP) live here. They are the safety net behind the
platform's core promise: **one tenant can never read or write another tenant's rows.**

## What gets tested (from Phase 2 onward)

- **Tenant isolation** — as Org A, every `select/insert/update/delete` against Org B's rows
  returns nothing / is rejected, on every tenant table.
- **`with check` enforcement** — a client cannot set `organization_id` to another org.
- **Permission gates** — write policies that call `can('<perm>')` reject unauthorized roles.
- **Platform admin** — `is_platform_admin()` paths are allowed and audited.
- **Helpers** — `auth_org_id()`, `auth_role()`, `is_platform_admin()` read claims correctly.

## Running

```bash
supabase start
supabase test db            # runs pgTAP tests in this folder
```

Tests are also executed in CI before any migration is allowed to merge.
