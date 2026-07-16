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
import HomeShell from './pages/HomeShell';
import About from './pages/About';
import Add from './pages/Add';
import Guide from './pages/Guide';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        // 首頁 fallback 用同構靜態殼：LCP 由 SSG HTML 直出（issue #725 P0）。
        index: true,
        element: <ClientOnly fallback={<HomeShell />}>{() => <Home />}</ClientOnly>,
      },
      { path: 'about', element: <About /> },
      {
        path: 'settings',
        element: <ClientOnly fallback={null}>{() => <Home initialTab="settings" />}</ClientOnly>,
      },
      {
        // 快速記錄依賴 IndexedDB / geolocation，僅客戶端渲染。
        path: 'add',
        element: <ClientOnly fallback={null}>{() => <Add />}</ClientOnly>,
      },
      {
        // 教學頁文案走 i18n（語言偵測在客戶端），避免 SSG 與 hydration 語言不一致。
        path: 'guide',
        element: <ClientOnly fallback={null}>{() => <Guide />}</ClientOnly>,
      },
    ],
  },
];
