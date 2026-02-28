import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncMapTileCacheConfig, TILE_CACHE_CONFIG_MESSAGE } from '../mapTileCache';

describe('syncMapTileCacheConfig', () => {
  const originalServiceWorker = navigator.serviceWorker;

  afterEach(() => {
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: originalServiceWorker,
      });
    } else {
      Reflect.deleteProperty(navigator, 'serviceWorker');
    }
    vi.restoreAllMocks();
  });

  it('應該在 service worker 不可用時直接返回', async () => {
    Reflect.deleteProperty(navigator, 'serviceWorker');

    await expect(syncMapTileCacheConfig(7)).resolves.toBeUndefined();
  });

  it('應該優先使用 controller 發送快取設定', async () => {
    const postMessage = vi.fn();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: { postMessage },
        ready: Promise.resolve({
          active: { postMessage: vi.fn() },
          waiting: null,
          installing: null,
        }),
      },
    });

    await syncMapTileCacheConfig(14);

    expect(postMessage).toHaveBeenCalledWith({
      type: TILE_CACHE_CONFIG_MESSAGE,
      cacheDurationDays: 14,
    });
  });

  it('應該在沒有 controller 時回退到 registration.active', async () => {
    const postMessage = vi.fn();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: null,
        ready: Promise.resolve({
          active: { postMessage },
          waiting: null,
          installing: null,
        }),
      },
    });

    await syncMapTileCacheConfig(3);

    expect(postMessage).toHaveBeenCalledWith({
      type: TILE_CACHE_CONFIG_MESSAGE,
      cacheDurationDays: 3,
    });
  });

  it('應該在 ready 失敗時記錄警告而非拋錯', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: null,
        ready: Promise.reject(new Error('sw unavailable')),
      },
    });

    await expect(syncMapTileCacheConfig(10)).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      'Unable to sync tile cache config with service worker:',
      expect.any(Error),
    );
  });
});
