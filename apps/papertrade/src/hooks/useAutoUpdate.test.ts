import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegisterSWOptions, UseRegisterSWReturn } from '../__mocks__/pwa-register-react';
import {
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_TOAST_FLAG_KEY,
  useAutoUpdate,
  VISIBILITY_CHECK_THROTTLE_MS,
} from './useAutoUpdate';
import { useTradeStore } from '../stores/tradeStore';
import { createInitialAccount } from '../engine/engine';

const mocks = vi.hoisted(() => ({
  updateServiceWorker: vi.fn(() => Promise.resolve()),
  options: undefined as RegisterSWOptions | undefined,
  setNeedRefresh: undefined as ((value: boolean) => void) | undefined,
}));

vi.mock('virtual:pwa-register/react', async () => {
  const { useEffect, useState } = await import('react');
  function useRegisterSW(options?: RegisterSWOptions): UseRegisterSWReturn {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    useEffect(() => {
      mocks.options = options;
      mocks.setNeedRefresh = setNeedRefresh;
    }, [options]);
    return {
      needRefresh: [needRefresh, setNeedRefresh],
      offlineReady: [offlineReady, setOfflineReady],
      updateServiceWorker: mocks.updateServiceWorker,
    };
  }
  return { useRegisterSW };
});

class FakeServiceWorkerContainer extends EventTarget {
  controller: object | null = null;
}

function stubServiceWorker(container: FakeServiceWorkerContainer) {
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: container,
    configurable: true,
  });
}

function toastTitles(): string[] {
  return useTradeStore.getState().toasts.map((toast) => toast.title);
}

const originalLocation = window.location;
const reload = vi.fn();

describe('useAutoUpdate', () => {
  beforeEach(() => {
    mocks.updateServiceWorker.mockClear();
    mocks.options = undefined;
    reload.mockClear();
    sessionStorage.clear();
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    Reflect.deleteProperty(window.navigator, 'serviceWorker');
  });

  it('auto-sends the update request when a waiting SW is detected', () => {
    renderHook(() => useAutoUpdate());
    expect(mocks.updateServiceWorker).not.toHaveBeenCalled();

    act(() => {
      mocks.setNeedRefresh?.(true);
    });
    expect(mocks.updateServiceWorker).toHaveBeenCalledOnce();
  });

  it('suppresses the library default reload so controllerchange stays the single reload owner', () => {
    renderHook(() => useAutoUpdate());
    expect(mocks.options?.onNeedReload).toBeTypeOf('function');
    // 呼叫不得觸發導航：reload 權責唯一屬 controllerchange 監聽。
    mocks.options?.onNeedReload?.();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads exactly once on controllerchange and sets the update flag', () => {
    const container = new FakeServiceWorkerContainer();
    container.controller = {};
    stubServiceWorker(container);
    renderHook(() => useAutoUpdate());

    act(() => {
      container.dispatchEvent(new Event('controllerchange'));
      container.dispatchEvent(new Event('controllerchange'));
    });

    expect(reload).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem(UPDATE_TOAST_FLAG_KEY)).toBe('1');
  });

  it('skips reload for the first-install takeover, then reloads on a real update', () => {
    const container = new FakeServiceWorkerContainer();
    container.controller = null;
    stubServiceWorker(container);
    renderHook(() => useAutoUpdate());

    act(() => {
      container.dispatchEvent(new Event('controllerchange'));
    });
    expect(reload).not.toHaveBeenCalled();

    act(() => {
      container.dispatchEvent(new Event('controllerchange'));
    });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('polls registration.update on the hourly interval', () => {
    vi.useFakeTimers();
    const update = vi.fn(() => Promise.resolve());
    renderHook(() => useAutoUpdate());
    act(() => {
      mocks.options?.onRegisteredSW?.('sw.js', { update } as unknown as ServiceWorkerRegistration);
    });

    act(() => {
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS - 1000);
    });
    expect(update).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(update).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
    });
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('throttles the foreground visibility check to once per five minutes', () => {
    vi.useFakeTimers();
    const update = vi.fn(() => Promise.resolve());
    renderHook(() => useAutoUpdate());
    act(() => {
      mocks.options?.onRegisteredSW?.('sw.js', { update } as unknown as ServiceWorkerRegistration);
    });

    act(() => {
      vi.advanceTimersByTime(VISIBILITY_CHECK_THROTTLE_MS - 1000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(update).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(update).toHaveBeenCalledOnce();
  });

  it('shows the updated toast once and consumes the flag', () => {
    sessionStorage.setItem(UPDATE_TOAST_FLAG_KEY, '1');
    const first = renderHook(() => useAutoUpdate());

    expect(toastTitles()).toContain('已更新至新版本');
    expect(sessionStorage.getItem(UPDATE_TOAST_FLAG_KEY)).toBeNull();

    first.unmount();
    useTradeStore.setState({ toasts: [] });
    renderHook(() => useAutoUpdate());
    expect(toastTitles()).toHaveLength(0);
  });

  it('surfaces the offline-ready notice through the toast system', () => {
    renderHook(() => useAutoUpdate());
    act(() => mocks.options?.onOfflineReady?.());
    expect(toastTitles()).toContain('離線就緒');
  });
});
