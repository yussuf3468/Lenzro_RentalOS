# Authentication & Onboarding

Auth is provided by **Supabase Auth** (GoTrue). The app holds the **anon key**; sessions are
JWTs (access token ~1h + refresh token). Tenant context is injected into the JWT by the Custom
Access Token Hook (see `multi-tenancy.md`).

## 1. Methods

| Method                    | Phase | Notes                                                   |
| ------------------------- | ----- | ------------------------------------------------------- |
| Email + password          | 2     | Primary. Email verification required before app access. |
| Magic link / OTP          | 2     | For invitations & passwordless option.                  |
| OAuth (Google, Microsoft) | later | Config-only; no schema change.                          |
| MFA (TOTP)                | later | Supabase native; enable per-org policy for Owner/Admin. |

Password policy: min length, breach-check (HaveIBeenPwned via Edge Function, later), rate-limited
attempts. Sessions: refresh rotation on, reuse detection on.

## 2. Account ↔ Profile ↔ Membership

```
auth.users (Supabase-managed, private)
    │  on signup → trigger handle_new_user()
    ▼
profiles (1:1 with auth.users, app-readable)
    │
    ▼
memberships (M:N profiles ↔ organizations, carries role)
```

A `handle_new_user()` trigger creates the `profiles` row automatically on signup, so the app
never writes to `auth.users`.

## 3. Flow: Sign up → create organization (first user becomes Owner)

```
1. User submits name, email, password on /register
2. supabase.auth.signUp() → auth.users row (unconfirmed)
   trigger handle_new_user() → profiles row
3. Supabase sends verification email (branded template)
4. User clicks link → email confirmed → session issued
5. App detects "no membership yet" → routes to /onboarding
6. User submits company details (name, country, currency, timezone)
7. RPC/Edge Function create_organization() runs ATOMICALLY:
      • insert organizations (slug generated, unique)
      • insert membership (user, org, role='owner', status='active')
      • insert subscription (plan='free_trial', status='trialing', trial_end=now()+14d)
      • set profiles.active_organization_id = new org
      • write audit_log
8. Client refreshSession() → JWT now carries organization_id + role='owner'
9. Redirect to /:orgSlug (dashboard, empty-state onboarding checklist)
```

`create_organization()` is a single transaction (Edge Function using a transaction, or a
Postgres function) so a failure leaves **no half-created tenant**.

## 4. Flow: Invite a teammate

```
Owner/Manager → /settings/team → "Invite"
   → RPC invite_member(email, role)
        • authorize: caller has 'team:invite' permission
        • enforce entitlement: seats_used < plan.max_users
        • insert invitations(org, email, role, token_hash, expires_at = now()+7d)
        • Edge Function sends branded invite email with signed link
   Invitee clicks link → /accept-invite?token=...
        • if no account → signUp (email pre-filled, verified via the invite token)
        • RPC accept_invitation(token):
             • validate token_hash + not expired + not used
             • insert/activate membership(role from invite)
             • mark invitation accepted_at
             • set active_organization_id if first org
        • refreshSession → enters org
```

Tokens are stored **hashed** (`token_hash`), single-use, expiring. The raw token only exists in
the emailed URL.

## 5. Flow: Email verification

- Required before any app access (`email_confirmed_at` gate in the route guard).
- Unverified users land on `/verify-email` with resend (rate-limited) and "change email".
- Verification + invite acceptance can be combined (clicking an invite verifies the email).

## 6. Flow: Forgot / reset password

```
/forgot-password → supabase.auth.resetPasswordForEmail(email, { redirectTo:/reset-password })
   → email with recovery link (always show success message; never reveal if email exists)
/reset-password (recovery session) → updateUser({ password }) → sign out other sessions → sign in
```

## 7. Route protection (frontend guards, backed by RLS)

```
<PublicRoute>      marketing, /login, /register, /forgot — redirect to app if authed
<RequireAuth>      must have a session; else → /login (preserve returnTo)
<RequireVerified>  email_confirmed_at not null; else → /verify-email
<RequireOrg>       has active membership; else → /onboarding
<RequireOrgSlug>   URL :orgSlug matches a membership; sync active org or 404
<RequirePermission perm="...">  gate a route/action by permission
<RequirePlatformRole>  Lenzro admin console
```

Guards are **UX**; the **security guarantee is RLS** — a forged client that skips a guard still
cannot read or write another tenant's rows.

## 8. Session & token lifecycle

| Event                       | Effect                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Login                       | access (~1h) + refresh token; JWT stamped with active org/role/platform_role       |
| Silent refresh              | supabase-js auto-refreshes; Auth Hook re-stamps claims (picks up role/org changes) |
| Org switch                  | `set_active_organization()` + forced `refreshSession()`                            |
| Membership revoked          | claim drops on next refresh; immediate kill via admin sign-out Edge Function       |
| Logout                      | clears local session; optional "sign out everywhere"                               |
| Suspended org / expired sub | guard routes to billing wall; read-only or locked per grace policy                 |

## 9. Emails (branded)

All transactional emails (verify, invite, reset, subscription notices) use Lenzro-branded
templates (logo, gradient rule, Inter type). Provider abstracted behind an Edge Function
(`send_email`) so SMTP/Resend/SES is a config swap — no app change. Phase 2 may use Supabase's
built-in mailer with custom templates; a dedicated provider is wired when volume grows.
