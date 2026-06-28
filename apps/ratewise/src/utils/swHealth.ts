/**
 * Service Worker 健康偵測與關鍵修復傳播決策。
 *
 * 僅對「壞 SW」（shell precache 缺 index.html 或 legacy 膨脹）在連網時
 * 自動 SKIP_WAITING + 整頁重載；健康 SW 維持 prompt UX，避免版本撕裂。
 */

import { logger } from './logger';
import { forceServiceWorkerUpdate } from './swUtils';

/** 新版 precache 約 92 項；舊版膨脹 SW 曾達 400+ 項。 */
export const LEGACY_PRECACHE_BLOAT_THRESHOLD = 150;

export const SHELL_PROBE_TIMEOUT_MS = 2000;
export const WAITING_SW_TIMEOUT_MS = 15000;

const CRITICAL_FIX_SESSION_KEY = 'rw-sw-critical-fix-attempted';

export interface SwShellProbeResult {
  probeTimedOut: boolean;
  hasIndexShell: boolean;
  precacheEntryCount: number;
}

export type SwShellHealthReason =
  | 'ok'
  | 'index-missing'
  | 'legacy-precache-bloat'
  | 'probe-timeout';

export interface SwShellHealth {
  broken: boolean;
  reason: SwShellHealthReason;
}

export type CriticalSwPropagationResult = 'healthy' | 'applied' | 'pending' | 'skipped';

export function evaluateSwShellHealth(probe: SwShellProbeResult): SwShellHealth {
  if (probe.probeTimedOut) {
    return { broken: true, reason: 'probe-timeout' };
  }
  if (!probe.hasIndexShell) {
    return { broken: true, reason: 'index-missing' };
  }
  if (probe.precacheEntryCount > LEGACY_PRECACHE_BLOAT_THRESHOLD) {
    return { broken: true, reason: 'legacy-precache-bloat' };
  }
  return { broken: false, reason: 'ok' };
}

export async function probeActiveSwShellHealth(): Promise<SwShellProbeResult> {
  const controller = navigator.serviceWorker.controller;
  if (!controller) {
    return { probeTimedOut: false, hasIndexShell: false, precacheEntryCount: 0 };
  }

  return new Promise<SwShellProbeResult>((resolve) => {
    const channel = new MessageChannel();
    const timeoutId = setTimeout(() => {
      resolve({ probeTimedOut: true, hasIndexShell: false, precacheEntryCount: 0 });
    }, SHELL_PROBE_TIMEOUT_MS);

    channel.port1.onmessage = (event: MessageEvent) => {
      clearTimeout(timeoutId);
      const data = event.data as {
        healthy?: boolean;
        hasIndexShell?: boolean;
        precacheEntryCount?: number;
      };
      resolve({
        probeTimedOut: false,
        hasIndexShell: Boolean(data.hasIndexShell ?? data.healthy),
        precacheEntryCount: Number(data.precacheEntryCount ?? 0),
      });
    };

    controller.postMessage({ type: 'CHECK_SHELL_PRECACHE' }, [channel.port2]);
  });
}

async function waitForWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs: number,
): Promise<ServiceWorker | null> {
  if (registration.waiting) {
    return registration.waiting;
  }

  return new Promise<ServiceWorker | null>((resolve) => {
    const timeoutId = setTimeout(() => {
      registration.removeEventListener('updatefound', onUpdateFound);
      resolve(registration.waiting);
    }, timeoutMs);

    const onUpdateFound = () => {
      const installing = registration.installing;
      if (!installing) {
        return;
      }

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && registration.waiting) {
          clearTimeout(timeoutId);
          registration.removeEventListener('updatefound', onUpdateFound);
          resolve(registration.waiting);
        }
      });
    };

    registration.addEventListener('updatefound', onUpdateFound);
  });
}

function hasCriticalFixBeenAttemptedThisSession(): boolean {
  try {
    return sessionStorage.getItem(CRITICAL_FIX_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markCriticalFixAttemptedThisSession(): void {
  try {
    sessionStorage.setItem(CRITICAL_FIX_SESSION_KEY, '1');
  } catch {
    // sessionStorage 不可用時略過，仍允許單次修復。
  }
}

/**
 * 連網時若 active SW 不健康，拉取 waiting 版並安全接管（SKIP_WAITING + 重載）。
 * 健康 SW 不觸發強制更新，維持 prompt 流程。
 */
export async function propagateCriticalSwFixIfBroken(): Promise<CriticalSwPropagationResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return 'skipped';
  }
  if (!navigator.onLine) {
    return 'skipped';
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !navigator.serviceWorker.controller) {
      return 'skipped';
    }

    const probe = await probeActiveSwShellHealth();
    const health = evaluateSwShellHealth(probe);

    if (!health.broken) {
      return 'healthy';
    }

    if (hasCriticalFixBeenAttemptedThisSession()) {
      logger.warn('[swHealth] Critical SW fix already attempted this session — skipping');
      return 'skipped';
    }

    logger.warn('[swHealth] Broken active SW detected — propagating critical fix', {
      reason: health.reason,
      precacheEntryCount: probe.precacheEntryCount,
    });

    await registration.update();

    const waiting =
      registration.waiting ??
      (await waitForWaitingServiceWorker(registration, WAITING_SW_TIMEOUT_MS));

    if (!waiting) {
      return 'pending';
    }

    markCriticalFixAttemptedThisSession();
    const applied = await forceServiceWorkerUpdate();
    return applied ? 'applied' : 'pending';
  } catch (error) {
    logger.error('Failed to propagate critical SW fix', error as Error);
    return 'skipped';
  }
}

/** 供 UpdatePrompt 判斷是否允許 needRefresh 自動接管（僅限壞 SW）。 */
export async function isActiveServiceWorkerBroken(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  if (!navigator.serviceWorker.controller) {
    return false;
  }

  const probe = await probeActiveSwShellHealth();
  return evaluateSwShellHealth(probe).broken;
}
