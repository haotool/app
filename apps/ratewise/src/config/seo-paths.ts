/**
 * SEO 路徑配置 - TypeScript SSOT
 *
 * ⚠️ 這是 TypeScript 代碼的單一真實來源 (SSOT)
 *
 * 同步要求：
 * - ../../seo-paths.config.mjs 必須與此文件保持同步（供 .js 腳本使用）
 * - 修改路徑時，必須同時更新 seo-paths.config.mjs
 *
 * 建立時間: 2025-12-14
 * 依據: [Linus: Single Source of Truth][SEO Best Practices 2025]
 */

/**
 * 確保 URL 具備尾斜線，避免 prerender/canonical 路徑拼接錯誤
 *
 * @param value - 原始 URL
 * @returns 具尾斜線的 URL
 */
export function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

/**
 * RateWise 所有需要預渲染的 SEO 路徑
 *
 * 總計：21 個路徑
 * - 8 個核心頁面：首頁、Multi、Favorites、Settings、FAQ、About、Privacy、Guide
 * - 13 個幣別落地頁：依字母順序排列
 *
 * 格式：統一使用尾斜線結尾（符合 SEO Best Practices 2025）
 */
export const SEO_PATHS = [
  // 核心頁面 (7)
  '/',
  '/multi/',
  '/favorites/',
  '/settings/',
  '/faq/',
  '/about/',
  '/privacy/',
  '/guide/',

  // 幣別落地頁 (13) - 依字母順序排列
  '/aud-twd/', // 澳幣 - Australian Dollar
  '/cad-twd/', // 加幣 - Canadian Dollar
  '/chf-twd/', // 瑞士法郎 - Swiss Franc
  '/cny-twd/', // 人民幣 - Chinese Yuan
  '/eur-twd/', // 歐元 - Euro
  '/gbp-twd/', // 英鎊 - British Pound
  '/hkd-twd/', // 港幣 - Hong Kong Dollar
  '/jpy-twd/', // 日圓 - Japanese Yen
  '/krw-twd/', // 韓元 - Korean Won
  '/nzd-twd/', // 紐幣 - New Zealand Dollar
  '/sgd-twd/', // 新加坡幣 - Singapore Dollar
  '/thb-twd/', // 泰銖 - Thai Baht
  '/usd-twd/', // 美金 - US Dollar
] as const;

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'] as const;

/**
 * 圖片資源路徑（用於生產環境驗證）
 */
export const IMAGE_RESOURCES = [
  '/og-image.png', // Open Graph 分享圖片
  '/favicon.ico', // Favicon
  '/apple-touch-icon.png', // Apple 觸控圖標
  '/icons/ratewise-icon-192x192.png', // PWA icon 192x192
  '/icons/ratewise-icon-512x512.png', // PWA icon 512x512
  '/icons/ratewise-icon-maskable-512x512.png', // PWA maskable icon
] as const;

/**
 * 網站基本配置
 */
export const SITE_CONFIG = {
  url: normalizeSiteUrl('https://app.haotool.org/ratewise/'),
  name: 'RateWise - 匯率好工具',
  title: 'RateWise - 即時匯率轉換器',
  description:
    'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。',
} as const satisfies Readonly<{
  url: string;
  name: string;
  title: string;
  description: string;
}>;

/**
 * 路徑標準化函數
 * 用於比較路徑時統一格式
 *
 * @param path - 原始路徑
 * @returns 標準化後的路徑（帶尾斜線，根路徑除外）
 */
export function normalizePath(path: string): string {
  if (path === '/' || path === '') return '/';
  // 確保前導斜線 + 移除尾斜線後再添加，確保一致性
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/, '') + '/';
}

/**
 * 檢查路徑是否應該被預渲染
 *
 * @param path - 要檢查的路徑
 * @returns 是否應該預渲染
 */
export function shouldPrerender(path: string): boolean {
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized as (typeof SEO_PATHS)[number]);
}

/**
 * 從所有路徑中過濾出需要預渲染的路徑
 *
 * @param paths - 所有可用路徑
 * @returns 需要預渲染的路徑
 */
export function getIncludedRoutes(paths: string[]): string[] {
  return paths.filter((path) => shouldPrerender(path));
}

// ============================================================================
// TypeScript 類型導出
// ============================================================================

/**
 * SEO 路徑字面類型（從配置中提取）
 * @example "/" | "/faq/" | "/about/" | ...
 */
export type SEOPath = (typeof SEO_PATHS)[number];

/**
 * SEO 檔案字面類型（從配置中提取）
 * @example "/sitemap.xml" | "/robots.txt" | "/llms.txt"
 */
export type SEOFile = (typeof SEO_FILES)[number];

/**
 * 圖片資源字面類型（從配置中提取）
 * @example "/og-image.png" | "/favicon.ico" | ...
 */
export type ImageResource = (typeof IMAGE_RESOURCES)[number];

/**
 * 網站配置類型
 */
export type SiteConfig = typeof SITE_CONFIG;

/**
 * 核心頁面路徑（7 個）
 */
export type CorePagePath =
  | '/'
  | '/multi/'
  | '/favorites/'
  | '/settings/'
  | '/faq/'
  | '/about/'
  | '/privacy/'
  | '/guide/';

/**
 * 幣別頁面路徑（後 13 個）
 */
export type CurrencyPagePath =
  | '/aud-twd/'
  | '/cad-twd/'
  | '/chf-twd/'
  | '/cny-twd/'
  | '/eur-twd/'
  | '/gbp-twd/'
  | '/hkd-twd/'
  | '/jpy-twd/'
  | '/krw-twd/'
  | '/nzd-twd/'
  | '/sgd-twd/'
  | '/thb-twd/'
  | '/usd-twd/';

// ============================================================================
// 類型守衛（Type Guards）
// ============================================================================

/**
 * 檢查路徑是否為有效的 SEO 路徑
 * @param path - 要檢查的路徑
 * @returns 是否為有效的 SEO 路徑
 */
export function isSEOPath(path: string): path is SEOPath {
  return SEO_PATHS.includes(path as SEOPath);
}

/**
 * 檢查路徑是否為核心頁面
 * @param path - 要檢查的路徑
 * @returns 是否為核心頁面
 */
export function isCorePagePath(path: string): path is CorePagePath {
  const corePaths: readonly CorePagePath[] = [
    '/',
    '/multi/',
    '/favorites/',
    '/settings/',
    '/faq/',
    '/about/',
    '/privacy/',
    '/guide/',
  ];
  return corePaths.includes(path as CorePagePath);
}

/**
 * 檢查路徑是否為幣別頁面
 * @param path - 要檢查的路徑
 * @returns 是否為幣別頁面
 */
export function isCurrencyPagePath(path: string): path is CurrencyPagePath {
  return isSEOPath(path) && !isCorePagePath(path);
}
