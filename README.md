<div align="center">
  <img src="assets/logo.svg" alt="Lenzro" width="64" height="68" />
  <h1>Lenzro RentalOS</h1>
  <p><strong>The operating system for rental businesses.</strong></p>
  <p>A multi-tenant cloud platform by Lenzro Software Solutions — fleet, bookings, customers, finance and reports in one place. Built for car rental first; ready for motorcycles, equipment, machinery and trucks without re-architecting.</p>
</div>

---

> **Status: Phase 1 — Project initialized.** The foundation (design system, providers, routing,
> Supabase scaffolding, tooling) is in place. No business features yet — those land phase by
> phase. See the [roadmap](#roadmap).

## Tech stack

| Area     | Tech                                                                   |
| -------- | ---------------------------------------------------------------------- |
| Frontend | React 19 · TypeScript · Vite                                           |
| UI       | TailwindCSS v4 · shadcn/ui · Framer Motion · Lucide · Sonner           |
| Data     | TanStack Query · TanStack Table                                        |
| Forms    | React Hook Form · Zod                                                  |
| Viz      | Recharts · FullCalendar · Leaflet                                      |
| Backend  | Supabase (Postgres · Auth · Storage · Edge Functions · Realtime · RLS) |
| Hosting  | Vercel (web) · Supabase (data/edge)                                    |

## Quick start

Prerequisites: **Node ≥ 20.19** (this repo pins **24** via `.nvmrc`) and npm.

```bash
npm install              # install dependencies
cp .env.example .env.local   # then fill in values (Supabase optional until Phase 2)
npm run dev              # http://localhost:5173
```

The app boots without Supabase configured — the marketing landing and app shell render so you
can see the design system immediately.

## Scripts

| Script                            | Does                                    |
| --------------------------------- | --------------------------------------- |
| `npm run dev`                     | Start the Vite dev server               |
| `npm run build`                   | Typecheck + production build to `dist/` |
| `npm run preview`                 | Preview the production build            |
| `npm run typecheck`               | TypeScript project build (no emit)      |
| `npm run lint` / `lint:fix`       | ESLint                                  |
| `npm run format` / `format:check` | Prettier                                |
| `npm test` / `test:watch`         | Vitest                                  |
| `npm run supabase:types`          | Regenerate DB types (Phase 2+)          |

## Project structure

```
src/
  app/          composition: providers, routes, layouts, app-level pages
  features/     one folder per module (auth, bookings, assets, …) — vertical slices
  components/   shared composites + ui/ (shadcn primitives)
  lib/          supabase client, query client, formatting, utils
  hooks/        cross-cutting hooks (useTheme, …)
  config/       typed env, site metadata
  types/        shared + generated database types
  styles/       globals.css (brand design tokens, light + dark)
supabase/
  migrations/   forward-only SQL (0000 extensions, 0001 helpers, …)
  functions/    Edge Functions (Deno)
  seed/  tests/ idempotent seeds · pgTAP RLS tests
docs/           architecture + product documentation
assets/  branding/   brand source of truth
```

Full detail: [`docs/architecture/folder-structure.md`](docs/architecture/folder-structure.md).

## Design system

The product theme is generated from the brand source in [`branding/`](branding/) and
[`assets/`](assets/) and wired into Tailwind v4 + shadcn CSS variables in
[`src/styles/globals.css`](src/styles/globals.css). Ink-dominant and minimal; the
yellow→green gradient is a signature accent. Light and dark are both first-class. See
[`docs/architecture/design-system.md`](docs/architecture/design-system.md).

## Backend (Supabase)

Backend-as-code lives in [`supabase/`](supabase/). Tenant isolation is enforced in the database
with Row Level Security — the app is untrusted by design. With the Supabase CLI:

```bash
supabase start          # local stack (Postgres, Auth, Storage, Studio)
supabase db reset       # apply migrations + seed
supabase test db        # RLS / pgTAP tests
```

## Environment

See [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md). Only `VITE_`-prefixed variables reach the
browser; the Supabase **anon** key is safe to expose (RLS gates access). The **service-role**
key is server-only and never shipped to the client.

## Deployment

Vercel (SPA) + Supabase. Security headers and CSP are configured in
[`vercel.json`](vercel.json). CI (`.github/workflows/ci.yml`) runs typecheck, lint, format,
tests and build on every push and PR.

## Documentation

- [Architecture overview](docs/ARCHITECTURE.md) — the full Phase 0 blueprint
- [Developer onboarding](docs/DEVELOPMENT.md)
- [Environment variables](docs/ENVIRONMENT.md)

## Roadmap

`0` Architecture · **`1` Project init (you are here)** · `2` Auth + marketing · `3` Dashboard ·
`4+` Vehicles → Bookings → Customers → Staff → Maintenance → Finance → Contracts → Reports →
Calendar → Notifications → Documents → Settings → Audit → Support. One module per phase.

---

© Lenzro Software Solutions. All rights reserved.
