/**
 * 版本管理工具
 *
 * 功能:
 * 1. 檢測版本變更
 * 2. 清除過期快取（保留用戶數據）
 * 3. 記錄版本更新歷史
 */

import { logger } from './logger';
import { CACHE_KEYS } from '../features/ratewise/storage-keys';

const VERSION_STORAGE_KEY = 'app_version';
const VERSION_HISTORY_KEY = 'version_history';

interface VersionInfo {
  version: string;
  timestamp: string;
}

/**
 * 獲取當前應用版本號
 */
export function getCurrentVersion(): string {
  return import.meta.env.VITE_APP_VERSION ?? '1.0.0';
}

/**
 * 獲取上次運行的版本號
 */
export function getPreviousVersion(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return localStorage.getItem(VERSION_STORAGE_KEY);
}

/**
 * 儲存當前版本號
 */
export function saveCurrentVersion(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const currentVersion = getCurrentVersion();
  localStorage.setItem(VERSION_STORAGE_KEY, currentVersion);
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
 * - ✅ 清除: 匯率快取數據 (CACHE_KEYS)
 * - ❌ 保留: 用戶設定、收藏、貨幣選擇 (USER_DATA_KEYS)
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
    const historyJson = localStorage.getItem(VERSION_HISTORY_KEY) ?? '[]';
    const history = JSON.parse(historyJson) as VersionInfo[];

    history.push({
      version: currentVersion,
      timestamp: new Date().toISOString(),
    });

    // 只保留最近 10 筆記錄
    const recentHistory = history.slice(-10);
    localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(recentHistory));

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
 * 3. 記錄更新歷史
 * 4. 儲存新版本號
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

  // 記錄更新歷史
  recordVersionUpdate();

  // 儲存新版本號
  saveCurrentVersion();

  logger.info('Version update completed', {
    version: currentVersion,
  });
}

/**
 * 獲取版本更新歷史
 */
export function getVersionHistory(): VersionInfo[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const historyJson = localStorage.getItem(VERSION_HISTORY_KEY) ?? '[]';
    return JSON.parse(historyJson) as VersionInfo[];
  } catch {
    return [];
  }
}
