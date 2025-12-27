import { useEffect, useRef, useState, type RefObject } from 'react';
import { logger } from '../utils/logger';

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
  options?: { enabled?: boolean },
): PullToRefreshState {
  const isEnabled = options?.enabled ?? true;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canTrigger, setCanTrigger] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isEnabled) return;

    const container = containerRef.current;
    if (!container) return;

    /**
     * Touch start handler - Capture initial Y position
     */
    const handleTouchStart = (e: TouchEvent) => {
      // [fix:2025-12-13] 放寬滾動檢查條件：允許 <=10px 誤差
      // 原本嚴格要求 scrollY === 0，但某些設備可能有 1-2px 誤差
      const currentScrollY = window.scrollY;
      logger.debug('Pull-to-refresh: touchstart', { scrollY: currentScrollY });

      if (currentScrollY > 10) {
        logger.debug('Pull-to-refresh: not at top, ignoring', { scrollY: currentScrollY });
        return;
      }
      if (isRefreshing) {
        logger.debug('Pull-to-refresh: already refreshing, ignoring');
        return;
      }

      logger.info('Pull-to-refresh: starting drag', { scrollY: currentScrollY });
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
      const shouldTrigger = tensionDistance >= TRIGGER_THRESHOLD;
      setCanTrigger(shouldTrigger);

      if (tensionDistance > 0) {
        logger.debug('Pull-to-refresh: dragging', {
          rawDistance,
          tensionDistance,
          canTrigger: shouldTrigger,
        });
      }

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

      logger.info('Pull-to-refresh: touch end', {
        canTrigger,
        pullDistance,
        threshold: TRIGGER_THRESHOLD,
      });

      // Enable smooth transition back
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';

      if (canTrigger && pullDistance >= TRIGGER_THRESHOLD) {
        // Trigger refresh
        logger.info('Pull-to-refresh: threshold met, triggering refresh');
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
            logger.error(
              'Pull-to-refresh error',
              error instanceof Error ? error : new Error(String(error)),
            );
          })
          .finally(finalize);
      } else {
        // Cancel - return to initial position
        logger.info('Pull-to-refresh: threshold not met, canceling');
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
  }, [containerRef, onRefresh, isRefreshing, canTrigger, pullDistance, isEnabled]);

  return {
    pullDistance,
    isRefreshing,
    canTrigger: canTrigger && pullDistance >= SHOW_INDICATOR_THRESHOLD,
  };
}

export { SHOW_INDICATOR_THRESHOLD, TRIGGER_THRESHOLD };
