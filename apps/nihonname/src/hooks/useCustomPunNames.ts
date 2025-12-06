/**
 * 用戶自訂諧音梗 Hook
 *
 * 提供 localStorage 持久化的用戶自訂諧音梗管理功能
 */
import React, { useState, useCallback } from 'react';
import type { CustomPunName, PunName } from '../types';

const STORAGE_KEY = 'nihonname_custom_puns';

/**
 * 從 localStorage 讀取自訂諧音梗
 */
const loadCustomPunNames = (): CustomPunName[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item: unknown): item is CustomPunName => {
      if (typeof item !== 'object' || item === null) return false;
      const obj = item as Record<string, unknown>;
      return (
        typeof obj['kanji'] === 'string' &&
        typeof obj['romaji'] === 'string' &&
        typeof obj['meaning'] === 'string' &&
        obj['isCustom'] === true
      );
    });
  } catch {
    return [];
  }
};

/**
 * 儲存自訂諧音梗到 localStorage
 */
const saveCustomPunNames = (names: CustomPunName[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // 忽略儲存錯誤 (例如 localStorage 已滿)
  }
};

interface UseCustomPunNamesReturn {
  /** 用戶自訂的諧音梗列表 */
  customPunNames: CustomPunName[];
  /** 新增一個自訂諧音梗 */
  addCustomPunName: (name: Omit<PunName, 'category' | 'isCustom'>) => boolean;
  /** 移除一個自訂諧音梗 */
  removeCustomPunName: (kanji: string) => void;
  /** 清空所有自訂諧音梗 */
  clearCustomPunNames: () => void;
  /** 檢查是否已存在 */
  isDuplicate: (kanji: string) => boolean;
  /** 自訂諧音梗數量 */
  count: number;
}

/**
 * 用戶自訂諧音梗 Hook
 *
 * [fix:2025-12-06] 修復 React Hydration Error #418
 * SSG 時 localStorage 不可用，必須在客戶端 useEffect 中載入
 *
 * @example
 * ```tsx
 * const { customPunNames, addCustomPunName, removeCustomPunName } = useCustomPunNames();
 *
 * // 新增自訂諧音梗
 * const success = addCustomPunName({
 *   kanji: '我的名字',
 *   romaji: 'Watashi no Namae',
 *   meaning: '這是我的諧音梗'
 * });
 *
 * // 移除自訂諧音梗
 * removeCustomPunName('我的名字');
 * ```
 */
export const useCustomPunNames = (): UseCustomPunNamesReturn => {
  // [fix:2025-12-06] 初始值必須為空，在 useEffect 中載入 localStorage
  // 避免 SSG/CSR 初始 state 不匹配導致 hydration error
  const [customPunNames, setCustomPunNames] = useState<CustomPunName[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 客戶端載入 localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isLoaded) {
      const stored = loadCustomPunNames();
      setCustomPunNames(stored);
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // 檢查是否重複
  const isDuplicate = useCallback(
    (kanji: string): boolean => {
      return customPunNames.some((name) => name.kanji === kanji);
    },
    [customPunNames],
  );

  // 新增自訂諧音梗
  const addCustomPunName = useCallback(
    (name: Omit<PunName, 'category' | 'isCustom'>): boolean => {
      // 驗證必填欄位
      if (!name.kanji.trim() || !name.romaji.trim() || !name.meaning.trim()) {
        return false;
      }

      // 檢查重複
      if (isDuplicate(name.kanji)) {
        return false;
      }

      const newName: CustomPunName = {
        ...name,
        category: 'custom',
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      const updated = [...customPunNames, newName];
      setCustomPunNames(updated);
      saveCustomPunNames(updated);
      return true;
    },
    [customPunNames, isDuplicate],
  );

  // 移除自訂諧音梗
  const removeCustomPunName = useCallback(
    (kanji: string): void => {
      const updated = customPunNames.filter((name) => name.kanji !== kanji);
      setCustomPunNames(updated);
      saveCustomPunNames(updated);
    },
    [customPunNames],
  );

  // 清空所有自訂諧音梗
  const clearCustomPunNames = useCallback((): void => {
    setCustomPunNames([]);
    saveCustomPunNames([]);
  }, []);

  return {
    customPunNames,
    addCustomPunName,
    removeCustomPunName,
    clearCustomPunNames,
    isDuplicate,
    count: customPunNames.length,
  };
};

export default useCustomPunNames;
