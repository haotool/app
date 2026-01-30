/**
 * Version Configuration - Single Source of Truth
 *
 * 版本管理 SSOT 模組
 * 所有版本資訊從 Vite 環境變數注入，避免硬編碼
 *
 * @see vite.config.ts - 版本號生成邏輯
 * @see package.json - 基礎版本來源
 */

/**
 * 應用程式版本號
 * 來源: vite.config.ts generateVersion()
 * 格式: {semver}[+build.{distance}] 或 {semver}[+sha.{hash}[-dirty]]
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '2.0.0';

/**
 * 建置時間 (ISO 8601)
 * 來源: vite.config.ts buildTime
 */
export const BUILD_TIME = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString();

/**
 * 是否為開發模式
 */
export const IS_DEV = import.meta.env.DEV;

/**
 * 格式化版本號顯示
 * @returns 格式化的版本字串 (e.g., "v2.0.0")
 */
export function getDisplayVersion(): string {
  // 移除建置後綴，僅顯示語義化版本
  const semver = APP_VERSION.split('+')[0];
  return `v${semver}`;
}

/**
 * 獲取完整版本資訊（含建置後綴）
 * @returns 完整版本字串 (e.g., "v2.0.0+build.15")
 */
export function getFullVersion(): string {
  return `v${APP_VERSION}`;
}

/**
 * 格式化建置時間
 * @returns 格式化的日期時間字串
 */
export function getFormattedBuildTime(): string {
  const buildDate = new Date(BUILD_TIME);
  const date = buildDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const time = buildDate.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

/**
 * 版本資訊物件
 */
export interface VersionInfo {
  version: string;
  displayVersion: string;
  fullVersion: string;
  buildTime: string;
  formattedBuildTime: string;
  isDev: boolean;
}

/**
 * 獲取完整版本資訊
 */
export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    displayVersion: getDisplayVersion(),
    fullVersion: getFullVersion(),
    buildTime: BUILD_TIME,
    formattedBuildTime: getFormattedBuildTime(),
    isDev: IS_DEV,
  };
}
