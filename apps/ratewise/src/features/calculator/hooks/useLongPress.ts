import { useRef, useCallback, useEffect } from 'react';

/**
 * Long Press Hook - iOS-style accelerated deletion (極速版)
 *
 * Features:
 * - Initial delay: 400ms (更快觸發，保持防誤觸)
 * - Acceleration: 80ms → 40ms → 20ms → 10ms (極速四段加速)
 * - Memory safe: cleans up timers on unmount
 *
 * @example
 * const longPressProps = useLongPress({
 *   onLongPress: handleDelete,
 *   onClick: handleSingleDelete,
 * });
 *
 * <button {...longPressProps}>Delete</button>
 */

interface UseLongPressOptions {
  /** Callback triggered repeatedly during long press */
  onLongPress: () => void;
  /** Callback for single click (optional) */
  onClick?: () => void;
  /** Initial delay before long press activates (default: 400ms) */
  threshold?: number;
}

export function useLongPress({ onLongPress, onClick, threshold = 400 }: UseLongPressOptions) {
  const isLongPress = useRef(false);
  const initialTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteCountRef = useRef(0);

  const start = useCallback(() => {
    isLongPress.current = false;
    deleteCountRef.current = 0;

    // Initial delay (400ms) prevents accidental long press
    initialTimerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
      deleteCountRef.current++;

      // Start accelerated deletion (極速四段加速)
      const acceleratedDelete = () => {
        // Calculate interval based on delete count
        // 1-3: 80ms, 4-6: 40ms, 7-10: 20ms, 11+: 10ms (極速版)
        let interval = 80;
        if (deleteCountRef.current > 10) interval = 10;
        else if (deleteCountRef.current > 6) interval = 20;
        else if (deleteCountRef.current > 3) interval = 40;

        deleteIntervalRef.current = setTimeout(() => {
          onLongPress();
          deleteCountRef.current++;
          acceleratedDelete(); // Recursive call for continuous deletion
        }, interval);
      };

      acceleratedDelete();
    }, threshold);
  }, [onLongPress, threshold]);

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
