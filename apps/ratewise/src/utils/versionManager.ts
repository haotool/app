/**
 * 版本管理工具
 *
 * 功能:
 * 1. 檢測版本變更
 * 2. 清除過期快取（保留用戶數據）
 * 3. 記錄版本更新歷史
 *
 * SSOT:
 * - 版本號來源: config/version.ts (APP_VERSION)
 * - Storage keys 來源: features/ratewise/storage-keys.ts (STORAGE_KEYS)
 */

import { APP_VERSION } from '../config/version';
import { logger } from './logger';
import { forceServiceWorkerUpdate } from './swUtils';
import { CACHE_KEYS, STORAGE_KEYS } from '../features/ratewise/storage-keys';

interface VersionHistoryEntry {
  version: string;
  timestamp: string;
}

/**
 * 獲取當前應用版本號
 * SSOT: 從 config/version.ts 的 APP_VERSION 取得
 */
export function getCurrentVersion(): string {
  return APP_VERSION;
}

/**
 * 獲取上次運行的版本號
 */
export function getPreviousVersion(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.APP_VERSION);
}

/**
 * 儲存當前版本號
 */
export function saveCurrentVersion(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const currentVersion = getCurrentVersion();
  localStorage.setItem(STORAGE_KEYS.APP_VERSION, currentVersion);
  logger.info('Version saved', { version: currentVersion });
}

/**
 * 檢查是否有版本更新
 * @returns true 表示版本已更新
 */
export function hasVersionChanged(): boolean {
  const currentVersion = getCurrentVersion();
  const previousVersion = getPreviousVersion();

  if (!previousVersion) {
    // 首次運行
    return false;
  }

  return currentVersion !== previousVersion;
}

/**
 * 清除應用快取（保留用戶數據）
 *
 * 清除策略:
 * - 清除: 匯率快取數據 (CACHE_KEYS)
 * - 保留: 用戶設定、收藏、貨幣選擇 (USER_DATA_KEYS)
 */
export async function clearAppCache(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  logger.info('Starting cache clearance', { reason: 'version_update' });

  // 1. 清除 localStorage 中的快取數據（保留用戶數據）
  try {
    for (const key of CACHE_KEYS) {
      localStorage.removeItem(key);
      logger.debug('Cleared localStorage cache', { key });
    }
  } catch (error) {
    logger.error('Failed to clear localStorage cache', error as Error);
  }

  // 2. 清除 Service Worker 快取
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          logger.debug('Deleted cache', { cacheName });
        }),
      );
      logger.info('All Service Worker caches cleared');
    } catch (error) {
      logger.error('Failed to clear Service Worker caches', error as Error);
    }
  }

  // 3. 清除 sessionStorage（臨時數據）
  try {
    if (window.sessionStorage) {
      sessionStorage.clear();
      logger.debug('Cleared sessionStorage');
    }
  } catch (error) {
    logger.error('Failed to clear sessionStorage', error as Error);
  }

  logger.info('Cache clearance completed');
}

/**
 * 記錄版本更新歷史
 */
export function recordVersionUpdate(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const currentVersion = getCurrentVersion();
  const previousVersion = getPreviousVersion();

  if (!previousVersion || currentVersion === previousVersion) {
    return;
  }

  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.VERSION_HISTORY) ?? '[]';
    const parsed = JSON.parse(historyJson) as unknown;
    const history = Array.isArray(parsed) ? (parsed as VersionHistoryEntry[]) : [];

    history.push({
      version: currentVersion,
      timestamp: new Date().toISOString(),
    });

    // 只保留最近 10 筆記錄
    const recentHistory = history.slice(-10);
    localStorage.setItem(STORAGE_KEYS.VERSION_HISTORY, JSON.stringify(recentHistory));

    logger.info('Version update recorded', {
      from: previousVersion,
      to: currentVersion,
    });
  } catch (error) {
    logger.error('Failed to record version update', error as Error);
  }
}

/**
 * 處理版本更新流程
 *
 * 流程:
 * 1. 檢測版本變更
 * 2. 清除過期快取
 * 3. 強制更新 Service Worker
 * 4. 記錄更新歷史
 * 5. 儲存新版本號
 */
export async function handleVersionUpdate(): Promise<void> {
  if (!hasVersionChanged()) {
    // 沒有版本更新，只儲存當前版本
    saveCurrentVersion();
    return;
  }

  const currentVersion = getCurrentVersion();
  const previousVersion = getPreviousVersion();

  logger.info('Version update detected', {
    from: previousVersion,
    to: currentVersion,
  });

  // 清除快取
  await clearAppCache();

  // Force Service Worker update
  await forceServiceWorkerUpdate();

  // 記錄更新歷史
  recordVersionUpdate();

  // 儲存新版本號
  saveCurrentVersion();

  logger.info('Version update completed', {
    version: currentVersion,
  });
}

export { forceServiceWorkerUpdate };

/**
 * 獲取版本更新歷史
 */
export function getVersionHistory(): VersionHistoryEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.VERSION_HISTORY) ?? '[]';
    const parsed = JSON.parse(historyJson) as unknown;
    return Array.isArray(parsed) ? (parsed as VersionHistoryEntry[]) : [];
  } catch {
    return [];
  }
}
