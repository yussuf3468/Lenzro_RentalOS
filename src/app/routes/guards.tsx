import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { RouteFallback } from './route-fallback';

/**
 * When Supabase is unconfigured, all guards fall through to <Outlet /> so the
 * app remains browsable for design review. With Supabase configured they enforce.
 */

export function RequireAuth() {
  const { status, isConfigured } = useAuth();
  const location = useLocation();
  if (!isConfigured) return <Outlet />;
  if (status === 'loading') return <RouteFallback />;
  if (status === 'unauthenticated') {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  return <Outlet />;
}

export function RequireVerified() {
  const { status, isEmailVerified, isConfigured } = useAuth();
  if (!isConfigured) return <Outlet />;
  if (status === 'loading') return <RouteFallback />;
  if (status === 'authenticated' && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  return <Outlet />;
}

export function RequireOrg() {
  const { status, claims, isConfigured } = useAuth();
  if (!isConfigured) return <Outlet />;
  if (status === 'loading') return <RouteFallback />;
  if (!claims.organizationId) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { status, claims, isConfigured } = useAuth();
  if (!isConfigured) return <Outlet />;
  if (status === 'loading') return <RouteFallback />;
  if (status === 'authenticated') {
    return <Navigate to={claims.organizationId ? '/app' : '/onboarding'} replace />;
  }
  return <Outlet />;
}
