/**
 * TypeScript 類型定義 for seo-paths.config.mjs
 *
 * 這個文件為 SSOT 配置文件提供 TypeScript 類型支持
 */

export interface AppConfig {
  name: string;
  displayName: string;
  basePath: {
    development: string;
    ci: string;
    production: string;
  };
  seoPaths: string[];
  siteUrl: string;
  build: {
    ssg: boolean;
    pwa: boolean;
  };
  resources: {
    seoFiles: string[];
    images: string[];
  };
}

export declare const SEO_PATHS: readonly string[];
export declare const SEO_FILES: readonly string[];
export declare const IMAGE_RESOURCES: readonly string[];

export declare const SITE_CONFIG: {
  readonly url: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
};

export declare const APP_CONFIG: AppConfig;

export declare function normalizePath(path: string): string;
export declare function shouldPrerender(path: string): boolean;
export declare function getIncludedRoutes(paths: string[]): string[];
