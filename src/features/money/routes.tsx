import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const MoneyPage = lazy(() => import('./pages/money-page').then((m) => ({ default: m.MoneyPage })));

/** Mounted inside the org-scoped app shell. */
export const moneyRoutes: RouteObject[] = [{ path: 'money', element: withSuspense(<MoneyPage />) }];
