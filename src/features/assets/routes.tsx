import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const VehiclesPage = lazy(() =>
  import('./pages/vehicles-page').then((m) => ({ default: m.VehiclesPage })),
);
const VehicleProfilePage = lazy(() =>
  import('./pages/vehicle-profile-page').then((m) => ({ default: m.VehicleProfilePage })),
);

/** Mounted inside the org-scoped app shell. */
export const assetRoutes: RouteObject[] = [
  { path: 'vehicles', element: withSuspense(<VehiclesPage />) },
  { path: 'vehicles/:id', element: withSuspense(<VehicleProfilePage />) },
];
