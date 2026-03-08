import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_LOCALE,
  SEO_INDEXABLE_LOCALES,
  buildDefaultAlternates,
} from './config/seo-metadata';

describe('Hreflang Configuration (SSOT)', () => {
  it('SEO indexable locales 應只包含預設語言', () => {
    expect(SEO_INDEXABLE_LOCALES).toEqual([DEFAULT_LOCALE]);
  });

  it('default alternates 應只輸出 x-default 與預設語言', () => {
    expect(buildDefaultAlternates('/guide/')).toEqual([
      { hrefLang: 'x-default', href: 'https://app.haotool.org/ratewise/guide/' },
      { hrefLang: DEFAULT_LOCALE, href: 'https://app.haotool.org/ratewise/guide/' },
    ]);
  });

  it('public sitemap 若存在 hreflang，不能出現未索引語言', () => {
    const sitemapPath = resolve(__dirname, '../public/sitemap.xml');
    if (!existsSync(sitemapPath)) {
      return;
    }

    const sitemap = readFileSync(sitemapPath, 'utf-8');
    expect(sitemap).not.toContain('hreflang="en"');
    expect(sitemap).not.toContain('hreflang="ja"');
    expect(sitemap).not.toContain('hreflang="zh-CN"');
  });
});
