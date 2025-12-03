/**
 * Route configuration for NihonName
 * [context7:react-router-dom:2025-12-03]
 */
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-stone-100">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent" />
  </div>
);

// Wrap component with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: withSuspense(Home),
      },
      {
        path: 'about',
        element: withSuspense(About),
      },
    ],
  },
];

/**
 * Get includedRoutes for SSG
 */
export function getIncludedRoutes(): string[] {
  return ['/', '/about'];
}

export default routes;
