/**
 * Vite React SSG Entry Point
 *
 * 使用 ViteReactSSG() 進行 SSG 預渲染，保留所有初始化邏輯。
 * 抑制 React Hydration #418 預期錯誤（SSG + 動態內容固有差異）。
 */

// IMPORTANT: This MUST be the first import to suppress hydration warnings
// before React loads. See suppress-hydration-warning.ts for details.
import './suppress-hydration-warning';

// Initialize Trusted Types (must run before any DOM manipulation)
import './trusted-types-bootstrap';

// Initialize i18n (must be before any React rendering)
import './i18n';

import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './index.css';
import { logger } from './utils/logger';
import { initWebVitals } from './utils/webVitals';
import { handleVersionUpdate } from './utils/versionManager';
import { APP_VERSION, BUILD_TIME } from './config/version';
import { isChunkLoadError, recoverFromChunkLoadError } from './utils/chunkLoadRecovery';
import { initPWAStorageManager, primePwaColdStartRecovery } from './utils/pwaStorageManager';
import {
  clearPwaAppReadyMarker,
  markPwaAppReady,
  recordPwaDiagnostic,
} from './utils/pwaDiagnostics';
import { initGA, scheduleAfterPageLoad, trackPageview, trackAiReferral } from '@shared/analytics';
import {
  ANALYTICS_IDLE_TIMEOUT_MS,
  ANALYTICS_INIT_DELAY_MS,
  PWA_STORAGE_IDLE_TIMEOUT_MS,
  PWA_STORAGE_INIT_DELAY_MS,
} from './config/performance';

const schedulePostLoadIdleTask = (
  task: () => void,
  delayMs: number,
  idleTimeoutMs: number,
): void => {
  window.setTimeout(() => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(task, { timeout: idleTimeoutMs });
      return;
    }

    window.setTimeout(task, 0);
  }, delayMs);
};

const shouldPrimePwaColdStartImmediately = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const isStandaloneDisplayMode =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = 'standalone' in navigator && navigator.standalone === true;

  return isStandaloneDisplayMode || isIosStandalone || Boolean(navigator.serviceWorker?.controller);
};

// Vite React SSG Configuration
export const createRoot = ViteReactSSG(
  {
    routes,
    basename: import.meta.env.BASE_URL || '/',
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
  ({ isClient }) => {
    // Client-side initialization
    if (isClient) {
      clearPwaAppReadyMarker();

      // GA4 延後初始化：load 後再注入腳本，避免 152KB GA 腳本與 LCP 關鍵資源競爭頻寬。
      // 防快取競態：若頁面已在 load 前完成（BFCache、快速快取頁），直接呼叫。
      const gaId = import.meta.env.VITE_GA_ID ?? '';
      const initAnalytics = (): void => {
        initGA(gaId);
        // AI referral 先於首次 page_view：trackAiReferral 會 `gtag('set', 'user_properties', { ai_source })`，
        // 必須在 page_view 之前執行，首個 page_view 才能帶上 ai_source 供 GA4 歸因首次造訪。
        trackAiReferral();
        trackPageview(window.location.pathname + window.location.search);
      };
      scheduleAfterPageLoad(() => {
        schedulePostLoadIdleTask(initAnalytics, ANALYTICS_INIT_DELAY_MS, ANALYTICS_IDLE_TIMEOUT_MS);
      });

      // Log application startup
      logger.info('Application starting', {
        environment: import.meta.env.MODE,
        version: APP_VERSION,
        buildTime: BUILD_TIME,
      });
      recordPwaDiagnostic('bootstrap-start', {
        environment: import.meta.env.MODE,
        version: APP_VERSION,
      });

      // 處理版本更新（檢測版本變更並清除快取）
      void handleVersionUpdate();

      // SW 更新後自動重載：新 SW 取得控制權時重載頁面，防止舊 HTML 引用舊 chunk URL 導致版本撕裂。
      // previousController：頁面載入時捕捉，用於區分「首次安裝」（null）與「版本更新」（有值）。
      // 首次安裝不觸發 reload，避免新用戶第一次開啟應用程式時無故重載。
      if ('serviceWorker' in navigator) {
        const previousController = navigator.serviceWorker.controller;
        let reloading = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (previousController && !reloading) {
            recordPwaDiagnostic('sw-controllerchange-reload', {
              hadPreviousController: Boolean(previousController),
            });
            reloading = true;
            window.location.reload();
          }
        });
      }

      // [fix:2026-02-08] iOS PWA Cache Persistence Strategy
      // 冷啟動自救不可延後到 load/idle；否則快取部分驅逐時，使用者可能先看到白屏。
      // 因此：
      // 1. standalone / 已受 SW 控制的情境，立即補熱關鍵資源與 precache 修復。
      // 2. 持久化儲存申請與健康度盤點仍延後，避免把效能優化完全回退。
      const shouldPrimeColdStartRecovery = shouldPrimePwaColdStartImmediately();
      recordPwaDiagnostic('cold-start-prime-decision', {
        shouldPrimeColdStartRecovery,
        hasController: Boolean(navigator.serviceWorker?.controller),
      });
      const coldStartPrimePromise = shouldPrimeColdStartRecovery
        ? primePwaColdStartRecovery(import.meta.env.BASE_URL || '/')
        : Promise.resolve({
            recachedCount: 0,
            didPingPrecacheRepair: false,
          });

      if (shouldPrimeColdStartRecovery) {
        void coldStartPrimePromise;
      }

      scheduleAfterPageLoad(() => {
        schedulePostLoadIdleTask(
          () => {
            recordPwaDiagnostic('pwa-storage-init-start');
            void (async () => {
              const coldStartPrimeResult = await coldStartPrimePromise;
              const skipDelayedCriticalRecache = coldStartPrimeResult.recachedCount > 0;
              const skipDelayedPrecacheRepairPing = coldStartPrimeResult.didPingPrecacheRepair;

              recordPwaDiagnostic('pwa-storage-init-skip-decision', {
                skipDelayedCriticalRecache,
                skipDelayedPrecacheRepairPing,
                coldStartPrimeResult,
              });
              void initPWAStorageManager(import.meta.env.BASE_URL || '/', {
                skipCriticalRecache: skipDelayedCriticalRecache,
                skipPrecacheRepairPing: skipDelayedPrecacheRepairPing,
              });
            })();
          },
          PWA_STORAGE_INIT_DELAY_MS,
          PWA_STORAGE_IDLE_TIMEOUT_MS,
        );
      });

      // 全域錯誤處理器 - 捕捉網路請求錯誤
      // [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
      // 主要用於處理歷史匯率 404 錯誤（正常現象，資料可能尚未生成）
      window.addEventListener('unhandledrejection', (event) => {
        // 安全地提取錯誤訊息
        const reason: unknown = event.reason;
        let errorMessage = '';

        if (reason instanceof Error) {
          errorMessage = reason.message;
        } else if (typeof reason === 'string') {
          errorMessage = reason;
        } else if (reason && typeof reason === 'object' && 'message' in reason) {
          const msg = (reason as { message: unknown }).message;
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(reason);
        }

        const errorObject =
          reason instanceof Error ? reason : new Error(errorMessage || 'Unhandled rejection');

        // 先處理 chunk 載入錯誤（避免被歷史匯率錯誤規則吞掉）
        if (isChunkLoadError(errorObject)) {
          logger.warn('Chunk load error captured by global handler', {
            reason: errorMessage,
          });
          recordPwaDiagnostic('chunk-load-error', errorMessage, 'error');
          event.preventDefault();
          void recoverFromChunkLoadError();
          return;
        }

        // 檢查是否為歷史匯率相關的網路錯誤
        const isHistoricalRates404 =
          errorMessage.includes('history') ||
          errorMessage.includes('404') ||
          errorMessage.includes('Failed to fetch');

        if (isHistoricalRates404) {
          // 這是預期的錯誤（歷史資料可能尚未生成），阻止顯示在 console
          logger.debug('Historical data fetch failed (expected)', {
            reason: errorMessage,
          });
          event.preventDefault(); // 防止錯誤顯示在瀏覽器 console
          return;
        }

        // 其他未處理的錯誤記錄但不阻止
        logger.error('Unhandled promise rejection', errorObject);
        recordPwaDiagnostic('unhandled-rejection', errorMessage || errorObject.message, 'error');
      });

      // Initialize observability (non-blocking)
      // Sentry loads on-demand via ErrorBoundary to save initial bundle size
      initWebVitals();

      // Log successful mount
      logger.info('Application mounted successfully (client-side)', {
        version: APP_VERSION,
        buildTime: BUILD_TIME,
      });
      markPwaAppReady();

      // Service Worker 註冊由 UpdatePrompt 組件處理
    } else {
      // Server-side rendering log
      logger.info('Generating static HTML (server-side)', {
        version: APP_VERSION,
        buildTime: BUILD_TIME,
      });
    }
  },
);
