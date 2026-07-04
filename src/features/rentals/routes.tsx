import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const CalendarPage = lazy(() =>
  import('./pages/calendar-page').then((m) => ({ default: m.CalendarPage })),
);
const RentalsPage = lazy(() =>
  import('./pages/rentals-page').then((m) => ({ default: m.RentalsPage })),
);
const CheckoutFlowPage = lazy(() =>
  import('./pages/checkout-flow-page').then((m) => ({ default: m.CheckoutFlowPage })),
);
const ReturnFlowPage = lazy(() =>
  import('./pages/return-flow-page').then((m) => ({ default: m.ReturnFlowPage })),
);
const ContractPage = lazy(() =>
  import('./pages/contract-page').then((m) => ({ default: m.ContractPage })),
);

/** Mounted inside the org-scoped app shell. */
export const rentalRoutes: RouteObject[] = [
  { path: 'calendar', element: withSuspense(<CalendarPage />) },
  { path: 'rentals', element: withSuspense(<RentalsPage />) },
  { path: 'rentals/:id/checkout', element: withSuspense(<CheckoutFlowPage />) },
  { path: 'rentals/:id/return', element: withSuspense(<ReturnFlowPage />) },
  { path: 'rentals/:id/contract', element: withSuspense(<ContractPage />) },
];
