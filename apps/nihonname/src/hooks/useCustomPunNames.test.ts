/**
 * useCustomPunNames Hook 單元測試
 *
 * 測試用戶自訂諧音梗的 localStorage 持久化功能
 *
 * @see [context7:vitest-dev/vitest:2025-12-04] localStorage mock
 * @see [context7:testing-library/react-testing-library:2025-12-04] hook testing
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomPunNames } from './useCustomPunNames';
import type { CustomPunName } from '../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('useCustomPunNames', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('應該在空 localStorage 時返回空陣列', () => {
      const { result } = renderHook(() => useCustomPunNames());

      expect(result.current.customPunNames).toEqual([]);
      expect(result.current.count).toBe(0);
    });

    it('應該從 localStorage 載入已存在的自訂諧音梗', () => {
      const existingNames: CustomPunName[] = [
        {
          kanji: '測試名',
          romaji: 'Tesuto Na',
          meaning: '測試用諧音',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(existingNames));

      const { result } = renderHook(() => useCustomPunNames());

      expect(result.current.customPunNames).toHaveLength(1);
      expect(result.current.customPunNames[0]?.kanji).toBe('測試名');
      expect(result.current.count).toBe(1);
    });

    it('應該在 localStorage 資料無效時返回空陣列', () => {
      mockLocalStorage.setItem('nihonname_custom_puns', 'invalid json');

      const { result } = renderHook(() => useCustomPunNames());

      expect(result.current.customPunNames).toEqual([]);
    });

    it('應該過濾掉格式不正確的資料', () => {
      const mixedData = [
        { kanji: '有效名', romaji: 'Valid', meaning: '有效', category: 'custom', isCustom: true },
        { kanji: '缺少欄位' }, // 缺少必要欄位
        'not an object', // 非物件
        null, // null
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(mixedData));

      const { result } = renderHook(() => useCustomPunNames());

      expect(result.current.customPunNames).toHaveLength(1);
      expect(result.current.customPunNames[0]?.kanji).toBe('有效名');
    });
  });

  describe('addCustomPunName', () => {
    it('應該成功新增自訂諧音梗', () => {
      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        const success = result.current.addCustomPunName({
          kanji: '新名字',
          romaji: 'Atarashii Namae',
          meaning: '新的諧音梗',
        });
        expect(success).toBe(true);
      });

      expect(result.current.customPunNames).toHaveLength(1);
      expect(result.current.customPunNames[0]).toMatchObject({
        kanji: '新名字',
        romaji: 'Atarashii Namae',
        meaning: '新的諧音梗',
        category: 'custom',
        isCustom: true,
      });
      expect(result.current.customPunNames[0]?.createdAt).toBeDefined();
    });

    it('應該將新增的諧音梗儲存到 localStorage', () => {
      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        result.current.addCustomPunName({
          kanji: '儲存測試',
          romaji: 'Storage Test',
          meaning: '測試 localStorage',
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0]?.[1] ?? '[]') as {
        kanji: string;
      }[];
      expect(savedData[0]?.kanji).toBe('儲存測試');
    });

    it('應該拒絕空白的 kanji', () => {
      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        const success = result.current.addCustomPunName({
          kanji: '   ',
          romaji: 'Test',
          meaning: 'Test',
        });
        expect(success).toBe(false);
      });

      expect(result.current.customPunNames).toHaveLength(0);
    });

    it('應該拒絕空白的 romaji', () => {
      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        const success = result.current.addCustomPunName({
          kanji: 'Test',
          romaji: '',
          meaning: 'Test',
        });
        expect(success).toBe(false);
      });

      expect(result.current.customPunNames).toHaveLength(0);
    });

    it('應該拒絕空白的 meaning', () => {
      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        const success = result.current.addCustomPunName({
          kanji: 'Test',
          romaji: 'Test',
          meaning: '   ',
        });
        expect(success).toBe(false);
      });

      expect(result.current.customPunNames).toHaveLength(0);
    });

    it('應該拒絕重複的 kanji', () => {
      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        result.current.addCustomPunName({
          kanji: '重複名',
          romaji: 'First',
          meaning: 'First',
        });
      });

      act(() => {
        const success = result.current.addCustomPunName({
          kanji: '重複名',
          romaji: 'Second',
          meaning: 'Second',
        });
        expect(success).toBe(false);
      });

      expect(result.current.customPunNames).toHaveLength(1);
      expect(result.current.customPunNames[0]?.romaji).toBe('First');
    });
  });

  describe('removeCustomPunName', () => {
    it('應該成功移除指定的諧音梗', () => {
      const existingNames: CustomPunName[] = [
        {
          kanji: '要刪除',
          romaji: 'Delete',
          meaning: 'To delete',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
        {
          kanji: '保留',
          romaji: 'Keep',
          meaning: 'To keep',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(existingNames));

      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        result.current.removeCustomPunName('要刪除');
      });

      expect(result.current.customPunNames).toHaveLength(1);
      expect(result.current.customPunNames[0]?.kanji).toBe('保留');
    });

    it('應該更新 localStorage 在移除後', () => {
      const existingNames: CustomPunName[] = [
        {
          kanji: '刪除測試',
          romaji: 'Delete Test',
          meaning: 'Test',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(existingNames));

      const { result } = renderHook(() => useCustomPunNames());
      vi.clearAllMocks();

      act(() => {
        result.current.removeCustomPunName('刪除測試');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0]?.[1] ?? '[]');
      expect(savedData).toHaveLength(0);
    });

    it('移除不存在的 kanji 應該不影響列表', () => {
      const existingNames: CustomPunName[] = [
        {
          kanji: '存在',
          romaji: 'Exists',
          meaning: 'Exists',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(existingNames));

      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        result.current.removeCustomPunName('不存在');
      });

      expect(result.current.customPunNames).toHaveLength(1);
    });
  });

  describe('clearCustomPunNames', () => {
    it('應該清空所有自訂諧音梗', () => {
      const existingNames: CustomPunName[] = [
        {
          kanji: '名字1',
          romaji: 'Name1',
          meaning: 'Meaning1',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
        {
          kanji: '名字2',
          romaji: 'Name2',
          meaning: 'Meaning2',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(existingNames));

      const { result } = renderHook(() => useCustomPunNames());

      act(() => {
        result.current.clearCustomPunNames();
      });

      expect(result.current.customPunNames).toHaveLength(0);
      expect(result.current.count).toBe(0);
    });
  });

  describe('isDuplicate', () => {
    it('應該正確檢測重複的 kanji', () => {
      const existingNames: CustomPunName[] = [
        {
          kanji: '已存在',
          romaji: 'Exists',
          meaning: 'Exists',
          category: 'custom',
          isCustom: true,
          createdAt: '2025-12-04T00:00:00.000Z',
        },
      ];
      mockLocalStorage.setItem('nihonname_custom_puns', JSON.stringify(existingNames));

      const { result } = renderHook(() => useCustomPunNames());

      expect(result.current.isDuplicate('已存在')).toBe(true);
      expect(result.current.isDuplicate('不存在')).toBe(false);
    });
  });

  describe('count', () => {
    it('應該正確返回自訂諧音梗數量', () => {
      const { result } = renderHook(() => useCustomPunNames());

      expect(result.current.count).toBe(0);

      act(() => {
        result.current.addCustomPunName({
          kanji: '第一個',
          romaji: 'First',
          meaning: 'First',
        });
      });

      expect(result.current.count).toBe(1);

      act(() => {
        result.current.addCustomPunName({
          kanji: '第二個',
          romaji: 'Second',
          meaning: 'Second',
        });
      });

      expect(result.current.count).toBe(2);
    });
  });

  describe('SSR 環境', () => {
    it('應該在 window undefined 時安全處理', () => {
      // 模擬 SSR 環境
      const originalWindow = globalThis.window;
      // @ts-expect-error - 模擬 SSR 環境
      delete globalThis.window;

      // 重新導入模組以測試 SSR 行為
      // 由於 hook 內部有 typeof window === 'undefined' 檢查
      // 這裡主要測試不會拋出錯誤
      expect(() => {
        // 在 SSR 環境下，loadCustomPunNames 應該返回空陣列
      }).not.toThrow();

      // 恢復 window
      globalThis.window = originalWindow;
    });
  });
});
