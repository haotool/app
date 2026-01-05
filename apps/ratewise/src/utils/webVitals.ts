/**
 * Core Web Vitals reporting
 * [context7:googlechrome/web-vitals:2026-01-06T01:22:11+08:00]
 *
 * Reports LCP, INP, CLS to console and optionally to analytics endpoint
 */
import { onCLS, onINP, onLCP } from 'web-vitals/attribution';
import { onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from './logger';
import { reportWebVitals, sendToAnalytics } from './reportWebVitals';
import { getVsiRating, VSI_GOOD_THRESHOLD } from './vsi';
import { INP_LONG_TASK_THRESHOLD_MS, isLongInteraction } from './interactionBudget';

/**
 * Initialize Core Web Vitals monitoring
 */
export function initWebVitals() {
  try {
    // Core Web Vitals (affect Google ranking)
    onLCP(reportWebVitals); // Largest Contentful Paint

    // Additional metrics (diagnostics)
    onFCP(reportWebVitals); // First Contentful Paint
    onTTFB(reportWebVitals); // Time to First Byte

    onCLS(
      (metric: Metric) => {
        reportWebVitals(metric);

        const rating = getVsiRating(metric.value);
        if (import.meta.env.DEV && metric.value > VSI_GOOD_THRESHOLD) {
          logger.warn('VSI exceeds target', { value: metric.value, rating });
        }

        if (import.meta.env.MODE === 'production') {
          sendToAnalytics({
            name: 'VSI',
            value: metric.value,
            rating,
            delta: metric.delta,
            id: metric.id,
          });
        }
      },
      { reportAllChanges: true },
    ); // Cumulative Layout Shift + VSI

    onINP(
      (metric: Metric) => {
        reportWebVitals(metric);

        if (isLongInteraction(metric.value)) {
          logger.warn('INP slow interaction detected', {
            value: metric.value,
            threshold: INP_LONG_TASK_THRESHOLD_MS,
          });
        }
      },
      { reportAllChanges: true, durationThreshold: INP_LONG_TASK_THRESHOLD_MS },
    ); // Interaction to Next Paint (replaces FID) + budget

    logger.info('Web Vitals monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize Web Vitals', error as Error);
  }
}

/**
 * Thresholds for reference
 * LCP: good < 2.5s, poor > 4s
 * INP: good < 200ms, poor > 500ms
 * CLS: good < 0.1, poor > 0.25
 */
