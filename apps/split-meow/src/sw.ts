/// <reference lib="webworker" />
/// <reference types="vite/client" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 首次安裝後立即控制所有已開啟頁面，避免頁面在 SW 啟動前發出的請求無法被攔截。
clientsClaim();

// 導覽請求：優先網路，離線回落到 offline.html。
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 2,
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
);

// 靜態資源：stale-while-revalidate。
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style'),
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

// 圖片：cache-first。
registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

setCatchHandler(async ({ event }) => {
  const request = (event as FetchEvent).request;

  // JS/CSS 離線回退：依序嘗試三種策略，避免 Response.error() 觸發黑屏。
  // 1) 精確 URL 比對（runtime cache bare-URL 條目）。
  // 2) 忽略 query string（workbox-precache revision-keyed 條目：?__WB_REVISION__=hash）。
  // 3) precache controller 查詢。
  if (request.destination === 'script' || request.destination === 'style') {
    const cached = await caches.match(request);
    if (cached) return cached;
    const cachedIgnoreSearch = await caches.match(request, { ignoreSearch: true });
    if (cachedIgnoreSearch) return cachedIgnoreSearch;
    const precached = await matchPrecache(request.url);
    if (precached) return precached;
    return Response.error();
  }

  if (request.mode === 'navigate') {
    // matchPrecache 處理 revision-keyed 快取鍵（?__WB_REVISION__=hash），
    // 比 caches.match() 精確比對更可靠。
    const offline = await matchPrecache('offline.html');
    if (offline) return offline;
    // 完整 URL fallback（ignoreSearch 涵蓋 revision hash 變體）。
    const fallback = await caches.match(
      new URL('offline.html', self.registration.scope).toString(),
      { ignoreSearch: true },
    );
    return fallback ?? Response.error();
  }

  return Response.error();
});

// 手動更新：prompt 模式由前端 UI 觸發。
self.addEventListener('message', (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
