/**
 * GA4 Analytics — 動態注入 gtag.js，無 inline script，CSP 相容。
 *
 * 設計原則：
 * - `send_page_view: false`：由 RouteAnalytics 手動送出，防止 SSG hydration 重複計算。
 * - `transport_type: 'beacon'`：使用 sendBeacon API，非阻塞且頁面卸載不丟失事件。
 * - `arguments` 物件：GA4 內部依賴 IArguments；改用 spread 會導致事件靜默失效。
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

/**
 * 初始化 GA4 並注入 gtag.js。
 * measurementId 為空時提早返回，dev 環境不啟用。
 */
export function initGA(measurementId: string): void {
  if (!measurementId || typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];

  // 必須使用 regular function + arguments 物件。
  // spread 建立真 Array，GA4 無法識別，導致所有事件靜默丟失。
  window.gtag = function gtag(): void {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
    transport_type: 'beacon',
  });

  // CSP script-src 已允許 googletagmanager.com，Trusted Types 亦已加白名單。
  // crossOrigin='anonymous'：CORS 模式載入，符合 COEP require-corp 跨源隔離環境要求。
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/** 送出 GA4 page_view 事件。gtag 未就緒時靜默略過。 */
export function trackPageview(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

/** 送出 GA4 自訂事件。gtag 未就緒時靜默略過。 */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}
