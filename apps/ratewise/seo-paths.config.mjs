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
 * 格式：統一使用尾斜線結尾。
 */

import { APP_INFO } from './src/config/app-info.ts';

const withTrailingSlash = (value) => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export const normalizeSiteUrl = withTrailingSlash;

/**
 * 公開可索引內容頁（9 個）- 含 /seo-tech/ 技術揭露頁（2026-04-06 新增）
 */
export const CONTENT_SEO_PATHS = [
  '/',
  '/faq/',
  '/about/',
  '/guide/',
  '/sell-rate-vs-mid-rate/',
  '/cash-vs-spot-rate/',
  '/card-rate-guide/',
  '/open-data/',
  '/seo-tech/',
];

/** 法律頁：需預渲染，但維持 noindex，不納入 sitemap。 */
export const LEGAL_SSG_PATHS = ['/privacy/'];

/**
 * 匯率落地頁（17 個，外幣→TWD）
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
 * 反向幣別落地頁（17 個，TWD→外幣，出國換匯場景）
 */
export const REVERSE_CURRENCY_SEO_PATHS = [
  '/twd-aud/',
  '/twd-cad/',
  '/twd-chf/',
  '/twd-cny/',
  '/twd-eur/',
  '/twd-gbp/',
  '/twd-hkd/',
  '/twd-idr/',
  '/twd-jpy/',
  '/twd-krw/',
  '/twd-myr/',
  '/twd-nzd/',
  '/twd-php/',
  '/twd-sgd/',
  '/twd-thb/',
  '/twd-usd/',
  '/twd-vnd/',
];

/** 外幣→TWD 代表性 canonical 金額集合。 */
export const INDEXABLE_FORWARD_AMOUNTS = {
  aud: [1, 20, 50, 100, 500, 1000],
  cad: [1, 20, 50, 100, 500, 1000],
  chf: [1, 10, 50, 100, 500, 1000],
  cny: [1, 100, 500, 1000, 5000, 10000],
  eur: [1, 10, 50, 100, 500, 1000],
  gbp: [1, 10, 50, 100, 500, 1000],
  hkd: [1, 100, 500, 1000, 5000, 10000],
  idr: [10000, 50000, 100000, 500000, 1000000, 5000000],
  jpy: [1000, 3000, 5000, 10000, 30000, 50000, 100000],
  krw: [1000, 5000, 10000, 50000, 100000, 300000, 500000],
  myr: [1, 10, 50, 100, 500, 1000],
  nzd: [1, 10, 50, 100, 500, 1000],
  php: [100, 500, 1000, 3000, 5000, 10000],
  sgd: [1, 10, 50, 100, 500, 1000],
  thb: [100, 500, 1000, 3000, 5000, 10000],
  usd: [1, 10, 50, 100, 500, 1000],
  vnd: [10000, 50000, 100000, 500000, 1000000, 5000000],
};

/** TWD→外幣 代表性 canonical 金額集合。 */
export const INDEXABLE_REVERSE_TWD_AMOUNTS = {
  aud: [10000, 30000, 50000, 100000, 200000, 300000],
  cad: [10000, 30000, 50000, 100000, 200000, 300000],
  chf: [10000, 30000, 50000, 100000, 200000, 300000],
  cny: [5000, 10000, 30000, 50000, 100000, 200000],
  eur: [10000, 30000, 50000, 100000, 200000, 300000],
  gbp: [10000, 30000, 50000, 100000, 200000, 300000],
  hkd: [5000, 10000, 30000, 50000, 100000, 200000],
  idr: [3000, 5000, 10000, 30000, 50000, 100000],
  jpy: [10000, 30000, 50000, 100000, 200000, 300000],
  krw: [5000, 10000, 30000, 50000, 100000, 200000],
  myr: [3000, 5000, 10000, 30000, 50000, 100000],
  nzd: [10000, 30000, 50000, 100000, 200000, 300000],
  php: [3000, 5000, 10000, 30000, 50000, 100000],
  sgd: [5000, 10000, 30000, 50000, 100000, 200000],
  thb: [5000, 10000, 30000, 50000, 100000, 200000],
  usd: [10000, 30000, 50000, 100000, 200000, 300000],
  vnd: [3000, 5000, 10000, 30000, 50000, 100000],
};

/**
 * 外幣→TWD 金額落地頁路徑（路徑型，Wise pattern）
 * 例：/usd-twd/500/
 */
export const INDEXABLE_AMOUNT_SEO_PATHS = CURRENCY_SEO_PATHS.flatMap((path) => {
  // path 格式：'/usd-twd/'
  const code = path.replace(/\//g, '').replace('-twd', '');
  return (INDEXABLE_FORWARD_AMOUNTS[code] ?? []).map((a) => `${path}${a}/`);
});

/**
 * TWD→外幣 金額落地頁路徑（路徑型）
 * 例：/twd-usd/50000/
 */
export const INDEXABLE_REVERSE_AMOUNT_SEO_PATHS = REVERSE_CURRENCY_SEO_PATHS.flatMap((path) => {
  // path 格式：'/twd-usd/'
  const code = path.replace(/\//g, '').replace('twd-', '');
  return (INDEXABLE_REVERSE_TWD_AMOUNTS[code] ?? []).map((a) => `${path}${a}/`);
});

/** canonical 索引頁。 */
export const INDEXABLE_CANONICAL_PATHS = [
  ...CONTENT_SEO_PATHS,
  ...CURRENCY_SEO_PATHS,
  ...REVERSE_CURRENCY_SEO_PATHS,
  ...INDEXABLE_AMOUNT_SEO_PATHS,
  ...INDEXABLE_REVERSE_AMOUNT_SEO_PATHS,
];

/** 相容別名：公開可索引 SEO 路徑。 */
export const SEO_PATHS = INDEXABLE_CANONICAL_PATHS;

/**
 * 需要回傳 app shell 的互動頁面（app-only）
 *
 * 排列順序：前 3 個為使用者功能頁（noindex 處理），後 4 個為開發展示頁（Disallow 處理）
 * ─ 使用者功能頁：允許爬取，由 SEOHelmet noindex 排除索引（Google 官方建議）
 * ─ 開發展示頁：直接 Disallow，無使用者價值，無需 noindex
 *
 * 注：/seo-tech/ 已移至 CONTENT_SEO_PATHS 成為可索引頁面（2026-04-07）
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

/** 使用者功能頁子集（前 3）：允許爬取 + noindex meta */
export const APP_ONLY_NOINDEX_PATHS = APP_ONLY_PATHS.slice(0, 3);

/** 開發 / 展示頁子集（後 4）：Disallow 爬取 */
export const DEV_ONLY_PATHS = APP_ONLY_PATHS.slice(3);

/**
 * 需要預渲染的 app-only 路由
 *
 * 雖然不應出現在 sitemap，但要直接輸出 noindex 首屏 HTML。
 */
export const APP_ONLY_PRERENDER_PATHS = [...APP_ONLY_PATHS];

/** 建置期輸出頁面。實際數量以 STATS 為準。 */
export const PRERENDER_PATHS = [...SEO_PATHS, ...LEGAL_SSG_PATHS, ...APP_ONLY_PRERENDER_PATHS];

/** 支援的動態金額路由規則。 */
export const SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS = [
  /^\/([a-z]{3})-([a-z]{3})\/(\d+(?:\.\d+)?)\/?$/i,
];

/**
 * 輔助函數：生成 getStaticPaths 用的路由數組（供 vite-react-ssg 使用）
 * 在構建時，vite-react-ssg 會調用此函數確定要預渲染哪些動態路由
 */
export function getStaticAmountPaths() {
  return [...INDEXABLE_AMOUNT_SEO_PATHS, ...INDEXABLE_REVERSE_AMOUNT_SEO_PATHS];
}

/** 統計資訊。 */
export const STATS = {
  content: CONTENT_SEO_PATHS.length,
  currency: CURRENCY_SEO_PATHS.length,
  reverseCurrency: REVERSE_CURRENCY_SEO_PATHS.length,
  currencyAmount: INDEXABLE_AMOUNT_SEO_PATHS.length,
  reverseCurrencyAmount: INDEXABLE_REVERSE_AMOUNT_SEO_PATHS.length,
  legal: LEGAL_SSG_PATHS.length,
  appOnly: APP_ONLY_PRERENDER_PATHS.length,
  total: PRERENDER_PATHS.length,
};

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
  name: APP_INFO.name,
  title: `${APP_INFO.shortName} — 台灣最精準匯率換算器`,
  description: `${APP_INFO.shortName} 顯示臺灣銀行牌告的實際買賣價（非中間價），讓你換匯前知道真正要付多少台幣。支援 18 種貨幣，每 5 分鐘同步，免費無廣告。`,
};

/**
 * 匯率資料 CDN 端點 - 單一真實來源 (SSOT)
 *
 * 使用位置（.mjs scripts，無法 import TypeScript 的 api-endpoints.ts）：
 * - scripts/generate-api-json.mjs
 * - scripts/generate-pair-json.mjs
 * - scripts/generate-openapi.mjs
 *
 * TypeScript src 使用 src/config/api-endpoints.ts（值相同，型別更完整）。
 */
const GITHUB_REPO = 'haotool/app';
const DATA_BRANCH = 'data';

/** GitHub Raw 資料根路徑（無快取，永遠最新）*/
export const RAW_DATA_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${DATA_BRANCH}`;

/** jsDelivr CDN 資料根路徑（12-24h 快取，備援用）*/
export const CDN_DATA_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@${DATA_BRANCH}`;

/**
 * 統一應用配置 - 單一真實來源 (SSOT)
 */
export const APP_CONFIG = {
  name: 'ratewise',
  displayName: APP_INFO.shortName,
  basePath: {
    development: '/',
    ci: '/',
    production: '/ratewise/',
  },
  seoPaths: SEO_PATHS,
  prerenderPaths: PRERENDER_PATHS,
  supportedDynamicRoutePatterns: SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS.map(
    (pattern) => pattern.source,
  ),
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

/** 相容別名：保留舊常數名稱。 */
export const FORWARD_AMOUNTS = INDEXABLE_FORWARD_AMOUNTS;
export const REVERSE_TWD_AMOUNTS = INDEXABLE_REVERSE_TWD_AMOUNTS;
export const CURRENCY_AMOUNT_SEO_PATHS = INDEXABLE_AMOUNT_SEO_PATHS;
export const REVERSE_CURRENCY_AMOUNT_SEO_PATHS = INDEXABLE_REVERSE_AMOUNT_SEO_PATHS;
