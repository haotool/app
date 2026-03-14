/**
 * Park-Keeper Routes for vite-react-ssg
 *
 * Home uses ClientOnly because it depends on IndexedDB, geolocation, and device APIs.
 * SEO metadata is injected at build time via onPageRendered (not from React components).
 *
 * fallback={null}：SSG 不預渲染骨架屏，避免 min-h-screen skeleton 覆蓋 React app。
 * Rocket Loader 修復後（data-cfasync="false"），hydration 正常，不需要 SSG fallback。
 */
import type { RouteRecord } from 'vite-react-ssg';
import { ClientOnly } from 'vite-react-ssg';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ClientOnly fallback={null}>{() => <Home />}</ClientOnly>,
      },
      { path: 'about', element: <About /> },
      {
        path: 'settings',
        element: <ClientOnly fallback={null}>{() => <Home initialTab="settings" />}</ClientOnly>,
      },
    ],
  },
];
