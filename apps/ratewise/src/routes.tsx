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
 *
 * [fix:2025-12-04] 新增 importWithRetry 處理 chunk 載入失敗
 * 修復 "Unexpected token '<'" 錯誤
 */

import type { RouteRecord } from 'vite-react-ssg';
import type { ComponentType } from 'react';
import CurrencyConverter from './features/ratewise/RateWise';
import { Layout } from './components/Layout';
import { logger } from './utils/logger';

/**
 * 帶重試機制的動態 import
 * [fix:2025-12-04] 修復 SSG 部署後 chunk 載入失敗導致的 JSON 解析錯誤
 */
async function importWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3,
  retryDelay = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;

      // 檢查是否為 chunk 載入錯誤
      const isChunkError =
        error instanceof Error &&
        (error.message.toLowerCase().includes('unexpected token') ||
          error.message.toLowerCase().includes('<!doctype') ||
          error.message.toLowerCase().includes('loading chunk') ||
          error.message.toLowerCase().includes('failed to fetch'));

      if (!isChunkError) {
        throw error;
      }

      logger.warn(`Chunk load failed (attempt ${attempt + 1}/${retries + 1})`, {
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // 所有重試都失敗後，嘗試刷新頁面
  if (typeof window !== 'undefined') {
    const REFRESH_KEY = 'chunk_load_refresh_timestamp';
    const REFRESH_COOLDOWN_MS = 30000;

    try {
      const lastRefresh = sessionStorage.getItem(REFRESH_KEY);
      const canRefresh =
        !lastRefresh || Date.now() - parseInt(lastRefresh, 10) > REFRESH_COOLDOWN_MS;

      if (canRefresh) {
        logger.warn('All chunk load retries failed, forcing page refresh');
        sessionStorage.setItem(REFRESH_KEY, Date.now().toString());

        // 清除 Service Worker 和快取
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        }
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }

        window.location.reload();
      }
    } catch {
      // 忽略 sessionStorage 錯誤
    }
  }

  throw lastError;
}

/**
 * 建立帶重試機制的 lazy 路由配置
 */
function createLazyRoute(
  path: string,
  importFn: () => Promise<{ default: ComponentType }>,
  entry: string,
): RouteRecord {
  return {
    path,
    lazy: async () => {
      const module = await importWithRetry(importFn);
      const PageComponent = module.default;
      return {
        Component: () => (
          <Layout>
            <PageComponent />
          </Layout>
        ),
      };
    },
    entry,
  };
}

// Route Configuration for vite-react-ssg
// [fix:2025-12-04] 使用 createLazyRoute 處理 chunk 載入失敗
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
  createLazyRoute('/faq', () => import('./pages/FAQ'), 'src/pages/FAQ.tsx'),
  createLazyRoute('/about', () => import('./pages/About'), 'src/pages/About.tsx'),
  createLazyRoute('/guide', () => import('./pages/Guide'), 'src/pages/Guide.tsx'),
  createLazyRoute('/usd-twd', () => import('./pages/USDToTWD'), 'src/pages/USDToTWD.tsx'),
  createLazyRoute('/jpy-twd', () => import('./pages/JPYToTWD'), 'src/pages/JPYToTWD.tsx'),
  createLazyRoute('/eur-twd', () => import('./pages/EURToTWD'), 'src/pages/EURToTWD.tsx'),
  createLazyRoute('/gbp-twd', () => import('./pages/GBPToTWD'), 'src/pages/GBPToTWD.tsx'),
  createLazyRoute('/cny-twd', () => import('./pages/CNYToTWD'), 'src/pages/CNYToTWD.tsx'),
  createLazyRoute('/krw-twd', () => import('./pages/KRWToTWD'), 'src/pages/KRWToTWD.tsx'),
  createLazyRoute('/hkd-twd', () => import('./pages/HKDToTWD'), 'src/pages/HKDToTWD.tsx'),
  createLazyRoute('/aud-twd', () => import('./pages/AUDToTWD'), 'src/pages/AUDToTWD.tsx'),
  createLazyRoute('/cad-twd', () => import('./pages/CADToTWD'), 'src/pages/CADToTWD.tsx'),
  createLazyRoute('/sgd-twd', () => import('./pages/SGDToTWD'), 'src/pages/SGDToTWD.tsx'),
  createLazyRoute('/thb-twd', () => import('./pages/THBToTWD'), 'src/pages/THBToTWD.tsx'),
  createLazyRoute('/nzd-twd', () => import('./pages/NZDToTWD'), 'src/pages/NZDToTWD.tsx'),
  createLazyRoute('/chf-twd', () => import('./pages/CHFToTWD'), 'src/pages/CHFToTWD.tsx'),
  // ❌ 不預渲染內部工具頁面
  createLazyRoute(
    '/color-scheme',
    () => import('./pages/ColorSchemeComparison'),
    'src/pages/ColorSchemeComparison.tsx',
  ),
  // ❌ 不預渲染 404 頁面（動態處理）
  createLazyRoute('*', () => import('./pages/NotFound'), 'src/pages/NotFound.tsx'),
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
