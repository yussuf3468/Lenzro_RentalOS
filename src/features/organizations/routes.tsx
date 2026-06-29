import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const OnboardingPage = lazy(() =>
  import('./pages/onboarding-page').then((m) => ({ default: m.OnboardingPage })),
);
const AcceptInvitePage = lazy(() =>
  import('./pages/accept-invite-page').then((m) => ({ default: m.AcceptInvitePage })),
);
const TeamPage = lazy(() => import('./pages/team-page').then((m) => ({ default: m.TeamPage })));

/** Authenticated + verified, but no organization required yet. */
export const onboardingRoute: RouteObject = {
  path: 'onboarding',
  element: withSuspense(<OnboardingPage />),
};

/** Public — the page adapts whether or not the visitor is signed in. */
export const acceptInviteRoute: RouteObject = {
  path: 'accept-invite',
  element: withSuspense(<AcceptInvitePage />),
};

/** Mounted inside the org-scoped app shell. */
export const appOrgRoutes: RouteObject[] = [{ path: 'team', element: withSuspense(<TeamPage />) }];
