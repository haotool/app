/**
 * SEO 路徑配置 - TypeScript mirror
 *
 * 說明：
 * - `../../seo-paths.config.mjs` 供 Node 腳本與建置流程使用
 * - 本檔提供 app runtime 與 TypeScript 型別
 *
 * 兩者必須保持一致，避免 sitemap / prerender / noindex 白名單互相衝突。
 */

export function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

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
] as const;

export const LEGAL_SSG_PATHS = ['/privacy/'] as const;

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
] as const;

/** TWD→外幣方向的反向幣別 SEO 落地頁（出國換匯場景）。 */
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
] as const;

/**
 * 各幣別熱門金額（外幣→TWD 方向）
 * 與 seo-paths.config.mjs FORWARD_AMOUNTS 同步。
 */
const FORWARD_AMOUNTS: Record<string, number[]> = {
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

/**
 * 各幣別熱門台幣金額（TWD→外幣 方向）
 * 與 seo-paths.config.mjs REVERSE_TWD_AMOUNTS 同步。
 */
const REVERSE_TWD_AMOUNTS: Record<string, number[]> = {
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

/** 外幣→TWD 金額落地頁路徑（路徑型，/usd-twd/500/）。 */
export const CURRENCY_AMOUNT_SEO_PATHS: string[] = CURRENCY_SEO_PATHS.flatMap((path) => {
  const code = path.replace(/\//g, '').replace('-twd', '');
  return (FORWARD_AMOUNTS[code] ?? []).map((a) => `${path}${a}/`);
});

/** TWD→外幣 金額落地頁路徑（路徑型，/twd-usd/50000/）。 */
export const REVERSE_CURRENCY_AMOUNT_SEO_PATHS: string[] = REVERSE_CURRENCY_SEO_PATHS.flatMap(
  (path) => {
    const code = path.replace(/\//g, '').replace('twd-', '');
    return (REVERSE_TWD_AMOUNTS[code] ?? []).map((a) => `${path}${a}/`);
  },
);

// 注意：LEGAL_SSG_PATHS（privacy noindex）不納入 sitemap
// 注意：amount 落地頁（CURRENCY_AMOUNT_SEO_PATHS / REVERSE_CURRENCY_AMOUNT_SEO_PATHS）不含於此 const，
// 其路徑為動態生成（string[]），在 vite.config.ts 的 includedRoutes 中另行加入。
export const SEO_PATHS = [
  ...CONTENT_SEO_PATHS,
  ...CURRENCY_SEO_PATHS,
  ...REVERSE_CURRENCY_SEO_PATHS,
  ...CURRENCY_AMOUNT_SEO_PATHS,
  ...REVERSE_CURRENCY_AMOUNT_SEO_PATHS,
] as const;

export const APP_ONLY_PATHS = [
  '/multi/',
  '/favorites/',
  '/settings/',
  '/theme-showcase/',
  '/color-scheme/',
  '/update-prompt-test/',
  '/ui-showcase/',
] as const;

/** 使用者功能頁子集（前 3）：允許爬取 + SEOHelmet noindex */
export const APP_ONLY_NOINDEX_PATHS = APP_ONLY_PATHS.slice(0, 3);

/** 開發 / 展示頁子集（後 4）：直接 Disallow 爬取 */
export const DEV_ONLY_PATHS = APP_ONLY_PATHS.slice(3);

export const APP_ONLY_PRERENDER_PATHS = [...APP_ONLY_PATHS] as const;

export const PRERENDER_PATHS = [
  ...SEO_PATHS,
  ...LEGAL_SSG_PATHS,
  ...APP_ONLY_PRERENDER_PATHS,
] as const;

export const KNOWN_ROUTE_PATHS = [...PRERENDER_PATHS] as const;

export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt'] as const;

export const SHARE_IMAGE = '/og-image.jpg' as const;
export const TWITTER_IMAGE = '/twitter-image.jpg' as const;

export const LEGACY_ASSET_REDIRECTS = {
  '/og-image.png': SHARE_IMAGE,
  '/twitter-image.png': TWITTER_IMAGE,
} as const;

export const IMAGE_RESOURCES = [
  SHARE_IMAGE,
  TWITTER_IMAGE,
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/ratewise-icon-192x192.png',
  '/icons/ratewise-icon-512x512.png',
  '/icons/ratewise-icon-maskable-512x512.png',
] as const;

export const SITE_CONFIG = {
  url: normalizeSiteUrl('https://app.haotool.org/ratewise/'),
  name: 'RateWise 匯率好工具',
  title: 'RateWise — 台灣最精準匯率換算器',
  description:
    'RateWise 顯示臺灣銀行牌告的實際買賣價（非中間價），支援 TWD、USD、JPY、EUR 等 18 種貨幣，讓你換匯前就知道真正要付多少台幣。',
} as const satisfies Readonly<{
  url: string;
  name: string;
  title: string;
  description: string;
}>;

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
} as const;

export function normalizePath(path: string): string {
  if (path === '/' || path === '') return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, '');
  return trimmed === '' ? '/' : `${trimmed}/`;
}

export function shouldPrerender(path: string): boolean {
  const normalized = normalizePath(path);
  return PRERENDER_PATHS.includes(normalized);
}

export function getIncludedRoutes(paths: string[]): string[] {
  return paths.filter((path) => shouldPrerender(path));
}

export type SEOPath = (typeof SEO_PATHS)[number];
export type SEOFile = (typeof SEO_FILES)[number];
export type ImageResource = (typeof IMAGE_RESOURCES)[number];
export type SiteConfig = typeof SITE_CONFIG;
export type CorePagePath = (typeof CONTENT_SEO_PATHS)[number];
export type CurrencyPagePath = (typeof CURRENCY_SEO_PATHS)[number];
export type ReverseCurrencyPagePath = (typeof REVERSE_CURRENCY_SEO_PATHS)[number];
export type AppOnlyPath = (typeof APP_ONLY_PATHS)[number];

export function isSEOPath(path: string): path is SEOPath {
  return SEO_PATHS.includes(path);
}

export function isCorePagePath(path: string): path is CorePagePath {
  return CONTENT_SEO_PATHS.includes(path as CorePagePath);
}

export function isCurrencyPagePath(path: string): path is CurrencyPagePath {
  return CURRENCY_SEO_PATHS.includes(path as CurrencyPagePath);
}

export function isReverseCurrencyPagePath(path: string): path is ReverseCurrencyPagePath {
  return REVERSE_CURRENCY_SEO_PATHS.includes(path as ReverseCurrencyPagePath);
}

export function isAppOnlyPath(path: string): path is AppOnlyPath {
  return APP_ONLY_PATHS.includes(path as AppOnlyPath);
}
