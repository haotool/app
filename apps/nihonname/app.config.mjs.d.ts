/**
 * Type definitions for app.config.mjs
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

export const SEO_PATHS: string[];
export const SEO_FILES: string[];
export const IMAGE_RESOURCES: string[];
export const SITE_CONFIG: {
  url: string;
  name: string;
  title: string;
  description: string;
};
export const APP_CONFIG: AppConfig;

export function normalizePath(path: string): string;
export function shouldPrerender(path: string): boolean;
export function getIncludedRoutes(paths: string[]): string[];
