// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetPwaDiagnosticForwardingDedup,
  clearPwaAppReadyMarker,
  flushPwaDiagnosticAnalyticsQueue,
  flushPwaDiagnosticForwarding,
  markPwaAppReady,
  PWA_APP_READY_ATTR,
  PWA_APP_READY_EVENT,
  PWA_DIAGNOSTICS_GA_QUEUE_STORAGE_KEY,
  PWA_DIAGNOSTICS_STORAGE_KEY,
  readPwaDiagnostics,
  recordPwaDiagnostic,
} from '../pwaDiagnostics';

vi.mock('../sentry', () => ({
  initSentry: vi.fn().mockResolvedValue(undefined),
  captureMessage: vi.fn().mockResolvedValue(undefined),
  addBreadcrumb: vi.fn().mockResolvedValue(undefined),
}));

describe('pwaDiagnostics', () => {
  beforeEach(() => {
    localStorage.clear();
    clearPwaAppReadyMarker();
    window.__RATEWISE_PWA_DIAGNOSTICS__ = [];
    __resetPwaDiagnosticForwardingDedup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    vi.unstubAllEnvs();
  });

  it('should persist diagnostic events to localStorage', () => {
    recordPwaDiagnostic('bootstrap-start', { version: '2.22.19' });

    const events = readPwaDiagnostics();
    expect(events).toHaveLength(1);
    expect(events[0]?.phase).toBe('bootstrap-start');
    expect(localStorage.getItem(PWA_DIAGNOSTICS_STORAGE_KEY)).toContain('bootstrap-start');
  });

  it('should mark app ready with DOM signal and event', () => {
    const listener = vi.fn();
    window.addEventListener(PWA_APP_READY_EVENT, listener, { once: true });

    markPwaAppReady();

    expect(document.documentElement.getAttribute(PWA_APP_READY_ATTR)).toBe('true');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(readPwaDiagnostics().at(-1)?.phase).toBe('app-ready');
  });

  it('should not throw when localStorage access is blocked', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Access denied', 'SecurityError');
      },
    });

    expect(() => recordPwaDiagnostic('bootstrap-start', { guarded: true })).not.toThrow();
    expect(readPwaDiagnostics().at(-1)?.phase).toBe('bootstrap-start');

    if (originalDescriptor) {
      Object.defineProperty(window, 'localStorage', originalDescriptor);
    }
  });

  describe('observability forwarding', () => {
    it('should forward error-level events to Sentry captureMessage without raw detail', async () => {
      const sentry = await import('../sentry');
      recordPwaDiagnostic(
        'cold-start-overlay-shown',
        'https://app.haotool.org/ratewise/assets/main.js?email=user@example.com',
        'error',
      );
      await flushPwaDiagnosticForwarding();

      expect(sentry.initSentry).toHaveBeenCalledTimes(1);
      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'PWA diagnostic: cold-start-overlay-shown',
        expect.objectContaining({
          level: 'error',
          tags: { pwa_diagnostic_phase: 'cold-start-overlay-shown' },
        }),
      );
      const captureCall = vi.mocked(sentry.captureMessage).mock.calls.at(0);
      if (!captureCall) throw new Error('captureMessage should be called');
      const sentryOptions = captureCall[1] as {
        extra?: Record<string, unknown>;
      };
      expect(sentryOptions.extra).toEqual(
        expect.objectContaining({
          detailPresent: true,
          detailCategory: 'asset-load',
          detailLength: 'medium',
        }),
      );
      expect(sentryOptions.extra).not.toHaveProperty('detail');
      expect(JSON.stringify(sentryOptions.extra)).not.toContain('user@example.com');
    });

    it('should forward warn-level events to Sentry addBreadcrumb without raw detail', async () => {
      const sentry = await import('../sentry');
      recordPwaDiagnostic('pwa-storage-near-limit', 'storage quota for user@example.com', 'warn');
      await flushPwaDiagnosticForwarding();

      expect(sentry.initSentry).toHaveBeenCalledTimes(1);
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        'pwa:pwa-storage-near-limit',
        expect.objectContaining({
          level: 'warn',
          detailPresent: true,
          detailCategory: 'storage',
          detailLength: 'short',
        }),
      );
      const breadcrumbCall = vi.mocked(sentry.addBreadcrumb).mock.calls.at(0);
      if (!breadcrumbCall) throw new Error('addBreadcrumb should be called');
      const breadcrumbData = breadcrumbCall[1]!;
      expect(breadcrumbData).not.toHaveProperty('detail');
      expect(JSON.stringify(breadcrumbData)).not.toContain('user@example.com');
      expect(sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should NOT forward info-level events (avoid Sentry quota burn)', async () => {
      const sentry = await import('../sentry');
      recordPwaDiagnostic('bootstrap-start', { version: '2.22.20' }, 'info');
      await flushPwaDiagnosticForwarding();

      expect(sentry.captureMessage).not.toHaveBeenCalled();
      expect(sentry.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('should dedup the same phase within 5 seconds', async () => {
      const sentry = await import('../sentry');
      recordPwaDiagnostic('chunk-load-error', 'first', 'error');
      recordPwaDiagnostic('chunk-load-error', 'second', 'error');
      recordPwaDiagnostic('chunk-load-error', 'third', 'error');
      await flushPwaDiagnosticForwarding();

      // Only the first should reach Sentry; subsequent calls are dedup'd.
      expect(sentry.captureMessage).toHaveBeenCalledTimes(1);
    });

    it('should send GA4 pwa_diagnostic event without raw diagnostic detail', () => {
      const gtag = vi.fn();
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = gtag;

      recordPwaDiagnostic(
        'cold-start-script-error',
        'https://app.haotool.org/ratewise/assets/main.js?email=user@example.com',
        'error',
      );

      expect(gtag).toHaveBeenCalledWith(
        'event',
        'pwa_diagnostic',
        expect.objectContaining({
          diagnostic_phase: 'cold-start-script-error',
          diagnostic_level: 'error',
          diagnostic_detail_present: true,
          diagnostic_detail_category: 'asset-load',
          diagnostic_detail_length: 'medium',
        }),
      );
      const gaParams = gtag.mock.calls[0]?.[2] as Record<string, unknown>;
      expect(gaParams).not.toHaveProperty('diagnostic_detail');
      expect(JSON.stringify(gaParams)).not.toContain('user@example.com');
    });

    it('should not throw when gtag is unavailable', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;
      expect(() => recordPwaDiagnostic('chunk-load-error', 'x', 'error')).not.toThrow();
    });

    it('should queue GA4 diagnostics until gtag is initialized', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;

      recordPwaDiagnostic(
        'cold-start-watchdog-timeout',
        'user@example.com network timeout',
        'warn',
      );

      const gtag = vi.fn();
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = gtag;
      flushPwaDiagnosticAnalyticsQueue();

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'pwa_diagnostic',
        expect.objectContaining({
          diagnostic_phase: 'cold-start-watchdog-timeout',
          diagnostic_level: 'warn',
          diagnostic_detail_present: true,
          diagnostic_detail_category: 'network',
          diagnostic_detail_length: 'short',
        }),
      );
      const gaParams = gtag.mock.calls[0]?.[2] as Record<string, unknown>;
      expect(gaParams).not.toHaveProperty('diagnostic_detail');
      expect(JSON.stringify(gaParams)).not.toContain('user@example.com');
    });

    it('should persist queued GA4 diagnostics across recovery reloads', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;

      recordPwaDiagnostic('chunk-load-error', 'user@example.com /assets/main.js', 'error');

      const persistedQueue = localStorage.getItem(PWA_DIAGNOSTICS_GA_QUEUE_STORAGE_KEY);
      expect(persistedQueue).toContain('chunk-load-error');
      expect(persistedQueue).not.toContain('user@example.com');

      const gtag = vi.fn();
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = gtag;
      flushPwaDiagnosticAnalyticsQueue();

      expect(gtag).toHaveBeenCalledWith(
        'event',
        'pwa_diagnostic',
        expect.objectContaining({
          diagnostic_phase: 'chunk-load-error',
          diagnostic_level: 'error',
          diagnostic_detail_category: 'asset-load',
        }),
      );
      expect(localStorage.getItem(PWA_DIAGNOSTICS_GA_QUEUE_STORAGE_KEY)).toBeNull();
    });

    it('should flush in-memory GA4 fallback when storage writes fail', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;

      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function setItem(
        key: string,
        value: string,
      ) {
        if (key === PWA_DIAGNOSTICS_GA_QUEUE_STORAGE_KEY) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        return originalSetItem(key, value);
      });

      try {
        recordPwaDiagnostic('pwa-storage-near-limit', 'storage quota warning', 'warn');

        const gtag = vi.fn();
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = gtag;
        flushPwaDiagnosticAnalyticsQueue();

        expect(gtag).toHaveBeenCalledWith(
          'event',
          'pwa_diagnostic',
          expect.objectContaining({
            diagnostic_phase: 'pwa-storage-near-limit',
            diagnostic_level: 'warn',
            diagnostic_detail_category: 'storage',
          }),
        );
      } finally {
        setItemSpy.mockRestore();
      }
    });

    it('should clear queued GA4 diagnostics when forwarding is disabled', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;

      recordPwaDiagnostic('chunk-load-error', '/assets/main.js', 'error');
      expect(localStorage.getItem(PWA_DIAGNOSTICS_GA_QUEUE_STORAGE_KEY)).toContain(
        'chunk-load-error',
      );

      vi.stubEnv('VITE_PWA_DIAGNOSTIC_FORWARDING', 'false');
      const gtag = vi.fn();
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = gtag;
      flushPwaDiagnosticAnalyticsQueue();

      expect(gtag).not.toHaveBeenCalled();
      expect(localStorage.getItem(PWA_DIAGNOSTICS_GA_QUEUE_STORAGE_KEY)).toBeNull();
    });
  });
});
