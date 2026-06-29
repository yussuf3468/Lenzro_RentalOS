import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MarketingLayout } from '@/app/layouts/marketing-layout';
import { LandingPage } from '@/app/pages/landing-page';
import { PublicOnly, RequireAuth, RequireOrg, RequireVerified } from '@/app/routes/guards';
import { withSuspense } from '@/app/routes/with-suspense';
import { publicAuthRoutes, sessionAuthRoutes } from '@/features/auth';
import { acceptInviteRoute, appOrgRoutes, onboardingRoute } from '@/features/organizations';

const AppShell = lazy(() =>
  import('@/app/layouts/app-shell').then((m) => ({ default: m.AppShell })),
);
const AppPlaceholderPage = lazy(() =>
  import('@/app/pages/app-placeholder').then((m) => ({ default: m.AppPlaceholderPage })),
);
const NotFoundPage = lazy(() =>
  import('@/app/pages/not-found').then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  // Marketing
  {
    element: <MarketingLayout />,
    children: [{ index: true, element: <LandingPage /> }],
  },

  // Public-only auth (signed-in users are redirected away)
  { element: <PublicOnly />, children: publicAuthRoutes },

  // Verification / recovery flows + public invitation acceptance
  ...sessionAuthRoutes,
  acceptInviteRoute,

  // Onboarding: authed + verified, no organization required yet
  {
    element: <RequireAuth />,
    children: [{ element: <RequireVerified />, children: [onboardingRoute] }],
  },

  // App shell: authed + verified + active organization
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireVerified />,
        children: [
          {
            element: <RequireOrg />,
            children: [
              {
                path: 'app',
                element: withSuspense(<AppShell />),
                children: [
                  { index: true, element: withSuspense(<AppPlaceholderPage />) },
                  ...appOrgRoutes,
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: withSuspense(<NotFoundPage />) },
]);
