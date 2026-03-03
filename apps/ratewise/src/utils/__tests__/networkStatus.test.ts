/**
 * Network Status Detection Tests
 *
 * 測試混合式離線偵測策略：
 * 1. navigator.onLine API（基本檢查）
 * 2. probe 路徑實際探測（避免快取誤判）
 * 3. 混合式檢測邏輯
 *
 * @created 2026-02-08
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkOnlineStatus, checkNetworkConnectivity, isOnline } from '../networkStatus';

describe('🔴 RED: Network Status Detection', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('https://app.haotool.org/ratewise/'),
    });

    // Reset fetch mock
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  describe('checkOnlineStatus - Basic navigator.onLine Check', () => {
    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(checkOnlineStatus()).toBe(false);
    });

    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(checkOnlineStatus()).toBe(true);
    });
  });

  describe('checkNetworkConnectivity - Real Network Request Verification', () => {
    it('should return true when fetch succeeds with ok status', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      const result = await checkNetworkConnectivity();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify probe asset + cache busting query parameter exist
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as
        | string
        | undefined;
      expect(fetchCall).toBeDefined();
      expect(fetchCall).toContain('__network_probe__');
      expect(fetchCall).toMatch(/\?t=\d+/);
      expect(fetchCall).not.toContain('/ratewise/manifest.webmanifest');
    });

    it('should return false when fetch fails with network error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const result = await checkNetworkConnectivity();
      expect(result).toBe(false);
    });

    it('should return false when fetch resolves with non-ok status', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response),
      );

      const result = await checkNetworkConnectivity();
      expect(result).toBe(false);
    });

    it('should use GET request on probe endpoint', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      await checkNetworkConnectivity();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('__network_probe__'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'same-origin',
        }),
      );
    });

    it('should treat missing probe resource as offline only when fetch rejects', async () => {
      global.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));

      const result = await checkNetworkConnectivity();

      expect(result).toBe(false);
    });

    it('should use cache: no-store to bypass cache', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      await checkNetworkConnectivity();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: 'no-store',
        }),
      );
    });

    it('should handle timeout with custom timeout value', async () => {
      // Mock fetch that handles abort signal
      global.fetch = vi.fn(
        (_url, options) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = (options as { signal?: AbortSignal })?.signal;
            signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          }),
      ) as typeof fetch;

      // 使用較短的超時時間（100ms）來快速測試
      const result = await checkNetworkConnectivity(100);
      expect(result).toBe(false);
    });

    it('should skip active probe on localhost to avoid stale service worker noise', async () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: new URL('http://127.0.0.1:4173/ratewise/'),
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      const result = await checkNetworkConnectivity();

      expect(result).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('isOnline - Hybrid Detection Logic', () => {
    it('should return false immediately when navigator.onLine is false', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      const result = await isOnline();
      expect(result).toBe(false);
      // Should not make network request if navigator.onLine is false
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should verify network connectivity when navigator.onLine is true', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      const result = await isOnline();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return false when navigator.onLine is true but network request fails', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const result = await isOnline();
      expect(result).toBe(false);
    });
  });
});
