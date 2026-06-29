# Environment Variables

Copy [`.env.example`](../.env.example) to `.env.local` and fill in values. `.env.local` is
git-ignored and must **never** be committed.

> **Rule:** only variables prefixed with `VITE_` are bundled into the browser. Anything secret
> must NOT use that prefix and must only exist server-side (Supabase / Vercel project secrets,
> Edge Function env).

## Client variables (browser — `VITE_`)

| Variable                 | Required | Description                                                                               |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Phase 2+ | Supabase project URL. Public.                                                             |
| `VITE_SUPABASE_ANON_KEY` | Phase 2+ | Supabase **anon** key. Public by design — all access is gated by Row Level Security.      |
| `VITE_APP_URL`           | optional | Public base URL of the app (auth redirects, emails). Defaults to `http://localhost:5173`. |

In Phase 1 the Supabase variables are **optional** — the app boots without them (marketing +
shell render). They become required as authentication lands in Phase 2; the client throws a
clear error if a feature uses Supabase while unconfigured.

Find the Supabase values in: **Supabase Dashboard → Project Settings → API**.

## Server-only secrets (NEVER prefix with `VITE_`)

Set these in Supabase / Vercel project secrets and Edge Function environments — never in the
client bundle or committed files.

| Variable                    | Where               | Description                                                    |
| --------------------------- | ------------------- | -------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions / CI | **Bypasses RLS.** Server-only, privileged operations.          |
| `SUPABASE_DB_URL`           | CI / tooling        | Direct Postgres connection string for migrations/tests.        |
| `RESEND_API_KEY` (or SMTP)  | Edge Functions      | Transactional email (verification, invites, reset) — Phase 2+. |

## Local Supabase

When running the local stack (`supabase start`), the CLI prints local `API URL` and `anon key`
to put in `.env.local` for end-to-end local development.
