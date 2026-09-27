/**
 * A320neo Flight Deck App Configuration - SSOT
 *
 * 使用位置：
 * - vite.config.ts（basePath）
 * - scripts/lib/workspace-utils.mjs（自動發現 apps → Cloudflare Pages 組裝與資源驗證）
 */

export const SEO_PATHS = ['/'];

export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

export const IMAGE_RESOURCES = [
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/og-image.jpg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
];

export const SITE_CONFIG = {
  url: 'https://app.haotool.org/a320-flight-deck/',
  name: 'A320neo 沉浸式駕駛艙',
  shortName: 'A320neo',
  title: 'A320neo 沉浸式駕駛艙 | 物理驅動的網頁飛行模擬',
  description:
    '以真實飛行物理、線傳飛控、自動駕駛與可操作 3D 駕駛艙打造的 A320neo 網頁飛行模擬，支援自動降落展示、電影運鏡與中英文介面。',
};

export const APP_CONFIG = {
  name: 'a320-flight-deck',
  displayName: 'A320neo 沉浸式駕駛艙',

  basePath: {
    development: '/',
    ci: '/a320-flight-deck/',
    production: '/a320-flight-deck/',
  },

  seoPaths: SEO_PATHS,
  siteUrl: SITE_CONFIG.url,

  build: {
    ssg: false,
    pwa: true,
  },

  // 單頁 WebGL 應用（無 client-side URL routing）：未知子路徑維持真 404

  resources: {
    seoFiles: SEO_FILES,
    images: IMAGE_RESOURCES,
  },
};

export function normalizePath(path) {
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') + '/';
}

export function shouldPrerender(path) {
  return SEO_PATHS.includes(normalizePath(path));
}

export function getIncludedRoutes(paths) {
  return paths.filter((path) => shouldPrerender(path));
}
