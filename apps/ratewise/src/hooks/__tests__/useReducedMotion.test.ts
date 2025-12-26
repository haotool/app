/**
 * useReducedMotion Hook - Unit Tests
 * @file useReducedMotion.test.ts
 * @description 減少動畫偏好 Hook 的單元測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when user prefers motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should return true when user prefers reduced motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('should register change event listener', () => {
    const addEventListenerSpy = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    renderHook(() => useReducedMotion());

    // 確認有註冊 change 事件監聽器
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should cleanup event listener on unmount', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
      writable: true,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
