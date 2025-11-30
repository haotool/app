/**
 * Vite React SSG Routes Configuration - SEO Phase 2B-2
 *
 * 路由策略：
 * - `/`: 首頁（RateWise.tsx）- 使用 index.html 靜態 JSON-LD
 * - `/faq`: FAQ 頁面 - 預渲染靜態 HTML，使用 SEOHelmet
 * - `/about`: About 頁面 - 預渲染靜態 HTML，使用 SEOHelmet
 * - `/guide`: Guide 頁面 - 預渲染靜態 HTML，使用 SEOHelmet + HowTo Schema
 * - `/*`: 404 頁面 - 不預渲染，動態處理，使用 SEOHelmet noindex
 * - `/color-scheme`: 內部工具 - 不預渲染（測試用）
 *
 * 參考：fix/seo-phase2b-prerendering
 * 依據：[Context7:daydreamer-riri/vite-react-ssg:2025-11-25]
 *
 * [Refactor:2025-11-29] Layout 組件移至 components/Layout.tsx
 * 依據：eslint-plugin-react-refresh (只導出組件的文件才能 Fast Refresh)
 */

import type { RouteRecord } from 'vite-react-ssg';
import CurrencyConverter from './features/ratewise/RateWise';
import { Layout } from './components/Layout';

// Route Configuration for vite-react-ssg
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: (
      <Layout>
        <CurrencyConverter />
      </Layout>
    ),
    entry: 'src/features/ratewise/RateWise',
  },
  {
    path: '/faq',
    lazy: async () => {
      const module = await import('./pages/FAQ');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/FAQ.tsx',
  },
  {
    path: '/about',
    lazy: async () => {
      const module = await import('./pages/About');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/About.tsx',
  },
  {
    path: '/guide',
    lazy: async () => {
      const module = await import('./pages/Guide');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/Guide.tsx',
  },
  // ❌ 不預渲染內部工具頁面
  {
    path: '/color-scheme',
    lazy: async () => {
      const module = await import('./pages/ColorSchemeComparison');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/ColorSchemeComparison.tsx',
  },
  // ❌ 不預渲染 404 頁面（動態處理）
  {
    path: '*',
    lazy: async () => {
      const module = await import('./pages/NotFound');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/NotFound.tsx',
  },
];

/**
 * 指定哪些路徑應該被預渲染為靜態 HTML
 *
 * 策略：
 * - ✅ 預渲染：首頁、FAQ、About、Guide（爬蟲需要的 SEO 頁面）
 * - ❌ 不預渲染：404、color-scheme（動態處理或內部工具）
 *
 * [fix:2025-11-30] 新增 /guide 到預渲染列表，與 vite.config.ts SSG 配置同步
 * 依據：sitemap.xml 與 SSG 預渲染路徑一致性
 */
export function getIncludedRoutes(paths: string[]): string[] {
  // 只預渲染以下路徑（標準化尾斜線避免 /faq 與 /faq/ 不一致）
  const includedPaths = ['/', '/faq', '/about', '/guide'];
  const normalize = (value: string) => {
    if (value === '/') return '/';
    return value.replace(/\/+$/, '');
  };

  const normalizedIncluded = includedPaths.map(normalize);
  return paths.filter((path) => normalizedIncluded.includes(normalize(path)));
}
