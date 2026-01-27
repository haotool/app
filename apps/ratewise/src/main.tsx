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
import { initCSPReporter } from './utils/csp-reporter';
import { ensureStaticLoaderData } from './utils/ssg-loader-data';

// 使用 import.meta.env 優先，如果不存在則使用全域變數，最後使用預設值
const appVersion =
  import.meta.env.VITE_APP_VERSION ??
  (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0');
const buildTime =
  import.meta.env.VITE_BUILD_TIME ??
  (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString());

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
      // Initialize CSP violation monitoring
      initCSPReporter();

      // 預先建立靜態載入資料，避免導覽時 JSON 解析錯誤
      void ensureStaticLoaderData();

      // Log application startup
      logger.info('Application starting', {
        environment: import.meta.env.MODE,
        version: appVersion,
        buildTime,
      });

      // 處理版本更新（檢測版本變更並清除快取）
      void handleVersionUpdate();

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
        } else {
          // 其他未處理的錯誤記錄但不阻止
          logger.error(
            'Unhandled promise rejection',
            reason instanceof Error ? reason : new Error(errorMessage),
          );
        }
      });

      // Initialize observability (non-blocking)
      // Sentry loads on-demand via ErrorBoundary to save initial bundle size
      initWebVitals();

      // Log successful mount
      logger.info('Application mounted successfully (client-side)', {
        version: appVersion,
        buildTime,
      });

      // Service Worker 註冊由 UpdatePrompt 組件處理
    } else {
      // Server-side rendering log
      logger.info('Generating static HTML (server-side)', {
        version: appVersion,
        buildTime,
      });
    }
  },
);
