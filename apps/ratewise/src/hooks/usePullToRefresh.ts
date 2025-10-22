import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * usePullToRefresh - Professional pull-to-refresh hook with micro-animations
 *
 * Based on 2025 UX best practices:
 * - Spring-like resistance (exponential dampening)
 * - Visual feedback at 50px threshold
 * - Trigger refresh at 100px threshold
 * - Smooth CSS transitions
 * - Prevents native pull-to-refresh with overscroll-behavior
 * - 只在頁面頂部觸發 (window.scrollY === 0)
 *
 * Fixed: 2025-10-22 - 修正 scrollTop 檢查邏輯，改用 window.scrollY
 *
 * Research sources:
 * - https://www.strictmode.io/articles/react-pull-to-refresh
 * - https://blog.logrocket.com/implementing-pull-to-refresh-react-tailwind-css/
 */

// Configuration constants
const SHOW_INDICATOR_THRESHOLD = 50; // Show visual indicator
const TRIGGER_THRESHOLD = 100; // Trigger refresh callback
const MAX_PULL_DISTANCE = 128; // Maximum pull distance (with tension)
const TENSION_FACTOR = 0.5; // Spring tension coefficient

interface PullToRefreshState {
  pullDistance: number;
  isRefreshing: boolean;
  canTrigger: boolean;
}

/**
 * Apply spring-like tension to pull distance
 * Formula: f(dy) = MAX × (1 - e^(-k × dy / MAX))
 */
function applyTension(distance: number): number {
  if (distance <= 0) return 0;
  return MAX_PULL_DISTANCE * (1 - Math.exp((-TENSION_FACTOR * distance) / MAX_PULL_DISTANCE));
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void> | void,
): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canTrigger, setCanTrigger] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * Touch start handler - Capture initial Y position
     */
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger when scrolled to top of the page
      // Use window.scrollY for global scroll position (not container.scrollTop)
      if (window.scrollY !== 0) return;
      if (isRefreshing) return;

      startY.current = e.touches[0]?.clientY ?? 0;
      currentY.current = startY.current;
      isDragging.current = true;

      // Disable transition during drag
      container.style.transition = 'none';
    };

    /**
     * Touch move handler - Track dragging and apply tension
     */
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return;

      currentY.current = e.touches[0]?.clientY ?? currentY.current;
      const rawDistance = currentY.current - startY.current;

      // Only allow pulling down
      if (rawDistance < 0) {
        setPullDistance(0);
        setCanTrigger(false);
        return;
      }

      // Apply exponential tension
      const tensionDistance = applyTension(rawDistance);
      setPullDistance(tensionDistance);

      // Update trigger state
      setCanTrigger(tensionDistance >= TRIGGER_THRESHOLD);

      // Apply transform
      container.style.transform = `translateY(${tensionDistance / 2}px)`;

      // Prevent default scrolling when pulling
      if (rawDistance > 0) {
        e.preventDefault();
      }
    };

    /**
     * Touch end handler - Trigger refresh if threshold met
     */
    const handleTouchEnd = () => {
      if (!isDragging.current || isRefreshing) return;
      isDragging.current = false;

      // Enable smooth transition back
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';

      if (canTrigger && pullDistance >= TRIGGER_THRESHOLD) {
        // Trigger refresh
        setIsRefreshing(true);
        const finalize = () => {
          setTimeout(() => {
            container.style.transform = 'translateY(0)';
            setPullDistance(0);
            setCanTrigger(false);
            setIsRefreshing(false);
          }, 300);
        };

        void Promise.resolve(onRefresh())
          .catch((error) => {
            console.error('Pull-to-refresh error:', error);
          })
          .finally(finalize);
      } else {
        // Cancel - return to initial position
        container.style.transform = 'translateY(0)';
        setPullDistance(0);
        setCanTrigger(false);
      }
    };

    // Attach event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, onRefresh, isRefreshing, canTrigger, pullDistance]);

  return {
    pullDistance,
    isRefreshing,
    canTrigger: canTrigger && pullDistance >= SHOW_INDICATOR_THRESHOLD,
  };
}

export { SHOW_INDICATOR_THRESHOLD, TRIGGER_THRESHOLD };
