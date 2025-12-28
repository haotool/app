/**
 * 地震知識小學堂 - 路由配置
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 */
import type { RouteRecord } from 'vite-react-ssg';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/Home'));
const LessonsPage = lazy(() => import('./pages/Lessons'));
const QuizPage = lazy(() => import('./pages/Quiz'));
const AboutPage = lazy(() => import('./pages/About'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-sky-50">
    <div className="animate-pulse text-sky-500 font-bold">載入中...</div>
  </div>
);

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
