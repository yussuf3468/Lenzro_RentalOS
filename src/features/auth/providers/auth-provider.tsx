import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type Session } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { extractTenantClaims } from '@/lib/auth/claims';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AuthContext, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = env.isSupabaseConfigured;
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'unauthenticated');

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseClient();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'unauthenticated');
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  const refresh = useCallback(async () => {
    if (!configured) return;
    const { data } = await getSupabaseClient().auth.refreshSession();
    setSession(data.session);
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    await getSupabaseClient().auth.signOut();
    setSession(null);
    setStatus('unauthenticated');
  }, [configured]);

  const value = useMemo(() => {
    return {
      status,
      session,
      user: session?.user ?? null,
      claims: extractTenantClaims(session?.access_token),
      isEmailVerified: Boolean(session?.user?.email_confirmed_at),
      isConfigured: configured,
      refresh,
      signOut,
    };
  }, [status, session, configured, refresh, signOut]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
