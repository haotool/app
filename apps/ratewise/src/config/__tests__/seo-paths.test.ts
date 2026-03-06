import { describe, expect, it } from 'vitest';
import {
  APP_ONLY_PATHS,
  APP_ONLY_PRERENDER_PATHS,
  IMAGE_RESOURCES,
  PRERENDER_PATHS,
  SEO_FILES,
  SEO_PATHS,
  SHARE_IMAGE,
  SITE_CONFIG,
  TWITTER_IMAGE,
  getIncludedRoutes,
  isAppOnlyPath,
  isCorePagePath,
  isCurrencyPagePath,
  isSEOPath,
  normalizePath,
  shouldPrerender,
} from '../seo-paths';

describe('SEO Paths Configuration', () => {
  describe('normalizePath', () => {
    it('應該保持根路徑不變', () => {
      expect(normalizePath('/')).toBe('/');
      expect(normalizePath('')).toBe('/');
    });

    it('應該為普通路徑補上單一尾斜線', () => {
      expect(normalizePath('/faq')).toBe('/faq/');
      expect(normalizePath('/guide///')).toBe('/guide/');
      expect(normalizePath('usd-twd')).toBe('/usd-twd/');
    });
  });

  describe('shouldPrerender', () => {
    it('應該預渲染公開內容頁、法律頁與 app-only noindex 頁面', () => {
      expect(shouldPrerender('/')).toBe(true);
      expect(shouldPrerender('/faq')).toBe(true);
      expect(shouldPrerender('/privacy')).toBe(true);
      expect(shouldPrerender('/usd-twd')).toBe(true);
      expect(shouldPrerender('/multi')).toBe(true);
      expect(shouldPrerender('/favorites')).toBe(true);
      expect(shouldPrerender('/settings')).toBe(true);
    });

    it('不應該預渲染未知路徑', () => {
      expect(shouldPrerender('/not-found')).toBe(false);
    });
  });

  describe('getIncludedRoutes', () => {
    it('應該只保留需要預渲染的路徑並維持順序', () => {
      const paths = ['/', '/multi', '/faq', '/privacy', '/usd-twd', '/favorites'];
      expect(getIncludedRoutes(paths)).toEqual([
        '/',
        '/multi',
        '/faq',
        '/privacy',
        '/usd-twd',
        '/favorites',
      ]);
    });
  });

  describe('SEO 與路由白名單', () => {
    it('SEO_PATHS 應只包含 25 個公開可索引路徑', () => {
      expect(SEO_PATHS).toHaveLength(25);
      expect(SEO_PATHS).toContain('/');
      expect(SEO_PATHS).toContain('/faq/');
      expect(SEO_PATHS).toContain('/about/');
      expect(SEO_PATHS).toContain('/guide/');
      expect(SEO_PATHS).toContain('/privacy/');
      expect(SEO_PATHS).toContain('/sell-rate-vs-mid-rate/');
      expect(SEO_PATHS).toContain('/cash-vs-spot-rate/');
      expect(SEO_PATHS).toContain('/card-rate-guide/');
      expect(SEO_PATHS).toContain('/usd-twd/');
      expect(SEO_PATHS).not.toContain('/multi/');
      expect(SEO_PATHS).not.toContain('/favorites/');
      expect(SEO_PATHS).not.toContain('/settings/');
    });

    it('PRERENDER_PATHS 應包含公開 SEO 路徑與 app-only noindex 頁面', () => {
      expect(PRERENDER_PATHS).toHaveLength(32);
      expect(PRERENDER_PATHS).toEqual([...SEO_PATHS, ...APP_ONLY_PRERENDER_PATHS]);
      expect(PRERENDER_PATHS).toContain('/privacy/');
      expect(PRERENDER_PATHS).toContain('/favorites/');
      expect(PRERENDER_PATHS).toContain('/settings/');
    });

    it('APP_ONLY_PATHS 應與 SEO_PATHS 完全分離', () => {
      expect(APP_ONLY_PATHS).toHaveLength(7);
      APP_ONLY_PATHS.forEach((path) => {
        expect(SEO_PATHS).not.toContain(path as (typeof SEO_PATHS)[number]);
      });
    });
  });

  describe('Static resources', () => {
    it('應該包含必要 SEO 檔案', () => {
      expect(SEO_FILES).toEqual(['/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt']);
    });

    it('應該包含最新分享圖片 SSOT', () => {
      expect(SHARE_IMAGE).toBe('/og-image.jpg');
      expect(TWITTER_IMAGE).toBe('/twitter-image.jpg');
      expect(IMAGE_RESOURCES).toContain(SHARE_IMAGE);
      expect(IMAGE_RESOURCES).toContain(TWITTER_IMAGE);
      expect(IMAGE_RESOURCES).toHaveLength(7);
    });
  });

  describe('SITE_CONFIG', () => {
    it('應該維持正確網站 URL 與基本資訊', () => {
      expect(SITE_CONFIG.url).toBe('https://app.haotool.org/ratewise/');
      expect(SITE_CONFIG.name.length).toBeGreaterThan(0);
      expect(SITE_CONFIG.title.length).toBeGreaterThan(0);
      expect(SITE_CONFIG.description.length).toBeGreaterThan(0);
    });
  });

  describe('Type guards', () => {
    it('isSEOPath 應正確識別公開 SEO 路徑', () => {
      expect(isSEOPath('/faq/')).toBe(true);
      expect(isSEOPath('/usd-twd/')).toBe(true);
      expect(isSEOPath('/privacy/')).toBe(true);
      expect(isSEOPath('/multi/')).toBe(false);
    });

    it('isCorePagePath 應只識別公開內容頁', () => {
      expect(isCorePagePath('/')).toBe(true);
      expect(isCorePagePath('/faq/')).toBe(true);
      expect(isCorePagePath('/guide/')).toBe(true);
      expect(isCorePagePath('/privacy/')).toBe(false);
      expect(isCorePagePath('/multi/')).toBe(false);
    });

    it('isCurrencyPagePath 應只識別匯率落地頁', () => {
      expect(isCurrencyPagePath('/usd-twd/')).toBe(true);
      expect(isCurrencyPagePath('/jpy-twd/')).toBe(true);
      expect(isCurrencyPagePath('/faq/')).toBe(false);
    });

    it('isAppOnlyPath 應識別 app-only 頁面', () => {
      expect(isAppOnlyPath('/multi/')).toBe(true);
      expect(isAppOnlyPath('/favorites/')).toBe(true);
      expect(isAppOnlyPath('/ui-showcase/')).toBe(true);
      expect(isAppOnlyPath('/faq/')).toBe(false);
    });
  });
});
