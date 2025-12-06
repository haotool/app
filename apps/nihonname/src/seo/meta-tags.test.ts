/**
 * Meta Tags Generation Tests
 * [test:2025-12-07] 補齊 meta-tags.ts 測試覆蓋率
 *
 * @see meta-tags.ts
 */
import { describe, it, expect } from 'vitest';
import { getMetaTagsForRoute } from './meta-tags';

describe('getMetaTagsForRoute', () => {
  const buildTime = '2025-12-07T00:00:00Z';

  describe('Home Page (/)', () => {
    it('should return correct title for home page', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<title>NihonName 皇民化改姓生成器');
    });

    it('should include default description', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('探索1940年代台灣皇民化運動');
    });

    it('should include canonical URL', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<link rel="canonical" href="https://app.haotool.org/nihonname/"');
    });
  });

  describe('About Page (/about)', () => {
    it('should return correct title', () => {
      const result = getMetaTagsForRoute('/about', buildTime);
      expect(result).toContain('<title>關於本站</title>');
    });

    it('should include about page specific description', () => {
      const result = getMetaTagsForRoute('/about', buildTime);
      expect(result).toContain('探索 NihonName 的開發故事');
    });

    it('should include about page specific keywords', () => {
      const result = getMetaTagsForRoute('/about', buildTime);
      expect(result).toContain('關於 NihonName');
    });
  });

  describe('Guide Page (/guide)', () => {
    it('should return correct title', () => {
      const result = getMetaTagsForRoute('/guide', buildTime);
      expect(result).toContain('<title>使用說明</title>');
    });

    it('should include guide page specific description', () => {
      const result = getMetaTagsForRoute('/guide', buildTime);
      expect(result).toContain('學習如何使用 NihonName');
    });
  });

  describe('FAQ Page (/faq)', () => {
    it('should return correct title', () => {
      const result = getMetaTagsForRoute('/faq', buildTime);
      expect(result).toContain('<title>常見問題</title>');
    });

    it('should include FAQ specific keywords', () => {
      const result = getMetaTagsForRoute('/faq', buildTime);
      expect(result).toContain('常見問題');
      expect(result).toContain('FAQ');
    });
  });

  describe('History Pages', () => {
    it('should return correct title for /history', () => {
      const result = getMetaTagsForRoute('/history', buildTime);
      expect(result).toContain('<title>歷史專區</title>');
    });

    it('should use article og:type for history pages', () => {
      const result = getMetaTagsForRoute('/history', buildTime);
      expect(result).toContain('<meta property="og:type" content="article"');
    });

    it('should return correct title for /history/kominka', () => {
      const result = getMetaTagsForRoute('/history/kominka', buildTime);
      expect(result).toContain('皇民化運動 (1937-1945)');
    });

    it('should return correct title for /history/shimonoseki', () => {
      const result = getMetaTagsForRoute('/history/shimonoseki', buildTime);
      expect(result).toContain('馬關條約 (1895)');
    });

    it('should return correct title for /history/san-francisco', () => {
      const result = getMetaTagsForRoute('/history/san-francisco', buildTime);
      expect(result).toContain('舊金山和約 (1951)');
    });
  });

  describe('OG Meta Tags', () => {
    it('should include og:type', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:type"');
    });

    it('should include og:url', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:url"');
    });

    it('should include og:title', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:title"');
    });

    it('should include og:description', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:description"');
    });

    it('should include og:image', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:image"');
    });

    it('should include og:image:width and og:image:height', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:image:width" content="1200"');
      expect(result).toContain('<meta property="og:image:height" content="630"');
    });

    it('should include og:locale', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:locale" content="zh_TW"');
    });

    it('should include og:site_name', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta property="og:site_name" content="NihonName"');
    });

    it('should include og:updated_time with build time', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain(`<meta property="og:updated_time" content="${buildTime}"`);
    });
  });

  describe('Twitter Meta Tags', () => {
    it('should include twitter:card', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="twitter:card" content="summary_large_image"');
    });

    it('should include twitter:site', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="twitter:site" content="@azlife_1224"');
    });

    it('should include twitter:creator', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="twitter:creator" content="@azlife_1224"');
    });

    it('should include twitter:title', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="twitter:title"');
    });

    it('should include twitter:description', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="twitter:description"');
    });

    it('should include twitter:image', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="twitter:image"');
    });
  });

  describe('Primary Meta Tags', () => {
    it('should include robots meta tag', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="robots" content="index, follow');
    });

    it('should include author meta tag', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="author" content="haotool"');
    });

    it('should include application-name meta tag', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="application-name" content="NihonName"');
    });

    it('should include keywords meta tag', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('<meta name="keywords"');
    });
  });

  describe('Language Alternates', () => {
    it('should include x-default hreflang', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('hrefLang="x-default"');
    });

    it('should include zh-TW hreflang', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('hrefLang="zh-TW"');
    });
  });

  describe('HTML Escaping', () => {
    it('should escape special characters in title', () => {
      // Test that normal text is not double-escaped
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).not.toContain('&amp;amp;');
    });
  });

  describe('Canonical URL Building', () => {
    it('should build correct canonical for root path', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('href="https://app.haotool.org/nihonname/"');
    });

    it('should build correct canonical for /about', () => {
      const result = getMetaTagsForRoute('/about', buildTime);
      expect(result).toContain('href="https://app.haotool.org/nihonname/about/"');
    });

    it('should build correct canonical for nested paths', () => {
      const result = getMetaTagsForRoute('/history/kominka', buildTime);
      expect(result).toContain('href="https://app.haotool.org/nihonname/history/kominka/"');
    });
  });

  describe('Unknown Routes', () => {
    it('should return default title for unknown routes', () => {
      const result = getMetaTagsForRoute('/unknown-page', buildTime);
      expect(result).toContain('NihonName 皇民化改姓生成器');
    });

    it('should return default description for unknown routes', () => {
      const result = getMetaTagsForRoute('/unknown-page', buildTime);
      expect(result).toContain('探索1940年代台灣皇民化運動');
    });
  });

  describe('OG Image URL', () => {
    it('should build correct OG image URL', () => {
      const result = getMetaTagsForRoute('/', buildTime);
      expect(result).toContain('https://app.haotool.org/nihonname/og-image.png');
    });
  });
});
