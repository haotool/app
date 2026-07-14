/// <reference lib="webworker" />
/// <reference types="vite/client" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// 版本化 runtime cache 名稱：新版本 SW activate 後舊 runtime cache 自動清除。
const RUNTIME_CACHE_VERSION = 'v1';
const CACHE_PAGES = `pages-${RUNTIME_CACHE_VERSION}`;
const CACHE_ASSETS = `assets-${RUNTIME_CACHE_VERSION}`;
const CACHE_IMAGES = `images-${RUNTIME_CACHE_VERSION}`;
const KNOWN_CACHES = new Set([CACHE_PAGES, CACHE_ASSETS, CACHE_IMAGES]);

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 首次安裝後立即控制所有已開啟頁面，避免頁面在 SW 啟動前發出的請求無法被攔截。
clientsClaim();

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith('workbox-precache') && !KNOWN_CACHES.has(key))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CACHE_PAGES,
    networkTimeoutSeconds: 2,
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
);

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style'),
  new StaleWhileRevalidate({
    cacheName: CACHE_ASSETS,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_IMAGES,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

setCatchHandler(async ({ event }) => {
  const request = (event as FetchEvent).request;

  // JS/CSS 離線回退：依序嘗試精確比對、忽略 query string（workbox revision key）、precache。
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
    // matchPrecache 可解析 revision-keyed 快取鍵（?__WB_REVISION__=hash）。
    const offline = await matchPrecache('offline.html');
    if (offline) return offline;
    const fallback = await caches.match(
      new URL('offline.html', self.registration.scope).toString(),
      { ignoreSearch: true },
    );
    return fallback ?? Response.error();
  }

  return Response.error();
});

// prompt 模式：由前端 UI 發送 SKIP_WAITING 才切換新 SW，避免版本撕裂。
self.addEventListener('message', (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
