import { useRef, useCallback, useEffect } from 'react';

/**
 * Long Press Hook - iOS-style accelerated deletion
 *
 * Features:
 * - Initial delay: 500ms (prevents accidental triggers)
 * - Acceleration: 100ms → 50ms → 25ms
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
  /** Initial delay before long press activates (default: 500ms) */
  threshold?: number;
}

export function useLongPress({ onLongPress, onClick, threshold = 500 }: UseLongPressOptions) {
  const isLongPress = useRef(false);
  const initialTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteCountRef = useRef(0);

  const start = useCallback(() => {
    isLongPress.current = false;
    deleteCountRef.current = 0;

    // Initial delay (500ms) prevents accidental long press
    initialTimerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
      deleteCountRef.current++;

      // Start accelerated deletion
      const acceleratedDelete = () => {
        // Calculate interval based on delete count
        // 0-5: 100ms, 6-10: 50ms, 11+: 25ms (iOS-style)
        let interval = 100;
        if (deleteCountRef.current > 10) interval = 25;
        else if (deleteCountRef.current > 5) interval = 50;

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
