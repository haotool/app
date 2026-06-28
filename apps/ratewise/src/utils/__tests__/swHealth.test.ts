/**
 * swHealth 健康偵測與關鍵修復傳播測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LEGACY_PRECACHE_BLOAT_THRESHOLD,
  evaluateSwShellHealth,
  isActiveServiceWorkerBroken,
  propagateCriticalSwFixIfBroken,
  probeActiveSwShellHealth,
} from '../swHealth';

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../swUtils', () => ({
  forceServiceWorkerUpdate: vi.fn().mockResolvedValue(true),
}));

import { forceServiceWorkerUpdate } from '../swUtils';

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    writable: true,
    configurable: true,
    value,
  });
}

function setController(postMessageImpl: (msg: unknown, transfer?: unknown) => void) {
  Object.defineProperty(window.navigator.serviceWorker, 'controller', {
    writable: true,
    configurable: true,
    value: { postMessage: postMessageImpl },
  });
}

describe('swHealth', () => {
  beforeEach(() => {
    setOnline(true);
    sessionStorage.clear();
    Object.defineProperty(window.navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        controller: null,
        getRegistration: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateSwShellHealth', () => {
    it('index.html 缺失 → broken', () => {
      expect(
        evaluateSwShellHealth({
          probeTimedOut: false,
          hasIndexShell: false,
          precacheEntryCount: 10,
        }).broken,
      ).toBe(true);
    });

    it('probe 逾時 → broken', () => {
      expect(
        evaluateSwShellHealth({
          probeTimedOut: true,
          hasIndexShell: false,
          precacheEntryCount: 0,
        }).reason,
      ).toBe('probe-timeout');
    });

    it('legacy precache 膨脹 → broken', () => {
      expect(
        evaluateSwShellHealth({
          probeTimedOut: false,
          hasIndexShell: true,
          precacheEntryCount: LEGACY_PRECACHE_BLOAT_THRESHOLD + 1,
        }).reason,
      ).toBe('legacy-precache-bloat');
    });

    it('shell 與 precache 規模正常 → healthy', () => {
      expect(
        evaluateSwShellHealth({
          probeTimedOut: false,
          hasIndexShell: true,
          precacheEntryCount: 92,
        }),
      ).toEqual({ broken: false, reason: 'ok' });
    });
  });

  describe('probeActiveSwShellHealth', () => {
    it('收到 SW 回覆時解析 hasIndexShell 與 precacheEntryCount', async () => {
      setController((_msg, transfer) => {
        (transfer as MessagePort[])?.[0]?.postMessage({
          type: 'SHELL_PRECACHE_STATUS',
          healthy: true,
          hasIndexShell: true,
          precacheEntryCount: 92,
        });
      });

      const probe = await probeActiveSwShellHealth();
      expect(probe).toEqual({
        probeTimedOut: false,
        hasIndexShell: true,
        precacheEntryCount: 92,
      });
    });
  });

  describe('propagateCriticalSwFixIfBroken', () => {
    it('健康 SW 不觸發 forceServiceWorkerUpdate', async () => {
      const updateStub = vi.fn().mockResolvedValue(undefined);
      window.navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue({
        waiting: null,
        update: updateStub,
      });
      setController((_msg, transfer) => {
        (transfer as MessagePort[])?.[0]?.postMessage({
          type: 'SHELL_PRECACHE_STATUS',
          healthy: true,
          hasIndexShell: true,
          precacheEntryCount: 92,
        });
      });

      const result = await propagateCriticalSwFixIfBroken();

      expect(result).toBe('healthy');
      expect(forceServiceWorkerUpdate).not.toHaveBeenCalled();
    });

    it('壞 SW 且已有 waiting → 自動 SKIP_WAITING 流程', async () => {
      const waiting = { postMessage: vi.fn() };
      const updateStub = vi.fn().mockResolvedValue(undefined);
      window.navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue({
        waiting,
        update: updateStub,
      });
      setController((_msg, transfer) => {
        (transfer as MessagePort[])?.[0]?.postMessage({
          type: 'SHELL_PRECACHE_STATUS',
          healthy: false,
          hasIndexShell: false,
          precacheEntryCount: 428,
        });
      });

      const result = await propagateCriticalSwFixIfBroken();

      expect(result).toBe('applied');
      expect(updateStub).toHaveBeenCalledOnce();
      expect(forceServiceWorkerUpdate).toHaveBeenCalledOnce();
    });

    it('離線時略過', async () => {
      setOnline(false);
      const result = await propagateCriticalSwFixIfBroken();
      expect(result).toBe('skipped');
    });
  });

  describe('isActiveServiceWorkerBroken', () => {
    it('無 controller 時回傳 false', async () => {
      expect(await isActiveServiceWorkerBroken()).toBe(false);
    });
  });
});
