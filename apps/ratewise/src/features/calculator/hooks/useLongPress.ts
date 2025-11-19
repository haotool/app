import { useRef, useCallback, useEffect } from 'react';

/**
 * Long Press Hook - iOS Calculator Standard
 *
 * Features:
 * - Initial delay: 500ms (iOS 標準，防誤觸)
 * - Fixed interval: 100ms (iOS Calculator 固定間隔)
 * - Memory safe: cleans up timers on unmount
 *
 * @see Web Research 2025-11-19 - iOS backspace: 0.5s initial, 0.1s interval
 *
 * @example
 * const longPressProps = useLongPress({
 *   onLongPress: handleDelete,
 *   onClick: handleSingleDelete,
 *   threshold: 500
 * });
 *
 * <button {...longPressProps}>Delete</button>
 */

interface UseLongPressOptions {
  /** Callback triggered repeatedly during long press */
  onLongPress: () => void;
  /** Callback for single click (optional) */
  onClick?: () => void;
  /** Initial delay before long press activates (default: 500ms) */
  threshold?: number;
  /** Repeat interval after threshold (default: 100ms) */
  interval?: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  interval = 100,
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

      // Start fixed interval deletion (iOS 標準：100ms 固定間隔)
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

    // If short press, execute onClick
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

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
