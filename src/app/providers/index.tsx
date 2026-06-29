import { lazy, Suspense, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth';
import { createQueryClient } from '@/lib/query/client';
import { ThemeProvider } from './theme-provider';

// Devtools are loaded lazily in dev only, so they never enter the prod bundle.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : null;

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster richColors closeButton position="top-right" theme="system" />
          {ReactQueryDevtools ? (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          ) : null}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
