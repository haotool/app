/**
 * Split-Meow App Configuration - SSOT
 *
 * ⚠️ 這是唯一的路徑配置來源，所有其他文件必須從這裡引用。
 *
 * 使用位置：
 * - vite.config.ts（basePath / PWA scope / start_url）
 * - scripts/lib/workspace-utils.mjs（自動發現 apps）
 */

export const SEO_PATHS = ['/'];

export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

export const IMAGE_RESOURCES = [
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.png',
  '/icons/icon-512.svg',
  '/icons/icon-512-maskable.png',
  '/icons/icon-512-maskable.svg',
];

export const SITE_CONFIG = {
  url: 'https://app.haotool.org/split-meow/',
  name: '喵喵分帳',
  title: '喵喵分帳 | 可離線的可愛分帳 PWA',
  description: '可愛又極簡的分帳工具，支援離線使用與安裝為 PWA。',
};

export const APP_CONFIG = {
  name: 'split-meow',
  displayName: '喵喵分帳',

  basePath: {
    development: '/',
    ci: '/split-meow/',
    production: '/split-meow/',
  },

  seoPaths: SEO_PATHS,
  siteUrl: SITE_CONFIG.url,

  build: {
    ssg: false,
    pwa: true,
  },

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
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized);
}

export function getIncludedRoutes(paths) {
  return paths.filter((path) => shouldPrerender(path));
}
