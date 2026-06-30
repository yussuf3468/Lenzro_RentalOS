# Supabase Setup

The app runs without Supabase for design review (auth is bypassed). To exercise real
authentication, organizations and invitations, connect a Supabase project and apply the
migrations in [`supabase/`](../supabase/).

## What the backend provides (Phase 2)

- Tables: `organizations`, `profiles`, `platform_admins`, `roles`, `permissions`,
  `role_permissions`, `memberships`, `invitations`, `subscription_plans`, `plan_entitlements`,
  `subscriptions`, `subscription_events` — all with **RLS** (default-deny).
- The **Custom Access Token Hook** (`custom_access_token_hook`) that stamps tenant claims
  (`organization_id`, `role`, `platform_role`, `org_ids`) into every JWT.
- RPCs: `create_organization`, `set_active_organization`, `invite_member`, `get_invitation`,
  `accept_invitation`; helpers `auth_org_id()`, `auth_role()`, `is_platform_admin()`, `can()`,
  `user_organization_ids()`, `has_feature()`, `entitlement_limit()`.
- Seed: roles, permissions, role→permission mappings, plans + entitlements.

## Option A — Local stack (Supabase CLI + Docker)

```bash
supabase start            # boots Postgres, Auth, Storage, Studio, Inbucket
supabase db reset         # applies supabase/migrations/* then supabase/seed/seed.sql
supabase test db          # runs pgTAP tests in supabase/tests/
```

The Custom Access Token Hook is already enabled for local in
[`supabase/config.toml`](../supabase/config.toml) (`[auth.hook.custom_access_token]`).

Copy the printed **API URL** and **anon key** into `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from `supabase start`>
VITE_APP_URL=http://localhost:5173
```

Verification emails appear in **Inbucket** at `http://localhost:54324`.

## Option B — Hosted project

1. Create a project at [supabase.com](https://supabase.com). Copy **Project URL** and **anon key**
   (Project Settings → API) into `.env.local`.
2. **Apply migrations** in order — either link the CLI and push:
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # applies supabase/migrations/*
   ```
   …then run `supabase/seed/seed.sql` in the SQL Editor. (Or paste each migration `0000…0007`
   then the seed into the SQL Editor, in order.)
3. **Enable the auth hook:** Dashboard → Authentication → Hooks → **Custom Access Token** →
   enable and select `public.custom_access_token_hook`. (This is what `config.toml` does locally.)
4. **Auth URLs:** Dashboard → Authentication → URL Configuration → set **Site URL** to your app
   URL and add redirect URLs for `/(verify-email|reset-password)` and your domain.
5. **Email:** Supabase's built-in mailer works for low volume; customize templates with Lenzro
   branding. A dedicated provider is wired via an Edge Function in a later phase.

## After connecting

```bash
npm run supabase:types    # regenerate src/types/database.generated.ts for full type-safety
npm run dev
```

Flow: register → verify email → create organization (you become Owner on a 14-day trial) →
invite teammates (share the generated link until automated email is enabled) → they accept →
switch orgs from the top bar.

> **Security note:** the app uses only the **anon** key; every table is protected by RLS. The
> **service-role** key must never appear in the client or `.env.local` with a `VITE_` prefix.
