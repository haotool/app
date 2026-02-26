/**
 * Park-Keeper App Configuration - SSOT
 *
 * ⚠️ 這是唯一的路徑配置來源，所有其他文件必須從這裡引用
 *
 * 使用位置：
 * - vite.config.ts (SSG 路徑)
 * - scripts/generate-sitemap.js (Sitemap 生成)
 * - scripts/verify-production-seo.mjs (生產環境檢測)
 *
 * 格式：統一使用尾斜線結尾（符合 SEO Best Practices 2025）
 *
 * 建立時間: 2026-02-25
 * 依據: [Linus: Single Source of Truth][SEO Best Practices 2025]
 */

/**
 * Park-Keeper 所有需要預渲染的 SEO 路徑
 *
 * 總計：3 個路徑
 * - 首頁、關於、設定
 */
export const SEO_PATHS = ['/', '/about/', '/settings/'];

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

/**
 * 圖片資源路徑（用於生產環境驗證）
 */
export const IMAGE_RESOURCES = [
  '/og-image.svg',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

/**
 * 網站基本配置
 */
export const SITE_CONFIG = {
  url: 'https://app.haotool.org/park-keeper/',
  name: '停車好工具',
  title: '停車好工具 — 台灣最好用的免費停車記錄與導航 App',
  description:
    '台灣最好用的停車工具！免費記錄車牌、樓層、GPS 座標與照片，羅盤導航秒找愛車。PWA 離線可用、零註冊、完全隱私。',
};

/**
 * 統一應用配置 - 單一真實來源 (SSOT)
 */
export const APP_CONFIG = {
  name: 'park-keeper',
  displayName: '停車好工具',

  basePath: {
    development: '/',
    ci: '/park-keeper/',
    production: '/park-keeper/',
  },

  seoPaths: SEO_PATHS,
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

/**
 * 路徑標準化函數
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path) {
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') + '/';
}

/**
 * 檢查路徑是否應該被預渲染
 * @param {string} path
 * @returns {boolean}
 */
export function shouldPrerender(path) {
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized);
}

/**
 * 從所有路徑中過濾出需要預渲染的路徑
 * @param {string[]} paths
 * @returns {string[]}
 */
export function getIncludedRoutes(paths) {
  return paths.filter((path) => shouldPrerender(path));
}
