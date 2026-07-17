import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 注入可控制的 pwa-register mock 狀態
let mockNeedRefresh = false;
let mockOfflineReady = false;
const mockUpdateServiceWorker = vi.fn();
const mockOnRegistered = vi.fn();

const MOCK_SW_URL = 'https://example.test/split-meow/sw.js';
const mockRegistration = {
  update: vi.fn(() => Promise.resolve()),
  installing: null as ServiceWorker | null,
};

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options?: {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (r: ServiceWorkerRegistration | undefined) => void;
    onRegisteredSW?: (swUrl: string, r: ServiceWorkerRegistration | undefined) => void;
  }) => {
    if (options?.onNeedRefresh && mockNeedRefresh) options.onNeedRefresh();
    if (options?.onOfflineReady && mockOfflineReady) options.onOfflineReady();
    if (options?.onRegistered) mockOnRegistered.mockImplementation(options.onRegistered);
    options?.onRegisteredSW?.(
      MOCK_SW_URL,
      mockRegistration as unknown as ServiceWorkerRegistration,
    );

    const setNeedRefresh = vi.fn((val: boolean) => {
      mockNeedRefresh = val;
    });
    const setOfflineReady = vi.fn((val: boolean) => {
      mockOfflineReady = val;
    });

    return {
      needRefresh: [mockNeedRefresh, setNeedRefresh],
      offlineReady: [mockOfflineReady, setOfflineReady],
      updateServiceWorker: mockUpdateServiceWorker,
    };
  },
}));

import { useUpdatePrompt } from '../useUpdatePrompt';

const mockFetch = vi.fn(() => Promise.resolve({ status: 200 }));

describe('useUpdatePrompt', () => {
  beforeEach(() => {
    mockNeedRefresh = false;
    mockOfflineReady = false;
    vi.clearAllMocks();
    mockFetch.mockImplementation(() => Promise.resolve({ status: 200 }));
    vi.stubGlobal('fetch', mockFetch);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('initially visible is false when no refresh or offline-ready', () => {
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.visible).toBe(false);
  });

  it('visible is true when needRefresh is true', () => {
    mockNeedRefresh = true;
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.visible).toBe(true);
  });

  it('visible is true when offlineReady is true', () => {
    mockOfflineReady = true;
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.visible).toBe(true);
  });

  it('handleDismiss hides the prompt', () => {
    mockNeedRefresh = true;
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.visible).toBe(true);
    act(() => {
      result.current.handleDismiss();
    });
    expect(result.current.visible).toBe(false);
  });

  it('dismissed offline-ready prompt should reappear when a new update becomes available', () => {
    mockOfflineReady = true;
    const { result, rerender } = renderHook(() => useUpdatePrompt());

    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.handleDismiss();
    });

    expect(result.current.visible).toBe(false);

    mockOfflineReady = false;
    mockNeedRefresh = true;
    rerender();

    expect(result.current.needRefresh).toBe(true);
    expect(result.current.visible).toBe(true);
  });

  it('handleUpdate calls updateServiceWorker with true', () => {
    mockNeedRefresh = true;
    const { result } = renderHook(() => useUpdatePrompt());
    act(() => {
      result.current.handleUpdate();
    });
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('handleUpdate 掛 controllerchange once 監聽以確保新 SW 接管後重載', () => {
    // workbox-window 對註冊 60 秒後才發現的更新視為 external，不自動 reload，
    // 必須由 handleUpdate 顯式監聽 controllerchange（迴歸防護）。
    const addEventListener = vi.fn();
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { addEventListener },
    });
    mockNeedRefresh = true;
    const { result } = renderHook(() => useUpdatePrompt());
    act(() => {
      result.current.handleUpdate();
    });
    expect(addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function), {
      once: true,
    });
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('exposes needRefresh and offlineReady state', () => {
    mockNeedRefresh = true;
    mockOfflineReady = false;
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.needRefresh).toBe(true);
    expect(result.current.offlineReady).toBe(false);
  });

  // ── 週期與喚回更新檢查 ──────────────────────────────────────────────────────

  describe('週期與喚回更新檢查', () => {
    const dispatchVisible = () => {
      document.dispatchEvent(new Event('visibilitychange'));
    };

    const dispatchPageShow = (persisted: boolean) => {
      const event = new Event('pageshow');
      Object.defineProperty(event, 'persisted', { value: persisted });
      window.dispatchEvent(event);
    };

    it('60 分鐘週期先探測 sw.js 再觸發 registration.update()', async () => {
      renderHook(() => useUpdatePrompt());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      });
      expect(mockFetch).toHaveBeenCalledWith(MOCK_SW_URL, {
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache' },
      });
      expect(mockRegistration.update).toHaveBeenCalledTimes(1);
    });

    it('喚回（visibilitychange→visible）超過節流窗後觸發 update', async () => {
      renderHook(() => useUpdatePrompt());
      await act(async () => {
        vi.advanceTimersByTime(61 * 1000);
        dispatchVisible();
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockRegistration.update).toHaveBeenCalledTimes(1);
    });

    it('節流生效：距上次檢查 <1 分鐘的喚回不觸發 update', async () => {
      renderHook(() => useUpdatePrompt());
      await act(async () => {
        vi.advanceTimersByTime(30 * 1000);
        dispatchVisible();
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockRegistration.update).not.toHaveBeenCalled();

      // 通過節流窗後同一 listener 恢復觸發
      await act(async () => {
        vi.advanceTimersByTime(61 * 1000);
        dispatchVisible();
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockRegistration.update).toHaveBeenCalledTimes(1);
    });

    it('頁面不可見時 visibilitychange 不觸發檢查', async () => {
      const original = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      try {
        renderHook(() => useUpdatePrompt());
        await act(async () => {
          vi.advanceTimersByTime(61 * 1000);
          dispatchVisible();
          await vi.advanceTimersByTimeAsync(0);
        });
        expect(mockRegistration.update).not.toHaveBeenCalled();
      } finally {
        delete (document as { visibilityState?: string }).visibilityState;
        if (original) Object.defineProperty(Document.prototype, 'visibilityState', original);
      }
    });

    it('pageshow persisted（bfcache 復原）觸發 update；非 persisted 不觸發', async () => {
      renderHook(() => useUpdatePrompt());
      await act(async () => {
        vi.advanceTimersByTime(61 * 1000);
        dispatchPageShow(false);
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockRegistration.update).not.toHaveBeenCalled();

      await act(async () => {
        dispatchPageShow(true);
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockRegistration.update).toHaveBeenCalledTimes(1);
    });

    it('sw.js 探測非 200 時跳過 update（避免伺服器異常空轉）', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({ status: 404 }));
      renderHook(() => useUpdatePrompt());
      await act(async () => {
        vi.advanceTimersByTime(61 * 1000);
        dispatchVisible();
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockFetch).toHaveBeenCalled();
      expect(mockRegistration.update).not.toHaveBeenCalled();
    });

    it('cleanup 無洩漏：unmount 後喚回與週期檢查皆不再觸發', async () => {
      const { unmount } = renderHook(() => useUpdatePrompt());
      unmount();
      await act(async () => {
        vi.advanceTimersByTime(61 * 1000);
        dispatchVisible();
        dispatchPageShow(true);
        await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRegistration.update).not.toHaveBeenCalled();
    });
  });
});
