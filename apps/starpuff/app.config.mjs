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
  '/icons/screenshot-gameplay.jpg',
];

export const SITE_CONFIG = {
  url: 'https://app.haotool.org/starpuff/',
  name: '星噗噗 StarPuff',
  shortName: 'StarPuff',
  title: '星噗噗 StarPuff｜免費橫向捲軸動作網頁遊戲・免下載離線可玩',
  description:
    '星噗噗 StarPuff 是免費網頁遊戲：橫向捲軸動作玩法，操控 Q 彈果凍球吸入果凍怪、化為九系星彈與星化變身，闖越果凍星球五大區域二十道關卡、挑戰五大魔王與 EX 變體。免下載、免註冊、無廣告，支援 PWA 安裝與離線遊玩，手機、平板與電腦開啟瀏覽器即可暢玩。',
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
