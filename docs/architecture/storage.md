# Storage Strategy

Supabase Storage (S3-backed). Files are tenant-isolated by **path prefix + storage RLS**, the
same isolation guarantee as table data. Default posture: **private**.

## 1. Buckets

| Bucket               | Visibility          | Contents                                   | Notes                                        |
| -------------------- | ------------------- | ------------------------------------------ | -------------------------------------------- |
| `org-public`         | public              | org logo, public branding                  | only non-sensitive, org-chosen public assets |
| `asset-images`       | private (signed)    | vehicle/asset photos                       | served via signed URLs / CDN transform       |
| `customer-documents` | **private, strict** | KYC: driver license, ID, passport          | least-privilege; PII — never public          |
| `contracts`          | private             | signed rental agreement PDFs               | immutable once signed                        |
| `maintenance`        | private             | repair photos, invoices, inspection images |                                              |
| `org-documents`      | private             | generic uploaded documents                 | maps to `documents` table                    |
| `avatars`            | private (signed)    | user profile images                        | small, image-only                            |

Bucket count is kept small and **stable**; new entity types reuse a bucket with a new path
segment rather than spawning buckets.

## 2. Path convention (tenant in the path)

```
{bucket}/{organization_id}/{entity}/{entity_id}/{uuid}-{safe_filename}.{ext}
```

Examples:

```
asset-images/8f.../assets/3c.../9a1...-front.jpg
customer-documents/8f.../customers/12.../license-back.pdf
contracts/8f.../bookings/77.../LNZ-CTR-2026-0042.pdf
```

The leading `organization_id` segment is what storage RLS checks, mirroring row tenancy.

## 3. Storage RLS

Storage policies (on `storage.objects`) enforce that the first path segment equals the caller's
JWT org, plus permission for sensitive buckets:

```sql
-- read within own org
create policy "asset_images_read" on storage.objects for select
  using ( bucket_id = 'asset-images'
          and (storage.foldername(name))[1] = auth_org_id()::text );

-- write requires asset write permission
create policy "asset_images_write" on storage.objects for insert
  with check ( bucket_id = 'asset-images'
               and (storage.foldername(name))[1] = auth_org_id()::text
               and can('assets:write') );

-- KYC docs: stricter — only roles with customer document access
create policy "customer_docs_read" on storage.objects for select
  using ( bucket_id = 'customer-documents'
          and (storage.foldername(name))[1] = auth_org_id()::text
          and can('customers:read') );
```

Private content is **never** served by public URL — only by **time-limited signed URLs**
generated server-side/per-request for users who pass policy.

## 4. Upload pipeline & validation

```
Client picks file
  → client-side check (type allow-list, max size, image dimension)
  → request signed upload (or direct upload under RLS)
  → upload to {org}/{entity}/{id}/...
  → on success: insert metadata row (asset_images / documents / customer_documents)
       storing path, mime, size_bytes, checksum, uploaded_by
  → (async) Edge Function post-process: re-verify mime by magic bytes, generate
       thumbnails/variants, optional AV scan, strip EXIF GPS from public images
```

Rules:

- **Allow-list** mime types per bucket (images: jpg/png/webp; docs: pdf + images). Reject by
  content sniffing, not just extension.
- Size caps per bucket (e.g. images ≤ 10 MB, docs ≤ 25 MB), enforced client + Edge.
- Filenames sanitized; randomized prefix prevents collisions/enumeration.
- Metadata row is the source of truth; orphaned objects reaped by a scheduled cleanup.

## 5. Serving & performance

- Images via Supabase image transformation / CDN (resize, format) → responsive `srcset`.
- Signed URLs cached briefly client-side; regenerated on expiry.
- Lazy-loaded; blurhash/placeholder for asset galleries.

## 6. Lifecycle, quotas, retention

- Storage usage metered per org → counts toward plan **storage limit** (entitlement).
- Soft-deleting an entity marks its files for retention-window cleanup (not instant purge),
  enabling restore; compliance erasure purges immediately.
- Contracts and audit-relevant files are retained per policy even after soft delete.

## 7. Multi-vertical neutrality

Because storage keys off `organization_id` + generic `entity` segments (`assets`, `customers`,
`bookings`), the exact same buckets and policies serve motorcycle/equipment/machinery/truck
rentals with no change — consistent with the asset abstraction.
