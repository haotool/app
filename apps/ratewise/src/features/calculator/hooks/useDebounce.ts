import { useEffect, useState } from 'react';

/**
 * Debounce Hook - Delays value updates until user stops typing
 *
 * Best practice for calculation preview:
 * - 100ms delay balances responsiveness and performance (優化: 200ms → 100ms)
 * - Trailing debounce: updates AFTER user stops typing
 * - Prevents excessive re-calculations
 * - 效能影響：每秒最多 10 次計算（expr-eval 快速，可接受）
 *
 * Linus 哲學：
 * - ✅ 真實問題：使用者回報 200ms 有延遲感
 * - ✅ 實測優化：100ms 為最佳平衡點（消除延遲感）
 * - ✅ 效能可控：計算成本低，50% 加速無負擔
 *
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - Feature 8
 * @updated 2025-11-18 - 優化延遲時間（200ms → 100ms）
 *
 * @example
 * const debouncedExpression = useDebounce(expression, 100);
 *
 * useEffect(() => {
 *   // This only runs 100ms after user stops typing (faster!)
 *   calculatePreview(debouncedExpression);
 * }, [debouncedExpression]);
 */

/**
 * Debounces a value by the specified delay
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 100ms, 優化自 200ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay = 100): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
