# Developer Onboarding

Welcome to Lenzro RentalOS. This gets you productive in ~10 minutes.

## 1. Prerequisites

- **Node ≥ 20.19** (repo pins **24** in `.nvmrc` — `nvm use` if you have nvm).
- **npm** (lockfile committed; use `npm ci` for reproducible installs).
- **Git**.
- _(Phase 2+)_ **Supabase CLI** and **Docker** for the local backend.

## 2. Setup

```bash
git clone <repo> && cd lenzro-rentalos
npm ci
cp .env.example .env.local      # Supabase optional until Phase 2
npm run dev                     # http://localhost:5173
```

## 3. Daily workflow

```bash
npm run dev            # develop
npm run typecheck      # tsc -b
npm run lint           # eslint
npm run format         # prettier --write
npm test               # vitest
```

Before pushing, the same checks run in CI; run them locally to stay green:
`npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`.

## 4. Conventions

- **Feature-sliced.** Put everything for a module under `src/features/<name>/`
  (`components/ hooks/ api/ schemas/ types/`). A feature imports another feature's **public API**
  only (`@/features/<name>`) — deep cross-feature imports are blocked by ESLint.
- **Imports.** Use the `@/` alias for `src/`. Prefer `import type` for types
  (enforced; auto-fixable with `lint:fix`).
- **One responsibility per file.** Components are presentational + hook-driven; data access lives
  in `api/` + TanStack Query hooks. No `supabase` calls inside components.
- **Styling.** Tailwind utilities + the brand tokens in `src/styles/globals.css`. Use semantic
  classes (`bg-background`, `text-muted-foreground`, `bg-primary`) — never hard-coded hex.
- **Money.** Store integer minor units + ISO currency; format with `@/lib/format`.
- **Forms.** React Hook Form + Zod (`zodResolver`); share schemas with server validation.

## 5. Backend (Phase 2+)

```bash
supabase start          # local Postgres, Auth, Storage, Studio
supabase db reset       # apply supabase/migrations + seed
supabase test db        # RLS / pgTAP tests
npm run supabase:types  # regenerate src/types/database.generated.ts
```

- Migrations are **forward-only**; never edit a shipped migration — add a new one.
- Every new tenant table ships with: `enable`+`force` RLS, policies, indexes (FK +
  `organization_id`-leading), and `updated_at`/audit triggers.
- The frontend is untrusted — **RLS is the security boundary**. See
  [`docs/architecture/security.md`](architecture/security.md).

## 6. Build phases

We build one phase at a time and stop for review after each. The current phase and plan are in
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §5. Don't start the next phase until the current one is
approved.

## 7. Where things live

| Need                     | Path                                                           |
| ------------------------ | -------------------------------------------------------------- |
| Architecture & decisions | `docs/ARCHITECTURE.md`, `docs/architecture/*`                  |
| Design tokens            | `src/styles/globals.css`, `docs/architecture/design-system.md` |
| App composition          | `src/app/` (providers, routes, layouts)                        |
| Shared UI                | `src/components/` (+ `ui/` primitives)                         |
| Backend                  | `supabase/`                                                    |
| Brand source             | `assets/`, `branding/`                                         |
