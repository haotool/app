// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPwaAppReadyMarker,
  markPwaAppReady,
  PWA_APP_READY_ATTR,
  PWA_APP_READY_EVENT,
  PWA_DIAGNOSTICS_STORAGE_KEY,
  readPwaDiagnostics,
  recordPwaDiagnostic,
} from '../pwaDiagnostics';

describe('pwaDiagnostics', () => {
  beforeEach(() => {
    localStorage.clear();
    clearPwaAppReadyMarker();
    window.__RATEWISE_PWA_DIAGNOSTICS__ = [];
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
});
