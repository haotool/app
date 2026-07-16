/// <reference lib="webworker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import {
  persistTileCacheDays,
  readPersistedTileCacheDays,
  TILE_CACHE_CONFIG_MESSAGE,
} from './services/mapTileCache';
import { CACHE_DAYS, clampCacheDays } from './constants';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: {
    revision: string | null;
    url: string;
  }[];
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TILE_CACHE_PREFIX = 'park-keeper-map-tiles';
const TILE_METADATA_PATH = '/__park_keeper_tile_meta__';
const TILE_CACHEABLE_STATUSES = [0, 200];
const TILE_PRUNE_INTERVAL_MS = 60 * 1000;
const TILE_CACHE_PATTERNS = [
  /^https:\/\/wmts\.nlsc\.gov\.tw\/wmts\//i,
  /^https:\/\/(?:[a-d]\.)?basemaps\.cartocdn\.com\//i,
];

// null = 本次 SW 生命週期尚未載入持久值；冷啟動先讀回，避免模組變數重設為預設值。
let tileCacheDays: number | null = null;
let lastTilePruneAt = 0;

async function getTileCacheDays(): Promise<number> {
  if (tileCacheDays !== null) return tileCacheDays;
  const persisted = await readPersistedTileCacheDays();
  // TOCTOU 防護：await 期間可能已被 config 訊息寫入，不得以預設值覆寫。
  if (tileCacheDays !== null) return tileCacheDays;
  tileCacheDays = persisted ?? CACHE_DAYS.DEFAULT;
  return tileCacheDays;
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// /about 為唯一真 SSG 內容頁：導覽必須綁定其精確預快取 HTML。
// 若回落 index.html（首頁殼）會使 client 以 /about 樹 hydrate 首頁 HTML，
// 觸發 React 418（issue #725 P0；e2e 因 serviceWorkers block 曾漏攔）。
// Workbox 以 pathname+search 比對，pattern 需容忍任意 querystring。
const ABOUT_NAV_PATTERN = new RegExp(`^${import.meta.env.BASE_URL}about/?(?:\\?.*)?$`);
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${import.meta.env.BASE_URL}about/index.html`), {
    allowlist: [ABOUT_NAV_PATTERN],
  }),
);

const navigationHandler = createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`);
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [
      /^\/api/,
      ABOUT_NAV_PATTERN,
      /\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)$/,
      /\.(?:js|css|json|woff|woff2)$/,
    ],
  }),
);

const isTileRequest = (request: Request) =>
  TILE_CACHE_PATTERNS.some((pattern) => pattern.test(request.url));

const getTileCacheName = (days: number) => `${TILE_CACHE_PREFIX}-${clampCacheDays(days)}d`;
const getTileCacheEntryLimit = (days: number) => 120 + clampCacheDays(days) * 60;

const getMetaRequest = (url: string) =>
  new Request(`${self.location.origin}${TILE_METADATA_PATH}?url=${encodeURIComponent(url)}`);

const isTileMetadataRequest = (request: Request) => request.url.includes(TILE_METADATA_PATH);

async function writeTileMetadata(cache: Cache, requestUrl: string) {
  await cache.put(
    getMetaRequest(requestUrl),
    new Response(JSON.stringify({ cachedAt: Date.now() }), {
      headers: {
        'content-type': 'application/json',
      },
    }),
  );
}

async function readTileMetadata(cache: Cache, requestUrl: string) {
  const metadataResponse = await cache.match(getMetaRequest(requestUrl));
  if (!metadataResponse) return null;

  try {
    const metadata = (await metadataResponse.json()) as { cachedAt?: number };
    return typeof metadata.cachedAt === 'number' ? metadata.cachedAt : null;
  } catch {
    return null;
  }
}

async function deleteTileEntry(cache: Cache, request: Request) {
  await Promise.all([cache.delete(request), cache.delete(getMetaRequest(request.url))]);
}

async function pruneTileCache(days: number, force = false) {
  const now = Date.now();
  if (!force && now - lastTilePruneAt < TILE_PRUNE_INTERVAL_MS) {
    return;
  }

  lastTilePruneAt = now;
  const cache = await caches.open(getTileCacheName(days));
  const requests = await cache.keys();
  const tileRequests = requests.filter((request) => !isTileMetadataRequest(request));
  const maxAgeMs = clampCacheDays(days) * ONE_DAY_MS;
  const entries = await Promise.all(
    tileRequests.map(async (request) => ({
      request,
      cachedAt: await readTileMetadata(cache, request.url),
    })),
  );

  for (const entry of entries) {
    if (entry.cachedAt === null || now - entry.cachedAt > maxAgeMs) {
      await deleteTileEntry(cache, entry.request);
    }
  }

  const remainingEntries = entries
    .filter((entry) => entry.cachedAt !== null && now - (entry.cachedAt ?? 0) <= maxAgeMs)
    .sort((left, right) => (right.cachedAt ?? 0) - (left.cachedAt ?? 0));

  const overflowEntries = remainingEntries.slice(getTileCacheEntryLimit(days));
  for (const entry of overflowEntries) {
    await deleteTileEntry(cache, entry.request);
  }
}

async function syncTileCacheBuckets(days: number) {
  const activeCacheName = getTileCacheName(days);
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(
        (cacheName) => cacheName.startsWith(TILE_CACHE_PREFIX) && cacheName !== activeCacheName,
      )
      .map((cacheName) => caches.delete(cacheName)),
  );

  await pruneTileCache(days, true);
}

async function refreshTileRequest(request: Request, days: number) {
  try {
    const response = await fetch(request);
    if (!TILE_CACHEABLE_STATUSES.includes(response.status) && response.type !== 'opaque') {
      return;
    }

    const cache = await caches.open(getTileCacheName(days));
    await cache.put(request, response.clone());
    await writeTileMetadata(cache, request.url);
    await pruneTileCache(days);
  } catch {
    // Background refresh failure should not break the current map view.
  }
}

registerRoute(
  ({ request }: { request: Request }) => isTileRequest(request),
  async ({ request, event }: { request: Request; event: ExtendableEvent }) => {
    const currentDays = await getTileCacheDays();
    const cacheName = getTileCacheName(currentDays);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedAt = await readTileMetadata(cache, request.url);
      const isExpired = cachedAt === null || Date.now() - cachedAt > currentDays * ONE_DAY_MS;

      if (!isExpired) {
        event.waitUntil(refreshTileRequest(request, currentDays));
        return cachedResponse;
      }
    }

    try {
      const networkResponse = await fetch(request);
      if (
        !TILE_CACHEABLE_STATUSES.includes(networkResponse.status) &&
        networkResponse.type !== 'opaque'
      ) {
        return networkResponse;
      }

      await cache.put(request, networkResponse.clone());
      await writeTileMetadata(cache, request.url);
      event.waitUntil(pruneTileCache(currentDays));
      return networkResponse;
    } catch (error) {
      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    }
  },
);

registerRoute(
  ({ request }: { request: Request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'html-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 })],
  }),
);

registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image' && !isTileRequest(request),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: TILE_CACHEABLE_STATUSES }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

registerRoute(
  ({ request }: { request: Request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: TILE_CACHEABLE_STATUSES }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  }),
);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const persisted = await readPersistedTileCacheDays();
      // 無持久值（既有使用者首次升級）：不得同步/刪任何 bucket，等 client config。
      if (persisted === null) return;
      // 競態防護：config 訊息已寫入時以其值為準。
      if (tileCacheDays === null) tileCacheDays = persisted;
      await syncTileCacheBuckets(tileCacheDays);
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data as { type?: string; cacheDurationDays?: number } | undefined;

  // prompt 更新流程：UpdatePrompt 元件確認後送出 SKIP_WAITING，觸發新 SW 接管並重載。
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
    return;
  }

  if (data?.type !== TILE_CACHE_CONFIG_MESSAGE || typeof data.cacheDurationDays !== 'number') {
    return;
  }

  tileCacheDays = clampCacheDays(data.cacheDurationDays);
  event.waitUntil(
    Promise.all([persistTileCacheDays(tileCacheDays), syncTileCacheBuckets(tileCacheDays)]),
  );
});
