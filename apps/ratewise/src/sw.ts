/** Service Worker：離線導覽與快取策略。 */

/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { resolveOfflineDocumentFallback } from './utils/pwaOfflineFallback';

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

/**
 * 確保 offline.html 一定被快取（install 失敗時的補救機制）。
 *
 * iOS Safari 在 PWA 冷啟動時可能遇到以下問題：
 * 1. SW install 過程中 offline.html 的 precache 因網路問題失敗
 * 2. additionalManifestEntries 的 revision 導致 cache key mismatch
 * 3. iOS cache eviction 清除了 offline.html
 *
 * 此機制在 SW activate 時直接用 bare URL（無 revision）快取 offline.html，
 * 確保 setCatchHandler 的 matchPrecache('offline.html') 或 caches.match() 一定能命中。
 */
async function ensureOfflineHtmlCached(): Promise<void> {
  try {
    // 先檢查是否已在任何快取中（precache 或 critical-launch-cache）
    const existingResponse = await caches.match('offline.html');
    if (existingResponse) {
      return;
    }

    // 嘗試從網路取得並快取到 html-cache（setCatchHandler 可 match）
    const scope = self.registration.scope;
    const offlineUrl = new URL('offline.html', scope).href;

    const response = await fetch(offlineUrl, { cache: 'no-cache' });
    if (response.ok) {
      const cache = await caches.open('html-cache');
      await cache.put(offlineUrl, response.clone());
      // 同時用相對路徑快取，讓 matchPrecache('offline.html') 也能命中
      await cache.put('offline.html', response);
    }
  } catch {
    // 離線時無法 fetch 為正常現象，忽略錯誤。
  }
}

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

/**
 * Cache Budget Guard（PR3: iOS 50MB cache 限制保護）
 *
 * iOS Safari 對 SW cache 有 50MB 上限，超過會觸發 eviction。
 * 此函式在 install 時檢查使用量，超過 40MB 時清理非關鍵快取。
 */
async function checkAndCleanupCacheBudget(): Promise<void> {
  try {
    if (!navigator.storage?.estimate) return;

    const { usage, quota } = await navigator.storage.estimate();
    if (!usage || !quota) return;

    const usageMB = usage / 1024 / 1024;
    const budgetMB = 40; // iOS 安全邊界（50MB 上限前預留緩衝）

    if (usageMB <= budgetMB) {
      // Cache 使用量在預算內，無需清理
      return;
    }

    console.warn(
      `[SW] Cache usage ${usageMB.toFixed(2)}MB exceeds ${budgetMB}MB budget, cleaning up...`,
    );

    // 清理優先順序：舊歷史資料 > 圖片 > 字型（保留 precache 與 html-cache）
    const cleanupOrder = ['history-rates-cdn', 'history-rates-raw', 'image-cache', 'font-cache'];
    for (const cacheName of cleanupOrder) {
      const cacheExists = await caches.has(cacheName);
      if (cacheExists) {
        await caches.delete(cacheName);
        console.warn(`[SW] Deleted cache: ${cacheName}`);

        // 重新檢查使用量
        const { usage: newUsage } = await navigator.storage.estimate();
        if (newUsage && newUsage / 1024 / 1024 <= budgetMB) {
          // 清理完成，使用量已在預算內
          return;
        }
      }
    }
  } catch (err) {
    console.error('[SW] Cache budget check failed:', err);
  }
}

// install 時檢查快取預算
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(checkAndCleanupCacheBudget());
});

// activate 時確保 offline.html 已快取（install 失敗時的補救）
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(ensureOfflineHtmlCached());
});

// prompt 模式：僅在 waiting SW 收到 SKIP_WAITING 訊息後才接管。
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
      console.warn('[SW] FORCE_HARD_RESET 收到，清除所有快取並通知 client 重載');
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.warn(`[SW] 已清除 ${String(cacheNames.length)} 個快取`);
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

// 網路失敗離線回退：JS/CSS 嘗試快取；導覽請求回退至 precache index.html / offline.html。
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

  // NavigationRoute 已攔截正常導覽；setCatchHandler 僅在網路失敗時作保險層。
  return resolveOfflineDocumentFallback({
    emergencyReason: 'emergency-document-fallback',
    matchPrecache,
    matchOfflineHtmlInAnyCache: () => caches.match('offline.html'),
  });
});

/**
 * SPA 導覽策略：StaleWhileRevalidate（installed PWA 與瀏覽器共用）
 *
 * 業界最佳實踐（web.dev / Workbox docs）：
 * - 已 install 過的 PWA / 已 visited 的瀏覽器：cache hit 立即返回（零白屏冷啟動）
 * - 背景 revalidate 抓取最新 HTML 寫回 cache，下一次 navigation 自動拿到新版
 * - 新版本切換由既有 SW controllerchange + reload 機制處理（main.tsx）
 * - handlerDidError：第一次訪問的離線或 fetch 失敗時，仍走 precache 三層 fallback
 *
 * 取代 NetworkFirst + 3s timeout 的理由：
 * - NetworkFirst 在慢網路下要等到 3s timeout 才 fallback → 感知白屏
 * - SWR 對「已有 cache」的場景立即回應，把感知白屏降為 0
 * - 對版本撕裂的防護：UpdatePrompt + handleVersionUpdate 雙重檢查
 *
 * @see https://developer.chrome.com/docs/workbox/modules/workbox-strategies#stale-while-revalidate
 */
const navigationStrategy = new StaleWhileRevalidate({
  cacheName: 'html-cache',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    {
      // 第一次訪問且網路失敗時的 fallback chain：precache index → precache offline → any cache offline。
      // SWR 在 cache miss 時必須等 fetch；fetch 失敗才會進入 handlerDidError。
      handlerDidError: async () => {
        // 最後防線：搜尋任何快取中的 offline.html；若全數失守，回 inline emergency HTML，
        // 避免 Workbox 在 plugin 已回傳 Response.error() 後不再進入全域 setCatchHandler。
        return resolveOfflineDocumentFallback({
          emergencyReason: 'emergency-navigation-fallback',
          matchPrecache,
          matchOfflineHtmlInAnyCache: () => caches.match('offline.html'),
        });
      },
    },
  ],
});

registerRoute(new NavigationRoute(navigationStrategy));

// 歷史匯率 aggregate（30 天合併 JSON）：StaleWhileRevalidate，每日更新。
registerRoute(
  ({ url }: { url: URL }) =>
    url.pathname.includes('/public/rates/history-30d.json') ||
    (url.origin === 'https://cdn.jsdelivr.net' &&
      url.pathname.includes('/public/rates/history-30d.json')) ||
    (url.origin === 'https://raw.githubusercontent.com' &&
      url.pathname.includes('/public/rates/history-30d.json')),
  new StaleWhileRevalidate({
    cacheName: 'history-aggregate-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 60 * 60 * 24, // 1 天（每日更新）
      }),
    ],
  }),
);

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
