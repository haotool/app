/**
 * Meta Tags 測試
 * [BDD 測試策略]
 */
import { describe, it, expect } from 'vitest';
import { getMetaTagsForRoute, PAGE_META, SITE_URL } from './meta-tags';

describe('SEO Meta Tags', () => {
  describe('PAGE_META', () => {
    it('應該包含所有頁面的 meta 資料', () => {
      // Given: PAGE_META
      // Then: 應該包含所有頁面
      expect(PAGE_META).toHaveProperty('/');
      expect(PAGE_META).toHaveProperty('/lessons');
      expect(PAGE_META).toHaveProperty('/quiz');
      expect(PAGE_META).toHaveProperty('/about');
    });

    it('每個頁面應該有必要的 meta 屬性', () => {
      // Given: 每個頁面
      Object.values(PAGE_META).forEach((meta) => {
        // Then: 應該有必要的屬性
        expect(meta).toHaveProperty('title');
        expect(meta).toHaveProperty('description');
        expect(meta).toHaveProperty('keywords');
      });
    });
  });

  describe('getMetaTagsForRoute', () => {
    it('應該為首頁生成正確的 meta tags', () => {
      // Given: 首頁路由
      const buildTime = new Date().toISOString();

      // When: 生成 meta tags
      const metaTags = getMetaTagsForRoute('/', buildTime);

      // Then: 應該包含正確的內容
      expect(metaTags).toContain('地震知識小學堂');
      expect(metaTags).toContain('og:type');
      expect(metaTags).toContain('twitter:card');
      expect(metaTags).toContain(SITE_URL);
    });

    it('應該為課程頁面生成正確的 canonical URL', () => {
      // Given: 課程頁面路由
      const buildTime = new Date().toISOString();

      // When: 生成 meta tags
      const metaTags = getMetaTagsForRoute('/lessons', buildTime);

      // Then: canonical URL 應該有尾斜線
      expect(metaTags).toContain(`${SITE_URL}/lessons/`);
    });
  });
});
