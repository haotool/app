/**
 * useStoredState Hook Tests
 *
 * [2025-12-29] 建立
 * 參考: [context7:/vitest-dev/vitest:testing-react:2025-12-29]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoredString, useStoredJSON, useStoredStringReadOnly } from '../useStoredState';

// Mock storage functions
vi.mock('../../storage', () => ({
  readString: vi.fn((key: string, defaultValue: string) => {
    const stored = localStorage.getItem(key);
    return stored ?? defaultValue;
  }),
  writeString: vi.fn((key: string, value: string) => {
    localStorage.setItem(key, value);
  }),
  readJSON: vi.fn(<T,>(key: string, defaultValue: T): T => {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  }),
  writeJSON: vi.fn(<T,>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  }),
}));

describe('useStoredState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('useStoredString', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useStoredString('test-key', 'default'));

      expect(result.current[0]).toBe('default');
    });

    it('should restore value from localStorage after hydration', async () => {
      localStorage.setItem('test-key', 'stored-value');

      const { result } = renderHook(() => useStoredString('test-key', 'default'));

      // 在測試環境中 useEffect 會同步執行，所以值已經被恢復
      // 在真實的 SSR/CSR hydration 中，初始值會是 default
      await vi.waitFor(() => {
        expect(result.current[0]).toBe('stored-value');
      });
    });

    it('should persist value changes to localStorage', () => {
      const { result } = renderHook(() => useStoredString<string>('test-key', 'default'));

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(localStorage.getItem('test-key')).toBe('new-value');
    });

    it('should apply sanitization function', async () => {
      localStorage.setItem('test-key', 'UPPERCASE');

      const sanitize = (value: string) => value.toLowerCase();
      const { result } = renderHook(() => useStoredString('test-key', 'default', sanitize));

      await vi.waitFor(() => {
        expect(result.current[0]).toBe('uppercase');
      });
    });

    it('should not update if stored value equals default', () => {
      localStorage.setItem('test-key', 'default');

      const { result } = renderHook(() => useStoredString('test-key', 'default'));

      // 應該保持 default，不觸發額外的 setState
      expect(result.current[0]).toBe('default');
    });
  });

  describe('useStoredJSON', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useStoredJSON('test-key', { count: 0 }));

      expect(result.current[0]).toEqual({ count: 0 });
    });

    it('should restore JSON value from localStorage after hydration', async () => {
      localStorage.setItem('test-key', JSON.stringify({ count: 42 }));

      const { result } = renderHook(() => useStoredJSON('test-key', { count: 0 }));

      await vi.waitFor(() => {
        expect(result.current[0]).toEqual({ count: 42 });
      });
    });

    it('should persist JSON value changes to localStorage', () => {
      const { result } = renderHook(() => useStoredJSON('test-key', { count: 0 }));

      act(() => {
        result.current[1]({ count: 100 });
      });

      expect(result.current[0]).toEqual({ count: 100 });
      expect(JSON.parse(localStorage.getItem('test-key') ?? '{}')).toEqual({ count: 100 });
    });

    it('should apply sanitization function', async () => {
      localStorage.setItem('test-key', JSON.stringify([1, 2, 3, 4, 5]));

      const sanitize = (arr: number[]) => arr.filter((n) => n > 2);
      const { result } = renderHook(() => useStoredJSON<number[]>('test-key', [], sanitize));

      await vi.waitFor(() => {
        expect(result.current[0]).toEqual([3, 4, 5]);
      });
    });

    it('should skip persistence when skipPersistIf returns true', () => {
      const skipPersistIf = (value: number[]) => value.length === 0;
      const { result } = renderHook(() =>
        useStoredJSON<number[]>('test-key', [], undefined, skipPersistIf),
      );

      // 空陣列不應該被持久化
      expect(localStorage.getItem('test-key')).toBeNull();

      act(() => {
        result.current[1]([1, 2, 3]);
      });

      // 非空陣列應該被持久化
      expect(JSON.parse(localStorage.getItem('test-key') ?? '[]')).toEqual([1, 2, 3]);
    });
  });

  describe('useStoredStringReadOnly', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useStoredStringReadOnly('test-key', 'default'));

      expect(result.current).toBe('default');
    });

    it('should restore value from localStorage', async () => {
      localStorage.setItem('test-key', 'stored-value');

      const { result } = renderHook(() => useStoredStringReadOnly('test-key', 'default'));

      await vi.waitFor(() => {
        expect(result.current).toBe('stored-value');
      });
    });

    it('should not persist changes (read-only)', () => {
      const { result, rerender } = renderHook(() =>
        useStoredStringReadOnly('test-key', 'default'),
      );

      // 這個 hook 不提供 setter，所以無法直接修改值
      expect(result.current).toBe('default');

      // 模擬外部修改 localStorage
      localStorage.setItem('test-key', 'external-change');

      // 重新渲染不會自動更新（因為 key 沒變）
      rerender();
      expect(result.current).toBe('default');
    });
  });
});
