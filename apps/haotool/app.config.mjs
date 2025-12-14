/**
 * HaoTool App Configuration - SSOT
 *
 * ⚠️ 這是唯一的路徑配置來源，所有其他文件必須從這裡引用
 *
 * 使用位置：
 * - src/routes.tsx (路由定義)
 * - vite.config.ts (SSG 預渲染)
 * - scripts/verify-production-seo.mjs (生產環境檢測)
 *
 * 格式：統一使用尾斜線結尾（符合 SEO Best Practices 2025）
 *
 * 建立時間: 2025-12-15
 * 依據: [Linus: Single Source of Truth][SEO Best Practices 2025]
 */

/**
 * HaoTool 所有需要預渲染的 SEO 路徑
 *
 * 總計：4 個路徑
 * - 首頁、專案列表、關於、聯絡
 */
export const SEO_PATHS = ['/', '/projects/', '/about/', '/contact/'];

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt'];

/**
 * 圖片資源路徑（用於生產環境驗證）
 */
export const IMAGE_RESOURCES = [
  '/og-image.png', // Open Graph 分享圖片
  '/favicon.ico', // Favicon
  '/icons/icon-192x192.png', // PWA icon 192x192
  '/icons/icon-512x512.png', // PWA icon 512x512
  '/icons/maskable-icon-512x512.png', // PWA maskable icon
];

/**
 * 網站基本配置
 */
export const SITE_CONFIG = {
  url: 'https://app.haotool.org/',
  name: 'HAOTOOL.ORG - Digital Portfolio',
  title: 'HAOTOOL.ORG - Full-Stack Developer Portfolio',
  description:
    'Full-stack developer portfolio showcasing high-performance web applications built with modern technologies.',
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
  name: 'haotool',
  displayName: 'HaoTool',

  // 部署路徑配置
  basePath: {
    development: '/',
    ci: '/',
    production: '/',
  },

  // SEO 路徑
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
