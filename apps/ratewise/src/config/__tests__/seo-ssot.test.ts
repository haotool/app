import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  HOMEPAGE_SEO,
  SEO_INDEXABLE_LOCALES,
  buildDefaultAlternates,
  getCurrencyLandingPageContent,
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

  // 幣別頁模板不得滲漏其他幣別名稱（template bleed 防護）。
  describe('currency page template bleed prevention', () => {
    // 非日圓幣別的 FAQ 不應出現「日圓」或「日幣」字樣。
    const nonJpyCurrencies = [
      'GBP',
      'EUR',
      'USD',
      'CAD',
      'AUD',
      'HKD',
      'KRW',
      'SGD',
      'CHF',
      'NZD',
      'THB',
      'PHP',
      'IDR',
      'MYR',
    ] as const;

    it.each(nonJpyCurrencies)('%s 頁 FAQ 不應含「日圓」或「日幣」', (code) => {
      const { faqEntries } = getCurrencyLandingPageContent(code);
      const allAnswers = faqEntries.map((e) => e.answer).join('\n');
      expect(allAnswers).not.toMatch(/日圓|日幣/);
    });

    // JPY 頁自身可合法出現「日圓」。
    it('JPY 頁 FAQ 可合法出現「日圓」', () => {
      const { faqEntries } = getCurrencyLandingPageContent('JPY');
      const allAnswers = faqEntries.map((e) => e.answer).join('\n');
      expect(allAnswers).toMatch(/日圓|日幣/);
    });
  });
});
