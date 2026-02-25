/**
 * Park-Keeper Routes for vite-react-ssg
 *
 * Home uses ClientOnly because it depends on IndexedDB, geolocation, and device APIs.
 * SEO metadata is injected at build time via onPageRendered (not from React components).
 */
import type { RouteRecord } from 'vite-react-ssg';
import { ClientOnly } from 'vite-react-ssg';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import HomeSkeleton from './components/HomeSkeleton';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ClientOnly fallback={<HomeSkeleton />}>{() => <Home />}</ClientOnly>,
      },
      { path: 'about', element: <About /> },
      {
        path: 'settings',
        element: (
          <ClientOnly fallback={<HomeSkeleton />}>
            {() => <Home initialTab="settings" />}
          </ClientOnly>
        ),
      },
    ],
  },
];
