// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetPwaDiagnosticForwardingDedup,
  clearPwaAppReadyMarker,
  flushPwaDiagnosticForwarding,
  markPwaAppReady,
  PWA_APP_READY_ATTR,
  PWA_APP_READY_EVENT,
  PWA_DIAGNOSTICS_STORAGE_KEY,
  readPwaDiagnostics,
  recordPwaDiagnostic,
} from '../pwaDiagnostics';

vi.mock('../sentry', () => ({
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
    it('should forward error-level events to Sentry captureMessage', async () => {
      const sentry = await import('../sentry');
      recordPwaDiagnostic('cold-start-overlay-shown', { timeoutMs: 5000 }, 'error');
      await flushPwaDiagnosticForwarding();

      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'PWA diagnostic: cold-start-overlay-shown',
        expect.objectContaining({
          level: 'error',
          tags: { pwa_diagnostic_phase: 'cold-start-overlay-shown' },
        }),
      );
    });

    it('should forward warn-level events to Sentry addBreadcrumb (not captureMessage)', async () => {
      const sentry = await import('../sentry');
      recordPwaDiagnostic('pwa-storage-near-limit', { usageMb: 45 }, 'warn');
      await flushPwaDiagnosticForwarding();

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        'pwa:pwa-storage-near-limit',
        expect.objectContaining({ level: 'warn' }),
      );
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

    it('should send GA4 pwa_diagnostic event when gtag is available', () => {
      const gtag = vi.fn();
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = gtag;

      recordPwaDiagnostic('cold-start-script-error', '/assets/main.js', 'error');

      expect(gtag).toHaveBeenCalledWith(
        'event',
        'pwa_diagnostic',
        expect.objectContaining({
          diagnostic_phase: 'cold-start-script-error',
          diagnostic_level: 'error',
        }),
      );
    });

    it('should not throw when gtag is unavailable', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;
      expect(() => recordPwaDiagnostic('chunk-load-error', 'x', 'error')).not.toThrow();
    });
  });
});
