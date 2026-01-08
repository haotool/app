/**
 * @file reportWebVitals.test.ts
 * @description Tests for reportWebVitals utility
 * @created 2026-01-08T23:21:49+08:00
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Metric } from 'web-vitals';

// Mock import.meta.env
vi.stubEnv('DEV', false);
vi.stubEnv('MODE', 'test');
vi.stubEnv('VITE_VITALS_ENDPOINT', '');

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Import after mocking
import { formatMetric, sendToAnalytics, reportWebVitals } from '../reportWebVitals';
import { logger } from '../logger';

// Get mocked functions with proper types - use binding to avoid unbound-method lint error
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockLoggerInfo = vi.mocked(logger.info);

describe('reportWebVitals', () => {
  const mockMetric: Metric = {
    name: 'LCP',
    value: 1500,
    rating: 'good',
    delta: 100,
    id: 'test-id-123',
    entries: [],
    navigationType: 'navigate',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    vi.stubEnv('DEV', false);
    vi.stubEnv('MODE', 'test');
    vi.stubEnv('VITE_VITALS_ENDPOINT', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('formatMetric', () => {
    it('should convert Metric to VitalsReport format', () => {
      const result = formatMetric(mockMetric);

      expect(result).toEqual({
        name: 'LCP',
        value: 1500,
        rating: 'good',
        delta: 100,
        id: 'test-id-123',
      });
    });

    it('should handle different ratings', () => {
      const poorMetric: Metric = {
        ...mockMetric,
        rating: 'poor',
        value: 5000,
      };

      const result = formatMetric(poorMetric);
      expect(result.rating).toBe('poor');
      expect(result.value).toBe(5000);
    });

    it('should handle needs-improvement rating', () => {
      const needsImprovementMetric: Metric = {
        ...mockMetric,
        rating: 'needs-improvement',
        value: 2800,
      };

      const result = formatMetric(needsImprovementMetric);
      expect(result.rating).toBe('needs-improvement');
    });
  });

  describe('sendToAnalytics', () => {
    it('should not send when no endpoint is configured', () => {
      vi.stubEnv('VITE_VITALS_ENDPOINT', '');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());

      const report = formatMetric(mockMetric);
      sendToAnalytics(report);

      // Should return early without calling fetch
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should use sendBeacon when available', () => {
      vi.stubEnv('VITE_VITALS_ENDPOINT', 'https://analytics.example.com/vitals');

      // Mock sendBeacon on navigator
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        value: mockSendBeacon,
        writable: true,
        configurable: true,
      });

      const report = formatMetric(mockMetric);
      sendToAnalytics(report);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        'https://analytics.example.com/vitals',
        JSON.stringify(report),
      );
    });

    it('should fallback to fetch when sendBeacon is not available', () => {
      vi.stubEnv('VITE_VITALS_ENDPOINT', 'https://analytics.example.com/vitals');

      // Save original sendBeacon
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalSendBeacon = navigator.sendBeacon;

      // Delete sendBeacon to test fallback
      // @ts-expect-error - deliberately deleting for test
      delete (navigator as unknown as Record<string, unknown>).sendBeacon;

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());

      const report = formatMetric(mockMetric);
      sendToAnalytics(report);

      expect(fetchSpy).toHaveBeenCalledWith('https://analytics.example.com/vitals', {
        method: 'POST',
        body: JSON.stringify(report),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });

      // Restore sendBeacon for other tests
      Object.defineProperty(navigator, 'sendBeacon', {
        value: originalSendBeacon,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('reportWebVitals', () => {
    it('should log in development mode with good rating emoji', () => {
      vi.stubEnv('DEV', true);

      reportWebVitals(mockMetric);

      expect(mockLoggerInfo).toHaveBeenCalledWith('✅ Web Vital: LCP', {
        value: 1500,
        rating: 'good',
      });
    });

    it('should log with warning emoji for needs-improvement', () => {
      vi.stubEnv('DEV', true);

      const needsImprovementMetric: Metric = {
        ...mockMetric,
        rating: 'needs-improvement',
        value: 2800,
      };

      reportWebVitals(needsImprovementMetric);

      expect(mockLoggerInfo).toHaveBeenCalledWith('⚠️ Web Vital: LCP', {
        value: 2800,
        rating: 'needs-improvement',
      });
    });

    it('should log with error emoji for poor rating', () => {
      vi.stubEnv('DEV', true);

      const poorMetric: Metric = {
        ...mockMetric,
        rating: 'poor',
        value: 5000,
      };

      reportWebVitals(poorMetric);

      expect(mockLoggerInfo).toHaveBeenCalledWith('❌ Web Vital: LCP', {
        value: 5000,
        rating: 'poor',
      });
    });

    it('should not log in production mode', () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('MODE', 'production');

      reportWebVitals(mockMetric);

      expect(mockLoggerInfo).not.toHaveBeenCalled();
    });

    it('should send to analytics in production mode', () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_VITALS_ENDPOINT', 'https://analytics.example.com/vitals');

      // Mock sendBeacon on navigator
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        value: mockSendBeacon,
        writable: true,
        configurable: true,
      });

      reportWebVitals(mockMetric);

      expect(mockSendBeacon).toHaveBeenCalled();
    });
  });
});
