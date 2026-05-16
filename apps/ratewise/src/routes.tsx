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
 * - 內部工具頁面（僅 dev 或 VITE_ENABLE_INTERNAL_ROUTES=true 註冊）：
 *   - `/theme-showcase`: 主題展示
 *   - `/color-scheme`: 內部工具
 *   - `/update-prompt-test`: UpdatePrompt 測試
 *   - `/ui-showcase`: UI 元件展示
 *   - `/*`: 404 頁面
 *
 */

import type { RouteRecord } from 'vite-react-ssg';
import type { ComponentType } from 'react';
import { Suspense } from 'react';
import { SEOHelmet } from './components/SEOHelmet';
import { HomepageSEOSection } from './components/HomepageSEOSection';
import { Layout } from './components/Layout';
import { AppLayout } from './components/AppLayout';
import {
  MultiConverterSkeleton,
  FavoritesSkeleton,
  SettingsSkeleton,
} from './components/SkeletonLoader';
import { HOMEPAGE_SEO } from './config/seo-metadata';
import { CURRENCY_LANDING_ROUTE_REGISTRY } from './config/currencyLandingRouteRegistry';
import { logger } from './utils/logger';
import { isChunkLoadError, recoverFromChunkLoadError } from './utils/chunkLoadRecovery';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { ChunkErrorBoundary, OfflineAwareFallback } from './components/OfflineAwareError';

import RateWise from './features/ratewise/RateWise';
const MultiConverter = lazyWithRetry(() => import('./pages/MultiConverter'));
const Favorites = lazyWithRetry(() => import('./pages/Favorites'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));

const shouldEnableInternalRoutes =
  import.meta.env.DEV || import.meta.env['VITE_ENABLE_INTERNAL_ROUTES'] === 'true';

const currencyLandingPageImports = {
  AUDToTWD: () => import('./pages/AUDToTWD'),
  CADToTWD: () => import('./pages/CADToTWD'),
  CHFToTWD: () => import('./pages/CHFToTWD'),
  CNYToTWD: () => import('./pages/CNYToTWD'),
  EURToTWD: () => import('./pages/EURToTWD'),
  GBPToTWD: () => import('./pages/GBPToTWD'),
  HKDToTWD: () => import('./pages/HKDToTWD'),
  IDRToTWD: () => import('./pages/IDRToTWD'),
  JPYToTWD: () => import('./pages/JPYToTWD'),
  KRWToTWD: () => import('./pages/KRWToTWD'),
  MYRToTWD: () => import('./pages/MYRToTWD'),
  NZDToTWD: () => import('./pages/NZDToTWD'),
  PHPToTWD: () => import('./pages/PHPToTWD'),
  SGDToTWD: () => import('./pages/SGDToTWD'),
  THBToTWD: () => import('./pages/THBToTWD'),
  USDToTWD: () => import('./pages/USDToTWD'),
  VNDToTWD: () => import('./pages/VNDToTWD'),
  TWDToAUD: () => import('./pages/TWDToAUD'),
  TWDToCAD: () => import('./pages/TWDToCAD'),
  TWDToCHF: () => import('./pages/TWDToCHF'),
  TWDToCNY: () => import('./pages/TWDToCNY'),
  TWDToEUR: () => import('./pages/TWDToEUR'),
  TWDToGBP: () => import('./pages/TWDToGBP'),
  TWDToHKD: () => import('./pages/TWDToHKD'),
  TWDToIDR: () => import('./pages/TWDToIDR'),
  TWDToJPY: () => import('./pages/TWDToJPY'),
  TWDToKRW: () => import('./pages/TWDToKRW'),
  TWDToMYR: () => import('./pages/TWDToMYR'),
  TWDToNZD: () => import('./pages/TWDToNZD'),
  TWDToPHP: () => import('./pages/TWDToPHP'),
  TWDToSGD: () => import('./pages/TWDToSGD'),
  TWDToTHB: () => import('./pages/TWDToTHB'),
  TWDToUSD: () => import('./pages/TWDToUSD'),
  TWDToVND: () => import('./pages/TWDToVND'),
} as const;

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
 * 首頁直接渲染主內容，避免 skeleton → 真內容整頁替換造成 CLS
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
              jsonLd={HOMEPAGE_SEO.jsonLd}
            />
            <RateWise />
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
      ...(shouldEnableInternalRoutes
        ? [
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
          ]
        : []),
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

  ...CURRENCY_LANDING_ROUTE_REGISTRY.flatMap((route) => {
    const importPage =
      currencyLandingPageImports[route.pageModule as keyof typeof currencyLandingPageImports];

    return [
      createLazyRoute(route.path.replace(/\/$/, ''), importPage, route.entry),
      createLazyRoute(route.amountPathPattern, importPage, route.entry),
    ];
  }),

  // SEO 技術揭露頁面
  createLazyRoute('/seo-tech', () => import('./pages/SeoTech'), 'src/pages/SeoTech.tsx'),

  ...(shouldEnableInternalRoutes
    ? [
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
        createLazyRoute(
          '/ui-showcase',
          () => import('./pages/UIShowcase'),
          'src/pages/UIShowcase.tsx',
        ),
      ]
    : []),

  // 不預渲染 404 頁面（動態處理）
  createLazyRoute('*', () => import('./pages/NotFound'), 'src/pages/NotFound.tsx'),
];

/**
 * 指定哪些路徑應該被預渲染為靜態 HTML
 *
 * 策略：
 * - 預渲染：首頁、FAQ、About、Guide + 34 個幣別落地頁
 * - 不預渲染：404、內部工具頁（production 不註冊）
 */
export { getIncludedRoutes } from './config/seo-paths';
