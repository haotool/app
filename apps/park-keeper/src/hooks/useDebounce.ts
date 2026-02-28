import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 *
 * 防抖 Hook，用於延遲更新值直到輸入停止一段時間
 *
 * @template T - 值的類型
 * @param value - 要進行防抖的值
 * @param delay - 防抖延遲時間（毫秒），預設 300ms
 * @returns 防抖後的值
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // 只有在使用者停止輸入 500ms 後才執行搜尋
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 *
 * 最佳實踐：
 * - 用於自動儲存、即時搜尋等需要減少 API 呼叫的場景
 * - 通常搭配 useEffect 使用
 * - 預設延遲 300ms 是業界標準，提供良好的使用者體驗與效能平衡
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 設定定時器，延遲更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清除定時器：當 value 或 delay 改變，或組件卸載時
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
