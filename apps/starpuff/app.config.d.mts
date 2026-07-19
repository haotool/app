// app.config.mjs 型別宣告：讓 src/seo 以型別安全方式引用站點 SSOT。
export declare const SEO_PATHS: string[];
export declare const SEO_FILES: string[];
export declare const IMAGE_RESOURCES: string[];

export declare const SITE_CONFIG: {
  url: string;
  name: string;
  shortName: string;
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
