/**
 * 地震知識小學堂 - 路由配置
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 * [fix:2026-01-04] 將 PageLoader 移至 components/ 以符合 react-refresh 規則
 */
import type { RouteRecord } from 'vite-react-ssg';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import { PageLoader } from './components/PageLoader';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/Home'));
const LessonsPage = lazy(() => import('./pages/Lessons'));
const QuizPage = lazy(() => import('./pages/Quiz'));
const AboutPage = lazy(() => import('./pages/About'));

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'lessons',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LessonsPage />
          </Suspense>
        ),
      },
      {
        path: 'quiz',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QuizPage />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        ),
      },
    ],
  },
];

/**
 * SSG 預渲染路徑
 */
export const getIncludedRoutes = (): string[] => {
  return ['/', '/lessons/', '/quiz/', '/about/'];
};
