import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  HOMEPAGE_SEO,
  SEO_INDEXABLE_LOCALES,
  buildDefaultAlternates,
  getCurrencyLandingPageContent,
} from '../seo-metadata';
import { SEO_RATE_EXAMPLES } from '../generated/seo-rate-examples';

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

  // 幣別頁 FAQ 應含具體台幣差距數字（來自 SEO_RATE_EXAMPLES）。
  describe('currency page rate example in FAQ', () => {
    const codesWithExamples = ['USD', 'JPY', 'EUR', 'GBP', 'KRW', 'THB'] as const;

    it.each(codesWithExamples)('%s 頁 FAQ 應含具體 TWD 差距數字', (code) => {
      const { faqEntries } = getCurrencyLandingPageContent(code);
      const allAnswers = faqEntries.map((e) => e.answer).join('\n');
      const ex = SEO_RATE_EXAMPLES[code as keyof typeof SEO_RATE_EXAMPLES];
      // 確認 FAQ 包含計算出的差距數字。
      expect(ex).toBeDefined();
      expect(allAnswers).toContain(`${ex!.diffTWD} 元台幣`);
    });

    it('每幣別範例應使用該幣別顯示名稱，不混用其他幣別', () => {
      const { faqEntries } = getCurrencyLandingPageContent('USD');
      const answer = faqEntries[0]?.answer ?? '';
      // 換 100 美金 → 應出現「美金」而非「日圓」。
      expect(answer).toContain('美金');
      expect(answer).not.toMatch(/日圓|日幣/);
    });

    it('SEO_RATE_EXAMPLES 應包含全部 17 幣別', () => {
      const codes = Object.keys(SEO_RATE_EXAMPLES);
      expect(codes.length).toBe(17);
    });
  });
});
