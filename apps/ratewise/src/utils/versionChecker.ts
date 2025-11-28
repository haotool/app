/**
 * 版本號檢查器 - Runtime 版本驗證
 *
 * 用於在 runtime 檢查當前運行的版本是否為最新版本
 * 防止用戶因快取問題停留在舊版本
 *
 * [fix:2025-11-05] 新增版本檢查機制
 * 參考:
 * - https://blog.pixelfreestudio.com/best-practices-for-handling-updates-in-progressive-web-apps/
 * - https://stackoverflow.com/questions/54322336
 */

import { logger } from './logger';

/**
 * 版本資訊介面
 */
export interface VersionInfo {
  version: string;
  buildTime: string;
  gitHash?: string;
}

/**
 * 從遠端獲取最新版本資訊
 *
 * 透過獲取 index.html 的 meta 標籤來檢查最新版本
 *
 * @returns Promise<VersionInfo | null> 遠端版本資訊，失敗時返回 null
 */
export async function fetchLatestVersion(): Promise<VersionInfo | null> {
  try {
    // 使用 cache-busting 參數確保獲取最新版本
    const timestamp = Date.now();
    const response = await fetch(
      `${window.location.origin}${import.meta.env.BASE_URL || '/'}?v=${timestamp}`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // 從 HTML 中提取版本號（假設在 meta 標籤中）
    const versionMatch = /<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i.exec(html);
    const buildTimeMatch = /<meta\s+name=["']build-time["']\s+content=["']([^"']+)["']/i.exec(html);

    if (!versionMatch) {
      logger.warn('Version meta tag not found in remote HTML');
      return null;
    }

    return {
      version: versionMatch[1] ?? 'unknown',
      buildTime: buildTimeMatch?.[1] ?? new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch latest version', error as Error);
    return null;
  }
}

/**
 * 獲取當前運行的版本資訊
 *
 * @returns VersionInfo 當前版本資訊
 */
export function getCurrentVersionInfo(): VersionInfo {
  return {
    version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    buildTime: import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString(),
  };
}

/**
 * 比較兩個版本號
 *
 * @param current 當前版本
 * @param latest 最新版本
 * @returns boolean 如果最新版本較新則返回 true
 */
export function isNewerVersion(current: string, latest: string): boolean {
  // 移除 build metadata (+ 之後的部分)
  const cleanCurrent = current.split('+')[0] ?? current;
  const cleanLatest = latest.split('+')[0] ?? latest;

  // 簡單的字串比較（適用於語義化版本）
  return cleanLatest !== cleanCurrent;
}

/**
 * 檢查是否有新版本可用
 *
 * @returns Promise<boolean> 如果有新版本返回 true
 */
export async function checkForNewVersion(): Promise<boolean> {
  // [fix:2025-11-27] 開發環境禁用版本檢查
  // 避免 __APP_VERSION__ 佔位符導致持續觸發更新提示
  if (import.meta.env.DEV) {
    logger.debug('Version check disabled in development mode');
    return false;
  }

  const currentVersion = getCurrentVersionInfo();
  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    logger.warn('Unable to check for new version');
    return false;
  }

  const hasUpdate = isNewerVersion(currentVersion.version, latestVersion.version);

  if (hasUpdate) {
    logger.info('New version detected', {
      current: currentVersion.version,
      latest: latestVersion.version,
    });
  } else {
    logger.debug('Running latest version', {
      version: currentVersion.version,
    });
  }

  return hasUpdate;
}

/**
 * 定期檢查版本更新
 *
 * @param intervalMs 檢查間隔（毫秒）
 * @param onUpdateAvailable 發現更新時的回調函數
 * @returns 清理函數
 */
export function startVersionCheckInterval(
  intervalMs: number,
  onUpdateAvailable: () => void,
): () => void {
  logger.info('Starting version check interval', { intervalMs });

  const checkVersion = async () => {
    const hasUpdate = await checkForNewVersion();
    if (hasUpdate) {
      onUpdateAvailable();
    }
  };

  // 立即檢查一次
  void checkVersion();

  // 定期檢查
  const intervalId = setInterval(() => {
    void checkVersion();
  }, intervalMs);

  // 返回清理函數
  return () => {
    logger.debug('Stopping version check interval');
    clearInterval(intervalId);
  };
}
