import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const CalendarPage = lazy(() =>
  import('./pages/calendar-page').then((m) => ({ default: m.CalendarPage })),
);
const RentalsPage = lazy(() =>
  import('./pages/rentals-page').then((m) => ({ default: m.RentalsPage })),
);

/** Mounted inside the org-scoped app shell. */
export const rentalRoutes: RouteObject[] = [
  { path: 'calendar', element: withSuspense(<CalendarPage />) },
  { path: 'rentals', element: withSuspense(<RentalsPage />) },
];
