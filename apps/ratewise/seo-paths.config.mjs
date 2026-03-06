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
 * 公開可索引內容頁（4 個）
 */
export const CONTENT_SEO_PATHS = ['/', '/faq/', '/about/', '/guide/'];

/**
 * 公開法律頁面：保留 SSG，但不主動放進 sitemap
 */
export const LEGAL_SSG_PATHS = ['/privacy/'];

/**
 * 匯率落地頁（17 個）
 */
export const CURRENCY_SEO_PATHS = [
  '/aud-twd/',
  '/cad-twd/',
  '/chf-twd/',
  '/cny-twd/',
  '/eur-twd/',
  '/gbp-twd/',
  '/hkd-twd/',
  '/idr-twd/',
  '/jpy-twd/',
  '/krw-twd/',
  '/myr-twd/',
  '/nzd-twd/',
  '/php-twd/',
  '/sgd-twd/',
  '/thb-twd/',
  '/usd-twd/',
  '/vnd-twd/',
];

/**
 * 公開可索引 SEO 路徑（21 個）
 */
export const SEO_PATHS = [...CONTENT_SEO_PATHS, ...CURRENCY_SEO_PATHS];

/**
 * 需要回傳 app shell 的互動頁面（app-only）
 */
export const APP_ONLY_PATHS = [
  '/multi/',
  '/favorites/',
  '/settings/',
  '/theme-showcase/',
  '/color-scheme/',
  '/update-prompt-test/',
  '/ui-showcase/',
];

/**
 * 需要預渲染的 app-only 路由
 *
 * 雖然不應出現在 sitemap，但要直接輸出 noindex 首屏 HTML。
 */
export const APP_ONLY_PRERENDER_PATHS = [...APP_ONLY_PATHS];

/**
 * 需要預渲染的靜態內容頁
 */
export const PRERENDER_PATHS = [...SEO_PATHS, ...LEGAL_SSG_PATHS, ...APP_ONLY_PRERENDER_PATHS];

/**
 * 所有已知前端路由
 */
export const KNOWN_ROUTE_PATHS = [...PRERENDER_PATHS];

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt'];

/**
 * 社交分享圖片與舊資源相容重定向
 */
export const SHARE_IMAGE = '/og-image.jpg';
export const TWITTER_IMAGE = '/twitter-image.jpg';
export const LEGACY_ASSET_REDIRECTS = {
  '/og-image.png': SHARE_IMAGE,
  '/twitter-image.png': TWITTER_IMAGE,
};

/**
 * 圖片資源路徑（用於生產環境驗證）
 */
export const IMAGE_RESOURCES = [
  SHARE_IMAGE,
  TWITTER_IMAGE,
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/ratewise-icon-192x192.png',
  '/icons/ratewise-icon-512x512.png',
  '/icons/ratewise-icon-maskable-512x512.png',
];

/**
 * 路徑標準化函數
 *
 * @param {string} path - 原始路徑
 * @returns {string} 標準化後的路徑（帶尾斜線，根路徑除外）
 */
export function normalizePath(path) {
  if (path === '/' || path === '') return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, '');
  return trimmed === '' ? '/' : `${trimmed}/`;
}

/**
 * 檢查路徑是否應該被預渲染
 *
 * @param {string} path - 要檢查的路徑
 * @returns {boolean} 是否應該預渲染
 */
export function shouldPrerender(path) {
  const normalized = normalizePath(path);
  return PRERENDER_PATHS.includes(normalized);
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
  title: 'RateWise — 台灣最精準匯率換算器',
  description:
    'RateWise 顯示臺灣銀行牌告的實際買賣價（非中間價），支援 TWD、USD、JPY、EUR 等 18 種貨幣，讓你換匯前就知道真正要付多少台幣。',
};

/**
 * 統一應用配置 - 單一真實來源 (SSOT)
 */
export const APP_CONFIG = {
  name: 'ratewise',
  displayName: 'RateWise',
  basePath: {
    development: '/',
    ci: '/',
    production: '/ratewise/',
  },
  seoPaths: SEO_PATHS,
  prerenderPaths: PRERENDER_PATHS,
  appShellPaths: APP_ONLY_PATHS,
  knownRoutes: KNOWN_ROUTE_PATHS,
  legacyAssetRedirects: LEGACY_ASSET_REDIRECTS,
  siteUrl: SITE_CONFIG.url,
  build: {
    ssg: true,
    pwa: true,
  },
  resources: {
    seoFiles: SEO_FILES,
    images: IMAGE_RESOURCES,
  },
};
