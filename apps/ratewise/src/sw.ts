/** RateWise Service Worker：提供離線導覽與快取策略。 */

/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// SW 自我修復：捕捉 precache 安裝失敗（常見於部署競態窗口，資源短暫 404）。
// 僅在無健康 active worker 時才登出（首次安裝失敗場景）；
// 若已有 active worker 仍在服務，保留其快取並讓瀏覽器下次自動重試新版安裝。
self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (String(event.reason).includes('bad-precaching-response')) {
    event.preventDefault();
    if (!self.registration.active) {
      console.warn('[SW] 首次 precache 安裝失敗，自動登出以允許重新安裝');
      void self.registration.unregister();
    } else {
      console.warn('[SW] 新版 precache 安裝失敗，保留現有 active worker，瀏覽器將自動重試');
    }
  }
});

// 預快取 Vite 產生的靜態資源。
precacheAndRoute(self.__WB_MANIFEST);

// 清除舊版快取。
cleanupOutdatedCaches();

// 立即啟用新版 SW，並接管現有頁面。
void self.skipWaiting();
clientsClaim();

// FORCE_HARD_RESET：客戶端（骨架屏超時、使用者手動下拉）可傳送此訊息。
// SW 清除所有快取並通知 client 重新載入，確保使用者永遠能脫離卡住狀態。
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | null;
  if (data?.type !== 'FORCE_HARD_RESET') return;

  event.waitUntil(
    (async () => {
      console.warn('[SW] FORCE_HARD_RESET 收到，清除所有快取並通知 client 重載');
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.warn(`[SW] 已清除 ${String(cacheNames.length)} 個快取`);
      } catch (err) {
        console.error('[SW] 清除快取失敗:', err);
      }
      // 通知所有 client 重新載入
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'SW_HARD_RESET_DONE' });
      }
    })(),
  );
});

// 離線探測專用路徑：永遠走網路，避免快取誤判在線。
registerRoute(
  ({ url }: { url: URL }) => url.pathname.endsWith('/__network_probe__'),
  new NetworkOnly(),
);

// 離線優先策略：導覽請求失敗時先嘗試既有快取，再回退 index/offline 頁面。
setCatchHandler(async ({ event, request }): Promise<Response> => {
  const fetchEvent = event as FetchEvent;
  const req = request ?? fetchEvent.request;

  // 僅處理導覽請求。
  if (req.destination !== 'document') {
    return Response.error();
  }

  // 安全性驗證：僅處理同源請求。
  let requestOrigin: string;
  let swOrigin: string;
  try {
    if (!req.url || typeof req.url !== 'string' || req.url.trim() === '') {
      return Response.error();
    }
    const scope = self.registration?.scope;
    if (!scope || typeof scope !== 'string' || scope.trim() === '') {
      return Response.error();
    }

    requestOrigin = new URL(req.url).origin;
    swOrigin = new URL(scope).origin;
  } catch (error) {
    console.error('[SW] Origin validation failed:', error);
    return Response.error();
  }
  if (requestOrigin !== swOrigin) {
    return Response.error();
  }

  // 1) 先取 runtime cache。
  try {
    if (!req.url || typeof req.url !== 'string' || req.url.trim() === '') {
      throw new Error('Invalid URL');
    }

    const requestUrl = new URL(req.url);
    if (!requestUrl.pathname.includes('..')) {
      const cachedHtml = await caches.match(req.url);
      if (cachedHtml) {
        return cachedHtml;
      }
    }
  } catch (error) {
    console.error('[SW] Runtime cache match failed:', error);
  }

  // 2) 再取 precache index.html。
  const indexHtml = await matchPrecache('index.html');
  if (indexHtml) {
    return indexHtml;
  }

  // 3) 備援：完整 URL 匹配 index.html。
  try {
    const scope = self.registration?.scope;
    if (!scope || typeof scope !== 'string' || scope.trim() === '') {
      throw new Error('Invalid scope');
    }

    const indexUrl = new URL('index.html', scope).href;
    const indexFromCache = await caches.match(indexUrl);
    if (indexFromCache) {
      return indexFromCache;
    }
  } catch (error) {
    console.error('[SW] Index URL construction failed:', error);
  }

  // 4) 最後回退 offline.html。
  const offlineResponse = await matchPrecache('offline.html');
  if (offlineResponse) {
    return offlineResponse;
  }

  // 備援：完整 URL 匹配 offline.html。
  try {
    const scope = self.registration?.scope;
    if (!scope || typeof scope !== 'string' || scope.trim() === '') {
      return Response.error();
    }

    const offlineUrl = new URL('offline.html', scope).href;
    const fallbackResponse = await caches.match(offlineUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
  } catch (error) {
    console.error('[SW] Offline URL construction failed:', error);
  }

  return Response.error();
});

// Runtime 快取策略
// HTML: NetworkFirst + 2 秒 timeout。
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
    networkTimeoutSeconds: 2,
  }),
);

// 歷史匯率（CDN）：CacheFirst。
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === 'https://cdn.jsdelivr.net' &&
    url.pathname.includes('/public/rates/history/') &&
    url.pathname.endsWith('.json'),
  new CacheFirst({
    cacheName: 'history-rates-cdn',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 180,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  }),
);

// 歷史匯率（GitHub raw 備援）：CacheFirst。
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === 'https://raw.githubusercontent.com' &&
    url.pathname.includes('/public/rates/history/') &&
    url.pathname.endsWith('.json'),
  new CacheFirst({
    cacheName: 'history-rates-raw',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 180,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);

// 最新匯率：StaleWhileRevalidate（離線備援 7 天）。
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === 'https://raw.githubusercontent.com' &&
    url.pathname.includes('/public/rates/latest.json'),
  new StaleWhileRevalidate({
    cacheName: 'latest-rate-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days (offline fallback)
      }),
    ],
  }),
);

// 圖片：CacheFirst。
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
      }),
    ],
  }),
);

// 字型：CacheFirst。
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  }),
);

// JS/CSS：CacheFirst（hash 檔名可視為不可變）。
registerRoute(
  ({ request }: { request: Request }) =>
    request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
);

// manifest/SEO 檔案：StaleWhileRevalidate。
registerRoute(
  ({ url }: { url: URL }) => /\.(webmanifest|txt|xml)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'seo-files-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  }),
);

// offline.html 已由 precache 管理，無需額外 runtime route。
