# Database Architecture

PostgreSQL (Supabase). UUID keys, foreign keys, indexes, constraints, soft deletes, audit
trails, RLS on every tenant table. This document defines the **shape and rules**; full DDL is
authored per-module in Phase 4+ as numbered migrations under `supabase/migrations/`.

## 1. Conventions (apply to every table)

### 1.1 Base columns

Every **tenant-owned** table includes this block:

```sql
id               uuid        primary key default gen_random_uuid(),
organization_id  uuid        not null references organizations(id) on delete cascade
                              default auth_org_id(),          -- tenant key, sourced from JWT
created_at       timestamptz not null default now(),
updated_at       timestamptz not null default now(),         -- maintained by trigger
created_by       uuid        references profiles(id),
updated_by       uuid        references profiles(id),
deleted_at       timestamptz                                  -- soft delete (where appropriate)
```

- **`updated_at`** is set by a shared `set_updated_at()` trigger — never trusted from the client.
- **`created_by` / `updated_by`** default to `auth.uid()` via trigger; provide an audit "who".
- **`deleted_at`** implements soft delete. Active-row queries filter `deleted_at is null`
  (encapsulated in views / data-access layer). Hard delete is reserved for compliance erasure.

### 1.2 Naming

- Tables: plural snake_case (`bookings`, `asset_categories`).
- PK: `id`. FK: `<entity>_id`. Booleans: `is_*` / `has_*`. Timestamps: `*_at`.
- Money: `*_amount_minor bigint` (minor units, e.g. cents) + `currency char(3)` — **never floats**.
- Enums: dedicated lookup tables or Postgres enums; prefer **text + check** or **lookup tables**
  for anything expected to grow (roles, statuses), reserving native enums for truly fixed sets.
- Ranges/periods: `tstzrange` for booking windows (enables exclusion constraints).

### 1.3 Integrity defaults

- All FKs explicit, with deliberate `on delete` (`cascade` for owned children, `restrict` for
  references that must not orphan, `set null` for optional links).
- `not null` is the default stance; nullable is a conscious choice.
- Check constraints on every status/enum-ish column and every money/quantity (`>= 0`).
- Unique constraints scoped by tenant: `unique (organization_id, <natural key>)`
  (e.g. a plate number is unique _within_ an org, not globally).

## 2. The asset abstraction (the "new vertical without migration" core)

The platform never models "cars". It models **rentable assets**. Car rental is the first
_configuration_ of this primitive.

```
asset_kinds (global catalog)
  key        text pk      -- 'vehicle' | 'motorcycle' | 'equipment' | 'machinery' | 'truck'
  label      text
  icon       text
  is_active  boolean
                                   ▲  referenced by
                                   │
asset_categories (per org)         │
  id, organization_id              │
  asset_kind   text ───────────────┘     -- which vertical this category belongs to
  name         text                      -- 'Economy', 'SUV', 'Excavators', '40ft Trucks'
  code         text
  default_rate_amount_minor, currency
  attribute_schema_id  uuid ─────────────┐  -- typed field definitions for this category
                                          │
category_attribute_schemas (per org)      │
  id, organization_id                     ◀┘
  asset_kind   text
  json_schema  jsonb     -- JSON Schema describing type-specific fields + validation
  ui_schema    jsonb     -- field order, labels, widgets for the dynamic form

assets (per org)  — one physical rentable UNIT
  id, organization_id
  category_id      uuid → asset_categories
  asset_kind       text                      -- denormalized for fast filtering/indexing
  name             text                      -- 'Toyota Prado — KDA 123X'
  identifier       text                      -- plate (vehicle) | serial (equipment) | VIN
  status           text   -- available | rented | reserved | maintenance | out_of_service | retired
  attributes       jsonb  -- TYPE-SPECIFIC fields, validated against category json_schema
  home_location    geography/point          -- optional, for maps
  acquisition_*    -- purchase date, cost, odometer/hours
  daily_rate_amount_minor, currency
  ... base columns
```

### How typed attributes work

`assets.attributes` holds the fields that differ per vertical:

| Kind       | Example `attributes` JSON                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| vehicle    | `{ "make":"Toyota","model":"Prado","year":2022,"transmission":"automatic","seats":7,"fuel":"diesel" }` |
| motorcycle | `{ "engine_cc":150,"type":"scooter" }`                                                                 |
| equipment  | `{ "power_kw":5,"weight_kg":120,"voltage":240 }`                                                       |
| machinery  | `{ "operating_weight_t":21,"bucket_capacity_m3":1.2,"engine_hours":3400 }`                             |
| truck      | `{ "axles":3,"payload_kg":18000,"trailer":"flatbed" }`                                                 |

Validation is layered:

1. **App layer** — a Zod schema generated from `json_schema` validates the form before submit.
2. **DB layer** — a trigger validates `attributes` against the category's `json_schema`
   (via a `jsonb`/JSON-Schema check) on insert/update, so the rule holds even for direct API calls.

**Adding "truck rentals" =** insert an `asset_kind` row (if new) + the org creates categories
and an attribute schema + inserts assets. **Zero migrations.** Bookings, pricing, availability,
maintenance, contracts and reports all operate on `assets` and never need to know the kind.

> **Product vocabulary mapping:** for a car-rental tenant the UI labels `assets` as
> "Vehicles" and `asset_categories` as "Vehicle Categories" (per the module list). The label
> set is chosen from the org's enabled `asset_kinds`. Same tables, different nouns.

## 3. Domain model by module

Tenant tables (all carry base columns + RLS) grouped by module. `→` = FK.

### Identity & tenancy

| Table                           | Purpose                        | Key fields / relationships                                                                      |
| ------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `organizations` _(global root)_ | The tenant                     | `slug` (unique), `legal_name`, `country`, `default_currency`, `timezone`, `status`, `logo_path` |
| `profiles` _(global)_           | App projection of `auth.users` | `id`=auth uid, `full_name`, `avatar_path`, `active_organization_id`, `locale`                   |
| `platform_admins` _(global)_    | Lenzro staff                   | `user_id`, `platform_role` (super_admin\|lenzro_admin)                                          |
| `memberships`                   | user ↔ org ↔ role              | → org, → profile, `role`, `status`                                                              |
| `invitations`                   | pending org invites            | → org, `email`, `role`, `token_hash`, `expires_at`, `accepted_at`                               |

### Subscriptions & platform billing (see `subscriptions.md`)

| Table                           | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `subscription_plans` _(global)_ | Free Trial / Basic / Professional / Enterprise catalog                |
| `plan_entitlements` _(global)_  | per-plan feature flags + numeric limits                               |
| `subscriptions`                 | an org's current plan, status, trial/period/grace dates               |
| `subscription_events`           | append-only lifecycle log (start, upgrade, downgrade, expire)         |
| `billing_customers`             | provider-agnostic billing ref (Stripe/M-Pesa id) — _prepared, unused_ |

### Fleet / assets

`asset_kinds`_(g)_, `asset_categories`, `category_attribute_schemas`, `assets`,
`asset_images`, `asset_documents`, `rate_plans`, `asset_availability_blocks`.

### Bookings

| Table            | Purpose                                | Notes                                                                                                 |
| ---------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `bookings`       | rental order                           | `code` (LNZ-BKG-YYYY-####), → customer, status lifecycle, totals                                      |
| `booking_items`  | asset reserved for a period            | → booking, → asset, `period tstzrange`, rate, → driver — **carries the no-double-booking constraint** |
| `booking_extras` | add-ons (GPS, child seat, insurance)   | → booking                                                                                             |
| `inspections`    | check-out / check-in condition reports | → booking_item, photos, fuel/odo, damages                                                             |

### Customers, drivers, staff

`customers`, `customer_documents`, `drivers` (link to employee/customer/user via nullable FKs),
`employees` (HR record; nullable `user_id` when the person logs in).

### Maintenance

`maintenance_orders` (→ asset, type=service|repair, status), `maintenance_items` (parts/labor),
`maintenance_schedules` (interval-based reminders by km/hours/date).

### Finance (operational billing — org → its customers)

`invoices` (→ booking/customer, status draft|sent|paid|overdue|void), `invoice_items`,
`payments` (→ invoice, method, amount, ref), `expenses` (→ asset/category, vendor),
`incomes` (non-booking income), `contracts` (→ booking, → asset, signed PDF in storage).

### Engagement & ops

`notifications` (per-user, in-app), `conversations` + `messages` (internal/customer messaging),
`documents` (generic file metadata → storage), `calendar_events` (derived view + ad-hoc events),
`support_tickets` (→ Lenzro support).

### Governance

`audit_logs` (append-only: actor, action, entity, before/after jsonb, ip, at),
`activity_logs` (lightweight user activity feed), `organization_settings` (per-org config, jsonb).

## 4. Critical DDL patterns (representative — the rest follow these)

### 4.1 Prevent double-booking with an exclusion constraint (race-proof, in the DB)

```sql
create extension if not exists btree_gist;

alter table booking_items
  add constraint booking_items_no_overlap
  exclude using gist (
    asset_id with =,
    period   with &&            -- overlapping time ranges
  )
  where (status in ('reserved','confirmed','checked_out') and deleted_at is null);
```

Two confirmed rentals of the same asset over overlapping periods become **physically
impossible** — no application-level race window. Maintenance blocks use the same pattern
against `asset_availability_blocks`.

### 4.2 Tenant defaulting + RLS (every tenant table)

```sql
alter table bookings enable row level security;
alter table bookings force  row level security;

create policy bookings_select on bookings for select
  using (organization_id = auth_org_id() or is_platform_admin());

create policy bookings_modify on bookings for all
  using (organization_id = auth_org_id())
  with check (organization_id = auth_org_id() and can('bookings:write'));
```

(`can()` = permission check helper; see `authorization.md`.)

### 4.3 Shared triggers

```sql
-- set_updated_at(): sets updated_at = now(), updated_by = auth.uid()
-- set_created_by(): sets created_by = auth.uid() on insert
-- validate_asset_attributes(): checks assets.attributes against category json_schema
-- write_audit(): captures before/after into audit_logs for governed tables
```

## 5. Indexing strategy

| Pattern                     | Index                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Tenant scoping (all tables) | composite leading with `organization_id`, e.g. `(organization_id, status, created_at desc)` |
| Foreign keys                | every FK gets an index (Postgres doesn't auto-create them)                                  |
| Soft delete                 | partial indexes `where deleted_at is null` for hot active-row queries                       |
| Booking availability        | GiST on `booking_items (asset_id, period)` (from the exclusion constraint)                  |
| Search                      | `pg_trgm` GIN on `customers.full_name`, `assets.identifier`, etc.                           |
| JSONB attributes            | targeted GIN on `assets.attributes` only where filtered (e.g. `attributes->>'make'`)        |
| Audit                       | `(organization_id, created_at desc)`, `(entity_type, entity_id)`                            |

## 6. ERD (core, textual)

```
organizations ─┬─< memberships >─ profiles ─(active_org)─→ organizations
               │        │
               │        └─ role → roles ─< role_permissions >─ permissions
               ├─< subscriptions ─→ subscription_plans ─< plan_entitlements
               ├─< asset_categories ─< assets ─< asset_images
               │         │               │
               │         └─ attribute_schema   └─< booking_items >─ bookings ─→ customers
               │                                        │
               │                                   (period: no-overlap exclusion)
               ├─< bookings ─< invoices ─< payments
               │       └─< contracts ─→ assets
               ├─< maintenance_orders ─→ assets
               ├─< expenses / incomes
               ├─< documents / notifications / messages
               └─< audit_logs / activity_logs / organization_settings

global (no organization_id): asset_kinds, subscription_plans, plan_entitlements,
                             roles, permissions, role_permissions, currencies, profiles*
                             (*profiles is per-user, not per-tenant)
```

## 7. Soft delete, audit, and time

- **Soft delete** on user-facing business records (assets, bookings, customers, invoices…).
  Junction/log tables are hard-deleted or immutable.
- **Audit**: governed tables fire `write_audit()` → `audit_logs` (append-only, no UPDATE/DELETE
  policy). Audit captures actor, action, entity, JSON diff, request IP/user-agent.
- **Time**: all timestamps `timestamptz` in UTC; org `timezone` used only for presentation.
  Currency/locale per org for formatting.
