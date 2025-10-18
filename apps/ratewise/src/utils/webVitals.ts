/**
 * Core Web Vitals reporting
 * [context7:web-vitals:2025-10-18T02:00:00+08:00]
 *
 * Reports LCP, INP, CLS to console and optionally to analytics endpoint
 */
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from './logger';

interface VitalsReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Convert web-vitals Metric to our report format
 */
function formatMetric(metric: Metric): VitalsReport {
  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  };
}

/**
 * Send vitals to analytics endpoint (if configured)
 */
function sendToAnalytics(report: VitalsReport) {
  const endpoint = import.meta.env.VITE_VITALS_ENDPOINT;

  if (!endpoint) {
    return; // No endpoint configured, skip
  }

  // Use sendBeacon for reliability (survives page unload)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon(endpoint, JSON.stringify(report));
  } else {
    // Fallback to fetch (non-blocking)
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(report),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch((error) => {
      logger.warn('Failed to send vitals', { error });
    });
  }
}

/**
 * Log and optionally send vitals
 */
function reportVital(metric: Metric) {
  const report = formatMetric(metric);

  // Always log to console in dev
  if (import.meta.env.DEV) {
    const emoji =
      report.rating === 'good' ? '✅' : report.rating === 'needs-improvement' ? '⚠️' : '❌';
    logger.info(`${emoji} Web Vital: ${report.name}`, {
      value: Math.round(report.value),
      rating: report.rating,
    });
  }

  // Send to analytics in production
  if (import.meta.env.MODE === 'production') {
    sendToAnalytics(report);
  }
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initWebVitals() {
  try {
    // Core Web Vitals (affect Google ranking)
    onLCP(reportVital); // Largest Contentful Paint
    onINP(reportVital); // Interaction to Next Paint (replaces FID)
    onCLS(reportVital); // Cumulative Layout Shift

    // Additional metrics (diagnostics)
    onFCP(reportVital); // First Contentful Paint
    onTTFB(reportVital); // Time to First Byte

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
