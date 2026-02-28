export const TILE_CACHE_CONFIG_MESSAGE = 'park-keeper:tile-cache-config';

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
