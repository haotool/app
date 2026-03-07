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

  /** 社群帳號 */
  socialHandle: '@azlife_1224',

  /** Threads 個人頁 */
  threadsUrl: 'https://www.threads.net/@azlife_1224',

  /** GitHub 倉庫 URL */
  github: 'https://github.com/haotool/app',

  /** 原始碼授權說明頁 */
  licenseUrl: 'https://github.com/haotool/app/blob/main/LICENSE',

  /** 授權類型 */
  license: 'GPL-3.0',

  /** 版權起始年份 */
  copyrightStartYear: 2025,

  /** 組織官網 URL（非 app URL，用於 Organization schema） */
  organizationUrl: 'https://haotool.org',

  /** 網站 URL */
  siteUrl: 'https://app.haotool.org/ratewise/',

  /** 取得圖片授權或使用許可的頁面 */
  imageLicenseContactUrl: 'https://app.haotool.org/ratewise/about/',
} as const;

export const AUTHOR_CONTACT_LINK_MAP = {
  threads: {
    id: 'threads',
    label: 'Threads',
    href: APP_INFO.threadsUrl,
    value: APP_INFO.socialHandle,
    external: true,
  },
  email: {
    id: 'email',
    label: 'Email',
    href: `mailto:${APP_INFO.email}`,
    value: APP_INFO.email,
    external: false,
  },
} as const;

export const AUTHOR_CONTACT_LINKS = [
  AUTHOR_CONTACT_LINK_MAP.threads,
  AUTHOR_CONTACT_LINK_MAP.email,
] as const;

export const SEO_SOCIAL_LINKS = [APP_INFO.threadsUrl, APP_INFO.github] as const;

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
export type AuthorContactLink = (typeof AUTHOR_CONTACT_LINKS)[number];
