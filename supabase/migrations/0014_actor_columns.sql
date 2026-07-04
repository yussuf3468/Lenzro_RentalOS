-- =============================================================================
-- 0014_actor_columns — HOTFIX: inserts into payments / expenses / rental_photos
-- failed with `record "new" has no field "updated_by"`.
-- -----------------------------------------------------------------------------
-- The shared set_actor() trigger (0001) stamps BOTH created_by and updated_by,
-- but the Phase B/C tables were created with created_by only. Add the missing
-- audit column so the platform-wide trigger works everywhere. Idempotent.
-- =============================================================================

alter table public.payments
  add column if not exists updated_by uuid references public.profiles (id);

alter table public.expenses
  add column if not exists updated_by uuid references public.profiles (id);

alter table public.rental_photos
  add column if not exists updated_by uuid references public.profiles (id);
