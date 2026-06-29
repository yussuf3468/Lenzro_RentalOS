import { z } from 'zod';

/**
 * Client-side environment. Only VITE_-prefixed vars exist in the browser bundle.
 * Supabase vars are optional in Phase 1 (no features call Supabase yet) so the
 * app boots without them; they become required as auth lands in Phase 2.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().min(1).optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  VITE_APP_URL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
}

const data = parsed.success ? parsed.data : {};

export const env = {
  supabaseUrl: data.VITE_SUPABASE_URL,
  supabaseAnonKey: data.VITE_SUPABASE_ANON_KEY,
  appUrl: data.VITE_APP_URL ?? 'http://localhost:5173',
  isSupabaseConfigured: Boolean(data.VITE_SUPABASE_URL && data.VITE_SUPABASE_ANON_KEY),
} as const;

export type Env = typeof env;
