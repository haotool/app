import { useRef, useCallback, useEffect } from 'react';

/**
 * Long Press Hook - iOS Calculator Standard (Optimized)
 *
 * Features:
 * - Initial delay: 500ms (iOS 標準，防誤觸)
 * - Optimized interval: 150ms (人體工學優化，避免過快刪除)
 * - Memory safe: cleans up timers on unmount
 * - Simplified: 移除 onClick 處理，讓組件自己決定（Linus KISS 原則）
 *
 * @see Web Research 2025-11-19 - iOS backspace: 0.5s initial
 * @see Bug Fix 2025-11-20 - 150ms interval 避免點一下刪兩個
 *
 * @example
 * const longPressProps = useLongPress({
 *   onLongPress: handleDelete,
 *   threshold: 500,
 *   interval: 150
 * });
 *
 * <button
 *   {...longPressProps}
 *   onClick={handleSingleClick} // 組件自己處理短按
 * >Delete</button>
 */

interface UseLongPressOptions {
  /** Callback triggered repeatedly during long press */
  onLongPress: () => void;
  /** Initial delay before long press activates (default: 500ms) */
  threshold?: number;
  /** Repeat interval after threshold (default: 150ms，人體工學優化） */
  interval?: number;
}

export function useLongPress({
  onLongPress,
  threshold = 500,
  interval = 150, // 🔧 修復：100ms → 150ms（避免過快）
}: UseLongPressOptions) {
  const isLongPress = useRef(false);
  const initialTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const start = useCallback(() => {
    isLongPress.current = false;

    // Initial delay (iOS 標準：500ms) prevents accidental long press
    initialTimerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();

      // Start optimized interval deletion (150ms 人體工學優化)
      const repeatDelete = () => {
        deleteIntervalRef.current = setTimeout(() => {
          onLongPress();
          repeatDelete(); // Recursive call for continuous deletion
        }, interval);
      };

      repeatDelete();
    }, threshold);
  }, [onLongPress, threshold, interval]);

  const stop = useCallback(() => {
    // Clean up all timers
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
    }
    if (deleteIntervalRef.current) {
      clearTimeout(deleteIntervalRef.current);
    }

    // 🔧 修復：移除 onClick 處理，讓組件自己決定（消除特殊情況）
    // 理由：hook 只專注長按功能，短按由組件的 onClick 處理
  }, []);

  // Clean up on unmount (prevent memory leaks)
  useEffect(() => {
    return () => {
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
      if (deleteIntervalRef.current) clearTimeout(deleteIntervalRef.current);
    };
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}
