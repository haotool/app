import { useEffect, useState } from 'react';

/**
 * Debounce Hook - Delays value updates until user stops typing
 *
 * Best practice for calculation preview:
 * - 200ms delay balances responsiveness and performance
 * - Trailing debounce: updates AFTER user stops typing
 * - Prevents excessive re-calculations
 *
 * @example
 * const debouncedExpression = useDebounce(expression, 200);
 *
 * useEffect(() => {
 *   // This only runs 200ms after user stops typing
 *   calculatePreview(debouncedExpression);
 * }, [debouncedExpression]);
 */

/**
 * Debounces a value by the specified delay
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 200ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay = 200): T {
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
