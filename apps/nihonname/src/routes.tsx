/**
 * Route configuration for NihonName
 * [context7:vite-react-ssg:2025-12-06] 使用 lazy 屬性取代 React.lazy + Suspense
 * [SEO:2025-12-04] 新增歷史專區頁面路由
 * [SEO:2025-12-05] 新增 FAQ 頁面，整合常見問題
 * [fix:2025-12-06] 修復 React Hydration Error #418 - 移除 Suspense boundary
 *
 * 重要：vite-react-ssg 使用 lazy 屬性會在 SSG 時預渲染完整 HTML，
 * 避免 Suspense streaming 標記導致的 hydration mismatch
 */
import type { RouteRecord } from 'vite-react-ssg';
import { Layout } from './components/Layout';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/components/Layout.tsx',
    children: [
      {
        index: true,
        lazy: async () => {
          const mod = await import('./pages/Home');
          return { Component: mod.default };
        },
        entry: 'src/pages/Home.tsx',
      },
      {
        path: 'about',
        lazy: async () => {
          const mod = await import('./pages/About');
          return { Component: mod.default };
        },
        entry: 'src/pages/About.tsx',
      },
      {
        path: 'guide',
        lazy: async () => {
          const mod = await import('./pages/Guide');
          return { Component: mod.default };
        },
        entry: 'src/pages/Guide.tsx',
      },
      {
        path: 'faq',
        lazy: async () => {
          const mod = await import('./pages/FAQ');
          return { Component: mod.default };
        },
        entry: 'src/pages/FAQ.tsx',
      },
      // History pages - SEO FAQ pages
      {
        path: 'history',
        lazy: async () => {
          const mod = await import('./pages/history/index');
          return { Component: mod.default };
        },
        entry: 'src/pages/history/index.tsx',
      },
      {
        path: 'history/kominka',
        lazy: async () => {
          const mod = await import('./pages/history/KominkaMovement');
          return { Component: mod.default };
        },
        entry: 'src/pages/history/KominkaMovement.tsx',
      },
      {
        path: 'history/shimonoseki',
        lazy: async () => {
          const mod = await import('./pages/history/ShimonosekiTreaty');
          return { Component: mod.default };
        },
        entry: 'src/pages/history/ShimonosekiTreaty.tsx',
      },
      {
        path: 'history/san-francisco',
        lazy: async () => {
          const mod = await import('./pages/history/SanFranciscoTreaty');
          return { Component: mod.default };
        },
        entry: 'src/pages/history/SanFranciscoTreaty.tsx',
      },
    ],
  },
];

/**
 * Get includedRoutes for SSG
 * [SEO:2025-12-04] 新增歷史專區頁面
 * [SEO:2025-12-05] 新增 FAQ 頁面
 */
export function getIncludedRoutes(): string[] {
  return [
    '/',
    '/about/',
    '/guide/',
    '/faq/',
    '/history/',
    '/history/kominka/',
    '/history/shimonoseki/',
    '/history/san-francisco/',
  ];
}

export default routes;
