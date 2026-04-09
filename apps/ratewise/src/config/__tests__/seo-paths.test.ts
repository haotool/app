import { describe, expect, it } from 'vitest';
import {
  APP_ONLY_PATHS,
  APP_CONFIG,
  IMAGE_RESOURCES,
  INDEXABLE_CANONICAL_PATHS,
  INDEXABLE_FORWARD_AMOUNTS,
  INDEXABLE_REVERSE_TWD_AMOUNTS,
  INDEXABLE_AMOUNT_SEO_PATHS,
  INDEXABLE_REVERSE_AMOUNT_SEO_PATHS,
  PRERENDER_PATHS,
  REVERSE_CURRENCY_SEO_PATHS,
  SEO_FILES,
  SEO_PATHS,
  SHARE_IMAGE,
  SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS,
  SITE_CONFIG,
  TWITTER_IMAGE,
  getIncludedRoutes,
  isAppOnlyPath,
  isCorePagePath,
  isCurrencyPagePath,
  isIndexableAmount,
  isIndexableAmountPath,
  isNonIndexableAmountPath,
  isReverseCurrencyPagePath,
  isSEOPath,
  normalizePath,
  shouldPrerender,
  DYNAMIC_AMOUNT_ROUTE_PATTERN,
  parseDynamicAmountRoute,
  getCurrencyPairBasePath,
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
    it('INDEXABLE_CANONICAL_PATHS 應作為 SEO_PATHS 的 SSOT', () => {
      expect(INDEXABLE_CANONICAL_PATHS).toEqual(SEO_PATHS);
      expect(APP_CONFIG.seoPaths).toEqual(INDEXABLE_CANONICAL_PATHS);
    });

    it('SEO_PATHS 應包含全部公開可索引路徑（含 206 個預渲染金額路由）', () => {
      // SEO_PATHS = CONTENT_SEO_PATHS(9) + CURRENCY_SEO_PATHS(17) + REVERSE_CURRENCY_SEO_PATHS(17)
      //          + CURRENCY_AMOUNT_SEO_PATHS(104) + REVERSE_CURRENCY_AMOUNT_SEO_PATHS(102) = 249
      // 2026-04-08：金額路由現已完整預渲染為靜態 HTML，並包含在 sitemap 中
      expect(SEO_PATHS).toHaveLength(249);
      expect(SEO_PATHS).toContain('/');
      expect(SEO_PATHS).toContain('/faq/');
      expect(SEO_PATHS).toContain('/about/');
      expect(SEO_PATHS).toContain('/guide/');
      expect(SEO_PATHS).not.toContain('/privacy/'); // noindex 頁不納入 sitemap
      expect(SEO_PATHS).toContain('/sell-rate-vs-mid-rate/');
      expect(SEO_PATHS).toContain('/cash-vs-spot-rate/');
      expect(SEO_PATHS).toContain('/card-rate-guide/');
      expect(SEO_PATHS).toContain('/open-data/');
      expect(SEO_PATHS).toContain('/seo-tech/');
      expect(SEO_PATHS).toContain('/usd-twd/'); // 基礎貨幣頁
      expect(SEO_PATHS).toContain('/usd-twd/500/'); // 金額頁現已預渲染為靜態 HTML
      expect(SEO_PATHS).toContain('/twd-usd/'); // 基礎反向頁
      expect(SEO_PATHS).toContain('/twd-usd/10000/'); // 金額頁現已預渲染為靜態 HTML
      expect(SEO_PATHS).toContain('/twd-jpy/');
      expect(SEO_PATHS).not.toContain('/multi/');
      expect(SEO_PATHS).not.toContain('/favorites/');
      expect(SEO_PATHS).not.toContain('/settings/');
    });

    it('PRERENDER_PATHS 應包含公開 SEO 路徑、法律頁與 app-only noindex 頁面', () => {
      expect(PRERENDER_PATHS).toHaveLength(257);
      // PRERENDER_PATHS = SEO_PATHS(249) + LEGAL_SSG_PATHS(1) + APP_ONLY_PRERENDER_PATHS(7) = 257
      expect(PRERENDER_PATHS).toContain('/privacy/'); // 仍需預渲染，但不在 sitemap
      expect(PRERENDER_PATHS).toContain('/favorites/');
      expect(PRERENDER_PATHS).toContain('/settings/');
      expect(APP_CONFIG.prerenderPaths).toEqual(PRERENDER_PATHS);
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
    it('isSEOPath 應正確識別公開 SEO 路徑（含預渲染金額頁）', () => {
      expect(isSEOPath('/faq/')).toBe(true);
      expect(isSEOPath('/usd-twd/')).toBe(true); // 基礎貨幣頁
      expect(isSEOPath('/usd-twd/500/')).toBe(true); // 金額頁現已預渲染為靜態 HTML
      expect(isSEOPath('/twd-usd/')).toBe(true); // 基礎反向頁
      expect(isSEOPath('/twd-usd/10000/')).toBe(true); // 金額頁現已預渲染為靜態 HTML
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

  describe('任意金額路由支援', () => {
    it('應以規則而非列舉清單宣告支援的動態金額路由', () => {
      expect(SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS).toHaveLength(1);
      expect(APP_CONFIG.supportedDynamicRoutePatterns).toEqual(
        SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS.map((pattern) => pattern.source),
      );
      expect(SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS[0]?.test('/usd-twd/999/')).toBe(true);
      expect(SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS[0]?.test('/twd-jpy/12345/')).toBe(true);
    });

    describe('DYNAMIC_AMOUNT_ROUTE_PATTERN', () => {
      it('應匹配有效的金額路由格式', () => {
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/usd-twd/500/')).toBe(true);
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/usd-twd/500')).toBe(true);
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/twd-usd/10000/')).toBe(true);
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/jpy-twd/100.5/')).toBe(true);
      });

      it('不應匹配無效格式', () => {
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/usd-twd/')).toBe(false);
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/usd-twd')).toBe(false);
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/faq/')).toBe(false);
        expect(DYNAMIC_AMOUNT_ROUTE_PATTERN.test('/usd-twd/abc/')).toBe(false);
      });
    });

    describe('parseDynamicAmountRoute', () => {
      it('應正確解析外幣→TWD 金額路由', () => {
        const result = parseDynamicAmountRoute('/usd-twd/500/');
        expect(result).toEqual({
          fromCode: 'USD',
          toCode: 'TWD',
          amount: 500,
          direction: 'to-twd',
        });
      });

      it('應正確解析 TWD→外幣 金額路由', () => {
        const result = parseDynamicAmountRoute('/twd-jpy/10000/');
        expect(result).toEqual({
          fromCode: 'TWD',
          toCode: 'JPY',
          amount: 10000,
          direction: 'twd-to-foreign',
        });
      });

      it('應支援小數金額', () => {
        const result = parseDynamicAmountRoute('/eur-twd/99.5/');
        expect(result?.amount).toBe(99.5);
      });

      it('無效路徑應返回 null', () => {
        expect(parseDynamicAmountRoute('/faq/')).toBeNull();
        expect(parseDynamicAmountRoute('/usd-twd/')).toBeNull();
        expect(parseDynamicAmountRoute('/usd-twd/0/')).toBeNull();
        expect(parseDynamicAmountRoute('/usd-twd/-100/')).toBeNull();
      });
    });

    describe('isIndexableAmount', () => {
      it('應識別 USD 的 canonical 金額', () => {
        expect(isIndexableAmount('usd', 500, 'to-twd')).toBe(true);
        expect(isIndexableAmount('USD', 1000, 'to-twd')).toBe(true);
        expect(isIndexableAmount('usd', 999, 'to-twd')).toBe(false);
        expect(isIndexableAmount('usd', 12345, 'to-twd')).toBe(false);
      });

      it('應識別 JPY 的 canonical 金額', () => {
        expect(isIndexableAmount('jpy', 10000, 'to-twd')).toBe(true);
        expect(isIndexableAmount('jpy', 50000, 'to-twd')).toBe(true);
        expect(isIndexableAmount('jpy', 12345, 'to-twd')).toBe(false);
      });

      it('應識別反向（TWD→外幣）的 canonical 金額', () => {
        expect(isIndexableAmount('usd', 50000, 'twd-to-foreign')).toBe(true);
        expect(isIndexableAmount('usd', 12345, 'twd-to-foreign')).toBe(false);
      });
    });

    describe('getCurrencyPairBasePath', () => {
      it('應返回正確的基礎幣對路徑', () => {
        expect(getCurrencyPairBasePath('usd', 'to-twd')).toBe('/usd-twd/');
        expect(getCurrencyPairBasePath('USD', 'to-twd')).toBe('/usd-twd/');
        expect(getCurrencyPairBasePath('jpy', 'twd-to-foreign')).toBe('/twd-jpy/');
      });
    });

    describe('isIndexableAmountPath', () => {
      it('應識別預渲染的金額頁', () => {
        expect(isIndexableAmountPath('/usd-twd/500/')).toBe(true);
        expect(isIndexableAmountPath('/twd-usd/10000/')).toBe(true);
        expect(isIndexableAmountPath('/jpy-twd/10000/')).toBe(true);
      });

      it('不應識別非預渲染的金額頁', () => {
        expect(isIndexableAmountPath('/usd-twd/999/')).toBe(false);
        expect(isIndexableAmountPath('/usd-twd/12345/')).toBe(false);
      });
    });

    describe('isNonIndexableAmountPath', () => {
      it('應識別非索引金額路由', () => {
        expect(isNonIndexableAmountPath('/usd-twd/999/')).toBe(true);
        expect(isNonIndexableAmountPath('/usd-twd/12345/')).toBe(true);
        expect(isNonIndexableAmountPath('/jpy-twd/12345/')).toBe(true);
      });

      it('不應將 canonical 金額識別為非索引路由', () => {
        expect(isNonIndexableAmountPath('/usd-twd/500/')).toBe(false);
        expect(isNonIndexableAmountPath('/jpy-twd/10000/')).toBe(false);
      });

      it('不應將基礎幣對頁識別為動態路由', () => {
        expect(isNonIndexableAmountPath('/usd-twd/')).toBe(false);
        expect(isNonIndexableAmountPath('/faq/')).toBe(false);
      });
    });

    it('索引金額清單應由規則生成而非逐頁硬編碼', () => {
      expect(INDEXABLE_FORWARD_AMOUNTS['usd']).toEqual([1, 10, 50, 100, 500, 1000]);
      expect(INDEXABLE_REVERSE_TWD_AMOUNTS['usd']).toEqual([
        10000, 30000, 50000, 100000, 200000, 300000,
      ]);
      expect(INDEXABLE_AMOUNT_SEO_PATHS).toContain('/usd-twd/500/');
      expect(INDEXABLE_REVERSE_AMOUNT_SEO_PATHS).toContain('/twd-usd/10000/');
      expect(INDEXABLE_AMOUNT_SEO_PATHS).not.toContain('/usd-twd/999/');
      expect(INDEXABLE_REVERSE_AMOUNT_SEO_PATHS).not.toContain('/twd-usd/12345/');
    });
  });
});
