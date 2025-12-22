/**
 * SEO 路徑配置 - 單一真實來源 (SSOT)
 *
 * ⚠️ 這是唯一的路徑配置來源，所有其他文件必須從這裡引用
 *
 * 使用位置：
 * - src/config/seo-paths.ts (TypeScript wrapper)
 * - vite.config.ts (SSG 預渲染)
 * - scripts/generate-sitemap.js (Sitemap 生成)
 * - scripts/verify-production-seo.mjs (生產環境檢測)
 *
 * 格式：統一使用尾斜線結尾（符合 SEO Best Practices 2025）
 *
 * 建立時間: 2025-12-14
 * 依據: [Linus: Single Source of Truth][SEO Best Practices 2025]
 */

const withTrailingSlash = (value) => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export const normalizeSiteUrl = withTrailingSlash;

/**
 * RateWise 所有需要預渲染的 SEO 路徑
 *
 * 總計：17 個路徑
 * - 4 個核心頁面：首頁、FAQ、About、Guide
 * - 13 個幣別落地頁：依字母順序排列
 */
export const SEO_PATHS = [
  // 核心頁面 (4)
  '/',
  '/faq/',
  '/about/',
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
];

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

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
];

/**
 * 路徑標準化函數
 * 用於比較路徑時統一格式
 *
 * @param {string} path - 原始路徑
 * @returns {string} 標準化後的路徑（帶尾斜線，根路徑除外）
 */
export function normalizePath(path) {
  if (path === '/') return '/';
  // 移除尾斜線後再添加，確保一致性
  return path.replace(/\/+$/, '') + '/';
}

/**
 * 檢查路徑是否應該被預渲染
 *
 * @param {string} path - 要檢查的路徑
 * @returns {boolean} 是否應該預渲染
 */
export function shouldPrerender(path) {
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized);
}

/**
 * 從所有路徑中過濾出需要預渲染的路徑
 *
 * @param {string[]} paths - 所有可用路徑
 * @returns {string[]} 需要預渲染的路徑
 */
export function getIncludedRoutes(paths) {
  return paths.filter((path) => shouldPrerender(path));
}

/**
 * 網站基本配置
 */
export const SITE_CONFIG = {
  url: withTrailingSlash('https://app.haotool.org/ratewise/'),
  name: 'RateWise - 匯率好工具',
  title: 'RateWise - 即時匯率轉換器',
  description:
    'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。',
};

/**
 * 統一應用配置 - 單一真實來源 (SSOT)
 *
 * 用於 workspace-utils.mjs 自動發現和 CI 批次檢測
 *
 * @type {{
 *   name: string,
 *   displayName: string,
 *   basePath: {development: string, ci: string, production: string},
 *   seoPaths: string[],
 *   siteUrl: string,
 *   build: {ssg: boolean, pwa: boolean},
 *   resources: {seoFiles: string[], images: string[]}
 * }}
 */
export const APP_CONFIG = {
  // 應用識別
  name: 'ratewise',
  displayName: 'RateWise',

  // 部署路徑配置
  basePath: {
    development: '/',
    ci: '/',
    production: '/ratewise/',
  },

  // SEO 路徑 (從現有 SEO_PATHS 導入)
  seoPaths: SEO_PATHS,
  siteUrl: SITE_CONFIG.url,

  // 建置配置
  build: {
    ssg: true,
    pwa: true,
  },

  // 資源配置
  resources: {
    seoFiles: SEO_FILES,
    images: IMAGE_RESOURCES,
  },
};
