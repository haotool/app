import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  HOMEPAGE_SEO,
  SEO_INDEXABLE_LOCALES,
  buildDefaultAlternates,
} from '../seo-metadata';

describe('SEO SSOT', () => {
  it('should keep indexable locales limited to the default locale', () => {
    expect(SEO_INDEXABLE_LOCALES).toEqual([DEFAULT_LOCALE]);
  });

  it('should generate fallback alternates from the canonical path', () => {
    expect(buildDefaultAlternates('/guide/')).toEqual([
      { hrefLang: 'x-default', href: 'https://app.haotool.org/ratewise/guide/' },
      { hrefLang: DEFAULT_LOCALE, href: 'https://app.haotool.org/ratewise/guide/' },
    ]);
  });

  it('should expose homepage FAQ as content SSOT instead of rich-result schema input', () => {
    expect(HOMEPAGE_SEO.faqContent.length).toBeGreaterThan(0);
    expect('faq' in HOMEPAGE_SEO).toBe(false);
  });
});
