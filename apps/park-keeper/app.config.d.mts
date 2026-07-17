// 預渲染路徑全集（vite.config.ts includedRoutes 與 postbuild ssgDirs 消費）。
export declare const SEO_PATHS: string[];
// noindex 功能頁：需預渲染但不入 sitemap 與生產 SEO 語義驗證。
export declare const NOINDEX_PATHS: string[];
// sitemap 對外路徑 = SEO_PATHS - NOINDEX_PATHS（sitemap.xml 與 verify-sitemap-ssg 消費）。
export declare const SITEMAP_PATHS: string[];
export declare const SEO_FILES: string[];
export declare const IMAGE_RESOURCES: string[];
export declare const SITE_CONFIG: {
  url: string;
  name: string;
  title: string;
  description: string;
};
export declare const APP_CONFIG: {
  name: string;
  displayName: string;
  basePath: { development: string; ci: string; production: string };
  seoPaths: string[];
  siteUrl: string;
  build: { ssg: boolean; pwa: boolean };
  resources: { seoFiles: string[]; images: string[] };
};
export declare function normalizePath(path: string): string;
export declare function shouldPrerender(path: string): boolean;
export declare function getIncludedRoutes(paths: string[]): string[];
