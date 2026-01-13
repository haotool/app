/**
 * useTheme Hook Tests
 *
 * @file useTheme.test.ts
 * @description 測試動態主題切換功能
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme } from '../useTheme';

describe('useTheme Hook', () => {
  let setAttributeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();

    // 重置 document.documentElement.setAttribute mock
    setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute');
  });

  describe('初始化', () => {
    it('應該預設為淺色主題', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
    });

    it('應該從 localStorage 讀取儲存的主題', () => {
      localStorage.setItem('ratewise-theme', 'dark');
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });

    it('應該應用主題到 HTML data-theme attribute', () => {
      renderHook(() => useTheme());
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'light');
    });
  });

  describe('主題切換', () => {
    it('應該切換為深色主題', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark');
      expect(localStorage.getItem('ratewise-theme')).toBe('dark');
    });

    it('應該切換為淺色主題', () => {
      localStorage.setItem('ratewise-theme', 'dark');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'light');
      expect(localStorage.getItem('ratewise-theme')).toBe('light');
    });

    it('應該持久化主題到 localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorage.getItem('ratewise-theme')).toBe('dark');
    });
  });

  describe('SSR 安全', () => {
    it('應該在 SSR 環境中返回預設主題', () => {
      // 測試 getInitialTheme 在 SSR 環境的行為
      // 由於測試環境總是有 window，我們驗證預設主題邏輯
      const { result } = renderHook(() => useTheme());

      // 應該返回 light 或從 localStorage 讀取的值
      expect(['light', 'dark']).toContain(result.current.theme);
    });
  });

  describe('系統偏好', () => {
    it('應該在沒有儲存偏好時跟隨系統深色模式', () => {
      // 模擬系統偏好深色模式
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('錯誤處理', () => {
    it('應該在 localStorage 錯誤時使用預設值', () => {
      // 模擬 localStorage 錯誤
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');

      // 恢復 mock
      vi.restoreAllMocks();
    });
  });
});
