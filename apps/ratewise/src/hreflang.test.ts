import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  SEO_INDEXABLE_LOCALES,
  buildDefaultAlternates,
} from './config/seo-metadata';

describe('Hreflang Configuration', () => {
  describe('Sitemap SSOT', () => {
    const sitemapPath = resolve(__dirname, '../public/sitemap.xml');
    const sitemapExists = existsSync(sitemapPath);
    const sitemapContent = sitemapExists ? readFileSync(sitemapPath, 'utf-8') : '';
    const isRatewiseSitemap = sitemapContent.includes('haotool.org/ratewise/');

    it('should not advertise unsupported English hreflang entries', () => {
      if (!isRatewiseSitemap) return;

      expect(sitemapContent).not.toContain('hreflang="en"');
      expect(sitemapContent).not.toContain('hreflang="en-US"');
    });

    it('should only contain zh-TW and x-default when hreflang entries exist', () => {
      if (!isRatewiseSitemap) return;
      if (!sitemapContent.includes('hreflang=')) return;

      expect(sitemapContent).toContain(`hreflang="${DEFAULT_LOCALE}"`);
      expect(sitemapContent).toContain('hreflang="x-default"');
      expect(sitemapContent).not.toContain('hreflang="ja"');
      expect(sitemapContent).not.toContain('hreflang="zh-CN"');
    });
  });

  describe('Fallback alternates', () => {
    const fallbackAlternates = buildDefaultAlternates('/guide/');

    it('should keep locale SSOT limited to the single indexable locale', () => {
      expect(SEO_INDEXABLE_LOCALES).toEqual([DEFAULT_LOCALE]);
    });

    it('should generate only x-default and zh-TW fallback alternates', () => {
      expect(fallbackAlternates).toEqual([
        { hrefLang: 'x-default', href: 'https://app.haotool.org/ratewise/guide/' },
        { hrefLang: DEFAULT_LOCALE, href: 'https://app.haotool.org/ratewise/guide/' },
      ]);
    });

    it('should not include unsupported locale alternates', () => {
      expect(fallbackAlternates.map(({ hrefLang }) => hrefLang)).not.toContain('en');
      expect(fallbackAlternates.map(({ hrefLang }) => hrefLang)).not.toContain('ja');
    });
  });
});
