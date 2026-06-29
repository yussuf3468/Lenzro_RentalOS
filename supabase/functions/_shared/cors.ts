// Shared CORS helpers for Lenzro Edge Functions (Deno runtime).
// Note: supabase/functions runs on Deno, not the Vite/Node toolchain — it is
// excluded from the app's TypeScript build and ESLint config on purpose.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

/** Short-circuit CORS pre-flight requests. Returns a Response for OPTIONS, else null. */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
