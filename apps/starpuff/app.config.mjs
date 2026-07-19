/**
 * StarPuff App Configuration - SSOT
 *
 * ⚠️ 這是唯一的路徑配置來源，所有其他文件必須從這裡引用。
 *
 * 使用位置：
 * - scripts/lib/workspace-utils.mjs（自動發現 apps）
 */

export const SEO_PATHS = ['/'];

export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

export const IMAGE_RESOURCES = [
  '/icons/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/icon-512.svg',
  '/icons/og-image.jpg',
];

export const SITE_CONFIG = {
  url: 'https://app.haotool.org/starpuff/',
  name: '星噗噗 StarPuff',
  title: '星噗噗 StarPuff｜吸入果凍怪的 Q 彈動作小遊戲',
  description: '直向 Boss Rush 動作小遊戲：吸入果凍怪、化為星彈、擊敗果凍王。免安裝、離線可玩。',
};

export const APP_CONFIG = {
  name: 'starpuff',
  displayName: '星噗噗 StarPuff',

  basePath: {
    development: '/',
    ci: '/starpuff/',
    production: '/starpuff/',
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
