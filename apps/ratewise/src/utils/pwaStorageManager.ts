/**
 * PWA Storage Manager - iOS Cache Persistence Strategy
 *
 * 解決問題：iOS Safari 在 PWA 關閉後清除 Cache Storage
 *
 * 根本原因：
 * - iOS Cache Storage 只持續到 Safari 完全卸載為止
 * - iOS 會在 PWA 關閉後移除 Service Worker (Workbox Issue #1494)
 * - 7 天 script-writable storage 上限
 * - 50MB Cache API 限制
 *
 * 解決方案：
 * 1. 請求持久化儲存 (navigator.storage.persist())
 * 2. 應用啟動時重新快取關鍵資源
 * 3. 監控快取狀態並提供診斷資訊
 *
 * References:
 * - [GitHub: PWA-POLICE/pwa-bugs](https://github.com/PWA-POLICE/pwa-bugs)
 * - [Apple Forums: iOS 17 PWA issues](https://developer.apple.com/forums/thread/737827)
 * - [GitHub: Workbox#1494](https://github.com/GoogleChrome/workbox/issues/1494)
 * - [MDN: Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
 */

import { logger } from './logger';

/**
 * 快取持久化狀態
 */
export interface StoragePersistenceStatus {
  /** 是否支援 Storage API */
  isSupported: boolean;
  /** 是否已請求持久化 */
  isPersistent: boolean;
  /** 估計可用空間 (bytes) */
  quota: number;
  /** 已使用空間 (bytes) */
  usage: number;
  /** 使用率 (0-1) */
  usagePercentage: number;
  /** 是否接近 iOS 50MB 限制 */
  isNearLimit: boolean;
}

/**
 * 關鍵資源 URL 列表
 * 這些資源在 PWA 啟動時必須確保已快取
 */
const CRITICAL_RESOURCES = [
  '/', // 首頁
  '/offline.html', // 離線頁面
  '/manifest.webmanifest', // PWA manifest
  '/icons/ratewise-icon-192x192.png', // 應用圖標
  '/icons/ratewise-icon-512x512.png',
];

/**
 * 請求持久化儲存
 *
 * Safari/iOS 支援 Storage API，但可能不授予持久化權限
 * Chrome/Edge 通常會自動授予權限
 *
 * @returns Promise<boolean> 是否成功獲得持久化權限
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    logger.warn('Storage API not supported');
    return false;
  }

  try {
    // 檢查是否已持久化
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      logger.info('Storage already persistent');
      return true;
    }

    // 請求持久化
    const granted = await navigator.storage.persist();
    if (granted) {
      logger.info('Persistent storage granted');
    } else {
      logger.warn('Persistent storage denied - cache may be cleared by browser');
    }

    return granted;
  } catch (error) {
    logger.error('Failed to request persistent storage', error as Error);
    return false;
  }
}

/**
 * 獲取快取持久化狀態
 *
 * @returns Promise<StoragePersistenceStatus> 快取狀態資訊
 */
export async function getStoragePersistenceStatus(): Promise<StoragePersistenceStatus> {
  const defaultStatus: StoragePersistenceStatus = {
    isSupported: false,
    isPersistent: false,
    quota: 0,
    usage: 0,
    usagePercentage: 0,
    isNearLimit: false,
  };

  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    return defaultStatus;
  }

  try {
    const [isPersistent, estimate] = await Promise.all([
      navigator.storage.persisted(),
      navigator.storage.estimate(),
    ]);

    const quota = estimate.quota ?? 0;
    const usage = estimate.usage ?? 0;
    const usagePercentage = quota > 0 ? usage / quota : 0;

    // iOS 限制約 50MB，接近 40MB 時視為接近限制
    const iOS_LIMIT = 50 * 1024 * 1024; // 50MB
    const isNearLimit = usage > iOS_LIMIT * 0.8; // 80% threshold

    return {
      isSupported: true,
      isPersistent,
      quota,
      usage,
      usagePercentage,
      isNearLimit,
    };
  } catch (error) {
    logger.error('Failed to get storage persistence status', error as Error);
    return defaultStatus;
  }
}

/**
 * 應用啟動時重新快取關鍵資源
 *
 * iOS Safari 會在 PWA 關閉後清除 Cache Storage
 * 此函數在應用啟動時主動預熱快取，確保離線功能可用
 *
 * @param baseUrl 應用 base URL (例如 /ratewise/)
 * @returns Promise<number> 成功快取的資源數量
 */
export async function recacheCriticalResourcesOnLaunch(baseUrl: string): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    logger.warn('Cache API not available');
    return 0;
  }

  try {
    logger.info('Starting critical resources pre-caching on launch');

    // 取得 precache 名稱（Workbox 使用 workbox-precache-v2-https://... 格式）
    const cacheNames = await caches.keys();
    const precacheName =
      cacheNames.find((name) => name.startsWith('workbox-precache')) || 'critical-cache';

    const cache = await caches.open(precacheName);
    let successCount = 0;

    // 平行預熱所有關鍵資源
    await Promise.allSettled(
      CRITICAL_RESOURCES.map(async (path) => {
        try {
          // 建構完整 URL
          const url = new URL(path, `${window.location.origin}${baseUrl}`).href;

          // 檢查是否已快取
          const cached = await cache.match(url);
          if (cached) {
            logger.debug('Resource already cached', { url });
            successCount++;
            return;
          }

          // 重新快取
          const response = await fetch(url, {
            cache: 'reload', // 強制重新驗證
            credentials: 'same-origin',
          });

          if (response.ok) {
            await cache.put(url, response);
            logger.debug('Resource re-cached successfully', { url });
            successCount++;
          } else {
            logger.warn('Resource fetch failed', { url, status: response.status });
          }
        } catch (error) {
          logger.error('Failed to re-cache resource', error as Error, { path });
        }
      }),
    );

    logger.info('Critical resources pre-caching completed', {
      total: CRITICAL_RESOURCES.length,
      success: successCount,
    });

    return successCount;
  } catch (error) {
    logger.error('Failed to re-cache critical resources', error as Error);
    return 0;
  }
}

/**
 * 檢查快取健康度
 *
 * 診斷 iOS Safari PWA 離線問題：
 * - 快取是否存在
 * - 關鍵資源是否已快取
 * - 快取使用量是否接近限制
 *
 * @returns Promise<CacheHealth> 快取健康度資訊
 */
export interface CacheHealth {
  /** 是否支援 Cache API */
  isSupported: boolean;
  /** 快取總數 */
  cacheCount: number;
  /** 快取名稱列表 */
  cacheNames: string[];
  /** 關鍵資源快取狀態 */
  criticalResources: {
    path: string;
    isCached: boolean;
  }[];
  /** 儲存狀態 */
  storage: StoragePersistenceStatus;
}

export async function checkCacheHealth(baseUrl: string): Promise<CacheHealth> {
  const defaultHealth: CacheHealth = {
    isSupported: false,
    cacheCount: 0,
    cacheNames: [],
    criticalResources: [],
    storage: await getStoragePersistenceStatus(),
  };

  if (typeof window === 'undefined' || !('caches' in window)) {
    return defaultHealth;
  }

  try {
    const cacheNames = await caches.keys();
    const criticalResources = await Promise.all(
      CRITICAL_RESOURCES.map(async (path) => {
        const url = new URL(path, `${window.location.origin}${baseUrl}`).href;
        let isCached = false;

        // 檢查所有快取
        for (const cacheName of cacheNames) {
          try {
            const cache = await caches.open(cacheName);
            const cached = await cache.match(url);
            if (cached) {
              isCached = true;
              break;
            }
          } catch {
            // 忽略單一快取檢查錯誤
          }
        }

        return { path, isCached };
      }),
    );

    return {
      isSupported: true,
      cacheCount: cacheNames.length,
      cacheNames,
      criticalResources,
      storage: await getStoragePersistenceStatus(),
    };
  } catch (error) {
    logger.error('Failed to check cache health', error as Error);
    return defaultHealth;
  }
}

/**
 * 初始化 PWA 儲存管理器
 *
 * 應在應用啟動時調用，執行：
 * 1. 請求持久化儲存
 * 2. 重新快取關鍵資源
 * 3. 記錄快取健康度
 *
 * @param baseUrl 應用 base URL (例如 /ratewise/)
 */
export async function initPWAStorageManager(baseUrl: string): Promise<void> {
  logger.info('Initializing PWA Storage Manager');

  try {
    // 1. 請求持久化儲存
    const isPersistent = await requestPersistentStorage();

    // 2. 重新快取關鍵資源
    const recachedCount = await recacheCriticalResourcesOnLaunch(baseUrl);

    // 3. 檢查快取健康度
    const health = await checkCacheHealth(baseUrl);

    logger.info('PWA Storage Manager initialized', {
      isPersistent,
      recachedCount,
      cacheCount: health.cacheCount,
      storageUsage: `${(health.storage.usagePercentage * 100).toFixed(1)}%`,
      isNearLimit: health.storage.isNearLimit,
    });

    // 警告：如果接近 iOS 50MB 限制
    if (health.storage.isNearLimit) {
      logger.warn('Cache usage near iOS 50MB limit', {
        usage: `${(health.storage.usage / 1024 / 1024).toFixed(2)} MB`,
        quota: `${(health.storage.quota / 1024 / 1024).toFixed(2)} MB`,
      });
    }

    // 警告：關鍵資源未快取
    const missingResources = health.criticalResources.filter((r) => !r.isCached);
    if (missingResources.length > 0) {
      logger.warn('Critical resources not cached', {
        missing: missingResources.map((r) => r.path),
      });
    }
  } catch (error) {
    logger.error('Failed to initialize PWA Storage Manager', error as Error);
  }
}
