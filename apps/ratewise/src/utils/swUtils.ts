/**
 * Service Worker Utilities
 *
 * Manages PWA Service Worker cache and updates
 *
 * References:
 * - https://web.dev/learn/pwa/update
 * - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
 */

import { logger } from './logger';

/**
 * 清除所有 Service Worker 快取
 *
 * @returns Promise<number> 清除的快取數量
 */
export async function clearAllServiceWorkerCaches(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    logger.warn('Service Worker caches API not available');
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((name) => caches.delete(name));
    await Promise.all(deletePromises);

    logger.info('All Service Worker caches cleared', {
      count: cacheNames.length,
      cacheNames,
    });

    return cacheNames.length;
  } catch (error) {
    logger.error('Failed to clear Service Worker caches', error as Error);
    return 0;
  }
}

/**
 * 檢查是否有新的 Service Worker 正在等待
 *
 * @returns Promise<boolean> 是否有更新等待中
 */
export async function hasServiceWorkerUpdate(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  if (typeof navigator.serviceWorker.getRegistration !== 'function') {
    logger.warn('Service Worker registration API not available');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    // 檢查是否有 waiting 或 installing 的 Service Worker
    return registration.waiting != null || registration.installing != null;
  } catch (error) {
    logger.error('Failed to check Service Worker update', error as Error);
    return false;
  }
}

/**
 * Force Service Worker update (skip waiting)
 *
 * Note: sw.ts calls self.skipWaiting() directly, so the SW activates immediately
 * after installation. registration.waiting is always null.
 *
 * @returns Promise<boolean> Whether update was triggered successfully
 */
export async function forceServiceWorkerUpdate(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  if (typeof navigator.serviceWorker.getRegistration !== 'function') {
    logger.warn('Service Worker registration API not available');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      logger.warn('No Service Worker registration found');
      return false;
    }

    // 主動檢查更新
    // 注意：由於 sw.ts 直接調用 skipWaiting()，新 SW 會立即激活
    // 不需要發送 SKIP_WAITING 消息（registration.waiting 永遠為 null）
    await registration.update();
    logger.info('Service Worker update check triggered');
    return true;
  } catch (error) {
    logger.error('Failed to force Service Worker update', error as Error);
    return false;
  }
}

/**
 * 傳送 FORCE_HARD_RESET 訊息給 SW，讓 SW 清除所有快取後重載。
 *
 * 優先使用 SW message（讓 SW 從內部清除快取），
 * 若 SW 不存在則直接由 client 清除快取。
 * SW 回覆 SW_HARD_RESET_DONE 時頁面重載，或 3 秒 timeout 後強制重載。
 *
 * @returns Promise<void>
 */
export async function forceHardReset(): Promise<void> {
  logger.info('[swUtils] forceHardReset: starting');

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    window.location.reload();
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const sw = registration?.active ?? registration?.installing ?? registration?.waiting;

    if (sw) {
      // 等待 SW 回覆後重載，最多 3 秒
      const reloadOnMessage = (event: MessageEvent) => {
        if ((event.data as { type?: string })?.type === 'SW_HARD_RESET_DONE') {
          navigator.serviceWorker.removeEventListener('message', reloadOnMessage);
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('message', reloadOnMessage);
      sw.postMessage({ type: 'FORCE_HARD_RESET' });

      // Fallback: 3 秒後若 SW 未回覆仍重載
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', reloadOnMessage);
        window.location.reload();
      }, 3000);
      return;
    }
  } catch (error) {
    logger.warn('[swUtils] forceHardReset: SW message failed, fallback to direct clear', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fallback：直接由 client 清除快取
  await clearAllServiceWorkerCaches();
  window.location.reload();
}

/**
 * 完整的刷新流程：清除快取 + 檢查更新 + 重新載入
 *
 * 用於下拉刷新等場景，確保用戶獲得最新內容。
 * 優先透過 SW 訊息清除快取（forceHardReset），
 * 確保 SW 快取與 client 端快取均被清除。
 *
 * @returns Promise<void>
 */
export async function performFullRefresh(): Promise<void> {
  logger.info('Starting full refresh flow');

  try {
    await forceHardReset();
  } catch (error) {
    logger.error('Full refresh flow failed', error as Error);
    window.location.reload();
  }
}

/**
 * 獲取 Service Worker 狀態資訊
 *
 * @returns Promise<ServiceWorkerStatus> Service Worker 狀態
 */
export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  hasUpdate: boolean;
  cacheCount: number;
}

export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const defaultStatus: ServiceWorkerStatus = {
    isSupported: false,
    isRegistered: false,
    isActive: false,
    hasUpdate: false,
    cacheCount: 0,
  };

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return defaultStatus;
  }
  if (typeof navigator.serviceWorker.getRegistration !== 'function') {
    logger.warn('Service Worker registration API not available');
    return defaultStatus;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const cacheNames = 'caches' in window ? await caches.keys() : [];

    return {
      isSupported: true,
      isRegistered: Boolean(registration),
      isActive: Boolean(registration?.active),
      hasUpdate: registration?.waiting != null || registration?.installing != null,
      cacheCount: cacheNames.length,
    };
  } catch (error) {
    logger.error('Failed to get Service Worker status', error as Error);
    return defaultStatus;
  }
}
