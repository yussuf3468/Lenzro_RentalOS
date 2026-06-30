import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const VehiclesPage = lazy(() =>
  import('./pages/vehicles-page').then((m) => ({ default: m.VehiclesPage })),
);

/** Mounted inside the org-scoped app shell. */
export const assetRoutes: RouteObject[] = [
  { path: 'vehicles', element: withSuspense(<VehiclesPage />) },
];
