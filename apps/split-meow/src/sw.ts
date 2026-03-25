/// <reference lib="webworker" />
/// <reference types="vite/client" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

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
  if (request.mode === 'navigate') {
    const offline = await caches.match(new URL('offline.html', self.registration.scope).toString());
    return offline ?? Response.error();
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
