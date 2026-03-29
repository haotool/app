/**
 * Vite React SSG 路由設定（單一真實來源）
 *
 * ⚠️ 這是唯一有效的路由定義，由 main.tsx 的 ViteReactSSG({ routes }) 消費。
 * App.tsx 已移除；所有路由必須在此定義。
 *
 * 路由策略：
 * - AppLayout 路由（底部導覽列 + 模組化架構）：
 *   - `/`: 首頁（單幣別轉換器）- 使用 ClientOnly 避免 Hydration 錯誤
 *   - `/multi`: 多幣別轉換器
 *   - `/favorites`: 收藏與歷史
 *   - `/settings`: 應用程式設定
 *   - `/theme-showcase`: 主題展示
 *
 * - Layout 路由（SEO 落地頁，保留原有結構）：
 *   - `/faq`: FAQ 頁面 - 預渲染靜態 HTML
 *   - `/about`: About 頁面 - 預渲染靜態 HTML
 *   - `/guide`: Guide 頁面 - 預渲染靜態 HTML + HowTo Schema
 *   - `/sell-rate-vs-mid-rate`: 賣出價與中間價差異指南
 *   - `/cash-vs-spot-rate`: 現金與即期匯率指南
 *   - `/card-rate-guide`: 刷卡匯率與 DCC 指南
 *   - `/seo-tech`: SEO 技術揭露頁面
 *   - `/xxx-twd` / `/twd-xxx`: 17+17 個幣別落地頁 - 預渲染靜態 HTML
 *
 * - 工具頁面（不預渲染）：
 *   - `/color-scheme`: 內部工具
 *   - `/update-prompt-test`: UpdatePrompt 測試
 *   - `/ui-showcase`: UI 元件展示
 *   - `/*`: 404 頁面
 *
 */

import type { RouteRecord } from 'vite-react-ssg';
import type { ComponentType } from 'react';
import { Suspense } from 'react';
import CurrencyConverter from './features/ratewise/RateWise';
import { SEOHelmet } from './components/SEOHelmet';
import { HomepageSEOSection } from './components/HomepageSEOSection';
import { Layout } from './components/Layout';
import { AppLayout } from './components/AppLayout';
import { ClientOnly } from 'vite-react-ssg';
import {
  SkeletonLoader,
  MultiConverterSkeleton,
  FavoritesSkeleton,
  SettingsSkeleton,
} from './components/SkeletonLoader';
import { HOMEPAGE_SEO } from './config/seo-metadata';
import { logger } from './utils/logger';
import { isChunkLoadError, recoverFromChunkLoadError } from './utils/chunkLoadRecovery';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { ChunkErrorBoundary, OfflineAwareFallback } from './components/OfflineAwareError';

const MultiConverter = lazyWithRetry(() => import('./pages/MultiConverter'));
const Favorites = lazyWithRetry(() => import('./pages/Favorites'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));

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
      try {
        const module = await importWithRetry(importFn);
        const PageComponent = module.default;
        return {
          Component: () => (
            <Layout>
              <PageComponent />
            </Layout>
          ),
        };
      } catch (error) {
        // 重試耗盡後顯示離線友善提示，防止 React Router 預設 "Unexpected Application Error!" 畫面。
        return { Component: () => <OfflineAwareFallback error={error} /> };
      }
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
      // 首頁可索引內容與 head metadata 都在 ClientOnly 外層，避免爬蟲只拿到互動骨架。
      {
        path: '',
        element: (
          <>
            <SEOHelmet
              pathname={HOMEPAGE_SEO.pathname}
              description={HOMEPAGE_SEO.description}
              howTo={HOMEPAGE_SEO.howTo}
              jsonLd={HOMEPAGE_SEO.jsonLd}
            />
            <ClientOnly fallback={<SkeletonLoader />}>{() => <CurrencyConverter />}</ClientOnly>
            <HomepageSEOSection />
          </>
        ),
        entry: 'src/features/ratewise/RateWise',
      },
      // 多幣別轉換器
      {
        path: 'multi',
        element: (
          <ChunkErrorBoundary>
            <Suspense fallback={<MultiConverterSkeleton />}>
              <MultiConverter />
            </Suspense>
          </ChunkErrorBoundary>
        ),
        entry: 'src/pages/MultiConverter.tsx',
      },
      // 收藏與歷史
      {
        path: 'favorites',
        element: (
          <ChunkErrorBoundary>
            <Suspense fallback={<FavoritesSkeleton />}>
              <Favorites />
            </Suspense>
          </ChunkErrorBoundary>
        ),
        entry: 'src/pages/Favorites.tsx',
      },
      // 應用程式設定
      {
        path: 'settings',
        element: (
          <ChunkErrorBoundary>
            <Suspense fallback={<SettingsSkeleton />}>
              <Settings />
            </Suspense>
          </ChunkErrorBoundary>
        ),
        entry: 'src/pages/Settings.tsx',
      },
      // 主題展示頁面
      {
        path: 'theme-showcase',
        lazy: async () => {
          try {
            const module = await import('./pages/ThemeShowcase');
            return { Component: module.default };
          } catch (error) {
            return { Component: () => <OfflineAwareFallback error={error} /> };
          }
        },
      },
    ],
  },

  // Layout 路由（SEO 落地頁，保留原有結構）
  createLazyRoute('/faq', () => import('./pages/FAQ'), 'src/pages/FAQ.tsx'),
  createLazyRoute('/about', () => import('./pages/About'), 'src/pages/About.tsx'),
  createLazyRoute('/privacy', () => import('./pages/Privacy'), 'src/pages/Privacy.tsx'),
  createLazyRoute('/guide', () => import('./pages/Guide'), 'src/pages/Guide.tsx'),
  createLazyRoute(
    '/sell-rate-vs-mid-rate',
    () => import('./pages/SellRateVsMidRate'),
    'src/pages/SellRateVsMidRate.tsx',
  ),
  createLazyRoute(
    '/cash-vs-spot-rate',
    () => import('./pages/CashVsSpotRate'),
    'src/pages/CashVsSpotRate.tsx',
  ),
  createLazyRoute(
    '/card-rate-guide',
    () => import('./pages/CardRateGuide'),
    'src/pages/CardRateGuide.tsx',
  ),
  createLazyRoute('/open-data', () => import('./pages/OpenData'), 'src/pages/OpenData.tsx'),

  // 17 個幣別落地頁（SEO 預渲染）+ 各自的金額子路由（/usd-twd/500/）
  createLazyRoute('/usd-twd', () => import('./pages/USDToTWD'), 'src/pages/USDToTWD.tsx'),
  createLazyRoute('/usd-twd/:amount', () => import('./pages/USDToTWD'), 'src/pages/USDToTWD.tsx'),
  createLazyRoute('/jpy-twd', () => import('./pages/JPYToTWD'), 'src/pages/JPYToTWD.tsx'),
  createLazyRoute('/jpy-twd/:amount', () => import('./pages/JPYToTWD'), 'src/pages/JPYToTWD.tsx'),
  createLazyRoute('/eur-twd', () => import('./pages/EURToTWD'), 'src/pages/EURToTWD.tsx'),
  createLazyRoute('/eur-twd/:amount', () => import('./pages/EURToTWD'), 'src/pages/EURToTWD.tsx'),
  createLazyRoute('/gbp-twd', () => import('./pages/GBPToTWD'), 'src/pages/GBPToTWD.tsx'),
  createLazyRoute('/gbp-twd/:amount', () => import('./pages/GBPToTWD'), 'src/pages/GBPToTWD.tsx'),
  createLazyRoute('/cny-twd', () => import('./pages/CNYToTWD'), 'src/pages/CNYToTWD.tsx'),
  createLazyRoute('/cny-twd/:amount', () => import('./pages/CNYToTWD'), 'src/pages/CNYToTWD.tsx'),
  createLazyRoute('/krw-twd', () => import('./pages/KRWToTWD'), 'src/pages/KRWToTWD.tsx'),
  createLazyRoute('/krw-twd/:amount', () => import('./pages/KRWToTWD'), 'src/pages/KRWToTWD.tsx'),
  createLazyRoute('/hkd-twd', () => import('./pages/HKDToTWD'), 'src/pages/HKDToTWD.tsx'),
  createLazyRoute('/hkd-twd/:amount', () => import('./pages/HKDToTWD'), 'src/pages/HKDToTWD.tsx'),
  createLazyRoute('/aud-twd', () => import('./pages/AUDToTWD'), 'src/pages/AUDToTWD.tsx'),
  createLazyRoute('/aud-twd/:amount', () => import('./pages/AUDToTWD'), 'src/pages/AUDToTWD.tsx'),
  createLazyRoute('/cad-twd', () => import('./pages/CADToTWD'), 'src/pages/CADToTWD.tsx'),
  createLazyRoute('/cad-twd/:amount', () => import('./pages/CADToTWD'), 'src/pages/CADToTWD.tsx'),
  createLazyRoute('/sgd-twd', () => import('./pages/SGDToTWD'), 'src/pages/SGDToTWD.tsx'),
  createLazyRoute('/sgd-twd/:amount', () => import('./pages/SGDToTWD'), 'src/pages/SGDToTWD.tsx'),
  createLazyRoute('/thb-twd', () => import('./pages/THBToTWD'), 'src/pages/THBToTWD.tsx'),
  createLazyRoute('/thb-twd/:amount', () => import('./pages/THBToTWD'), 'src/pages/THBToTWD.tsx'),
  createLazyRoute('/nzd-twd', () => import('./pages/NZDToTWD'), 'src/pages/NZDToTWD.tsx'),
  createLazyRoute('/nzd-twd/:amount', () => import('./pages/NZDToTWD'), 'src/pages/NZDToTWD.tsx'),
  createLazyRoute('/chf-twd', () => import('./pages/CHFToTWD'), 'src/pages/CHFToTWD.tsx'),
  createLazyRoute('/chf-twd/:amount', () => import('./pages/CHFToTWD'), 'src/pages/CHFToTWD.tsx'),
  createLazyRoute('/vnd-twd', () => import('./pages/VNDToTWD'), 'src/pages/VNDToTWD.tsx'),
  createLazyRoute('/vnd-twd/:amount', () => import('./pages/VNDToTWD'), 'src/pages/VNDToTWD.tsx'),
  createLazyRoute('/php-twd', () => import('./pages/PHPToTWD'), 'src/pages/PHPToTWD.tsx'),
  createLazyRoute('/php-twd/:amount', () => import('./pages/PHPToTWD'), 'src/pages/PHPToTWD.tsx'),
  createLazyRoute('/idr-twd', () => import('./pages/IDRToTWD'), 'src/pages/IDRToTWD.tsx'),
  createLazyRoute('/idr-twd/:amount', () => import('./pages/IDRToTWD'), 'src/pages/IDRToTWD.tsx'),
  createLazyRoute('/myr-twd', () => import('./pages/MYRToTWD'), 'src/pages/MYRToTWD.tsx'),
  createLazyRoute('/myr-twd/:amount', () => import('./pages/MYRToTWD'), 'src/pages/MYRToTWD.tsx'),

  // 17 個反向幣別落地頁（TWD→外幣，出國換匯場景，SEO 預渲染）+ 各自的金額子路由
  createLazyRoute('/twd-usd', () => import('./pages/TWDToUSD'), 'src/pages/TWDToUSD.tsx'),
  createLazyRoute('/twd-usd/:amount', () => import('./pages/TWDToUSD'), 'src/pages/TWDToUSD.tsx'),
  createLazyRoute('/twd-jpy', () => import('./pages/TWDToJPY'), 'src/pages/TWDToJPY.tsx'),
  createLazyRoute('/twd-jpy/:amount', () => import('./pages/TWDToJPY'), 'src/pages/TWDToJPY.tsx'),
  createLazyRoute('/twd-eur', () => import('./pages/TWDToEUR'), 'src/pages/TWDToEUR.tsx'),
  createLazyRoute('/twd-eur/:amount', () => import('./pages/TWDToEUR'), 'src/pages/TWDToEUR.tsx'),
  createLazyRoute('/twd-gbp', () => import('./pages/TWDToGBP'), 'src/pages/TWDToGBP.tsx'),
  createLazyRoute('/twd-gbp/:amount', () => import('./pages/TWDToGBP'), 'src/pages/TWDToGBP.tsx'),
  createLazyRoute('/twd-aud', () => import('./pages/TWDToAUD'), 'src/pages/TWDToAUD.tsx'),
  createLazyRoute('/twd-aud/:amount', () => import('./pages/TWDToAUD'), 'src/pages/TWDToAUD.tsx'),
  createLazyRoute('/twd-cad', () => import('./pages/TWDToCAD'), 'src/pages/TWDToCAD.tsx'),
  createLazyRoute('/twd-cad/:amount', () => import('./pages/TWDToCAD'), 'src/pages/TWDToCAD.tsx'),
  createLazyRoute('/twd-cny', () => import('./pages/TWDToCNY'), 'src/pages/TWDToCNY.tsx'),
  createLazyRoute('/twd-cny/:amount', () => import('./pages/TWDToCNY'), 'src/pages/TWDToCNY.tsx'),
  createLazyRoute('/twd-hkd', () => import('./pages/TWDToHKD'), 'src/pages/TWDToHKD.tsx'),
  createLazyRoute('/twd-hkd/:amount', () => import('./pages/TWDToHKD'), 'src/pages/TWDToHKD.tsx'),
  createLazyRoute('/twd-krw', () => import('./pages/TWDToKRW'), 'src/pages/TWDToKRW.tsx'),
  createLazyRoute('/twd-krw/:amount', () => import('./pages/TWDToKRW'), 'src/pages/TWDToKRW.tsx'),
  createLazyRoute('/twd-sgd', () => import('./pages/TWDToSGD'), 'src/pages/TWDToSGD.tsx'),
  createLazyRoute('/twd-sgd/:amount', () => import('./pages/TWDToSGD'), 'src/pages/TWDToSGD.tsx'),
  createLazyRoute('/twd-thb', () => import('./pages/TWDToTHB'), 'src/pages/TWDToTHB.tsx'),
  createLazyRoute('/twd-thb/:amount', () => import('./pages/TWDToTHB'), 'src/pages/TWDToTHB.tsx'),
  createLazyRoute('/twd-nzd', () => import('./pages/TWDToNZD'), 'src/pages/TWDToNZD.tsx'),
  createLazyRoute('/twd-nzd/:amount', () => import('./pages/TWDToNZD'), 'src/pages/TWDToNZD.tsx'),
  createLazyRoute('/twd-chf', () => import('./pages/TWDToCHF'), 'src/pages/TWDToCHF.tsx'),
  createLazyRoute('/twd-chf/:amount', () => import('./pages/TWDToCHF'), 'src/pages/TWDToCHF.tsx'),
  createLazyRoute('/twd-vnd', () => import('./pages/TWDToVND'), 'src/pages/TWDToVND.tsx'),
  createLazyRoute('/twd-vnd/:amount', () => import('./pages/TWDToVND'), 'src/pages/TWDToVND.tsx'),
  createLazyRoute('/twd-php', () => import('./pages/TWDToPHP'), 'src/pages/TWDToPHP.tsx'),
  createLazyRoute('/twd-php/:amount', () => import('./pages/TWDToPHP'), 'src/pages/TWDToPHP.tsx'),
  createLazyRoute('/twd-idr', () => import('./pages/TWDToIDR'), 'src/pages/TWDToIDR.tsx'),
  createLazyRoute('/twd-idr/:amount', () => import('./pages/TWDToIDR'), 'src/pages/TWDToIDR.tsx'),
  createLazyRoute('/twd-myr', () => import('./pages/TWDToMYR'), 'src/pages/TWDToMYR.tsx'),
  createLazyRoute('/twd-myr/:amount', () => import('./pages/TWDToMYR'), 'src/pages/TWDToMYR.tsx'),

  // SEO 技術揭露頁面
  createLazyRoute('/seo-tech', () => import('./pages/SeoTech'), 'src/pages/SeoTech.tsx'),

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
