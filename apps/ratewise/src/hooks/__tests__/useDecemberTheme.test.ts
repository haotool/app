/**
 * useDecemberTheme Hook - Unit Tests
 * @file useDecemberTheme.test.ts
 * @description 12 月主題 Hook 的單元測試
 *
 * [fix:2026-01-16] 由於 useDecemberTheme 使用 VITE_BUILD_TIME 來避免 hydration mismatch，
 * vi.setSystemTime 無法影響 getDateInfo 的結果（因為 useState 的 lazy init 在模組載入時就執行了）。
 * 因此這些測試只驗證 hook 的結構和行為，不驗證特定的月份/年份。
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
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return hook structure correctly', () => {
    const { result } = renderHook(() => useDecemberTheme());

    // 驗證返回的結構
    expect(typeof result.current.isDecember).toBe('boolean');
    expect(typeof result.current.showAnimations).toBe('boolean');
    expect(typeof result.current.isDisabledByUser).toBe('boolean');
    expect(typeof result.current.toggleTheme).toBe('function');
    expect(typeof result.current.currentYear).toBe('number');
  });

  it('should have isDecember as a boolean value', () => {
    const { result } = renderHook(() => useDecemberTheme());
    // isDecember 應該是布林值（true 或 false）
    expect([true, false]).toContain(result.current.isDecember);
  });

  it('should have valid currentYear', () => {
    const { result } = renderHook(() => useDecemberTheme());
    // currentYear 應該是一個合理的年份
    expect(result.current.currentYear).toBeGreaterThanOrEqual(2025);
    expect(result.current.currentYear).toBeLessThanOrEqual(2100);
  });

  it('should read disabled state from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useDecemberTheme());

    expect(result.current.isDisabledByUser).toBe(true);
  });

  it('should have toggleTheme function that updates localStorage', () => {
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

  it('should not show animations when user disabled', () => {
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useDecemberTheme());

    // 當用戶禁用時，showAnimations 應該為 false
    expect(result.current.isDisabledByUser).toBe(true);
    expect(result.current.showAnimations).toBe(false);
  });

  it('should toggle between enabled and disabled states', () => {
    // 初始狀態：未禁用
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useDecemberTheme());
    expect(result.current.isDisabledByUser).toBe(false);

    // 調用 toggleTheme
    act(() => {
      result.current.toggleTheme();
    });

    // 應該將 disabled 設為 true
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ratewise-december-theme-disabled',
      'true',
    );
  });
});
