# Folder Structure

**Feature-based (vertical slices), not layer-based.** Everything about "bookings" lives under
`features/bookings`. Shared, cross-feature code lives in clearly named top-level folders. This
keeps modules independent and the codebase navigable as it grows to dozens of modules.

## 1. Repository root

```
lenzro-rentalos/
├── assets/                     # brand source (logo.svg, logo-mono.svg, favicon.svg) — do not fork
├── branding/                   # brand spec (colors, typography, spacing, tone, logo)
├── docs/                       # architecture + product docs (this set)
│   ├── ARCHITECTURE.md
│   └── architecture/*.md
├── public/                     # static served assets (favicon, og images, robots)
├── src/                        # the React app (see §2)
├── supabase/                   # backend-as-code (see §3)
├── .env.example                # every env var documented (no secrets)
├── .env.local                  # git-ignored
├── components.json             # shadcn config
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig*.json
├── eslint.config.js / .prettierrc
├── vercel.json                 # headers (CSP, HSTS), rewrites
└── package.json
```

> Single-app layout now (Decision D3). If a second surface appears (admin console, mobile,
> shared SDK), promote to a Turborepo with `apps/*` + `packages/*` — the `src/` boundaries below
> are drawn so that lift is mechanical.

## 2. `src/` — application

```
src/
├── main.tsx                    # entry: providers (Query, Theme, Router, Auth), Sonner
├── App.tsx                     # router composition
│
├── app/                        # app-wide composition (not feature-specific)
│   ├── routes/                 # route tree, guards (RequireAuth/Verified/Org/Permission)
│   ├── providers/              # QueryClientProvider, ThemeProvider, AuthProvider, OrgProvider
│   └── layouts/                # AppShell, AuthLayout, MarketingLayout
│
├── features/                   # ★ vertical slices — one folder per module
│   ├── auth/
│   ├── organizations/
│   ├── subscriptions/
│   ├── dashboard/
│   ├── assets/                 # (presented as "Vehicles" for car tenants)
│   ├── bookings/
│   ├── customers/
│   ├── drivers/
│   ├── employees/
│   ├── maintenance/
│   ├── finance/                # expenses, income, invoices, payments
│   ├── contracts/
│   ├── reports/
│   ├── calendar/
│   ├── notifications/
│   ├── messaging/
│   ├── documents/
│   ├── settings/
│   ├── audit/
│   └── support/
│        └── (each feature:)
│            ├── components/    # feature UI
│            ├── hooks/         # useX (TanStack Query wrappers, feature logic)
│            ├── api/           # data-access fns + query-key factories
│            ├── schemas/       # Zod schemas (shared with Edge Functions)
│            ├── types/         # feature types (from DB types + z.infer)
│            ├── utils/         # feature-only helpers
│            └── routes.tsx     # feature's nested routes (lazy-loaded)
│
├── components/                 # shared composites (DataTable, PageHeader, StatCard, Money…)
│   └── ui/                     # shadcn primitives (owned source)
│
├── lib/                        # framework-agnostic singletons & helpers
│   ├── supabase/               # client, generated types, typed helpers
│   ├── query/                  # QueryClient config, shared key helpers
│   ├── auth/                   # session/claims utilities
│   ├── format/                 # money, date, number (tabular), id formatting
│   ├── validation/             # shared Zod primitives
│   └── utils.ts                # cn(), misc
│
├── hooks/                      # cross-cutting hooks (useEntitlements, usePermissions, useOrg, useTheme)
├── config/                     # env parsing (typed), constants, nav config, plan config
├── types/                      # global/shared types, database.generated.ts
├── styles/                     # globals.css (Tailwind layers + CSS variable tokens)
└── test/                       # test setup, utilities, factories
```

### Rules

- A feature may import from `lib/`, `components/`, `hooks/`, `config/`, `types/` — **never** from
  another feature's internals. Cross-feature needs are lifted to shared layers (enforced by ESLint
  import boundaries).
- One responsibility per file. Components are presentational + hook-driven; data logic lives in
  `api/` + `hooks/`. No `supabase` calls inside components.
- Routes are **lazy-loaded** per feature for code-splitting.
- Types flow one way: generated DB types → Zod schemas → inferred TS types → components.

## 3. `supabase/` — backend as code

```
supabase/
├── config.toml
├── migrations/                 # timestamped, append-only, production-ready SQL
│   ├── 0000_extensions.sql        # pgcrypto, btree_gist, pg_trgm, …
│   ├── 0001_core_helpers.sql      # auth_org_id(), can(), set_updated_at(), write_audit()
│   ├── 0002_organizations.sql
│   ├── 0003_profiles_memberships.sql
│   ├── 0004_roles_permissions.sql
│   ├── 0005_subscriptions.sql
│   ├── 0006_assets.sql            # kinds, categories, attribute schemas, assets
│   ├── 0007_bookings.sql          # bookings, items, exclusion constraint
│   └── …                          # one concern per migration, per phase
├── functions/                  # Edge Functions (Deno), one folder each
│   ├── _shared/                   # cors, auth verify, zod, response helpers
│   ├── create-organization/
│   ├── accept-invitation/
│   ├── send-email/
│   ├── revoke-sessions/
│   └── subscription-cron/
├── seed/                       # idempotent seed: plans, entitlements, roles, permissions, asset_kinds
└── tests/                      # pgTAP / RLS policy tests (tenant-isolation assertions)
```

### Backend rules

- **Migrations are immutable once shipped** — forward-only; fixes are new migrations.
- Every migration that creates a tenant table also: enables + forces RLS, adds policies, adds
  indexes (incl. FK + `organization_id`-leading), and triggers (updated_at, audit).
- RLS isolation has **automated tests** (`tests/`) asserting Org A cannot read/write Org B.
- Seed is **idempotent** (`on conflict do nothing/update`) so it's safe to re-run.

## 4. Path aliases

`@/` → `src/`. Feature-relative imports stay short; cross-cutting via `@/lib`, `@/components`,
`@/hooks`, `@/config`, `@/types`. Configured in `tsconfig` + `vite.config` + ESLint resolver.
