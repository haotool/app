/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="@sentry/react" />

// 版本管理全局變數
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_TIME?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Window 介面擴展
 * [context7:getsentry/sentry-javascript:2025-11-10T03:05:00+08:00]
 */
interface Window {
  Sentry?: typeof import('@sentry/react');
  gtag?: (...args: unknown[]) => void;
}
