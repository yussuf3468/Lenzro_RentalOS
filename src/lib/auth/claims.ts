/** Tenant context decoded from the JWT's app_metadata (stamped by the auth hook). */
export interface TenantClaims {
  organizationId: string | null;
  role: string | null;
  platformRole: string | null;
  orgIds: string[];
}

interface JwtAppMetadata {
  organization_id?: string;
  role?: string;
  platform_role?: string;
  org_ids?: string[];
}

interface JwtPayload {
  app_metadata?: JwtAppMetadata;
}

const EMPTY_CLAIMS: TenantClaims = {
  organizationId: null,
  role: null,
  platformRole: null,
  orgIds: [],
};

function base64UrlDecode(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

/** Extract tenant claims from an access token. Returns empty claims if absent/invalid. */
export function extractTenantClaims(accessToken: string | undefined | null): TenantClaims {
  if (!accessToken) return EMPTY_CLAIMS;
  const meta = decodeJwtPayload(accessToken)?.app_metadata ?? {};
  return {
    organizationId: meta.organization_id ?? null,
    role: meta.role ?? null,
    platformRole: meta.platform_role ?? null,
    orgIds: Array.isArray(meta.org_ids) ? meta.org_ids : [],
  };
}
