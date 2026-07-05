import { describe, expect, it } from 'vitest';
import { APP_CONFIG, APP_ONLY_NOINDEX_PATHS, DEV_ONLY_PATHS, PRERENDER_PATHS } from '../seo-paths';

const internalOnlyRoutes = [
  '/theme-showcase/',
  '/color-scheme/',
  '/update-prompt-test/',
  '/ui-showcase/',
] as const;

describe('RateWise public route surface', () => {
  it('keeps only real user app routes in public noindex app paths', () => {
    // /open-source/ 為 E4 新增的 noindex 內容頁：可爬取讀 noindex、不入 sitemap。
    expect(APP_ONLY_NOINDEX_PATHS).toEqual([
      '/multi/',
      '/favorites/',
      '/settings/',
      '/open-source/',
    ]);
  });

  it('keeps internal-only routes out of production prerender paths', () => {
    for (const route of internalOnlyRoutes) {
      expect(PRERENDER_PATHS).not.toContain(route);
    }
  });

  it('keeps internal-only routes out of production app shell paths', () => {
    for (const route of internalOnlyRoutes) {
      expect(APP_CONFIG.appShellPaths).not.toContain(route);
    }
  });

  it('tracks internal-only routes separately for development tooling', () => {
    expect(DEV_ONLY_PATHS).toEqual([...internalOnlyRoutes]);
  });
});
