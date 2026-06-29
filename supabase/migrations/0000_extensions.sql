-- =============================================================================
-- 0000_extensions — required Postgres extensions
-- =============================================================================
-- pgcrypto   : cryptographic functions (token hashing, gen_random_uuid fallback)
-- btree_gist : composite GiST indexes → exclusion constraints (no double-booking)
-- pg_trgm    : trigram fuzzy search (customers, assets)
-- citext     : case-insensitive text (emails, slugs)
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists citext with schema extensions;
