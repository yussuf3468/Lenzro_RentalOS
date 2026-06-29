# Multi-Tenancy Strategy

> The single most important architectural decision. **Company A must never see Company B's data.**

## 1. Model selection

| Model                                                   | Isolation             | Scales to 1000s on Supabase?                                   | Migration cost | Verdict    |
| ------------------------------------------------------- | --------------------- | -------------------------------------------------------------- | -------------- | ---------- |
| Database-per-tenant                                     | Highest               | ❌ Supabase = one Postgres DB                                  | N×migrations   | Rejected   |
| Schema-per-tenant                                       | High                  | ❌ Postgres degrades past a few hundred schemas; catalog bloat | N×migrations   | Rejected   |
| **Shared DB + shared schema + `organization_id` + RLS** | High (enforced in-DB) | ✅ Native Supabase pattern                                     | 1×migration    | **Chosen** |

**Chosen model: shared schema, row-level tenancy.** Every tenant-owned row carries an
`organization_id`. Postgres **Row Level Security** makes it impossible for a query to read
or write rows outside the caller's organization — even if the frontend is compromised or a
developer forgets a `WHERE` clause.

## 2. The three planes of access

```
┌─ Platform plane ───────────────────────────────────────────────┐
│ Lenzro staff. Cross-tenant. Super Admin, Lenzro Admin.          │
│ Governed by platform_role claim + dedicated, audited policies.  │
└─────────────────────────────────────────────────────────────────┘
┌─ Organization plane ────────────────────────────────────────────┐
│ A tenant's own users. Scoped to ONE active organization_id.     │
│ Owner, Manager, Receptionist, Driver, Mechanic, Accountant.     │
└─────────────────────────────────────────────────────────────────┘
┌─ Customer plane (future portal) ────────────────────────────────┐
│ A tenant's end customers. Scoped to their own records within    │
│ one organization. (Customer role.)                              │
└─────────────────────────────────────────────────────────────────┘
```

A user can belong to **multiple organizations** (e.g. an outsourced accountant, or a Lenzro
admin impersonating support). One organization is **active** at a time, carried in the JWT.

## 3. Source of truth: `memberships`

```
memberships
  id                uuid pk
  organization_id   uuid → organizations(id)
  user_id           uuid → auth.users(id)
  role              text  (FK to roles.key — see authorization.md)
  status            text  invited | active | suspended
  invited_by        uuid
  accepted_at       timestamptz
  (unique: organization_id + user_id)
```

This table is the **authoritative answer** to "can this user act inside this org, and as what
role?" RLS and the auth hook both derive from it.

## 4. Fast tenancy via JWT custom claims

Per-row RLS that does `organization_id IN (SELECT ... FROM memberships WHERE user_id = auth.uid())`
works, but runs a subquery for every row and gets slow at scale. Instead we put the **active
org and role directly in the JWT** and let RLS read them as constants.

### Custom Access Token Hook (Supabase Auth Hook)

On every token issue/refresh, a Postgres function enriches the JWT:

```
claims.app_metadata.organization_id  = profiles.active_organization_id   (validated vs memberships)
claims.app_metadata.role             = role of that membership
claims.app_metadata.platform_role    = super_admin | lenzro_admin | null
claims.app_metadata.org_ids          = [all orgs the user belongs to]   (for the switcher)
```

The hook **re-validates** that `active_organization_id` is a real, active membership before
stamping it — a user cannot forge access to an org they were removed from (it takes effect on
next refresh; see §6 on revocation).

### What RLS reads

```sql
-- helper, STABLE, reads only the verified JWT (no table hit on the hot path)
auth_org_id()        := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
auth_role()          := (auth.jwt() -> 'app_metadata' ->> 'role')
is_platform_admin()  := (auth.jwt() -> 'app_metadata' ->> 'platform_role') is not null
```

Canonical tenant policy (every tenant table gets the equivalent):

```sql
alter table bookings enable row level security;
alter table bookings force row level security;   -- applies even to table owner

create policy bookings_tenant_isolation on bookings
  for all
  using ( organization_id = auth_org_id() or is_platform_admin() )
  with check ( organization_id = auth_org_id() );
```

- `using` filters what rows are **visible / updatable / deletable**.
- `with check` ensures inserts/updates **cannot place a row in another org** — even platform
  admins write only into the active org (cross-tenant writes go through audited Edge Functions).

### Client never sets `organization_id`

The column defaults from the JWT so the client physically cannot spoof it:

```sql
organization_id uuid not null default auth_org_id()
```

Combined with the `with check`, a malicious client that injects a different `organization_id`
is rejected by the policy.

## 5. Organization switching

```
User clicks org in switcher
      │
      ▼
RPC set_active_organization(org_id)
  • verifies membership(org_id, user) is active   → else 403
  • updates profiles.active_organization_id
      │
      ▼
Client calls supabase.auth.refreshSession()
  • Auth Hook re-stamps JWT with new org + role
      │
      ▼
TanStack Query cache cleared / invalidated → app re-renders in new tenant context
```

URL convention: the app shell is mounted under `/:orgSlug/...` (e.g. `/acme-rentals/bookings`)
for shareable deep links. A route guard verifies the slug maps to a membership and that it
matches the active JWT org; mismatch triggers a switch or 404. The JWT — not the URL — is the
security boundary; the slug is UX.

## 6. Isolation guarantees & edge cases

| Concern                                                    | Handling                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Forgotten `WHERE org_id` in a query                        | Irrelevant — RLS filters anyway. Default-deny.                                                                                                                                                                     |
| Compromised anon key                                       | Anon key is public by design; RLS gates everything.                                                                                                                                                                |
| User removed from org mid-session                          | Membership flips to `suspended`/deleted; **next token refresh** drops the claim. Short access-token TTL (≈1h) + a `revoke_sessions` path for immediate kill (Edge Function calls Auth admin to sign the user out). |
| Cross-tenant report needed by Lenzro                       | Only via `is_platform_admin()` policies, read-mostly, fully audited.                                                                                                                                               |
| Shared/global data (plans, currencies, asset-kind catalog) | Lives in tables **without** `organization_id`; readable by all authenticated users, writable only by platform admins.                                                                                              |
| `auth.users` (Supabase-managed)                            | Never exposed directly; the app reads a `profiles` projection with its own RLS.                                                                                                                                    |
| Service-role key                                           | Bypasses RLS — therefore **only** used inside Edge Functions, never shipped to the client.                                                                                                                         |
| Realtime leakage                                           | Realtime respects RLS; subscriptions only emit rows the JWT can see.                                                                                                                                               |

## 7. Why this scales to thousands of tenants

- One schema → one migration applies to all tenants at once (no per-tenant DDL).
- RLS predicates are constant-time comparisons against JWT claims (with the right indexes;
  see `database.md` §indexes — every tenant table leads its composite indexes with
  `organization_id`).
- Connection pooling (Supavisor) is shared, not multiplied per tenant.
- Hot tenants can later be isolated via table partitioning by `organization_id` or a
  dedicated read replica **without changing application code** (see `scalability.md`).
