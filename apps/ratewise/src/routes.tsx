/**
 * Vite React SSG Routes Configuration - Modern App Architecture
 *
 * 路由策略：
 * - AppLayout 路由（底部導覽列 + 模組化架構）：
 *   - `/`: 首頁（單幣別轉換器）- 使用 ClientOnly 避免 Hydration 錯誤
 *   - `/multi`: 多幣別轉換器 - 佔位頁面
 *   - `/favorites`: 收藏與歷史 - 佔位頁面
 *   - `/settings`: 應用程式設定 - 佔位頁面
 *
 * - Layout 路由（SEO 落地頁，保留原有結構）：
 *   - `/faq`: FAQ 頁面 - 預渲染靜態 HTML
 *   - `/about`: About 頁面 - 預渲染靜態 HTML
 *   - `/guide`: Guide 頁面 - 預渲染靜態 HTML + HowTo Schema
 *   - `/xxx-twd`: 13 個幣別落地頁 - 預渲染靜態 HTML
 *
 * - 工具頁面（不預渲染）：
 *   - `/color-scheme`: 內部工具
 *   - `/update-prompt-test`: UpdatePrompt 測試
 *   - `/*`: 404 頁面
 *
 * [refactor:2026-01-15] 重構路由支援底部導覽列與模組化架構
 * 依據：Phase 2 架構升級計畫 - 嵌套路由與 AppLayout 整合
 *
 * 參考：
 * - [Context7:daydreamer-riri/vite-react-ssg:2025-11-25]
 * - [fix:2025-12-04] importWithRetry 處理 chunk 載入失敗
 * - [fix:2025-12-25] ClientOnly 解決 React Hydration #418
 */

import type { RouteRecord } from 'vite-react-ssg';
import type { ComponentType } from 'react';
import { ClientOnly } from 'vite-react-ssg';
import CurrencyConverter from './features/ratewise/RateWise';
import { Layout } from './components/Layout';
import { AppLayout } from './components/AppLayout';
import { SkeletonLoader } from './components/SkeletonLoader';
import { logger } from './utils/logger';
import MultiConverter from './pages/MultiConverter';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

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

/**
 * Route Configuration for vite-react-ssg
 *
 * [refactor:2026-01-15] 新增嵌套路由支援底部導覽列架構
 * 架構：AppLayout（父路由）包含 4 個子路由（Single, Multi, Favorites, Settings）
 *
 * [fix:2025-12-04] 使用 createLazyRoute 處理 chunk 載入失敗
 * [fix:2025-12-25] 首頁使用 ClientOnly 避免 React Hydration #418 錯誤
 */
export const routes: RouteRecord[] = [
  // ✅ AppLayout 路由（底部導覽列 + 模組化架構）
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // 單幣別轉換器（首頁）
      {
        path: '',
        element: (
          <ClientOnly fallback={<SkeletonLoader />}>{() => <CurrencyConverter />}</ClientOnly>
        ),
        entry: 'src/features/ratewise/RateWise',
      },
      // 多幣別轉換器
      {
        path: 'multi',
        element: <MultiConverter />,
        entry: 'src/pages/MultiConverter.tsx',
      },
      // 收藏與歷史
      {
        path: 'favorites',
        element: <Favorites />,
        entry: 'src/pages/Favorites.tsx',
      },
      // 應用程式設定
      {
        path: 'settings',
        element: <Settings />,
        entry: 'src/pages/Settings.tsx',
      },
    ],
  },

  // ✅ Layout 路由（SEO 落地頁，保留原有結構）
  createLazyRoute('/faq', () => import('./pages/FAQ'), 'src/pages/FAQ.tsx'),
  createLazyRoute('/about', () => import('./pages/About'), 'src/pages/About.tsx'),
  createLazyRoute('/guide', () => import('./pages/Guide'), 'src/pages/Guide.tsx'),

  // ✅ 13 個幣別落地頁（SEO 預渲染）
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
  createLazyRoute(
    '/update-prompt-test',
    () => import('./pages/UpdatePromptTest'),
    'src/pages/UpdatePromptTest.tsx',
  ),
  createLazyRoute('/ui-showcase', () => import('./pages/UIShowcase'), 'src/pages/UIShowcase.tsx'),

  // ❌ 不預渲染 404 頁面（動態處理）
  createLazyRoute('*', () => import('./pages/NotFound'), 'src/pages/NotFound.tsx'),
];

/**
 * 指定哪些路徑應該被預渲染為靜態 HTML
 *
 * 策略：
 * - ✅ 預渲染：首頁、FAQ、About、Guide + 13 個幣別落地頁（爬蟲需要的 SEO 頁面）
 * - ❌ 不預渲染：404、color-scheme（動態處理或內部工具）
 *
 * [fix:2025-11-30] 新增 /guide 到預渲染列表，與 vite.config.ts SSG 配置同步
 * [refactor:2025-12-14] 使用集中式 SEO 路徑配置，避免多處維護
 * 依據：sitemap.xml 與 SSG 預渲染路徑一致性 + SEO Best Practices 2025
 */
export { getIncludedRoutes } from './config/seo-paths';
