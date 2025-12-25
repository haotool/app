/**
 * useDecemberTheme Hook - Unit Tests
 * @file useDecemberTheme.test.ts
 * @description 12 月主題 Hook 的單元測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDecemberTheme } from '../useDecemberTheme';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('useDecemberTheme', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should detect December correctly', () => {
    // 設定為 12 月
    vi.setSystemTime(new Date(2025, 11, 25)); // December 25, 2025

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.isDecember).toBe(true);
    expect(result.current.currentYear).toBe(2025);
  });

  it('should not detect December in other months', () => {
    // 設定為 6 月
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.isDecember).toBe(false);
  });

  it('should show animations in December when not disabled', () => {
    vi.setSystemTime(new Date(2025, 11, 25));
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.showAnimations).toBe(true);
    expect(result.current.isDisabledByUser).toBe(false);
  });

  it('should not show animations when user disabled', () => {
    vi.setSystemTime(new Date(2025, 11, 25));
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.showAnimations).toBe(false);
    expect(result.current.isDisabledByUser).toBe(true);
  });

  it('should have toggleTheme function that saves to localStorage', () => {
    vi.setSystemTime(new Date(2025, 11, 25));

    const { result } = renderHook(() => useDecemberTheme());

    // 初始狀態
    expect(result.current.isDisabledByUser).toBe(false);
    expect(typeof result.current.toggleTheme).toBe('function');

    // 調用 toggleTheme 應該更新 localStorage
    act(() => {
      result.current.toggleTheme();
    });

    // 驗證 localStorage 被調用
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ratewise-december-theme-disabled',
      'true',
    );
  });

  it('should read disabled state from localStorage', () => {
    vi.setSystemTime(new Date(2025, 11, 25));
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.isDisabledByUser).toBe(true);
    expect(result.current.showAnimations).toBe(false);
  });

  it('should return correct year', () => {
    vi.setSystemTime(new Date(2030, 11, 25));

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.currentYear).toBe(2030);
  });
});
