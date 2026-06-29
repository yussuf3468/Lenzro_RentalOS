import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { withSuspense } from '@/app/routes/with-suspense';

const SignInPage = lazy(() =>
  import('./pages/sign-in-page').then((m) => ({ default: m.SignInPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/register-page').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import('./pages/verify-email-page').then((m) => ({ default: m.VerifyEmailPage })),
);

/** Sign-in/up/forgot — only for signed-out visitors (wrapped in PublicOnly). */
export const publicAuthRoutes: RouteObject[] = [
  { path: 'login', element: withSuspense(<SignInPage />) },
  { path: 'register', element: withSuspense(<RegisterPage />) },
  { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
];

/** Reachable with or without a session (recovery / verification flows). */
export const sessionAuthRoutes: RouteObject[] = [
  { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
  { path: 'verify-email', element: withSuspense(<VerifyEmailPage />) },
];
