/**
 * Vite React SSG 路由設定
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
 */

import type { RouteRecord } from 'vite-react-ssg';
import type { ComponentType } from 'react';
import { ClientOnly } from 'vite-react-ssg';
import CurrencyConverter from './features/ratewise/RateWise';
import { HOMEPAGE_FAQ } from './features/ratewise/constants';
import { SEOHelmet } from './components/SEOHelmet';
import { HomeStructuredData } from './components/HomeStructuredData';
import { Layout } from './components/Layout';
import { AppLayout } from './components/AppLayout';
import { SkeletonLoader } from './components/SkeletonLoader';
import { logger } from './utils/logger';
import { isChunkLoadError, recoverFromChunkLoadError } from './utils/chunkLoadRecovery';
import MultiConverter from './pages/MultiConverter';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

/** 帶重試機制的動態 import */
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

      if (!isChunkLoadError(error)) {
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

  await recoverFromChunkLoadError();

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
 * vite-react-ssg 路由設定
 *
 * 架構：AppLayout（父路由）包含 4 個子路由（Single, Multi, Favorites, Settings）
 * 首頁使用 ClientOnly 避免 hydration mismatch
 */
export const routes: RouteRecord[] = [
  // AppLayout 路由（底部導覽列 + 模組化架構）
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // 單幣別轉換器（首頁）
      // SEOHelmet + HomeStructuredData 放在 ClientOnly 外面，確保 SSG 時渲染 SEO metadata
      // @see https://vite-react-ssg.netlify.app/docs/components — Head 獨立於 ClientOnly
      {
        path: '',
        element: (
          <>
            <SEOHelmet pathname="/" />
            <HomeStructuredData faq={HOMEPAGE_FAQ} />
            <ClientOnly fallback={<SkeletonLoader />}>{() => <CurrencyConverter />}</ClientOnly>
          </>
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
      // 主題展示頁面
      {
        path: 'theme-showcase',
        lazy: async () => {
          const module = await import('./pages/ThemeShowcase');
          return { Component: module.default };
        },
      },
    ],
  },

  // Layout 路由（SEO 落地頁，保留原有結構）
  createLazyRoute('/faq', () => import('./pages/FAQ'), 'src/pages/FAQ.tsx'),
  createLazyRoute('/about', () => import('./pages/About'), 'src/pages/About.tsx'),
  createLazyRoute('/guide', () => import('./pages/Guide'), 'src/pages/Guide.tsx'),

  // 13 個幣別落地頁（SEO 預渲染）
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

  // 不預渲染內部工具頁面
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

  // 不預渲染 404 頁面（動態處理）
  createLazyRoute('*', () => import('./pages/NotFound'), 'src/pages/NotFound.tsx'),
];

/**
 * 指定哪些路徑應該被預渲染為靜態 HTML
 *
 * 策略：
 * - 預渲染：首頁、FAQ、About、Guide + 13 個幣別落地頁
 * - 不預渲染：404、color-scheme（動態處理或內部工具）
 */
export { getIncludedRoutes } from './config/seo-paths';
