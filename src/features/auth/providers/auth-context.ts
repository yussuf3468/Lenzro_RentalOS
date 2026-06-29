import { createContext } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { type TenantClaims } from '@/lib/auth/claims';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  claims: TenantClaims;
  isEmailVerified: boolean;
  /** Whether Supabase is configured (env present). When false, auth is bypassed for design review. */
  isConfigured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
