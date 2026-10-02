/**
 * swUtils 離線防護測試
 *
 * 核心規則：離線狀態下絕不清除 SW 快取，
 * 避免 PWA 離線功能失效。
 *
 * @created 2026-03-07
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clearRatewiseRuntimeCaches,
  forceHardReset,
  forceServiceWorkerUpdate,
  performFullRefresh,
  selfHealStaleShellPrecache,
} from '../swUtils';

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

function mockCaches(cacheNames: string[] = ['ratewise-precache-v1', 'ratewise-runtime']) {
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
    vi.stubEnv('BASE_URL', '/ratewise/');
    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock, href: 'https://app.haotool.org/ratewise/' },
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
    vi.unstubAllEnvs();
  });

  // ── clearRatewiseRuntimeCaches ──────────────────────────────────────────

  describe('clearRatewiseRuntimeCaches', () => {
    it('離線時跳過清除並回傳 0', async () => {
      setOnline(false);
      const { keysStub } = mockCaches();

      const result = await clearRatewiseRuntimeCaches();

      expect(result).toBe(0);
      expect(keysStub).not.toHaveBeenCalled();
    });

    it('在線時只清除自身 runtime，保留自己與其他 app 的 precache', async () => {
      setOnline(true);
      const { deleteStub } = mockCaches([
        'ratewise-image-cache',
        'workbox-precache-v2-https://app.haotool.org/ratewise/',
        'workbox-precache-v2-https://app.haotool.org/starpuff/',
      ]);

      const result = await clearRatewiseRuntimeCaches();

      expect(result).toBe(1);
      expect(deleteStub).toHaveBeenCalledExactlyOnceWith('ratewise-image-cache');
      expect(deleteStub).not.toHaveBeenCalledWith(
        'workbox-precache-v2-https://app.haotool.org/starpuff/',
      );
    });

    it('caches API 不存在時直接回傳 0', async () => {
      setOnline(true);
      Object.defineProperty(window, 'caches', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const result = await clearRatewiseRuntimeCaches();

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
      const { deleteStub } = mockCaches(['ratewise-precache-v1']);

      await forceHardReset();

      expect(deleteStub).toHaveBeenCalledOnce();
      expect(reloadMock).toHaveBeenCalledOnce();
    });

    it('hard reset ACK cancels the fallback while reload has not unloaded the page', async () => {
      vi.useFakeTimers();
      try {
        const { deleteStub } = mockCaches();
        const listeners: ((event: MessageEvent) => void)[] = [];
        Object.defineProperty(navigator, 'serviceWorker', {
          configurable: true,
          value: {
            getRegistration: vi.fn().mockResolvedValue({
              scope: 'https://app.haotool.org/ratewise/',
              active: { postMessage: vi.fn() },
            }),
            addEventListener: (_type: string, listener: (event: MessageEvent) => void) =>
              listeners.push(listener),
            removeEventListener: vi.fn(),
          },
        });
        await forceHardReset();
        listeners[0]?.({ data: { type: 'SW_HARD_RESET_DONE_V2' } } as MessageEvent);
        await vi.advanceTimersByTimeAsync(20000);
        expect(reloadMock).toHaveBeenCalledOnce();
        expect(deleteStub).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it.each(['no-ack', 'throw', 'offline'])(
      'missing ACK or postMessage error preserves precache (%s)',
      async (mode) => {
        vi.useFakeTimers();
        try {
          const ownPrecache = 'workbox-precache-v2-https://app.haotool.org/ratewise/';
          const { deleteStub } = mockCaches([ownPrecache, 'ratewise-runtime']);
          const removeEventListener = vi.fn();
          const postMessage = vi.fn(() => {
            if (mode === 'throw') throw new Error('message rejected');
          });
          Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {
              getRegistration: vi.fn().mockResolvedValue({
                scope: 'https://app.haotool.org/ratewise/',
                active: { postMessage },
              }),
              addEventListener: vi.fn(),
              removeEventListener,
            },
          });
          await forceHardReset();
          if (mode === 'offline') setOnline(false);
          await vi.advanceTimersByTimeAsync(20000);
          expect(deleteStub).not.toHaveBeenCalledWith(ownPrecache);
          if (mode === 'offline') expect(deleteStub).not.toHaveBeenCalled();
          else expect(deleteStub).toHaveBeenCalledWith('ratewise-runtime');
          expect(reloadMock).toHaveBeenCalledOnce();
          expect(removeEventListener).toHaveBeenCalledOnce();
        } finally {
          vi.useRealTimers();
        }
      },
    );

    it('parent root registration cannot receive a RateWise hard reset', async () => {
      const postMessage = vi.fn();
      const { deleteStub } = mockCaches();
      const getRegistration = vi
        .fn()
        .mockResolvedValue({ scope: 'https://app.haotool.org/', active: { postMessage } });
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          getRegistration,
          addEventListener,
          removeEventListener: vi.fn(),
        },
      });
      await forceHardReset();
      expect(getRegistration).toHaveBeenCalledExactlyOnceWith('https://app.haotool.org/ratewise/');
      expect(postMessage).not.toHaveBeenCalled();
      expect(deleteStub).toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalledOnce();
    });

    it('在線且有 active SW 時傳送 FORCE_HARD_RESET 訊息', async () => {
      setOnline(true);
      mockCaches();

      const postMessage = vi.fn();
      const addEventListener = vi.fn();
      const swInstance = { postMessage, state: 'activated' };

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          getRegistration: vi
            .fn()
            .mockResolvedValue({ scope: 'https://app.haotool.org/ratewise/', active: swInstance }),
          addEventListener,
          removeEventListener: vi.fn(),
        },
      });

      // Don't await full timeout — just verify postMessage is called
      const promise = forceHardReset();

      // Let microtasks run (getRegistration, postMessage)
      await new Promise((r) => setTimeout(r, 0));

      expect(postMessage).toHaveBeenCalledWith({ type: 'FORCE_HARD_RESET_V2' });

      const listener = addEventListener.mock.calls[0]?.[1] as (event: MessageEvent) => void;
      listener({ data: { type: 'SW_HARD_RESET_DONE' } } as MessageEvent);
      expect(reloadMock).not.toHaveBeenCalled();
      listener({ data: { type: 'SW_HARD_RESET_DONE_V2' } } as MessageEvent);
      await promise;
    });
  });

  // ── forceServiceWorkerUpdate ──────────────────────────────────────────────

  describe('forceServiceWorkerUpdate', () => {
    it('離線且有 waiting SW 時不送 SKIP_WAITING，回傳 false', async () => {
      setOnline(false);
      const postMessage = vi.fn();

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          getRegistration: vi.fn().mockResolvedValue({
            waiting: { postMessage },
            installing: null,
          }),
          addEventListener,
          removeEventListener: vi.fn(),
        },
      });

      const result = await forceServiceWorkerUpdate();

      expect(result).toBe(false);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('離線且無 waiting SW 時不觸發 update()，回傳 false', async () => {
      setOnline(false);
      const updateStub = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          getRegistration: vi.fn().mockResolvedValue({
            waiting: null,
            installing: null,
            update: updateStub,
          }),
          addEventListener,
          removeEventListener: vi.fn(),
        },
      });

      const result = await forceServiceWorkerUpdate();

      expect(result).toBe(false);
      expect(updateStub).not.toHaveBeenCalled();
    });

    it('在線且有 waiting SW 時送出 SKIP_WAITING，回傳 true', async () => {
      setOnline(true);
      const postMessage = vi.fn();
      const addEventListener = vi.fn();

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          addEventListener,
          removeEventListener: vi.fn(),
          getRegistration: vi.fn().mockResolvedValue({
            waiting: { postMessage },
            installing: null,
          }),
        },
      });

      const result = await forceServiceWorkerUpdate();

      expect(result).toBe(true);
      expect(addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function), {
        once: true,
      });
      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('在線且無 waiting SW 時觸發 registration.update()，回傳 true', async () => {
      setOnline(true);
      const updateStub = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          getRegistration: vi.fn().mockResolvedValue({
            waiting: null,
            installing: null,
            update: updateStub,
          }),
          addEventListener,
          removeEventListener: vi.fn(),
        },
      });

      const result = await forceServiceWorkerUpdate();

      expect(result).toBe(true);
      expect(updateStub).toHaveBeenCalledOnce();
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
      const { deleteStub } = mockCaches(['ratewise-precache-v1']);

      await performFullRefresh();

      expect(deleteStub).toHaveBeenCalledOnce();
      expect(reloadMock).toHaveBeenCalledOnce();
    });
  });

  // ── selfHealStaleShellPrecache ───────────────────────────────────────────
  describe('selfHealStaleShellPrecache', () => {
    function setController(controller: unknown) {
      Object.defineProperty(window.navigator.serviceWorker, 'controller', {
        writable: true,
        configurable: true,
        value: controller,
      });
    }

    it('離線時略過，不觸發 update（保留離線快取）', async () => {
      setOnline(false);
      const updateStub = vi.fn().mockResolvedValue(undefined);
      window.navigator.serviceWorker.getRegistration = vi
        .fn()
        .mockResolvedValue({ update: updateStub });
      setController({ postMessage: vi.fn() });

      const result = await selfHealStaleShellPrecache();

      expect(result).toBe('skipped');
      expect(updateStub).not.toHaveBeenCalled();
    });

    it('無 active controller 時略過', async () => {
      setOnline(true);
      const updateStub = vi.fn().mockResolvedValue(undefined);
      window.navigator.serviceWorker.getRegistration = vi
        .fn()
        .mockResolvedValue({ update: updateStub });
      setController(null);

      const result = await selfHealStaleShellPrecache();

      expect(result).toBe('skipped');
      expect(updateStub).not.toHaveBeenCalled();
    });

    it('shell precache 健康時回報 healthy，不觸發 update', async () => {
      setOnline(true);
      const updateStub = vi.fn().mockResolvedValue(undefined);
      window.navigator.serviceWorker.getRegistration = vi
        .fn()
        .mockResolvedValue({ update: updateStub });
      // controller 立即在 transferred port 回覆 healthy:true
      setController({
        postMessage: (_msg: unknown, transfer: MessagePort[]) => {
          const replyPort = transfer[0];
          if (replyPort) {
            replyPort.postMessage({ type: 'SHELL_PRECACHE_STATUS', healthy: true });
          }
        },
      });

      const result = await selfHealStaleShellPrecache();

      expect(result).toBe('healthy');
      expect(updateStub).not.toHaveBeenCalled();
    });

    it('shell precache 不健康（壞 SW 無回覆）→ 委派 swHealth 傳播關鍵修復', async () => {
      vi.useFakeTimers();
      try {
        setOnline(true);
        const updateStub = vi.fn().mockResolvedValue(undefined);
        const waiting = { postMessage: vi.fn() };
        window.navigator.serviceWorker.getRegistration = vi
          .fn()
          .mockResolvedValue({ waiting, update: updateStub });
        setController({ postMessage: vi.fn() });

        const promise = selfHealStaleShellPrecache();
        await vi.advanceTimersByTimeAsync(2100);
        const result = await promise;

        expect(result).toBe('healing');
        expect(updateStub).toHaveBeenCalledOnce();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
