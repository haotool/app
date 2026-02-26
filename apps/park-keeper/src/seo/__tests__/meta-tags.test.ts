import { getMetaTagsForRoute } from '@app/park-keeper/seo/meta-tags';

describe('meta-tags module', () => {
  const buildTime = '2025-01-15T12:00:00.000Z';

  describe('getMetaTagsForRoute', () => {
    it('home route should have correct title tag', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<title>停車好工具 — 台灣最好用的免費停車記錄與導航 App</title>');
    });

    it('about route should have correct title', () => {
      const result = getMetaTagsForRoute('/about/', buildTime);
      expect(result).toContain('<title>關於停車好工具 — 台灣免費智慧停車記錄 PWA</title>');
    });

    it('settings route should have correct title', () => {
      const result = getMetaTagsForRoute('/settings/', buildTime);
      expect(result).toContain('<title>設定 — 停車好工具 | 主題與語言自訂</title>');
    });

    it('should include canonical URL', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<link rel="canonical"');
      expect(result).toContain('https://app.haotool.org/park-keeper/');
    });

    it('should include hreflang tags', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('hreflang="zh-TW"');
      expect(result).toContain('hreflang="x-default"');
    });

    it('should include OG tags with image dimensions', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('og:type');
      expect(result).toContain('og:url');
      expect(result).toContain('og:title');
      expect(result).toContain('og:description');
      expect(result).toContain('og:image');
      expect(result).toContain('og:image:alt');
      expect(result).toContain('og:image:width');
      expect(result).toContain('og:image:height');
      expect(result).toContain('og:updated_time');
    });

    it('should include Twitter card tags with image alt', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('twitter:card');
      expect(result).toContain('twitter:url');
      expect(result).toContain('twitter:title');
      expect(result).toContain('twitter:description');
      expect(result).toContain('twitter:image:alt');
    });

    it('should include build-time meta', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('name="build-time"');
      expect(result).toContain(buildTime);
    });

    it('unknown route should fall back to home meta', () => {
      const result = getMetaTagsForRoute('/unknown/page/', buildTime);
      expect(result).toContain('停車好工具');
    });

    it('home description should target key SEO phrases', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('台灣最好用的停車工具');
    });
  });
});
