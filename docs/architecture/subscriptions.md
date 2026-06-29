# Subscriptions, Entitlements & Platform Billing

This is the **SaaS** layer: each organization subscribes to Lenzro. **No payment provider is
integrated in this phase** — we build the model, lifecycle, and feature-locking so that wiring
Stripe / M-Pesa / Flutterwave later is a contained, additive change.

> **Two billing domains, kept separate** (see `database.md`):
>
> - **Platform billing** (this doc): org → Lenzro, the subscription.
> - **Operational billing**: org → its own customers, the rental `invoices`/`payments`.

## 1. Plans

| Plan             | Intent                         | Example limits (configurable in DB, not code)                |
| ---------------- | ------------------------------ | ------------------------------------------------------------ |
| **Free Trial**   | 14-day full-feature evaluation | trial of Professional limits                                 |
| **Basic**        | Single small branch            | e.g. 25 assets, 3 users, core modules                        |
| **Professional** | Growing company                | e.g. 150 assets, 15 users, + analytics, contracts, messaging |
| **Enterprise**   | Multi-branch / high volume     | high/unlimited limits, all modules, priority support         |

Plans, prices and limits live in **`subscription_plans` + `plan_entitlements`** — editable
without a deploy. Adding a plan = data, not code.

## 2. Data model

```
subscription_plans (global)
  key, name, tier(int), price_amount_minor, currency, billing_interval(month|year), is_public

plan_entitlements (global)            -- one row per (plan, feature)
  plan_key, feature_key, limit_int?, enabled bool
  -- feature_key ∈ flags ('module.analytics','module.contracts','feature.api')
  --             ∪ limits  ('limit.assets','limit.users','limit.storage_gb','limit.bookings_month')

subscriptions (per org)               -- exactly one current row per org
  organization_id, plan_key,
  status,            -- trialing | active | past_due | grace | canceled | expired
  trial_end, current_period_start, current_period_end,
  grace_until, cancel_at_period_end bool,
  billing_customer_id?  -- provider ref, prepared/unused

subscription_events (per org, append-only)
  type (created|trial_started|activated|upgraded|downgraded|renewed|payment_failed
        |grace_started|canceled|expired|reactivated), from_plan, to_plan, at, metadata

billing_customers (per org)           -- provider-agnostic, prepared
  provider (null for now), external_id, default_payment_method
```

## 3. Entitlements — the single source of "what can this org do"

A resolver computes effective entitlements for the active org and exposes them to the app:

```
useEntitlements() → {
  can(featureKey): boolean              // 'module.analytics' enabled?
  limit(limitKey): number | Infinity    // 'limit.assets'
  usage(limitKey): number               // current count
  remaining(limitKey): number
  status: 'trialing' | 'active' | 'grace' | 'past_due' | 'expired'
}
```

- **UX gating** uses `useEntitlements()` to lock modules, show upgrade prompts, and render
  usage meters.
- **Hard enforcement** lives server-side: limit checks run in the RPCs/triggers that create the
  limited resource. Example — creating the (limit+1)-th asset:

```sql
-- inside create_asset() / a BEFORE INSERT trigger
if (select count(*) from assets where organization_id = auth_org_id() and deleted_at is null)
     >= entitlement_limit('limit.assets')
then raise exception 'LNZ_PLAN_LIMIT_REACHED' using detail = 'limit.assets';
end if;
```

So feature locking cannot be bypassed by calling the API directly — same principle as RLS.

## 4. Lifecycle state machine

```
                 ┌─────────── upgrade/downgrade (immediate or at period end) ───────────┐
                 ▼                                                                        │
[trialing] ──trial_end & paid──▶ [active] ──period_end & paid──▶ [active] (renew)         │
   │ trial_end & unpaid                │ payment_failed                                   │
   ▼                                   ▼                                                  │
[expired] ◀── grace_until passed ── [grace / past_due] ──payment recovered──▶ [active] ───┘
   ▲                                   │ user cancels
   │                                   ▼
   └──────────────── reactivate ── [canceled] (access until period_end → expired)
```

- **Trial:** full features for 14 days; daily countdown surfaced in UI from day 7.
- **Grace period:** on expiry/failed payment, a configurable grace window (e.g. 7 days) keeps
  the app **read-only or limited** (configurable) before lock — never abrupt data loss.
- **Expired/locked:** app routes to a **billing wall**; data is retained (not deleted), exports
  still allowed for a retention window. Owner can reactivate.
- All transitions append to `subscription_events` and emit notifications (T-7, T-3, T-1, expiry).

## 5. Enforcement points (today, without a payment provider)

- A scheduled job (Supabase cron / scheduled Edge Function) evaluates `trial_end` /
  `current_period_end` / `grace_until` nightly and transitions `status`, writing events +
  notifications. Until payments exist, "renewal" can be **manually granted** by a Lenzro admin
  (the same RPC the payment webhook will later call).
- The Auth Hook can include `subscription_status` in the JWT so route guards lock instantly
  without an extra query; the billing wall is also enforced by entitlement checks server-side.

## 6. Upgrade / downgrade

- **Upgrade:** immediate; entitlements widen at once; proration handled later by the provider.
- **Downgrade:** takes effect at period end (`cancel_at_period_end`-style), with a pre-check
  that current usage fits the lower plan's limits (or prompts the org to reduce first).
- Changing plan is an audited RPC `change_subscription_plan(plan_key)` gated by `billing:manage`.

## 7. Payment integration seam (later, no rework)

When payments are added:

- A provider adapter behind `billing_customers` + an Edge Function `billing_webhook` calls the
  **same** lifecycle RPCs (`activate_subscription`, `mark_payment_failed`, `renew`) used by the
  manual/admin path today.
- M-Pesa (STK push) and card (Stripe) are two adapters over one internal interface — no schema
  change, because the model is provider-agnostic from day one.
