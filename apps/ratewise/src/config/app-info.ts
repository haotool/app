/**
 * App Information - Single Source of Truth
 *
 * 應用程式基本資訊 SSOT 模組
 * 所有作者、聯繫、授權資訊從此模組導入
 */

export const APP_INFO = {
  /** 應用程式名稱 */
  name: 'RateWise',

  /** 應用程式副標題 */
  subtitle: '匯率好工具',

  /** 開發者/組織名稱 */
  author: 'HaoTool',

  /** 聯繫信箱 */
  email: 'haotool.org@gmail.com',

  /** GitHub 倉庫 URL */
  github: 'https://github.com/haotool/app',

  /** 授權類型 */
  license: 'GPL-3.0',

  /** 版權起始年份 */
  copyrightStartYear: 2025,

  /** 網站 URL */
  siteUrl: 'https://app.haotool.org/ratewise/',
} as const;

/**
 * 取得版權年份字串
 * @returns 格式化的版權年份，如 "2025-2026" 或 "2025"
 */
export function getCopyrightYears(): string {
  const start = APP_INFO.copyrightStartYear;
  const end = new Date().getFullYear();
  if (start === end) {
    return String(start);
  }
  return `${start}-${end}`;
}

/**
 * 取得完整版權聲明
 * @returns 格式化的版權聲明
 */
export function getCopyrightNotice(): string {
  return `© ${getCopyrightYears()} ${APP_INFO.name}`;
}

export type AppInfo = typeof APP_INFO;
