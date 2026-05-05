const PWA_DIAGNOSTICS_STORAGE_KEY = 'ratewise_pwa_diagnostics_v1';
const PWA_DIAGNOSTIC_EVENT = 'ratewise:pwa-diagnostic';
const PWA_APP_READY_EVENT = 'ratewise:pwa-app-ready';
const PWA_APP_READY_ATTR = 'data-ratewise-app-ready';
const MAX_PWA_DIAGNOSTIC_EVENTS = 40;

export interface PwaDiagnosticEvent {
  phase: string;
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  detail?: string;
}

declare global {
  interface Window {
    __RATEWISE_PWA_DIAGNOSTICS__?: PwaDiagnosticEvent[];
  }
}

function canUseBrowserStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function stringifyDetail(detail: unknown): string | undefined {
  if (detail == null) return undefined;
  if (typeof detail === 'string') return detail;

  try {
    return JSON.stringify(detail);
  } catch {
    return Object.prototype.toString.call(detail);
  }
}

function normalizeDiagnostics(input: unknown): PwaDiagnosticEvent[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((entry): entry is Record<string, unknown> => entry != null && typeof entry === 'object')
    .map((entry) => ({
      phase: typeof entry['phase'] === 'string' ? entry['phase'] : 'unknown',
      level:
        entry['level'] === 'warn' || entry['level'] === 'error' || entry['level'] === 'info'
          ? entry['level']
          : 'info',
      timestamp:
        typeof entry['timestamp'] === 'string' ? entry['timestamp'] : new Date().toISOString(),
      detail: typeof entry['detail'] === 'string' ? entry['detail'] : undefined,
    }));
}

export function readPwaDiagnostics(): PwaDiagnosticEvent[] {
  if (!canUseBrowserStorage()) {
    return window.__RATEWISE_PWA_DIAGNOSTICS__ ?? [];
  }

  try {
    const raw = window.localStorage.getItem(PWA_DIAGNOSTICS_STORAGE_KEY);
    if (!raw) return window.__RATEWISE_PWA_DIAGNOSTICS__ ?? [];

    const diagnostics = normalizeDiagnostics(JSON.parse(raw));
    window.__RATEWISE_PWA_DIAGNOSTICS__ = diagnostics;
    return diagnostics;
  } catch {
    return window.__RATEWISE_PWA_DIAGNOSTICS__ ?? [];
  }
}

export function recordPwaDiagnostic(
  phase: string,
  detail?: unknown,
  level: PwaDiagnosticEvent['level'] = 'info',
): PwaDiagnosticEvent | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const entry: PwaDiagnosticEvent = {
    phase,
    level,
    timestamp: new Date().toISOString(),
    detail: stringifyDetail(detail),
  };

  const diagnostics = [...readPwaDiagnostics(), entry].slice(-MAX_PWA_DIAGNOSTIC_EVENTS);
  window.__RATEWISE_PWA_DIAGNOSTICS__ = diagnostics;

  if (canUseBrowserStorage()) {
    try {
      window.localStorage.setItem(PWA_DIAGNOSTICS_STORAGE_KEY, JSON.stringify(diagnostics));
    } catch {
      // Ignore storage quota / private mode failures.
    }
  }

  try {
    window.dispatchEvent(
      new CustomEvent(PWA_DIAGNOSTIC_EVENT, {
        detail: entry,
      }),
    );
  } catch {
    // Ignore CustomEvent issues in older environments.
  }

  return entry;
}

export function markPwaAppReady(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  document.documentElement.setAttribute(PWA_APP_READY_ATTR, 'true');
  recordPwaDiagnostic('app-ready', undefined, 'info');

  try {
    window.dispatchEvent(new Event(PWA_APP_READY_EVENT));
  } catch {
    // Ignore event dispatch failures.
  }
}

export function clearPwaAppReadyMarker(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.removeAttribute(PWA_APP_READY_ATTR);
}

export {
  MAX_PWA_DIAGNOSTIC_EVENTS,
  PWA_APP_READY_ATTR,
  PWA_APP_READY_EVENT,
  PWA_DIAGNOSTICS_STORAGE_KEY,
  PWA_DIAGNOSTIC_EVENT,
};
