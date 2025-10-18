// Service Worker - 手動建立
// 參考: https://developer.chrome.com/docs/workbox/

const CACHE_NAME = 'ratewise-v1';
const RUNTIME_CACHE = 'ratewise-runtime-v1';

// 預快取資源
const PRECACHE_URLS = ['/', '/index.html', '/manifest.webmanifest'];

// 安裝事件 - 預快取核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// 啟用事件 - 清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch 事件 - Runtime caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CDN 歷史匯率數據 - CacheFirst with NetworkFallback
  if (
    (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'raw.githubusercontent.com') &&
    url.pathname.includes('/rates/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // 如果 CDN 失敗，返回快取（即使過期）
              return cached || new Response('Network error', { status: 408 });
            })
        );
      }),
    );
    return;
  }

  // API 請求 - NetworkFirst
  if (url.hostname === 'api.frankfurter.app') {
    event.respondWith(
      fetch(request, { timeout: 10000 })
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Google Fonts - CacheFirst
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
        );
      }),
    );
    return;
  }

  // 其他請求 - Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
      return cached || fetchPromise;
    }),
  );
});
