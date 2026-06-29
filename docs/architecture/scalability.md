# Future Scalability

Designed to serve **thousands of rental companies across Africa**, and to grow from car rental
into motorcycle, equipment, machinery and truck rental **without re-architecting**.

## 1. New rental verticals — zero schema change

This requirement shaped the whole data model (`database.md` §2). Adding a vertical:

| Step | Action                                                                                    | Code/DDL?       |
| ---- | ----------------------------------------------------------------------------------------- | --------------- |
| 1    | Ensure the `asset_kind` exists (`vehicle`/`motorcycle`/`equipment`/`machinery`/`truck`/…) | data (seed row) |
| 2    | Org creates categories under that kind                                                    | data (app)      |
| 3    | Org defines the category's typed attribute schema (JSON Schema)                           | data (app)      |
| 4    | Org adds assets; type-specific fields go in validated `attributes` JSONB                  | data (app)      |
| 5    | UI labels switch (Vehicles → Equipment) from the org's enabled kinds                      | config          |

Bookings, availability, pricing, maintenance, contracts, invoicing, reports all operate on the
abstract `asset` and are **kind-agnostic**, so they keep working unchanged. The promise "expand
without changing the database architecture" is structural, not aspirational.

## 2. Tenant scale — thousands of orgs on shared Postgres

- **Shared schema + RLS** means one migration serves all tenants; no per-tenant DDL, no schema
  sprawl. (Why schema/DB-per-tenant were rejected: `multi-tenancy.md` §1.)
- Every tenant table leads its composite indexes with `organization_id`, so per-tenant working
  sets stay index-local even as total rows grow.
- RLS predicates are constant comparisons against JWT claims — no per-row subqueries on the hot
  path.
- Connection pooling via **Supavisor** (transaction mode) is shared across all tenants, not
  multiplied per tenant.

## 3. Data growth — large tables

When `bookings`, `audit_logs`, `notifications`, `payments` get large:

- **Partitioning:** range-partition append-heavy logs by time, or hash/list-partition hot tables
  by `organization_id`. Because tenancy is already a column + index, this is transparent to app
  code.
- **Archival:** cold partitions (old audit/bookings) move to cheaper storage / are summarized
  into reporting tables.
- **Keyset pagination** everywhere on big lists (already specified in `api.md`).
- **Materialized views / rollup tables** for dashboard KPIs and reports, refreshed on a schedule
  or via triggers, so analytics never scan raw transactional tables.

## 4. Read & compute scaling

- **Read replicas** for analytics/reporting workloads (Supabase read replicas) — routed at the
  data-access layer with no component changes.
- Heavy/async work (PDF generation, exports, bulk imports, emails) runs in **Edge Functions** and
  scheduled jobs, off the request path.
- **Caching:** TanStack Query on the client; HTTP/CDN caching for public marketing + transformed
  images; optional Postgres/Upstash cache for hot entitlements/lookups.

## 5. "Noisy neighbor" & large-tenant isolation

- Per-org **entitlement limits** (assets, users, bookings/month, storage, API) cap blast radius
  and align cost with plan — enforced server-side (`subscriptions.md`).
- Rate limiting per org/user (`security.md` §8).
- A very large tenant can later be moved to its own partition set, dedicated replica, or even a
  dedicated Supabase project **without app changes**, because all access is `organization_id`-keyed.

## 6. Performance budget & practices

- Index every FK and every common filter/sort; review slow queries each phase.
- `select` only needed columns via the data-access layer; avoid `select *` over wide rows.
- Realtime used selectively (live ops views, notifications), with channels torn down on
  navigation to bound connection count.
- Frontend: route-level code splitting, lazy features, virtualized long tables/lists, image
  transforms + lazy loading, bundle-size budget in CI.

## 7. Geographic & localization scale (pan-African)

- Money as integer minor units + ISO currency; per-org currency, locale, timezone, number/date
  formatting — multi-country from day one (KES default).
- i18n-ready structure (copy externalized) for future languages (English first; French,
  Swahili, etc. later) without refactor.
- Supabase region chosen per data-residency needs; CDN edge for static + images.
- Payment seam (`subscriptions.md` §7) already provider-agnostic so M-Pesa / card / bank vary by
  country without schema change.

## 8. Organizational scale (the codebase)

- Feature-sliced structure + import boundaries keep modules independent as the team and surface
  area grow.
- Backend-as-code (forward-only migrations, Edge Functions, seed, RLS tests) makes the platform
  reproducible and reviewable; CI runs typecheck, lint, build, and **RLS isolation tests**.
- Promote to a monorepo (`apps/*`, `packages/*`) when a second app appears — boundaries already
  drawn for it.

## 9. Extensibility seams summarized

| Want to add…                    | How                                                        | Schema change? |
| ------------------------------- | ---------------------------------------------------------- | -------------- |
| A rental vertical               | asset_kind + category + attribute schema                   | No             |
| A role                          | rows in `roles` + `role_permissions`                       | No             |
| A permission                    | row in `permissions` + map + reference                     | No             |
| A subscription plan             | rows in `subscription_plans` + `plan_entitlements`         | No             |
| A payment provider              | adapter behind `billing_customers` + webhook Edge Function | No             |
| A language / currency / country | config + locale data                                       | No             |
| A new module                    | a new `features/*` slice + its migrations                  | additive only  |
