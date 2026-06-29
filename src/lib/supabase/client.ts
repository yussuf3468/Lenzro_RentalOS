import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

let browserClient: SupabaseClient | undefined;

/**
 * Lazily-created singleton Supabase browser client (public anon key; all access
 * governed by RLS). Untyped at the schema level until generated DB types land
 * (`npm run supabase:types`); responses are validated with Zod at the data-access
 * boundary instead.
 *
 * Throws a clear error only when used without configuration, so the app still
 * boots for pages that don't touch Supabase (e.g. marketing).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!env.isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
    );
  }

  browserClient ??= createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  return browserClient;
}
