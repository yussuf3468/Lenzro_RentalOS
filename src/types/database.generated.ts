/**
 * AUTO-GENERATED PLACEHOLDER.
 *
 * Replaced by the real schema types once Supabase tables exist (Phase 2+):
 *   npm run supabase:types
 *
 * Until then this minimal shape satisfies `SupabaseClient<Database>` generics.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
