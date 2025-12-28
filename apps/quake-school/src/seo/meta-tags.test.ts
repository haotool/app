/**
 * Meta Tags Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import { getMetaTagsForRoute } from './meta-tags';

describe('Meta Tags Module', () => {
  describe('getMetaTagsForRoute', () => {
    it('首頁應該包含正確的 title', () => {
      const result = getMetaTagsForRoute('/', '2025-12-29');

      expect(result).toContain('<title>');
      expect(result).toContain('Quake-School');
    });

    it('首頁應該包含 canonical URL', () => {
      const result = getMetaTagsForRoute('/', '2025-12-29');

      expect(result).toContain('rel="canonical"');
      expect(result).toContain('https://app.haotool.org/quake-school/');
    });

    it('應該包含 Open Graph 標籤', () => {
      const result = getMetaTagsForRoute('/', '2025-12-29');

      expect(result).toContain('property="og:type"');
      expect(result).toContain('property="og:title"');
      expect(result).toContain('property="og:description"');
      expect(result).toContain('property="og:url"');
      expect(result).toContain('property="og:image"');
    });

    it('應該包含 Twitter Card 標籤', () => {
      const result = getMetaTagsForRoute('/', '2025-12-29');

      expect(result).toContain('name="twitter:card"');
      expect(result).toContain('summary_large_image');
    });

    it('應該包含 hreflang 標籤', () => {
      const result = getMetaTagsForRoute('/', '2025-12-29');

      expect(result).toContain('hreflang="zh-TW"');
      expect(result).toContain('hreflang="x-default"');
    });

    it('關於頁面應該有不同的 title', () => {
      const result = getMetaTagsForRoute('/about/', '2025-12-29');

      expect(result).toContain('關於 Quake-School');
    });

    it('FAQ 頁面應該包含相關 keywords', () => {
      const result = getMetaTagsForRoute('/faq/', '2025-12-29');

      expect(result).toContain('FAQ');
      expect(result).toContain('常見問題');
    });

    it('canonical URL 應該統一使用尾斜線', () => {
      const homeResult = getMetaTagsForRoute('/', '2025-12-29');
      const aboutResult = getMetaTagsForRoute('/about', '2025-12-29');

      // 首頁
      expect(homeResult).toContain('href="https://app.haotool.org/quake-school/"');

      // 關於頁面也應該有尾斜線
      expect(aboutResult).toContain('href="https://app.haotool.org/quake-school/about/"');
    });
  });
});
