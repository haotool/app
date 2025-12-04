/**
 * Route configuration for NihonName
 * [context7:react-router-dom:2025-12-03]
 * [SEO:2025-12-04] 新增歷史專區頁面路由
 */
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Guide = lazy(() => import('./pages/Guide'));

// History pages - SEO FAQ pages
const HistoryIndex = lazy(() => import('./pages/history/index'));
const KominkaMovement = lazy(() => import('./pages/history/KominkaMovement'));
const ShimonosekiTreaty = lazy(() => import('./pages/history/ShimonosekiTreaty'));
const SanFranciscoTreaty = lazy(() => import('./pages/history/SanFranciscoTreaty'));

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
      {
        path: 'guide',
        element: withSuspense(Guide),
      },
      // History pages - SEO FAQ pages
      {
        path: 'history',
        element: withSuspense(HistoryIndex),
      },
      {
        path: 'history/kominka',
        element: withSuspense(KominkaMovement),
      },
      {
        path: 'history/shimonoseki',
        element: withSuspense(ShimonosekiTreaty),
      },
      {
        path: 'history/san-francisco',
        element: withSuspense(SanFranciscoTreaty),
      },
    ],
  },
];

/**
 * Get includedRoutes for SSG
 * [SEO:2025-12-04] 新增歷史專區頁面
 */
export function getIncludedRoutes(): string[] {
  return [
    '/',
    '/about',
    '/guide',
    '/history',
    '/history/kominka',
    '/history/shimonoseki',
    '/history/san-francisco',
  ];
}

export default routes;
