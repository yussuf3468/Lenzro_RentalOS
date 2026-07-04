import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const CustomersPage = lazy(() =>
  import('./pages/customers-page').then((m) => ({ default: m.CustomersPage })),
);
const CustomerProfilePage = lazy(() =>
  import('./pages/customer-profile-page').then((m) => ({ default: m.CustomerProfilePage })),
);

/** Mounted inside the org-scoped app shell. */
export const customerRoutes: RouteObject[] = [
  { path: 'customers', element: withSuspense(<CustomersPage />) },
  { path: 'customers/:id', element: withSuspense(<CustomerProfilePage />) },
];
