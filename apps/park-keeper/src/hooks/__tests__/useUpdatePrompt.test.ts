import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useUpdatePrompt } from '../useUpdatePrompt';

const mockUpdateServiceWorker = vi.fn();
const mockRegistrationUpdate = vi.fn();

const g = globalThis as Record<string, unknown>;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn((options?: { onRegistered?: (r: unknown) => void }) => {
    // 讓測試可手動觸發 onRegistered
    if (options?.onRegistered) {
      // 暴露觸發函式供測試使用
      (globalThis as Record<string, unknown>)['__triggerOnRegistered'] = options.onRegistered;
    }
    const [needRefresh, setNeedRefresh] = useState(
      (globalThis as Record<string, unknown>)['__mockNeedRefresh'] ?? false,
    );
    const [offlineReady, setOfflineReady] = useState(
      (globalThis as Record<string, unknown>)['__mockOfflineReady'] ?? false,
    );
    return {
      needRefresh: [needRefresh, setNeedRefresh],
      offlineReady: [offlineReady, setOfflineReady],
      updateServiceWorker: mockUpdateServiceWorker,
    };
  }),
}));

describe('useUpdatePrompt', () => {
  beforeEach(() => {
    mockUpdateServiceWorker.mockResolvedValue(undefined);
    mockRegistrationUpdate.mockResolvedValue(undefined);
    g['__mockNeedRefresh'] = false;
    g['__mockOfflineReady'] = false;
    vi.stubGlobal('navigator', { ...navigator, onLine: true });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete g['__mockNeedRefresh'];
    delete g['__mockOfflineReady'];
    delete g['__triggerOnRegistered'];
  });

  it('預設狀態：無更新、無離線就緒、未更新中', () => {
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.needRefresh).toBe(false);
    expect(result.current.offlineReady).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.updateFailed).toBe(false);
  });

  it('handleDismiss 重設所有狀態', () => {
    const { result } = renderHook(() => useUpdatePrompt());
    act(() => {
      result.current.handleDismiss();
    });
    expect(result.current.updateFailed).toBe(false);
  });

  it('onRegistered 觸發後啟動輪詢計時器並呼叫 r.update()', () => {
    renderHook(() => useUpdatePrompt());
    const mockReg = { update: mockRegistrationUpdate };
    act(() => {
      const trigger = g['__triggerOnRegistered'] as ((r: unknown) => void) | undefined;
      trigger?.(mockReg);
    });
    expect(mockRegistrationUpdate).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(60_001);
    });
    expect(mockRegistrationUpdate).toHaveBeenCalledTimes(2);
  });

  it('visibilitychange → 回前景時呼叫 r.update()', () => {
    renderHook(() => useUpdatePrompt());
    const mockReg = { update: mockRegistrationUpdate };
    act(() => {
      const trigger = g['__triggerOnRegistered'] as ((r: unknown) => void) | undefined;
      trigger?.(mockReg);
    });
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(mockRegistrationUpdate.mock.calls.length).toBeGreaterThan(1);
  });

  it('handleUpdate 更新成功時 updateFailed 不變', async () => {
    const { result } = renderHook(() => useUpdatePrompt());
    await act(async () => {
      await result.current.handleUpdate();
    });
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
    expect(result.current.updateFailed).toBe(false);
  });

  it('handleUpdate 更新失敗時 updateFailed = true', async () => {
    mockUpdateServiceWorker.mockRejectedValueOnce(new Error('update fail'));
    const { result } = renderHook(() => useUpdatePrompt());
    await act(async () => {
      await result.current.handleUpdate();
    });
    expect(result.current.updateFailed).toBe(true);
  });

  it('needRefresh + 離線：不觸發 updateServiceWorker', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    g['__mockNeedRefresh'] = true;
    renderHook(() => useUpdatePrompt());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockUpdateServiceWorker).not.toHaveBeenCalled();
  });
});
