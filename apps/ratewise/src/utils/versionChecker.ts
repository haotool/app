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
 * [fix:2025-11-06] 優先從 version.json 讀取版本號，fallback 到 HTML meta 標籤
 * version.json 不會被 Service Worker 快取，確保版本檢查的即時性
 * 參考最佳實踐:
 * - https://stackoverflow.com/questions/54322336
 * - https://blog.pixelfreestudio.com/best-practices-for-handling-updates-in-progressive-web-apps/
 *
 * @returns Promise<VersionInfo | null> 遠端版本資訊，失敗時返回 null
 */
export async function fetchLatestVersion(): Promise<VersionInfo | null> {
  try {
    // 策略 1: 優先嘗試從 version.json 獲取（最可靠，不會被 SW 快取）
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const timestamp = Date.now();
      const versionUrl = `${window.location.origin}${baseUrl}version.json?v=${timestamp}`;

      logger.debug('Fetching version from version.json', { url: versionUrl });

      const versionResponse = await fetch(versionUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      if (versionResponse.ok) {
        const versionData = (await versionResponse.json()) as {
          version: string;
          buildTime?: string;
          packageVersion?: string;
        };
        logger.info('✅ Version fetched from version.json', {
          version: versionData.version,
          buildTime: versionData.buildTime,
          packageVersion: versionData.packageVersion,
        });
        return {
          version: versionData.version,
          buildTime: versionData.buildTime ?? new Date().toISOString(),
        };
      }

      logger.warn('version.json not found or not OK, falling back to HTML meta', {
        status: versionResponse.status,
      });
    } catch (error) {
      logger.warn('Failed to fetch version.json, falling back to HTML meta', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 策略 2: Fallback 到 HTML meta 標籤
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

    logger.info('✅ Version fetched from HTML meta', { version: versionMatch[1] });
    return {
      version: versionMatch[1] ?? 'unknown',
      buildTime: buildTimeMatch?.[1] ?? new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch latest version', error instanceof Error ? error : undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
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
