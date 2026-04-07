import { describe, expect, it } from 'vitest';
import {
  APP_ONLY_PATHS,
  CURRENCY_AMOUNT_SEO_PATHS,
  IMAGE_RESOURCES,
  PRERENDER_PATHS,
  REVERSE_CURRENCY_AMOUNT_SEO_PATHS,
  REVERSE_CURRENCY_SEO_PATHS,
  SEO_FILES,
  SEO_PATHS,
  SHARE_IMAGE,
  SITE_CONFIG,
  TWITTER_IMAGE,
  getIncludedRoutes,
  isAppOnlyPath,
  isCorePagePath,
  isCurrencyPagePath,
  isReverseCurrencyPagePath,
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
      expect(shouldPrerender('/twd-usd')).toBe(true);
      expect(shouldPrerender('/twd-jpy')).toBe(true);
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
    it('SEO_PATHS 應包含全部公開可索引路徑，含金額落地頁', () => {
      // SEO_PATHS = CONTENT_SEO_PATHS(9) + CURRENCY_SEO_PATHS(17) + REVERSE_CURRENCY_SEO_PATHS(17)
      //          + CURRENCY_AMOUNT_SEO_PATHS(104) + REVERSE_CURRENCY_AMOUNT_SEO_PATHS(102) = 249
      // 注：CONTENT_SEO_PATHS 包含 /seo-tech/（2026-04-07 從 APP_ONLY_PATHS 移至可索引）
      expect(SEO_PATHS).toHaveLength(
        9 + 17 + 17 + CURRENCY_AMOUNT_SEO_PATHS.length + REVERSE_CURRENCY_AMOUNT_SEO_PATHS.length,
      );
      expect(SEO_PATHS).toContain('/');
      expect(SEO_PATHS).toContain('/faq/');
      expect(SEO_PATHS).toContain('/about/');
      expect(SEO_PATHS).toContain('/guide/');
      expect(SEO_PATHS).not.toContain('/privacy/'); // noindex 頁不納入 sitemap
      expect(SEO_PATHS).toContain('/sell-rate-vs-mid-rate/');
      expect(SEO_PATHS).toContain('/cash-vs-spot-rate/');
      expect(SEO_PATHS).toContain('/card-rate-guide/');
      expect(SEO_PATHS).toContain('/open-data/');
      expect(SEO_PATHS).toContain('/usd-twd/');
      expect(SEO_PATHS).toContain('/usd-twd/500/');
      expect(SEO_PATHS).toContain('/twd-usd/10000/');
      expect(SEO_PATHS).toContain('/twd-usd/');
      expect(SEO_PATHS).toContain('/twd-jpy/');
      expect(SEO_PATHS).not.toContain('/multi/');
      expect(SEO_PATHS).not.toContain('/favorites/');
      expect(SEO_PATHS).not.toContain('/settings/');
    });

    it('PRERENDER_PATHS 應包含公開 SEO 路徑、法律頁與 app-only noindex 頁面', () => {
      expect(PRERENDER_PATHS).toHaveLength(257);
      // PRERENDER_PATHS = SEO_PATHS(249) + LEGAL_SSG_PATHS(1) + APP_ONLY_PRERENDER_PATHS(7) = 257
      // 注：SEO_PATHS +1（/seo-tech/ 移入），APP_ONLY_PRERENDER_PATHS -1（/seo-tech/ 移出），相消
      expect(PRERENDER_PATHS).toContain('/privacy/'); // 仍需預渲染，但不在 sitemap
      expect(PRERENDER_PATHS).toContain('/favorites/');
      expect(PRERENDER_PATHS).toContain('/settings/');
    });

    it('REVERSE_CURRENCY_SEO_PATHS 應包含 17 個 TWD→外幣反向路徑', () => {
      expect(REVERSE_CURRENCY_SEO_PATHS).toHaveLength(17);
      expect(REVERSE_CURRENCY_SEO_PATHS).toContain('/twd-usd/');
      expect(REVERSE_CURRENCY_SEO_PATHS).toContain('/twd-jpy/');
      expect(REVERSE_CURRENCY_SEO_PATHS).toContain('/twd-eur/');
      expect(REVERSE_CURRENCY_SEO_PATHS).not.toContain('/usd-twd/'); // 正向不在此陣列
    });

    it('APP_ONLY_PATHS 應與 SEO_PATHS 完全分離', () => {
      expect(APP_ONLY_PATHS).toHaveLength(7);
      // 注：APP_ONLY_PATHS 移除 /seo-tech/（2026-04-07 改為可索引 SEO 路徑）
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
      expect(SITE_CONFIG.name).toBe('RateWise 匯率好工具');
      expect(SITE_CONFIG.title.length).toBeGreaterThan(0);
      expect(SITE_CONFIG.description.length).toBeGreaterThan(0);
    });
  });

  describe('Type guards', () => {
    it('isSEOPath 應正確識別公開 SEO 路徑', () => {
      expect(isSEOPath('/faq/')).toBe(true);
      expect(isSEOPath('/usd-twd/')).toBe(true);
      expect(isSEOPath('/usd-twd/500/')).toBe(true);
      expect(isSEOPath('/twd-usd/10000/')).toBe(true);
      expect(isSEOPath('/privacy/')).toBe(false); // noindex，不在 SEO_PATHS
      expect(isSEOPath('/multi/')).toBe(false);
    });

    it('isCorePagePath 應只識別公開內容頁', () => {
      expect(isCorePagePath('/')).toBe(true);
      expect(isCorePagePath('/faq/')).toBe(true);
      expect(isCorePagePath('/guide/')).toBe(true);
      expect(isCorePagePath('/privacy/')).toBe(false);
      expect(isCorePagePath('/multi/')).toBe(false);
    });

    it('isCurrencyPagePath 應只識別 XXX→TWD 落地頁', () => {
      expect(isCurrencyPagePath('/usd-twd/')).toBe(true);
      expect(isCurrencyPagePath('/jpy-twd/')).toBe(true);
      expect(isCurrencyPagePath('/faq/')).toBe(false);
      expect(isCurrencyPagePath('/twd-usd/')).toBe(false); // 反向路徑不屬此 guard
    });

    it('isReverseCurrencyPagePath 應只識別 TWD→XXX 落地頁', () => {
      expect(isReverseCurrencyPagePath('/twd-usd/')).toBe(true);
      expect(isReverseCurrencyPagePath('/twd-jpy/')).toBe(true);
      expect(isReverseCurrencyPagePath('/usd-twd/')).toBe(false); // 正向不屬此 guard
      expect(isReverseCurrencyPagePath('/faq/')).toBe(false);
    });

    it('isAppOnlyPath 應識別 app-only 頁面', () => {
      expect(isAppOnlyPath('/multi/')).toBe(true);
      expect(isAppOnlyPath('/favorites/')).toBe(true);
      expect(isAppOnlyPath('/ui-showcase/')).toBe(true);
      expect(isAppOnlyPath('/faq/')).toBe(false);
    });
  });
});
