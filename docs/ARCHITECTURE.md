# Lenzro RentalOS — System Architecture

> **Phase 0 — Architecture.** This document set is the architectural blueprint for
> Lenzro RentalOS. No application code is written in this phase. Everything here is
> the contract that Phases 1+ implement against.

**Product:** Lenzro RentalOS — a multi-tenant cloud platform that lets rental companies
run their entire business.
**Owner:** Lenzro Software Solutions.
**Initial market:** Car rental companies in East Africa (default currency **KES**, multi-currency capable).
**Status:** Phase 0 (architecture). Awaiting approval before Phase 1.

---

## 1. What we are building

A B2B SaaS where each rental company ("organization" / tenant) signs up, subscribes,
and manages vehicles, bookings, customers, staff, maintenance, finances, contracts and
reports — fully isolated from every other company on the platform.

The platform launches for **car rental** but the data model is built on a generic
**rentable asset** primitive so the _same database_ serves motorcycle, equipment,
machinery and truck rentals with **zero schema migrations** — only configuration.

### Design tenets

1. **Tenant isolation is non-negotiable.** Company A can never see Company B's data.
   Enforced in the database with Row Level Security (RLS), not just in application code.
2. **The database is the security boundary.** The frontend is untrusted. Every rule that
   matters is enforced in Postgres (RLS, constraints, triggers) and/or Edge Functions.
3. **Generic core, typed edges.** Bookings, pricing, availability and maintenance operate
   on an abstract `asset`. Type-specific fields (seats, transmission, load capacity, operating
   hours) live in validated JSONB so new rental verticals need no migration.
4. **One responsibility per unit.** One concern per file, table, function, component.
5. **Production-ready only.** No placeholder logic, no stubbed security, no fake data paths.
6. **Built for thousands of tenants.** Every index, policy and query is written with that scale in mind.

---

## 2. Technology stack (locked)

| Layer        | Choice                              | Notes                                                   |
| ------------ | ----------------------------------- | ------------------------------------------------------- |
| Frontend     | React 19 + TypeScript + Vite        | SPA, deployed to Vercel                                 |
| Styling      | TailwindCSS + shadcn/ui             | Theme driven by brand CSS variables (see design system) |
| Animation    | Framer Motion                       | Restrained, purposeful motion                           |
| Server state | TanStack Query                      | Single source of truth for server data + cache          |
| Forms        | React Hook Form + Zod               | `zodResolver`; schemas shared client/server             |
| Tables       | TanStack Table                      | Headless; styled with shadcn                            |
| Charts       | Recharts                            | Dashboard & analytics                                   |
| Calendar     | FullCalendar                        | Bookings / availability board                           |
| Maps         | Leaflet                             | Fleet location, GPS placeholder                         |
| Icons        | Lucide                              |                                                         |
| Toasts       | Sonner                              |                                                         |
| Backend      | Supabase                            | Postgres, Auth, Storage, Edge Functions, Realtime, RLS  |
| Hosting      | Vercel (web) + Supabase (data/edge) |                                                         |

### Decisions made in Phase 0 (the stack list left these open — override if you disagree)

| #   | Decision                                                                                          | Rationale                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Routing: React Router v7**                                                                      | Stack specified TanStack _Query_ (not Router). React Router v7 is the de-facto standard, file-agnostic, SSR-optional. (Alt: TanStack Router for end-to-end type-safe routes.) |
| D2  | **Client state: TanStack Query + React Context; add Zustand only if a real need appears**         | Avoid premature global-state complexity. Server state is 90% of state here.                                                                                                   |
| D3  | **Repo: single Vite app + root `supabase/` dir (not a monorepo yet)**                             | Simpler to start; promote to a Turborepo/`packages/*` later if a second app (mobile, admin) appears.                                                                          |
| D4  | **Multi-tenancy: shared schema + `organization_id` discriminator + RLS**                          | The only model that scales to thousands of tenants on Supabase's single Postgres. (Schema-per-tenant and DB-per-tenant rejected — see `architecture/multi-tenancy.md`.)       |
| D5  | **Active tenant carried in a JWT custom claim via a Supabase Auth Hook**                          | Fast RLS (no per-row subquery), clean org-switching. Membership table remains source of truth.                                                                                |
| D6  | **Rentable unit is modeled as a generic `asset`; "Vehicle" is the car-rental presentation of it** | Delivers the "new vertical without schema change" requirement.                                                                                                                |
| D7  | **Default currency KES, money stored as integer minor units + ISO currency code**                 | Avoid float rounding; multi-currency ready for pan-African expansion.                                                                                                         |
| D8  | **Platform billing and tenant operational invoicing are separate domains**                        | An org _pays Lenzro_ (subscriptions) vs an org _invoices its own customers_ (rental invoices). Never conflated.                                                               |

---

## 3. System context (C4 level 1)

```
                       ┌────────────────────────────────────────────┐
                       │                  Vercel                     │
   Browser  ───────────▶  Lenzro RentalOS SPA (React 19 / Vite)      │
   (tenant users,       │  - marketing site + app shell              │
    Lenzro staff)       │  - supabase-js (anon key)                  │
                       └───────────────┬────────────────────────────┘
                                       │ HTTPS (JWT bearer)
                          ┌────────────▼─────────────────────────────┐
                          │               Supabase                    │
                          │                                           │
   Auth (email/pwd,  ◀────┤  • Auth + Custom Access Token Hook        │
   magic link, OAuth)     │  • PostgREST  (RLS-governed REST)         │
                          │  • Edge Functions (Deno) — privileged ops │
   Storage (S3) ◀─────────┤  • Postgres 15+ (RLS, triggers, RPC)      │
                          │  • Realtime (RLS-scoped subscriptions)    │
                          └────────────┬──────────────────────────────┘
                                       │ (future, provider-agnostic)
                          ┌────────────▼─────────────┐
                          │  Email (Resend/SMTP),     │
                          │  Payments (Stripe/M-Pesa) │  ← Phase: later
                          │  SMS, Maps tiles          │
                          └───────────────────────────┘
```

The browser talks to Supabase directly using the **anon key**; security comes from RLS,
not from hiding the endpoint. The **service-role key never leaves the server** (Edge
Functions only). Privileged or multi-step operations go through Edge Functions / Postgres RPC.

---

## 4. Document index

| Doc                                                                    | Covers                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`architecture/multi-tenancy.md`](architecture/multi-tenancy.md)       | Tenancy model, JWT claims, org switching, isolation guarantees                  |
| [`architecture/database.md`](architecture/database.md)                 | Full schema, asset abstraction, base columns, indexes, constraints, ERD         |
| [`architecture/authentication.md`](architecture/authentication.md)     | Sign-up, org creation, invitations, verification, password reset, onboarding    |
| [`architecture/authorization.md`](architecture/authorization.md)       | Role planes, RBAC, permission catalog, enforcement layers                       |
| [`architecture/security.md`](architecture/security.md)                 | RLS patterns, audit trail, validation, secrets, storage security, rate limiting |
| [`architecture/api.md`](architecture/api.md)                           | PostgREST vs RPC vs Edge Functions, data-access layer, Realtime, error model    |
| [`architecture/storage.md`](architecture/storage.md)                   | Buckets, path conventions, storage RLS, signed URLs, upload validation          |
| [`architecture/subscriptions.md`](architecture/subscriptions.md)       | Plans, entitlements, trial/grace lifecycle, feature locking, limits             |
| [`architecture/design-system.md`](architecture/design-system.md)       | Brand → product design system, tokens, dark mode, components, motion            |
| [`architecture/ui-standards.md`](architecture/ui-standards.md)         | **Binding UI/UX bar** — Liquid Glass, motion, states, responsiveness, perf      |
| [`architecture/folder-structure.md`](architecture/folder-structure.md) | Repo + `src/` feature-based structure                                           |
| [`architecture/scalability.md`](architecture/scalability.md)           | Scaling to thousands of tenants, new verticals, performance, partitioning       |

---

## 5. Roadmap (phase plan)

We build like a software company: one phase, then **stop for approval**.

| Phase  | Scope                                                                                                                                                                                                                                                            | Gate                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **0**  | Architecture (this set). No code.                                                                                                                                                                                                                                | ✅ this deliverable → awaiting approval |
| **1**  | Project init: folder structure, packages, config, Supabase project, CI, design tokens, app shell skeleton. No features.                                                                                                                                          | approval                                |
| **2**  | Auth + marketing site: landing, sign in/up, forgot/reset, email verification, org creation, invitations, tenant onboarding.                                                                                                                                      | approval                                |
| **3**  | Dashboard: KPIs, revenue, bookings, fleet availability, charts, dark mode, responsive.                                                                                                                                                                           | approval                                |
| **4+** | Vehicles/Assets → Bookings → Customers → Staff/Drivers → Maintenance → Finance (expenses/income/invoices/payments) → Contracts → Reports/Analytics → Calendar → Notifications/Messaging → Documents → Settings → Audit/Activity → Support. One module per phase. | approval each                           |

Every phase ends with a self-review (bugs, imports, architecture, security) and a STOP.

---

## 6. Glossary (shared vocabulary)

| Term                            | Meaning                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| **Organization / Tenant / Org** | A rental company on the platform. The unit of isolation.                              |
| **Membership**                  | A user's link to an org, carrying their org-level role.                               |
| **Platform role**               | Lenzro-staff role spanning all tenants (Super Admin, Lenzro Admin).                   |
| **Asset**                       | A rentable unit (the platform primitive). A _Vehicle_ is an asset of kind `vehicle`.  |
| **Asset kind**                  | `vehicle` \| `motorcycle` \| `equipment` \| `machinery` \| `truck` \| … (extensible). |
| **Booking**                     | A customer's rental order; has one or more booking items (asset + period + rate).     |
| **Entitlement**                 | A capability/limit granted by the org's subscription plan.                            |
| **Platform billing**            | The org paying Lenzro for the SaaS.                                                   |
| **Operational billing**         | The org invoicing _its_ customers for rentals.                                        |
