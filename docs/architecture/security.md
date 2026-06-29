# Security Model

Security is layered and **enforced in the database**, because the frontend and the anon key are
public. If a control matters, it lives in Postgres (RLS, constraints, triggers) or an Edge
Function — never only in the UI.

## 1. Threat model (what we defend against)

| Threat                    | Primary control                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Cross-tenant data access  | RLS on every tenant table, keyed to JWT `organization_id`                                                                        |
| Forged/escalated requests | `with check` policies + `can()` permission checks server-side                                                                    |
| Stolen anon key           | Anon key is public by design; useless without a valid user JWT + RLS                                                             |
| Service-role key leak     | Key never ships to client; only in Edge Function secrets                                                                         |
| SQL injection             | Parameterized PostgREST/RPC; no string-built SQL on the client                                                                   |
| XSS                       | React escaping, no `dangerouslySetInnerHTML` on user data, strict CSP                                                            |
| CSRF                      | Token-in-header bearer auth (not cookies) — not CSRF-prone                                                                       |
| Privilege via direct API  | PostgREST respects RLS identically to the app; same policies apply                                                               |
| Mass assignment           | Column-level defaults from JWT + `with check`; clients can't set `organization_id`, `created_by`, money totals (server-computed) |
| Replay/expired access     | Short access-token TTL, refresh rotation, reuse detection                                                                        |
| File-based attacks        | Storage RLS, type/size validation, signed URLs, no public PII buckets                                                            |

## 2. RLS patterns (the backbone)

Rules applied uniformly:

1. `enable row level security` **and** `force row level security` on every tenant table.
2. **Default deny** — no policy = no access. Policies are added per operation deliberately.
3. Separate `select` vs `insert/update/delete` policies; writes always carry a `with check`.
4. `using` = visibility; `with check` = legal target state. Both reference `auth_org_id()`.
5. Permission-sensitive writes add `and can('<perm>')`.
6. Helper functions are `security definer` with **`set search_path = public`** pinned (prevents
   search-path hijacking) and marked `stable`.
7. Global/catalog tables: `select` to all authenticated; writes restricted to `is_platform_admin()`.
8. Append-only tables (`audit_logs`) have **no** update/delete policy at all.

(Canonical policy examples live in `multi-tenancy.md` §4 and `database.md` §4.)

## 3. JWT & claims integrity

- Tenant context lives in `app_metadata` (server-controlled), **not** `user_metadata`
  (user-writable). A user cannot edit `app_metadata`.
- The Auth Hook re-derives `organization_id`/`role` from `memberships` on every issue — claims
  can't drift from the source of truth or be self-elevated.
- Access tokens are short-lived; sensitive changes (role/membership revocation) take effect on
  next refresh, with an immediate-revocation Edge Function for emergencies.

## 4. Input validation

- **Shared Zod schemas** validate on the client (fast UX) **and** are re-validated inside Edge
  Functions (trust boundary). The DB adds the final guard via constraints + the
  `validate_asset_attributes` trigger.
- Never trust client-supplied: `organization_id`, `created_by/updated_by`, money totals, status
  transitions, or computed fields — these are set/_recomputed_ server-side.
- Status transitions go through guarded RPCs (e.g. `confirm_booking`) that validate the state
  machine, not raw `UPDATE status=...`.

## 5. Secrets & configuration

| Secret                          | Where it lives                  | Exposure                   |
| ------------------------------- | ------------------------------- | -------------------------- |
| Supabase **anon** key           | client env (`VITE_*`)           | Public — safe, RLS-gated   |
| Supabase URL                    | client env                      | Public                     |
| Supabase **service-role** key   | Edge Function / server env only | **Never** in client bundle |
| Email/SMS/payment provider keys | Edge Function secrets           | Server only                |
| JWT signing secret              | Supabase-managed                | Never exposed              |

- `.env.local` git-ignored; `.env.example` documents every variable (`docs` lists them).
- Only `VITE_`-prefixed vars reach the browser; everything else is server-side.
- No secret is ever logged. PII is redacted in logs.

## 6. Audit & activity trails

- **`audit_logs`** (append-only): security/compliance record — actor, action, entity type+id,
  before/after JSON diff, IP, user-agent, timestamp. Written by `write_audit()` triggers on
  governed tables and by privileged Edge Functions. No UPDATE/DELETE policy.
- **`activity_logs`**: lightweight, user-facing "who did what" feed for the org.
- Both are tenant-scoped via RLS; platform admins read across tenants (audited).

## 7. Storage security

See `storage.md`. Summary: private buckets by default, path prefixed by `organization_id`,
storage RLS keyed to membership, signed URLs for private content, server-side type/size checks,
no PII in public buckets.

## 8. Rate limiting & abuse (prepared)

- Auth endpoints: Supabase built-in throttling on signup/login/reset.
- Edge Functions: per-identity token-bucket limiter (keyed by user/org/IP) — interface defined
  now, backed by Postgres or Upstash later.
- Vercel + Cloudflare edge provide network-level protection; bot protection on public forms.
- Sensitive actions (invites, exports, bulk ops) carry app-level quotas.

## 9. Transport, headers, browser hardening

- HTTPS everywhere (Vercel + Supabase TLS).
- Security headers via Vercel config: `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, and a **Content-Security-Policy** allow-listing
  Supabase, fonts, map tiles only.
- No third-party script unless vetted; SRI where applicable.

## 10. Privacy & compliance posture (foundation)

- Soft delete + a hard-delete/erasure path for data-subject requests (GDPR/Kenya DPA alignment).
- PII minimization; customer KYC docs in a strict private bucket with least-privilege access.
- Data residency configurable via Supabase region selection at provisioning.
- Per-org data export (portability) built on the same export permissions.

## 11. Security review gates

Every phase ends with a security pass: new tables have RLS + `force` + policies; new Edge
Functions re-validate auth/permission/input; no secret leaked to client; no `service_role` use
on the client path; audit coverage for new governed actions.
