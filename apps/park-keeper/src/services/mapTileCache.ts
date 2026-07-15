import { clampCacheDays } from '@app/park-keeper/constants';

export const TILE_CACHE_CONFIG_MESSAGE = 'park-keeper:tile-cache-config';

// SW 天數設定持久化：獨立 Cache bucket 存 JSON，冷啟/更新先讀回，杜絕重設為預設值。
// bucket 名稱不可與 tile cache 前綴（park-keeper-map-tiles）重疊，避免被 bucket 同步刪除。
const TILE_CONFIG_CACHE_NAME = 'park-keeper-tile-config';
const TILE_CONFIG_REQUEST_PATH = '/__park_keeper_tile_config__';

const getTileConfigRequest = () =>
  new Request(`${globalThis.location.origin}${TILE_CONFIG_REQUEST_PATH}`);

export async function persistTileCacheDays(days: number): Promise<void> {
  try {
    const cache = await caches.open(TILE_CONFIG_CACHE_NAME);
    await cache.put(
      getTileConfigRequest(),
      new Response(JSON.stringify({ cacheDurationDays: days }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
  } catch {
    // 持久化失敗不阻斷 SW 運作，下次冷啟回退預設值。
  }
}

export async function readPersistedTileCacheDays(): Promise<number | null> {
  try {
    const cache = await caches.open(TILE_CONFIG_CACHE_NAME);
    const response = await cache.match(getTileConfigRequest());
    if (!response) return null;
    const data = (await response.json()) as { cacheDurationDays?: number };
    return typeof data.cacheDurationDays === 'number'
      ? clampCacheDays(data.cacheDurationDays)
      : null;
  } catch {
    return null;
  }
}

export async function syncMapTileCacheConfig(cacheDurationDays: number): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const activeWorker =
      navigator.serviceWorker.controller ??
      registration.active ??
      registration.waiting ??
      registration.installing;

    activeWorker?.postMessage({
      type: TILE_CACHE_CONFIG_MESSAGE,
      cacheDurationDays,
    });
  } catch (error) {
    console.warn('Unable to sync tile cache config with service worker:', error);
  }
}
