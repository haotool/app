/**
 * swUtils 離線防護測試
 *
 * 核心規則：離線狀態下絕不清除 SW 快取，
 * 避免 PWA 離線功能失效。
 *
 * @created 2026-03-07
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearAllServiceWorkerCaches, forceHardReset, performFullRefresh } from '../swUtils';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    writable: true,
    configurable: true,
    value,
  });
}

function mockCaches(cacheNames: string[] = ['precache-v1', 'runtime']) {
  const keysStub = vi.fn().mockResolvedValue(cacheNames);
  const deleteStub = vi.fn().mockResolvedValue(true);

  Object.defineProperty(window, 'caches', {
    writable: true,
    configurable: true,
    value: { keys: keysStub, delete: deleteStub },
  });

  return { keysStub, deleteStub };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('swUtils', () => {
  let reloadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    // default: online
    setOnline(true);

    // default: serviceWorker available but no registration
    Object.defineProperty(window.navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── clearAllServiceWorkerCaches ──────────────────────────────────────────

  describe('clearAllServiceWorkerCaches', () => {
    it('離線時跳過清除並回傳 0', async () => {
      setOnline(false);
      const { keysStub } = mockCaches();

      const result = await clearAllServiceWorkerCaches();

      expect(result).toBe(0);
      expect(keysStub).not.toHaveBeenCalled();
    });

    it('在線時正常清除所有快取並回傳數量', async () => {
      setOnline(true);
      const { keysStub, deleteStub } = mockCaches(['cache-a', 'cache-b']);

      const result = await clearAllServiceWorkerCaches();

      expect(result).toBe(2);
      expect(keysStub).toHaveBeenCalledOnce();
      expect(deleteStub).toHaveBeenCalledTimes(2);
    });

    it('caches API 不存在時直接回傳 0', async () => {
      setOnline(true);
      Object.defineProperty(window, 'caches', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const result = await clearAllServiceWorkerCaches();

      expect(result).toBe(0);
    });
  });

  // ── forceHardReset ────────────────────────────────────────────────────────

  describe('forceHardReset', () => {
    it('離線時不清快取，直接重載', async () => {
      setOnline(false);
      const { deleteStub } = mockCaches();

      await forceHardReset();

      expect(deleteStub).not.toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalledOnce();
    });

    it('在線且無 SW 時清除快取後重載', async () => {
      setOnline(true);
      const { deleteStub } = mockCaches(['precache-v1']);

      await forceHardReset();

      expect(deleteStub).toHaveBeenCalledOnce();
      expect(reloadMock).toHaveBeenCalledOnce();
    });

    it('在線且有 active SW 時傳送 FORCE_HARD_RESET 訊息', async () => {
      setOnline(true);
      mockCaches();

      const postMessage = vi.fn();
      const swInstance = { postMessage, state: 'activated' };

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          getRegistration: vi.fn().mockResolvedValue({ active: swInstance }),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      });

      // Don't await full timeout — just verify postMessage is called
      const promise = forceHardReset();

      // Let microtasks run (getRegistration, postMessage)
      await new Promise((r) => setTimeout(r, 0));

      expect(postMessage).toHaveBeenCalledWith({ type: 'FORCE_HARD_RESET' });

      // Cleanup: resolve via the SW_HARD_RESET_DONE message path or timeout
      // (we don't need to wait for reload in this test)
      promise.catch(() => {}); // prevent unhandled rejection if any
    });
  });

  // ── performFullRefresh ────────────────────────────────────────────────────

  describe('performFullRefresh', () => {
    it('離線時不清快取，直接重載', async () => {
      setOnline(false);
      const { deleteStub } = mockCaches();

      await performFullRefresh();

      expect(deleteStub).not.toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalledOnce();
    });

    it('在線時執行完整重置流程', async () => {
      setOnline(true);
      const { deleteStub } = mockCaches(['precache-v1']);

      await performFullRefresh();

      expect(deleteStub).toHaveBeenCalledOnce();
      expect(reloadMock).toHaveBeenCalledOnce();
    });
  });
});
