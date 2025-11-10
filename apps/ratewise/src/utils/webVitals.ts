/**
 * Core Web Vitals reporting
 * [context7:googlechrome/web-vitals:2025-11-10T03:15:00+08:00]
 * [context7:getsentry/sentry-javascript:2025-11-10T03:15:00+08:00]
 *
 * Reports LCP, INP, CLS to console and optionally to analytics endpoint
 * 整合 Sentry Performance Monitoring 和 Google Analytics
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
 * Send Web Vitals to Google Analytics
 * [context7:googlechrome/web-vitals:2025-11-10T03:15:00+08:00]
 */
function sendToGoogleAnalytics(metric: Metric) {
  // 僅在生產環境且 gtag 已初始化時上傳
  if (import.meta.env.PROD && typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.delta), // 使用 delta 進行聚合
      event_label: metric.id,
      non_interaction: true,
      // 額外參數
      metric_value: Math.round(metric.value),
      metric_rating: metric.rating,
    });
  }
}

/**
 * Send Web Vitals to Sentry Performance Monitoring
 * [context7:getsentry/sentry-javascript:2025-11-10T03:15:00+08:00]
 */
function sendToSentry(metric: Metric) {
  // 僅在生產環境且 Sentry 已初始化時上傳
  if (import.meta.env.PROD && typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.setMeasurement(metric.name, metric.value, 'millisecond');

    // 若效能不佳，額外記錄為 breadcrumb
    if (metric.rating === 'poor') {
      window.Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `Poor ${metric.name} detected`,
        level: 'warning',
        data: {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        },
      });
    }
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

  // 生產環境多管道上傳
  if (import.meta.env.MODE === 'production') {
    sendToAnalytics(report); // 自訂 analytics endpoint
    sendToGoogleAnalytics(metric); // Google Analytics
    sendToSentry(metric); // Sentry Performance
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
