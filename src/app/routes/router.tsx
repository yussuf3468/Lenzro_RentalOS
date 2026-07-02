import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireOrg, RequireVerified } from '@/app/routes/guards';
import { withSuspense } from '@/app/routes/with-suspense';
import { assetRoutes } from '@/features/assets';
import { publicAuthRoutes, sessionAuthRoutes } from '@/features/auth';
import { customerRoutes } from '@/features/customers';
import { acceptInviteRoute, appOrgRoutes, onboardingRoute } from '@/features/organizations';
import { moneyRoutes } from '@/features/money';
import { rentalRoutes } from '@/features/rentals';

const MarketingHome = lazy(() =>
  import('@/features/marketing').then((m) => ({ default: m.LandingPage })),
);
const AppShell = lazy(() =>
  import('@/app/layouts/app-shell').then((m) => ({ default: m.AppShell })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const NotFoundPage = lazy(() =>
  import('@/app/pages/not-found').then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  // Marketing — the immersive landing owns its own chrome
  { path: '/', element: withSuspense(<MarketingHome />) },

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
                  { index: true, element: withSuspense(<DashboardPage />) },
                  ...rentalRoutes,
                  ...moneyRoutes,
                  ...assetRoutes,
                  ...customerRoutes,
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
