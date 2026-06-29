import { Suspense, type ReactNode } from 'react';
import { RouteFallback } from './route-fallback';

/** Wrap a lazily-loaded route element in a branded Suspense fallback. */
export function withSuspense(node: ReactNode): ReactNode {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}
