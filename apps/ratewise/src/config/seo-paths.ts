/**
 * SEO 路徑集中配置
 *
 * 目的：避免路徑配置分散在多個文件中，確保一致性
 *
 * 使用：
 * - verify-production-seo.mjs: 生產環境檢測
 * - vite.config.ts: SSG 預渲染配置
 * - routes.tsx: 路由定義
 * - generate-sitemap.js: sitemap 生成
 *
 * 格式：統一使用尾斜線（符合 SEO 最佳實踐 2025）
 *
 * 建立時間: 2025-12-14
 * 依據: [SEO Best Practices 2025] 尾斜線一致性
 */

/**
 * RateWise 所有需要預渲染的 SEO 路徑
 *
 * 包含：
 * - 4 個核心頁面：首頁、FAQ、About、Guide
 * - 13 個幣別落地頁：USD-TWD, JPY-TWD, EUR-TWD 等
 *
 * 格式：所有路徑都使用尾斜線結尾（除根路徑 `/`）
 * 總計：17 個路徑
 */
export const SEO_PATHS = [
  // 核心頁面 (4)
  '/',
  '/faq/',
  '/about/',
  '/guide/',

  // 幣別落地頁 (13) - 依字母順序排列
  '/aud-twd/', // 澳幣
  '/cad-twd/', // 加幣
  '/chf-twd/', // 瑞士法郎
  '/cny-twd/', // 人民幣
  '/eur-twd/', // 歐元
  '/gbp-twd/', // 英鎊
  '/hkd-twd/', // 港幣
  '/jpy-twd/', // 日圓
  '/krw-twd/', // 韓元
  '/nzd-twd/', // 紐幣
  '/sgd-twd/', // 新加坡幣
  '/thb-twd/', // 泰銖
  '/usd-twd/', // 美金
] as const;

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'] as const;

/**
 * 路徑標準化函數
 * 用於比較路徑時統一格式
 *
 * @param path - 原始路徑
 * @returns 標準化後的路徑（帶尾斜線，根路徑除外）
 */
export function normalizePath(path: string): string {
  if (path === '/') return '/';
  // 移除尾斜線後再添加，確保一致性
  return path.replace(/\/+$/, '') + '/';
}

/**
 * 檢查路徑是否應該被預渲染
 *
 * @param path - 要檢查的路徑
 * @returns 是否應該預渲染
 */
export function shouldPrerender(path: string): boolean {
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized as (typeof SEO_PATHS)[number]);
}

/**
 * 從所有路徑中過濾出需要預渲染的路徑
 *
 * @param paths - 所有可用路徑
 * @returns 需要預渲染的路徑
 */
export function getIncludedRoutes(paths: string[]): string[] {
  return paths.filter((path) => shouldPrerender(path));
}

// 類型導出
export type SEOPath = (typeof SEO_PATHS)[number];
export type SEOFile = (typeof SEO_FILES)[number];
