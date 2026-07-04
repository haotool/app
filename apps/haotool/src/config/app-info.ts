/**
 * App Information - Single Source of Truth
 *
 * 應用程式基本資訊 SSOT 模組
 * 所有品牌、作者、聯繫、授權資訊從此模組導入
 * 結構對齊 apps/ratewise/src/config/app-info.ts（wordmark 拆分模式）
 */

/**
 * 品牌原子（Brand Atoms）— 未來改名時只需改這兩個常數，
 * 其餘所有衍生值（name、page titles、描述等）會自動跟隨。
 */
const BRAND_SHORT_NAME = 'HaoTool';
const BRAND_SUBTITLE = '好工具';

// 品牌標準字拆分：前段墨色、後段品牌藍強調。
// 兩段串接必須等於 BRAND_SHORT_NAME。
const BRAND_WORDMARK_PREFIX = 'Hao';
const BRAND_WORDMARK_ACCENT = 'Tool';

export const APP_INFO = {
  /** 應用程式完整名稱（shortName + subtitle 組合） */
  name: `${BRAND_SHORT_NAME} ${BRAND_SUBTITLE}`,

  /** 安裝後顯示的簡短名稱（純品牌） */
  shortName: BRAND_SHORT_NAME,

  /** 品牌標準字拆分（wordmark 視覺）：prefix 墨色 + accent 品牌藍。 */
  wordmarkPrefix: BRAND_WORDMARK_PREFIX,
  wordmarkAccent: BRAND_WORDMARK_ACCENT,

  /** 應用程式副標題 */
  subtitle: BRAND_SUBTITLE,

  /** 作者名稱 */
  author: '阿璋',

  /** 作者職稱 */
  authorTitle: '全端工程師',

  /** 開發者/組織名稱 */
  organization: 'HaoTool',

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

  /** 網站 canonical URL（根站） */
  siteUrl: 'https://haotool.org/',

  /** 子 app 部署主機 URL */
  appsHostUrl: 'https://app.haotool.org/',
} as const;

export const AUTHOR_CONTACT_LINK_MAP = {
  email: {
    id: 'email',
    label: 'Email',
    // SSG HTML 禁止輸出 mailto: href（CF Email Obfuscation 治理）；hydration 後由 MailtoLink 注入。
    href: null,
    value: APP_INFO.email,
    external: false,
  },
  github: {
    id: 'github',
    label: 'GitHub',
    href: APP_INFO.github,
    value: 'haotool/app',
    external: true,
  },
  threads: {
    id: 'threads',
    label: 'Threads',
    href: APP_INFO.threadsUrl,
    value: APP_INFO.socialHandle,
    external: true,
  },
} as const;

export const AUTHOR_CONTACT_LINKS = [
  AUTHOR_CONTACT_LINK_MAP.email,
  AUTHOR_CONTACT_LINK_MAP.github,
  AUTHOR_CONTACT_LINK_MAP.threads,
] as const;

export const SEO_SOCIAL_LINKS = [APP_INFO.threadsUrl, APP_INFO.github] as const;

/**
 * 作者 Person SSOT — 用於 schema.org Person JSON-LD 與 E-E-A-T 信號。
 */
export const AUTHOR_PERSON = {
  name: APP_INFO.author,
  url: `${APP_INFO.siteUrl}about/`,
  sameAs: SEO_SOCIAL_LINKS as readonly string[],
  email: APP_INFO.email,
  jobTitle: APP_INFO.authorTitle,
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
  return `© ${getCopyrightYears()} ${APP_INFO.shortName} · ${APP_INFO.license}`;
}

export type AppInfo = typeof APP_INFO;
export type AuthorContactLink = (typeof AUTHOR_CONTACT_LINKS)[number];
