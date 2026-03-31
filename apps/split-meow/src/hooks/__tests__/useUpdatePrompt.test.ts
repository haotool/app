import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 注入可控制的 pwa-register mock 狀態
let mockNeedRefresh = false;
let mockOfflineReady = false;
const mockUpdateServiceWorker = vi.fn();
const mockOnRegistered = vi.fn();

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options?: {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (r: ServiceWorkerRegistration | undefined) => void;
  }) => {
    if (options?.onNeedRefresh && mockNeedRefresh) options.onNeedRefresh();
    if (options?.onOfflineReady && mockOfflineReady) options.onOfflineReady();
    if (options?.onRegistered) mockOnRegistered.mockImplementation(options.onRegistered);

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

describe('useUpdatePrompt', () => {
  beforeEach(() => {
    mockNeedRefresh = false;
    mockOfflineReady = false;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('exposes needRefresh and offlineReady state', () => {
    mockNeedRefresh = true;
    mockOfflineReady = false;
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.needRefresh).toBe(true);
    expect(result.current.offlineReady).toBe(false);
  });
});
