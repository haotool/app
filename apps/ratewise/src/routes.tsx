/**
 * Vite React SSG Routes Configuration - SEO Phase 2B-2
 *
 * 路由策略：
 * - `/`: 首頁（RateWise.tsx）- 使用 index.html 靜態 JSON-LD
 * - `/faq`: FAQ 頁面 - 預渲染靜態 HTML，使用 SEOHelmet
 * - `/about`: About 頁面 - 預渲染靜態 HTML，使用 SEOHelmet
 * - `/*`: 404 頁面 - 不預渲染，動態處理，使用 SEOHelmet noindex
 * - `/color-scheme`: 內部工具 - 不預渲染（測試用）
 *
 * 參考：fix/seo-phase2b-prerendering
 * 依據：[Context7:daydreamer-riri/vite-react-ssg:2025-11-25]
 */

import type { RouteRecord } from 'vite-react-ssg';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonLoader } from './components/SkeletonLoader';
import { UpdatePrompt } from './components/UpdatePrompt';
import CurrencyConverter from './features/ratewise/RateWise';

// Layout Component with ErrorBoundary + HelmetProvider + UpdatePrompt
function Layout({ children }: { children: React.ReactNode }) {
  // 標記應用已完全載入，供 E2E 測試使用
  // [E2E-fix:2025-10-25] 添加明確的載入完成信號
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset['appReady'] = 'true';
    }
  }, []);

  return (
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <main role="main" className="min-h-screen">
            {/* [SEO Fix 2025-11-26] 移除 Layout 的 sr-only H1，讓各頁面自定義語義 H1
                依據：[Google SEO Guidelines] 每頁應有唯一的語義 H1
                參考：[Context7:vite-react-ssg] Head component best practices */}
            <React.Suspense fallback={<SkeletonLoader />}>{children}</React.Suspense>
          </main>
        </ErrorBoundary>
        {/* PWA 更新通知 - 品牌對齊風格 */}
        <UpdatePrompt />
      </HelmetProvider>
    </React.StrictMode>
  );
}

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
 * - ✅ 預渲染：首頁、FAQ、About（爬蟲需要）
 * - ❌ 不預渲染：404、color-scheme（動態處理或內部工具）
 */
export function getIncludedRoutes(paths: string[]): string[] {
  // 只預渲染以下路徑
  const includedPaths = ['/', '/faq', '/about'];

  return paths.filter((path) => includedPaths.includes(path));
}
