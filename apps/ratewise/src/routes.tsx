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
  {
    path: '/usd-twd',
    lazy: async () => {
      const module = await import('./pages/USDToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/USDToTWD.tsx',
  },
  {
    path: '/jpy-twd',
    lazy: async () => {
      const module = await import('./pages/JPYToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/JPYToTWD.tsx',
  },
  {
    path: '/eur-twd',
    lazy: async () => {
      const module = await import('./pages/EURToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/EURToTWD.tsx',
  },
  {
    path: '/gbp-twd',
    lazy: async () => {
      const module = await import('./pages/GBPToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/GBPToTWD.tsx',
  },
  {
    path: '/cny-twd',
    lazy: async () => {
      const module = await import('./pages/CNYToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/CNYToTWD.tsx',
  },
  {
    path: '/krw-twd',
    lazy: async () => {
      const module = await import('./pages/KRWToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/KRWToTWD.tsx',
  },
  {
    path: '/hkd-twd',
    lazy: async () => {
      const module = await import('./pages/HKDToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/HKDToTWD.tsx',
  },
  {
    path: '/aud-twd',
    lazy: async () => {
      const module = await import('./pages/AUDToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/AUDToTWD.tsx',
  },
  {
    path: '/cad-twd',
    lazy: async () => {
      const module = await import('./pages/CADToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/CADToTWD.tsx',
  },
  {
    path: '/sgd-twd',
    lazy: async () => {
      const module = await import('./pages/SGDToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/SGDToTWD.tsx',
  },
  {
    path: '/thb-twd',
    lazy: async () => {
      const module = await import('./pages/THBToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/THBToTWD.tsx',
  },
  {
    path: '/nzd-twd',
    lazy: async () => {
      const module = await import('./pages/NZDToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/NZDToTWD.tsx',
  },
  {
    path: '/chf-twd',
    lazy: async () => {
      const module = await import('./pages/CHFToTWD');
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry: 'src/pages/CHFToTWD.tsx',
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
  const includedPaths = [
    '/',
    '/faq',
    '/about',
    '/guide',
    '/usd-twd',
    '/jpy-twd',
    '/eur-twd',
    '/gbp-twd',
    '/cny-twd',
    '/krw-twd',
    '/hkd-twd',
    '/aud-twd',
    '/cad-twd',
    '/sgd-twd',
    '/thb-twd',
    '/nzd-twd',
    '/chf-twd',
  ];
  const normalize = (value: string) => {
    if (value === '/') return '/';
    return value.replace(/\/+$/, '');
  };

  const normalizedIncluded = includedPaths.map(normalize);
  return paths.filter((path) => normalizedIncluded.includes(normalize(path)));
}
