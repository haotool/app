/**
 * SEO 路徑配置 - TypeScript SSOT
 *
 * ⚠️ 這是 TypeScript 代碼的單一真實來源 (SSOT)
 *
 * 建立時間: 2025-12-29
 * 依據: [Linus: Single Source of Truth][SEO Best Practices 2025]
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 */

/**
 * 確保 URL 具備尾斜線，避免 prerender/canonical 路徑拼接錯誤
 */
export function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

/**
 * Quake-School 所有需要預渲染的 SEO 路徑
 *
 * 格式：統一使用尾斜線結尾（符合 SEO Best Practices 2025）
 */
export const SEO_PATHS = [
  // 核心頁面
  '/',
  '/about/',
  '/faq/',
  '/guide/',
] as const;

/**
 * SEO 配置文件路徑
 */
export const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'] as const;

/**
 * 圖片資源路徑（用於生產環境驗證）
 */
export const IMAGE_RESOURCES = [
  '/og-image.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
] as const;

/**
 * 網站基本配置
 */
export const SITE_CONFIG = {
  url: normalizeSiteUrl('https://app.haotool.org/quake-school/'),
  name: 'Quake-School 地震防災教室',
  title: 'Quake-School 地震防災教室 | 台灣地震知識與防災準備',
  description:
    'Quake-School 提供台灣地震防災教育，包含地震知識、防災準備、避難指南等完整資訊。PWA 離線可用。',
} as const satisfies Readonly<{
  url: string;
  name: string;
  title: string;
  description: string;
}>;

/**
 * 路徑標準化函數
 */
export function normalizePath(path: string): string {
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') + '/';
}

/**
 * 檢查路徑是否應該被預渲染
 */
export function shouldPrerender(path: string): boolean {
  const normalized = normalizePath(path);
  return SEO_PATHS.includes(normalized as (typeof SEO_PATHS)[number]);
}

/**
 * 從所有路徑中過濾出需要預渲染的路徑
 */
export function getIncludedRoutes(paths: string[]): string[] {
  return paths.filter((path) => shouldPrerender(path));
}

// TypeScript 類型導出
export type SEOPath = (typeof SEO_PATHS)[number];
export type SEOFile = (typeof SEO_FILES)[number];
export type ImageResource = (typeof IMAGE_RESOURCES)[number];
export type SiteConfig = typeof SITE_CONFIG;
