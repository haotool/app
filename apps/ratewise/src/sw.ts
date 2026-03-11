/** RateWise Service Worker：離線導覽與快取策略。 */

/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// precache 安裝失敗自動修復：首次安裝失敗時登出以允許重試；已有 active worker 則保留。
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

// 保存 manifest 供 VERIFY_AND_REPAIR_PRECACHE 使用。
const WB_MANIFEST = self.__WB_MANIFEST;

// 預快取 Vite 產出的靜態資源。
precacheAndRoute(WB_MANIFEST);

// precache 完整性驗證與修復：補回 iOS cache eviction 清除的 JS/CSS chunk。
async function verifyAndRepairPrecache(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    const precacheName = cacheNames.find((n) => n.startsWith('workbox-precache-v2'));
    if (!precacheName) {
      console.warn('[SW] Precache 快取不存在，跳過修復');
      return;
    }

    const cache = await caches.open(precacheName);
    const cachedRequests = await cache.keys();
    const cachedUrls = new Set(cachedRequests.map((r) => r.url));
    const scope = self.registration.scope;

    type ManifestEntry = string | { url: string; revision?: string | null };
    const missing = (WB_MANIFEST as ManifestEntry[]).filter((entry) => {
      const relUrl = typeof entry === 'string' ? entry : entry.url;
      if (!relUrl.endsWith('.js') && !relUrl.endsWith('.css')) return false;
      const fullUrl = new URL(relUrl, scope).href;
      return !cachedUrls.has(fullUrl);
    });

    if (missing.length === 0) {
      return;
    }

    console.warn(`[SW] Precache 缺少 ${missing.length} 個條目，開始修復`);
    await Promise.allSettled(
      missing.map(async (entry) => {
        const relUrl = typeof entry === 'string' ? entry : entry.url;
        const fullUrl = new URL(relUrl, scope).href;
        try {
          const response = await fetch(fullUrl, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(fullUrl, response);
          }
        } catch (err) {
          console.warn(`[SW] 修復失敗: ${fullUrl}`, err);
        }
      }),
    );
    console.warn('[SW] Precache 修復完成');
  } catch (err) {
    console.error('[SW] verifyAndRepairPrecache 執行失敗:', err);
  }
}

// 清除舊版快取。
cleanupOutdatedCaches();

// prompt 模式：新 SW 進入 waiting 狀態，由使用者確認後才接管，防止版本撕裂導致 Load failed。
clientsClaim();

// 訊息處理：SKIP_WAITING（prompt 更新流程）/ FORCE_HARD_RESET（緊急清除快取）。
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | null;

  // UpdatePrompt.updateServiceWorker(true) 觸發，讓 waiting SW 立即接管。
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
    return;
  }

  // 啟動時驗證 precache 完整性，補回 iOS cache eviction 清除的 chunk。
  if (data?.type === 'VERIFY_AND_REPAIR_PRECACHE') {
    event.waitUntil(verifyAndRepairPrecache());
    return;
  }

  if (data?.type !== 'FORCE_HARD_RESET') return;

  event.waitUntil(
    (async () => {
      console.warn('[SW] FORCE_HARD_RESET 收到，清除 runtime 快取並通知 client 重載');
      try {
        const cacheNames = await caches.keys();
        // 保留 workbox precache，避免清除後冷啟動離線白屏。
        // Workbox cleanupOutdatedCaches 負責清理舊版 precache，不需手動介入。
        const runtimeCaches = cacheNames.filter((n) => !n.startsWith('workbox-precache-v2'));
        await Promise.all(runtimeCaches.map((name) => caches.delete(name)));
        console.warn(
          `[SW] 已清除 ${String(runtimeCaches.length)} 個 runtime 快取（保留 precache）`,
        );
      } catch (err) {
        console.error('[SW] 清除快取失敗:', err);
      }
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'SW_HARD_RESET_DONE' });
      }
    })(),
  );
});

// 離線探測端點：永遠走網路，避免快取誤判在線狀態。
registerRoute(
  ({ url }: { url: URL }) => url.pathname.endsWith('/__network_probe__'),
  new NetworkOnly(),
);

// 網路失敗離線回退：JS/CSS 嘗試快取；導覽請求回退至 precache index.html。
setCatchHandler(async ({ event, request }): Promise<Response> => {
  const fetchEvent = event as FetchEvent;
  const req = request ?? fetchEvent.request;

  // JS/CSS 離線回退：iOS cache eviction 後先嘗試全快取比對，避免 "Load failed" 崩潰。
  if (req.destination === 'script' || req.destination === 'style') {
    try {
      const cached = await caches.match(req);
      if (cached) return cached;
    } catch {
      // 忽略快取存取錯誤。
    }
    return Response.error();
  }

  if (req.destination !== 'document') {
    return Response.error();
  }

  // SPA 導覽離線回退：直接從 precache 提供 index.html（Workbox 官方 SPA 模式）。
  // NavigationRoute 已攔截所有正常導覽請求；setCatchHandler 僅在網路失敗時作為保險層。
  return (await matchPrecache('index.html')) ?? Response.error();
});

// SPA 導覽：所有導覽請求直接從 precache 提供 index.html（Workbox 官方 SPA 離線模式）。
// NavigationRoute + createHandlerBoundToURL 是 Workbox 官方 SPA 最佳實踐，
// 可確保冷啟動離線時 index.html 一定能從 precache 取得，無需依賴 NetworkFirst 與 html-cache。
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// 歷史匯率（CDN）：CacheFirst，不可變資料永久快取。
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === 'https://cdn.jsdelivr.net' &&
    url.pathname.includes('/public/rates/history/') &&
    url.pathname.endsWith('.json'),
  new CacheFirst({
    cacheName: 'history-rates-cdn',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 180,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
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
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 180,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);

// 最新匯率：StaleWhileRevalidate，離線備援 7 天。
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === 'https://raw.githubusercontent.com' &&
    url.pathname.includes('/public/rates/latest.json'),
  new StaleWhileRevalidate({
    cacheName: 'latest-rate-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
      }),
    ],
  }),
);

// 圖片：CacheFirst，90 天。
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 60 * 24 * 90, // 90 天
      }),
    ],
  }),
);

// 字型：CacheFirst，1 年。
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
      }),
    ],
  }),
);

// JS/CSS：CacheFirst，content hash 確保不可變性，30 天。
registerRoute(
  ({ request }: { request: Request }) =>
    request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
      }),
    ],
  }),
);

// manifest / SEO 文字檔案：StaleWhileRevalidate，7 天。
registerRoute(
  ({ url }: { url: URL }) => /\.(webmanifest|txt|xml)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'seo-files-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
      }),
    ],
  }),
);

// offline.html 由 precache 管理，無需額外 runtime route。
