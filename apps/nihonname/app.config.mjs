/**
 * NihonName App Configuration - SSOT
 *
 * ⚠️ 這是唯一的路徑配置來源，所有其他文件必須從這裡引用
 *
 * 使用位置：
 * - src/routes.tsx (路由定義)
 * - vite.config.ts (SSG 預渲染)
 * - scripts/generate-sitemap.js (Sitemap 生成)
 * - scripts/verify-production-seo.mjs (生產環境檢測)
 *
 * 格式：統一使用尾斜線結尾（符合 SEO Best Practices 2025）
 *
 * 建立時間: 2025-12-15
 * 依據: [Linus: Single Source of Truth][SEO Best Practices 2025]
 */

/**
 * NihonName 所有需要預渲染的 SEO 路徑
 *
 * 總計：8 個路徑
 * - 4 個核心頁面：首頁、About、Guide、FAQ
 * - 4 個歷史專區頁面：索引、小民家運動、馬關條約、舊金山和約
 */
export const SEO_PATHS = [
  // 核心頁面 (4)
  '/',
  '/about/',
  '/guide/',
  '/faq/',

  // 歷史專區 (4)
  '/history/',
  '/history/kominka/',
  '/history/shimonoseki/',
  '/history/san-francisco/',
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
];

/**
 * 網站基本配置
 */
export const SITE_CONFIG = {
  url: 'https://app.haotool.org/nihonname/',
  name: 'NihonName - 日本名正名運動',
  title: 'NihonName - 為什麼要叫日本為「日本」？',
  description:
    'NihonName 正名運動：探討「日本」稱呼的歷史源流，從小民家運動到馬關條約，了解日本國名的真實意涵。',
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
  name: 'nihonname',
  displayName: 'NihonName',

  // 部署路徑配置
  basePath: {
    development: '/',
    ci: '/nihonname/',
    production: '/nihonname/',
  },

  // SEO 路徑
  seoPaths: SEO_PATHS,
  siteUrl: SITE_CONFIG.url,

  // 建置配置
  build: {
    ssg: true,
    pwa: false,
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
