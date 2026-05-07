const PWA_DIAGNOSTICS_STORAGE_KEY = 'ratewise_pwa_diagnostics_v1';
const PWA_DIAGNOSTIC_EVENT = 'ratewise:pwa-diagnostic';
const PWA_APP_READY_EVENT = 'ratewise:pwa-app-ready';
const PWA_APP_READY_ATTR = 'data-ratewise-app-ready';
const MAX_PWA_DIAGNOSTIC_EVENTS = 40;

// 5 秒內同一 phase 不重複轉發，避免 watchdog / chunk-error 連發爆 Sentry / GA4 quota。
const FORWARD_DEDUP_WINDOW_MS = 5000;
const recentlyForwardedPhases = new Map<string, number>();

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

function isForwardingEnabled(): boolean {
  // 預設啟用；可由環境變數設 'false' 完全關閉（避免測試或敏感環境送外部訊號）。
  const flag: unknown = import.meta.env['VITE_PWA_DIAGNOSTIC_FORWARDING'];
  return flag !== 'false' && flag !== false;
}

function shouldForwardPhase(phase: string, level: PwaDiagnosticEvent['level']): boolean {
  // info-level 量大且通常不需告警，僅在內部 localStorage 留存即可。
  if (level === 'info') return false;

  const now = Date.now();
  const last = recentlyForwardedPhases.get(phase);
  if (last && now - last < FORWARD_DEDUP_WINDOW_MS) return false;

  recentlyForwardedPhases.set(phase, now);
  if (recentlyForwardedPhases.size > 50) {
    const cutoff = now - FORWARD_DEDUP_WINDOW_MS * 4;
    for (const [key, ts] of recentlyForwardedPhases) {
      if (ts < cutoff) recentlyForwardedPhases.delete(key);
    }
  }
  return true;
}

function classifyDiagnosticDetail(detail: string | undefined): string | undefined {
  if (!detail) return undefined;

  const value = detail.toLowerCase();
  if (value.includes('/assets/') || value.includes('.js') || value.includes('.css')) {
    return 'asset-load';
  }
  if (value.includes('storage') || value.includes('quota') || value.includes('cache')) {
    return 'storage';
  }
  if (value.includes('network') || value.includes('fetch') || value.includes('offline')) {
    return 'network';
  }
  if (value.includes('timeout')) {
    return 'timeout';
  }
  return 'other';
}

function bucketDiagnosticDetailLength(detail: string | undefined): string | undefined {
  if (!detail) return undefined;
  if (detail.length <= 64) return 'short';
  if (detail.length <= 256) return 'medium';
  return 'long';
}

function buildForwardingMetadata(entry: PwaDiagnosticEvent): Record<string, unknown> {
  return {
    timestamp: entry.timestamp,
    detailPresent: Boolean(entry.detail),
    detailCategory: classifyDiagnosticDetail(entry.detail),
    detailLength: bucketDiagnosticDetailLength(entry.detail),
  };
}

function trackGaPwaDiagnostic(entry: PwaDiagnosticEvent): void {
  if (typeof window === 'undefined') return;
  // gtag 由 @shared/analytics 在 client-only initGA() 後注入；SSG 時或 GA 未 init 時皆無 function。
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  try {
    gtag('event', 'pwa_diagnostic', {
      diagnostic_phase: entry.phase,
      diagnostic_level: entry.level,
      diagnostic_detail_present: Boolean(entry.detail),
      diagnostic_detail_category: classifyDiagnosticDetail(entry.detail),
      diagnostic_detail_length: bucketDiagnosticDetailLength(entry.detail),
    });
  } catch {
    // GA4 unavailable — diagnostics 仍保留在 localStorage。
  }
}

// 追蹤 pending forwards，僅供測試 `flushPwaDiagnosticForwarding` 使用；
// 正式 runtime 不影響行為（fire-and-forget 語意維持）。
const pendingForwards = new Set<Promise<void>>();

async function forwardPwaDiagnostic(entry: PwaDiagnosticEvent): Promise<void> {
  if (!isForwardingEnabled()) return;
  if (!shouldForwardPhase(entry.phase, entry.level)) return;

  trackGaPwaDiagnostic(entry);
  const forwardingMetadata = buildForwardingMetadata(entry);

  try {
    if (entry.level === 'error') {
      const { initSentry, captureMessage } = await import('./sentry');
      await initSentry();
      await captureMessage(`PWA diagnostic: ${entry.phase}`, {
        level: 'error',
        tags: { pwa_diagnostic_phase: entry.phase },
        extra: {
          ...forwardingMetadata,
        },
      });
    } else if (entry.level === 'warn') {
      const { initSentry, addBreadcrumb } = await import('./sentry');
      await initSentry();
      await addBreadcrumb(`pwa:${entry.phase}`, {
        level: entry.level,
        ...forwardingMetadata,
      });
    }
  } catch {
    // Sentry / dynamic import 失敗時靜默忽略 — diagnostic 仍在 localStorage。
  }
}

function trackPendingForward(promise: Promise<void>): void {
  pendingForwards.add(promise);
  void promise.finally(() => pendingForwards.delete(promise));
}

// 暴露給測試：等待所有 pending forwards 完成（含 dynamic import 解析）。
export async function flushPwaDiagnosticForwarding(): Promise<void> {
  while (pendingForwards.size > 0) {
    await Promise.allSettled([...pendingForwards]);
  }
}

// 暴露給測試環境驗證 dedup 行為，正式程式碼不應依賴。
export function __resetPwaDiagnosticForwardingDedup(): void {
  recentlyForwardedPhases.clear();
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

  // 觀察性：fire-and-forget 把 warn/error 事件送到 Sentry / GA4，
  // 從盲修轉為數據驅動。info-level 與 dedup 內事件不會送出。
  trackPendingForward(forwardPwaDiagnostic(entry));

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
