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
 * 完整的刷新流程：清除快取 + 檢查更新 + 重新載入
 *
 * 用於下拉刷新等場景，確保用戶獲得最新內容
 *
 * @returns Promise<void>
 */
export async function performFullRefresh(): Promise<void> {
  logger.info('Starting full refresh flow');

  try {
    // 1. 清除所有 Service Worker 快取
    const clearedCount = await clearAllServiceWorkerCaches();
    logger.debug('Caches cleared', { count: clearedCount });

    // 2. 主動檢查並更新 Service Worker
    await forceServiceWorkerUpdate();

    // 3. 重新載入頁面
    window.location.reload();
  } catch (error) {
    logger.error('Full refresh flow failed', error as Error);
    // 即使出錯，仍然重新載入頁面
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
