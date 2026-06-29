# API Architecture

There is no hand-written CRUD server. The "API" is three Supabase surfaces, each chosen for a
specific job, all governed by the same RLS:

| Surface                                     | Use it for                                                                           | Auth                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **PostgREST** (auto REST via `supabase-js`) | Reads + simple CRUD on tables/views                                                  | anon key + user JWT, RLS-enforced                               |
| **Postgres RPC** (`rpc()` → SQL functions)  | Transactional/business logic that stays in-DB (state machines, atomic multi-row ops) | same JWT, runs as caller (or `security definer` when justified) |
| **Edge Functions** (Deno)                   | Privileged ops, secrets, external calls, webhooks, heavy/async work                  | service-role _inside_ the function only                         |

## 1. Decision rule — where does logic go?

```
Is it a plain read or single-table write fully expressible under RLS?      → PostgREST
Is it multi-row / transactional / a guarded state transition, no secrets?  → Postgres RPC
Does it need a secret, an external API, a webhook, email, or service-role?  → Edge Function
```

Examples:

- List bookings, update a customer's phone → **PostgREST**.
- `create_organization()`, `accept_invitation()`, `confirm_booking()`,
  `set_active_organization()`, `check_availability()` → **RPC** (atomic, RLS-safe).
- `send_email()`, `revoke_user_sessions()`, future `process_payment_webhook()`,
  `generate_contract_pdf()`, `export_report()` → **Edge Function**.

## 2. The frontend data-access layer

The UI never calls `supabase` ad hoc. Each feature owns a thin, typed **data-access module**
wrapped by **TanStack Query** hooks:

```
src/features/bookings/
  api/bookings.api.ts      // pure functions: listBookings(filters), getBooking(id), createBooking(dto)
  api/bookings.keys.ts     // query-key factory: bookingKeys.list(filters), bookingKeys.detail(id)
  hooks/useBookings.ts     // useQuery wrappers
  hooks/useCreateBooking.ts// useMutation + optimistic update + cache invalidation
  schemas/booking.schema.ts// Zod (shared with Edge Function validation)
  types/booking.types.ts   // derived from generated DB types + Zod infer
```

Benefits: one place per entity for data logic, consistent caching, testable, and DB types are
**generated** (`supabase gen types typescript`) so the client is type-safe end-to-end.

### Query-key & caching conventions

- Keys are tenant-scoped implicitly (RLS) but **explicitly include the active org id** so a
  cache never bleeds across an org switch; switching org clears/invalidates queries.
- Standard `staleTime`/`gcTime` per data volatility; lists invalidate on related mutations.
- Mutations use optimistic updates where safe, always reconcile on settle.

## 3. Realtime

- Supabase Realtime (Postgres changes) for live dashboards, booking board, notifications,
  messaging. Subscriptions are **RLS-scoped** — clients only receive rows their JWT can see.
- Channels are namespaced per org (`org:{id}:bookings`) and torn down on org switch/unmount.
- Used judiciously (live ops views, notifications), not for every list, to control connections.

## 4. Error model & contracts

- Errors normalized into a single `AppError { code, message, details? }` shape at the
  data-access boundary; Postgres error codes / PostgREST errors mapped to friendly messages.
- Domain errors raised in SQL/Edge with stable codes (e.g. `LNZ_ASSET_UNAVAILABLE`,
  `LNZ_PLAN_LIMIT_REACHED`) so the UI can react precisely (toast, upsell, field error).
- Mutations surface validation errors back to RHF field level; system errors → Sonner toast.

## 5. Pagination, filtering, sorting

- Server-side via PostgREST `range`/`order`/`filter`; **keyset (cursor) pagination** for large
  lists (bookings, audit) using `(created_at, id)`; offset only for small/admin lists.
- TanStack Table drives column sort/filter → translated to PostgREST query params in the
  data-access layer (not in components).

## 6. Idempotency & concurrency

- Mutating RPCs/Edge Functions accept an **idempotency key** for retry-safety (create booking,
  payments later).
- Optimistic concurrency via `updated_at` checks on critical updates; the booking exclusion
  constraint is the ultimate guard against double-booking races.

## 7. Versioning & stability

- DB types regenerated on every migration; breaking changes are additive-first (new columns
  nullable, deprecate before drop).
- RPC/Edge contracts are explicit DTOs (Zod). Edge Functions are individually deployable and
  versioned in `supabase/functions/*`.

## 8. Observability

- Structured logs in Edge Functions (no PII/secrets), correlation id per request.
- Supabase logs/metrics for Postgres + PostgREST; Vercel analytics for the SPA.
- Slow-query review each phase; `audit_logs` doubles as a security/event stream.
