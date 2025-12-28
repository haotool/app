/**
 * Meta Tags Tests
 * [BDD:2025-12-29] SEO meta tags 測試
 */

import { describe, it, expect } from 'vitest';
import { getMetaTagsForRoute } from './meta-tags';

describe('getMetaTagsForRoute', () => {
  const buildTime = '2025-12-29T00:00:00.000Z';

  describe('當路由為首頁時', () => {
    it('應該生成正確的標題', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      expect(result).toContain('<title>地震小學堂 | 互動式地震衛教網頁</title>');
    });

    it('應該包含正確的 canonical URL', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      expect(result).toContain(
        '<link rel="canonical" href="https://app.haotool.org/earthquake-simulator/" />',
      );
    });

    it('應該包含 Open Graph 標籤', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      expect(result).toContain('property="og:type"');
      expect(result).toContain('property="og:url"');
      expect(result).toContain('property="og:title"');
      expect(result).toContain('property="og:description"');
      expect(result).toContain('property="og:image"');
    });

    it('應該包含 Twitter 卡片標籤', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      expect(result).toContain('name="twitter:card"');
      expect(result).toContain('summary_large_image');
    });

    it('應該包含 robots 標籤', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      expect(result).toContain('name="robots"');
      expect(result).toContain('index, follow');
    });
  });

  describe('當路由為測驗頁時', () => {
    it('應該生成測驗專屬標題', () => {
      const result = getMetaTagsForRoute('/quiz/', buildTime);

      expect(result).toContain('地震知識測驗');
    });

    it('應該包含尾斜線的 canonical URL', () => {
      const result = getMetaTagsForRoute('/quiz', buildTime);

      expect(result).toContain(
        '<link rel="canonical" href="https://app.haotool.org/earthquake-simulator/quiz/" />',
      );
    });
  });

  describe('SEO 最佳實踐驗證', () => {
    it('應該正確處理尾斜線一致性', () => {
      const withSlash = getMetaTagsForRoute('/quiz/', buildTime);
      const withoutSlash = getMetaTagsForRoute('/quiz', buildTime);

      // 兩者都應該使用尾斜線
      expect(withSlash).toContain('earthquake-simulator/quiz/');
      expect(withoutSlash).toContain('earthquake-simulator/quiz/');
    });

    it('應該包含 hreflang 標籤', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      expect(result).toContain('hrefLang="x-default"');
      expect(result).toContain('hrefLang="zh-TW"');
    });

    it('應該正確轉義 HTML 特殊字元', () => {
      const result = getMetaTagsForRoute('/', buildTime);

      // 確保沒有未轉義的 & 符號
      expect(result).not.toMatch(/&(?!(amp|lt|gt|quot|#039);)/);
    });
  });
});
