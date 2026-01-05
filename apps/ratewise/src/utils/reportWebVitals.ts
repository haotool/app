import type { Metric } from 'web-vitals';
import { logger } from './logger';

export interface VitalsReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Convert web-vitals Metric to our report format
 */
export function formatMetric(metric: Metric): VitalsReport {
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
export function sendToAnalytics(report: VitalsReport) {
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
export function reportWebVitals(metric: Metric) {
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
