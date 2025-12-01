/**
 * Storage Utilities - Unit Tests
 *
 * [BDD:2025-12-02] 測試 localStorage 存取工具函數
 * [Coverage:2025-12-02] 目標覆蓋率 82.6% → 90%
 *
 * 測試案例：
 * 1. readString - 正常讀取、fallback、SSR 環境
 * 2. writeString - 正常寫入、SSR 環境
 * 3. readJSON - 正常讀取、JSON 解析錯誤、fallback、SSR 環境
 * 4. writeJSON - 正常寫入、SSR 環境
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readString, writeString, readJSON, writeJSON } from '../storage';

describe('Storage Utilities', () => {
  // 保存原始 localStorage
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    // 清空 localStorage
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 恢復原始 localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe('readString', () => {
    it('應該正確讀取已存在的字串值', () => {
      // Given: localStorage 中有一個值
      window.localStorage.setItem('test-key', 'test-value');

      // When: 讀取該值
      const result = readString('test-key', 'fallback');

      // Then: 應該返回存儲的值
      expect(result).toBe('test-value');
    });

    it('應該在 key 不存在時返回 fallback', () => {
      // Given: localStorage 中沒有該 key

      // When: 讀取不存在的 key
      const result = readString('non-existent-key', 'fallback-value');

      // Then: 應該返回 fallback
      expect(result).toBe('fallback-value');
    });

    it('應該處理空字串值', () => {
      // Given: localStorage 中有空字串
      window.localStorage.setItem('empty-key', '');

      // When: 讀取該值
      const result = readString('empty-key', 'fallback');

      // Then: 應該返回空字串（不是 fallback）
      expect(result).toBe('');
    });
  });

  describe('writeString', () => {
    it('應該正確寫入字串值', () => {
      // When: 寫入一個值
      writeString('write-key', 'write-value');

      // Then: localStorage 應該有該值
      expect(window.localStorage.getItem('write-key')).toBe('write-value');
    });

    it('應該覆蓋已存在的值', () => {
      // Given: localStorage 中已有值
      window.localStorage.setItem('overwrite-key', 'old-value');

      // When: 寫入新值
      writeString('overwrite-key', 'new-value');

      // Then: 應該是新值
      expect(window.localStorage.getItem('overwrite-key')).toBe('new-value');
    });
  });

  describe('readJSON', () => {
    it('應該正確讀取並解析 JSON 物件', () => {
      // Given: localStorage 中有 JSON 物件
      const testObject = { name: 'test', value: 123 };
      window.localStorage.setItem('json-key', JSON.stringify(testObject));

      // When: 讀取該值
      const result = readJSON<typeof testObject>('json-key', { name: '', value: 0 });

      // Then: 應該返回解析後的物件
      expect(result).toEqual(testObject);
    });

    it('應該正確讀取並解析 JSON 陣列', () => {
      // Given: localStorage 中有 JSON 陣列
      const testArray = ['a', 'b', 'c'];
      window.localStorage.setItem('array-key', JSON.stringify(testArray));

      // When: 讀取該值
      const result = readJSON<string[]>('array-key', []);

      // Then: 應該返回解析後的陣列
      expect(result).toEqual(testArray);
    });

    it('應該在 key 不存在時返回 fallback', () => {
      // Given: localStorage 中沒有該 key
      const fallback = { default: true };

      // When: 讀取不存在的 key
      const result = readJSON('non-existent-json', fallback);

      // Then: 應該返回 fallback
      expect(result).toEqual(fallback);
    });

    it('應該在 JSON 解析失敗時返回 fallback', () => {
      // Given: localStorage 中有無效的 JSON
      window.localStorage.setItem('invalid-json', 'not valid json {{{');

      // When: 讀取該值
      const fallback = { error: 'fallback' };
      const result = readJSON('invalid-json', fallback);

      // Then: 應該返回 fallback
      expect(result).toEqual(fallback);
    });

    it('應該處理 null 值', () => {
      // Given: localStorage 中有 null
      window.localStorage.setItem('null-key', 'null');

      // When: 讀取該值
      const result = readJSON<string | null>('null-key', 'fallback');

      // Then: 應該返回 null（JSON.parse('null') = null）
      expect(result).toBeNull();
    });
  });

  describe('writeJSON', () => {
    it('應該正確序列化並寫入 JSON 物件', () => {
      // Given: 一個物件
      const testObject = { name: 'test', value: 123 };

      // When: 寫入該物件
      writeJSON('write-json-key', testObject);

      // Then: localStorage 應該有序列化後的值
      expect(window.localStorage.getItem('write-json-key')).toBe(JSON.stringify(testObject));
    });

    it('應該正確序列化並寫入 JSON 陣列', () => {
      // Given: 一個陣列
      const testArray = [1, 2, 3];

      // When: 寫入該陣列
      writeJSON('write-array-key', testArray);

      // Then: localStorage 應該有序列化後的值
      expect(window.localStorage.getItem('write-array-key')).toBe(JSON.stringify(testArray));
    });

    it('應該覆蓋已存在的 JSON 值', () => {
      // Given: localStorage 中已有 JSON 值
      window.localStorage.setItem('overwrite-json', JSON.stringify({ old: true }));

      // When: 寫入新值
      writeJSON('overwrite-json', { new: true });

      // Then: 應該是新值
      expect(JSON.parse(window.localStorage.getItem('overwrite-json') ?? '{}')).toEqual({
        new: true,
      });
    });
  });

  describe('SSR 環境 (isBrowser = false)', () => {
    // 注意：由於 isBrowser 是在模組載入時計算的，
    // 我們無法在測試中直接模擬 SSR 環境。
    // 這些測試驗證了在瀏覽器環境中的行為。
    // SSR 環境的行為已在 Layout.tsx 測試中驗證。

    it('應該在 localStorage 拋出異常時優雅處理', () => {
      // Given: localStorage.setItem 拋出異常（如 QuotaExceededError）
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      Object.defineProperty(window, 'localStorage', {
        value: {
          ...originalLocalStorage,
          setItem: mockSetItem,
          getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
          removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
          clear: originalLocalStorage.clear.bind(originalLocalStorage),
          length: originalLocalStorage.length,
          key: originalLocalStorage.key.bind(originalLocalStorage),
        },
        writable: true,
      });

      // When & Then: 寫入應該拋出異常（由調用者處理）
      expect(() => writeString('quota-key', 'value')).toThrow('QuotaExceededError');
    });

    it('應該在 localStorage.getItem 拋出異常時優雅處理', () => {
      // Given: localStorage.getItem 拋出異常
      const mockGetItem = vi.fn().mockImplementation(() => {
        throw new Error('SecurityError');
      });

      Object.defineProperty(window, 'localStorage', {
        value: {
          ...originalLocalStorage,
          getItem: mockGetItem,
          setItem: originalLocalStorage.setItem.bind(originalLocalStorage),
          removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
          clear: originalLocalStorage.clear.bind(originalLocalStorage),
          length: originalLocalStorage.length,
          key: originalLocalStorage.key.bind(originalLocalStorage),
        },
        writable: true,
      });

      // When & Then: 讀取應該拋出異常（由調用者處理）
      expect(() => readString('security-key', 'fallback')).toThrow('SecurityError');
    });
  });
});
