/** RateWise Service Worker：離線導覽與快取策略。 */

/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
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

// prompt 模式：新 SW 不主動呼叫 skipWaiting()，等待 UpdatePrompt 發送 SKIP_WAITING 後才接管。
// clientsClaim() 確保啟動後立即控制所有已開啟頁面（首次安裝時適用）。
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

  // 診斷資訊查詢：回傳 SW 狀態與快取清單，供冷啟動偵測器顯示詳情。
  if (data?.type === 'GET_DIAGNOSTICS') {
    event.waitUntil(
      (async () => {
        interface CacheInfo {
          name: string;
          count: number;
        }
        const cacheInfoList: CacheInfo[] = [];
        try {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            cacheInfoList.push({ name, count: keys.length });
          }
        } catch {
          // ignore cache enumeration errors
        }
        const msg = {
          type: 'SW_DIAGNOSTICS',
          data: {
            scope: self.registration?.scope ?? '',
            state: self.registration?.active
              ? 'active'
              : self.registration?.waiting
                ? 'waiting'
                : self.registration?.installing
                  ? 'installing'
                  : 'none',
            caches: cacheInfoList,
          },
        };
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage(msg);
        }
      })(),
    );
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

/**
 * 最終導覽回退 HTML。
 *
 * 當所有快取查找均失敗時，回傳此 HTML 而非 Response.error()。
 * Chrome PWA standalone 模式若收到 Response.error()，
 * 會顯示原生「此連線並不安全」錯誤頁面，完全繞過應用程式 UI。
 */
function buildOfflineFallbackHtml(): string {
  const css = [
    'html,body{margin:0;min-height:100%;background:#f8fafc}',
    'body{display:flex;align-items:center;justify-content:center;',
    'font-family:system-ui,-apple-system,sans-serif;padding:2rem;text-align:center}',
    '.c{max-width:18rem}',
    'h1{font-size:1.125rem;font-weight:700;color:#1e293b;margin:0 0 .5rem}',
    'p{font-size:.875rem;color:#64748b;line-height:1.6;margin:0 0 1.25rem}',
    '.r{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}',
    '.btn{padding:.625rem 1.5rem;border:none;border-radius:9999px;',
    'font-size:.875rem;font-weight:600;cursor:pointer;margin:.125rem}',
    '.p{background:#8B5CF6;color:#fff}',
    '.s{background:transparent;color:#64748b;border:1px solid #cbd5e1;font-size:.8rem}',
    'details{margin-top:.75rem;font-size:.75rem;color:#94a3b8;text-align:left}',
    'summary{cursor:pointer;text-align:center;padding:.25rem;',
    '-webkit-user-select:none;user-select:none}',
    'pre{white-space:pre-wrap;word-break:break-all;background:#f1f5f9;',
    'padding:.75rem;border-radius:.5rem;font-size:.7rem;color:#475569;margin:.5rem 0}',
  ].join('');

  // 診斷腳本（非同步收集 SW / cache 狀態並更新 pre#d）
  const script = [
    '(async function(){',
    'var L=[];',
    'L.push("\\u23f0 "+new Date().toLocaleTimeString("zh-TW"));',
    'L.push("\\ud83c\\udf10 \\u7db2\\u8def: "+(navigator.onLine?"\\u5728\\u7dda":"\\u96e2\\u7dda"));',
    'try{',
    'var r=await navigator.serviceWorker.getRegistration();',
    'L.push("\\u2699\\ufe0f SW: "+(r?(r.active?"active":r.waiting?"waiting":r.installing?"installing":"\\u7121 worker"):"\\u672a\\u8a3b\\u518a"));',
    'if(r)L.push("\\ud83c\\udfae \\u63a7\\u5236: "+(navigator.serviceWorker.controller?"\\u6709":"\\u7121"));',
    '}catch(e){L.push("\\u2699\\ufe0f SW: "+String(e));}',
    'try{',
    'var ks=await caches.keys();var tot=0;var det=[];',
    'for(var i=0;i<ks.length;i++){var c=await caches.open(ks[i]);var en=await c.keys();tot+=en.length;det.push("  "+ks[i].replace("workbox-precache-v2-","pc-").slice(-42)+": "+en.length);}',
    'L.push("\\ud83d\\udce6 \\u5feb\\u53d6: "+ks.length+" \\u500b / "+tot+" \\u9805");',
    'for(var j=0;j<det.length;j++)L.push(det[j]);',
    '}catch(e){L.push("\\ud83d\\udce6 \\u5feb\\u53d6: "+String(e));}',
    'document.getElementById("d").textContent=L.join("\\n");',
    '})();',
    // 清除快取按鈕
    'document.getElementById("cr").addEventListener("click",async function(){',
    'this.disabled=true;this.textContent="\\u6e05\\u9664\\u4e2d\\u2026";',
    'try{var ks=await caches.keys();await Promise.all(ks.map(function(n){return caches.delete(n);}));}catch(e){}',
    'location.reload();',
    '});',
  ].join('');

  return [
    '<!doctype html><html lang="zh-TW"><head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>RateWise \u2014 \u96e2\u7dda</title>',
    `<style>${css}</style>`,
    '</head><body><div class="c">',
    '<p style="font-size:2.5rem;margin:0 0 1rem">\ud83d\udce1</p>',
    '<h1>\u7121\u6cd5\u8f09\u5165\u61c9\u7528\u7a0b\u5f0f</h1>',
    '<p>PWA \u5feb\u53d6\u8cc7\u6e90\u4e0d\u5b8c\u6574\u6216\u5df2\u904e\u671f\uff0c\u8acb\u9023\u7dda\u5f8c\u91cd\u65b0\u958b\u555f\u3002</p>',
    '<div class="r">',
    '<button class="btn p" onclick="location.reload()">\u91cd\u65b0\u8f09\u5165</button>',
    '<button class="btn s" id="cr">\u6e05\u9664\u5feb\u53d6\u4e26\u91cd\u8f09</button>',
    '</div>',
    '<details><summary>\ud83d\udcca \u8a3a\u65b7\u8a73\u60c5</summary>',
    '<pre id="d">\u6536\u96c6\u4e2d\u2026</pre></details>',
    `<script>${script}</` + `script>`,
    '</div></body></html>',
  ].join('\n');
}

// 導覽請求失敗離線回退：runtime cache → precache index.html → offline.html。
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

  // 安全驗證：僅處理同源請求。
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

  // 1) runtime cache 比對。
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

  // 2) precache index.html。
  const indexHtml = await matchPrecache('index.html');
  if (indexHtml) {
    return indexHtml;
  }

  // 3) 完整 URL 比對 index.html。
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

  // 4) precache offline.html。
  const offlineResponse = await matchPrecache('offline.html');
  if (offlineResponse) {
    return offlineResponse;
  }

  // 5) 完整 URL 比對 offline.html。
  try {
    const scope = self.registration?.scope;
    if (!scope || typeof scope !== 'string' || scope.trim() === '') {
      throw new Error('Invalid scope');
    }

    const offlineUrl = new URL('offline.html', scope).href;
    const fallbackResponse = await caches.match(offlineUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
  } catch (error) {
    console.error('[SW] Offline URL construction failed:', error);
  }

  // 最終安全網：回傳內嵌離線提示 HTML，絕不對導覽請求回傳 Response.error()。
  // Chrome PWA standalone 模式若收到 Response.error()，
  // 會顯示原生「此連線並不安全」錯誤頁面，完全繞過應用程式 UI。
  console.warn('[SW] All cache lookups failed; serving inline offline fallback HTML');
  return new Response(buildOfflineFallbackHtml(), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
});

// 導覽請求（HTML）：NetworkFirst，2 秒 timeout 後回落快取。
// request.mode === 'navigate' 為 Workbox 官方建議，較 destination === 'document' 更精確。
registerRoute(
  ({ request }: { request: Request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
      }),
    ],
    networkTimeoutSeconds: 2,
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
