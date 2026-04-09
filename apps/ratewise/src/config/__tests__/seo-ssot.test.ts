import { describe, expect, it } from 'vitest';
import {
  ABOUT_PAGE_SEO,
  CARD_RATE_GUIDE_PAGE,
  CASH_VS_SPOT_RATE_PAGE,
  DEFAULT_LOCALE,
  FAQ_PAGE_SEO,
  GUIDE_PAGE_SEO,
  HOMEPAGE_SEO,
  OPEN_DATA_PAGE_SEO,
  SEO_INDEXABLE_LOCALES,
  SELL_RATE_VS_MID_RATE_PAGE,
  buildDefaultAlternates,
  buildSpeakableJsonLd,
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
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
      expect(allAnswers).toContain(`${ex!.diffTWD} 元新台幣`);
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

  describe('反向幣別頁（TWD→外幣）內容 SSOT', () => {
    it('getReverseCurrencyLandingPageContent("USD") 應回傳正確結構', () => {
      const content = getReverseCurrencyLandingPageContent('USD');
      expect(content.currencyCode).toBe('USD');
      expect(content.pathname).toBe('/twd-usd');
      expect(content.direction).toBe('twd-to-foreign');
    });

    it('反向頁 title 應包含「台幣換」而非只有「換台幣」', () => {
      const content = getReverseCurrencyLandingPageContent('USD');
      expect(content.title).toMatch(/台幣換/);
    });

    it('反向頁 keywords 應包含「台幣換X」方向關鍵字', () => {
      const content = getReverseCurrencyLandingPageContent('USD');
      const keywordsStr = content.keywords.join(' ');
      expect(keywordsStr).toMatch(/台幣換美金|TWD.*USD/);
    });

    it('反向頁 FAQ 應包含出國換匯場景問題', () => {
      const content = getReverseCurrencyLandingPageContent('USD');
      const allQuestions = content.faqEntries.map((e) => e.question).join('\n');
      expect(allQuestions).toMatch(/台幣換|換美金|出國/);
    });

    it('反向頁與正向頁 FAQ 不應完全相同（避免 thin content）', () => {
      const forward = getCurrencyLandingPageContent('USD');
      const reverse = getReverseCurrencyLandingPageContent('USD');
      const forwardQ = forward.faqEntries.map((e) => e.question).join('|');
      const reverseQ = reverse.faqEntries.map((e) => e.question).join('|');
      expect(forwardQ).not.toBe(reverseQ);
    });

    it('反向頁 pathname 格式應為 /twd-{code}（無尾斜線，與正向頁對稱）', () => {
      const usd = getReverseCurrencyLandingPageContent('USD');
      const jpy = getReverseCurrencyLandingPageContent('JPY');
      expect(usd.pathname).toBe('/twd-usd');
      expect(jpy.pathname).toBe('/twd-jpy');
    });

    it('反向頁 template bleed：非 JPY 幣別不應出現「日圓」', () => {
      const content = getReverseCurrencyLandingPageContent('USD');
      const allAnswers = content.faqEntries.map((e) => e.answer).join('\n');
      expect(allAnswers).not.toMatch(/日圓|日幣/);
    });
  });

  // ─── Speakable Schema ──────────────────────────────────────────────────────
  describe('buildSpeakableJsonLd()', () => {
    it('應回傳正確的 SpeakableSpecification schema', () => {
      const schema = buildSpeakableJsonLd(['h1', 'details summary']);
      expect(schema['@type']).toBe('SpeakableSpecification');
      expect(schema['cssSelector']).toEqual(['h1', 'details summary']);
    });

    it('使用預設選擇器時應包含 h1', () => {
      const schema = buildSpeakableJsonLd();
      const selectors = schema['cssSelector'] as string[];
      expect(selectors).toContain('h1');
    });

    it('不應包含 @context（由 @graph 統一注入）', () => {
      const schema = buildSpeakableJsonLd();
      expect('@context' in schema).toBe(false);
    });
  });

  describe('首頁 Speakable Schema', () => {
    it('HOMEPAGE_SEO.jsonLd 應包含 SpeakableSpecification', () => {
      const jsonLdArray = Array.isArray(HOMEPAGE_SEO.jsonLd)
        ? HOMEPAGE_SEO.jsonLd
        : HOMEPAGE_SEO.jsonLd
          ? [HOMEPAGE_SEO.jsonLd]
          : [];
      const hasSpeakable = jsonLdArray.some((block) => block['@type'] === 'SpeakableSpecification');
      expect(hasSpeakable).toBe(true);
    });
  });

  describe('FAQ 頁 Speakable Schema', () => {
    it('FAQ_PAGE_SEO.jsonLd 應包含 SpeakableSpecification', () => {
      const jsonLdArray = Array.isArray(FAQ_PAGE_SEO.jsonLd)
        ? FAQ_PAGE_SEO.jsonLd
        : FAQ_PAGE_SEO.jsonLd
          ? [FAQ_PAGE_SEO.jsonLd]
          : [];
      const hasSpeakable = jsonLdArray.some((block) => block['@type'] === 'SpeakableSpecification');
      expect(hasSpeakable).toBe(true);
    });
  });

  // ─── 內容頁 Speakable Schema ───────────────────────────────────────────────
  describe('內容頁 Speakable Schema 覆蓋', () => {
    function hasSpeakable(jsonLd: unknown): boolean {
      if (!jsonLd) return false;
      const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      return arr.some(
        (block: Record<string, unknown>) => block['@type'] === 'SpeakableSpecification',
      );
    }

    it('GUIDE_PAGE_SEO.jsonLd 應包含 SpeakableSpecification', () => {
      expect(hasSpeakable(GUIDE_PAGE_SEO.jsonLd)).toBe(true);
    });

    it('OPEN_DATA_PAGE_SEO.jsonLd 應包含 SpeakableSpecification', () => {
      expect(hasSpeakable(OPEN_DATA_PAGE_SEO.jsonLd)).toBe(true);
    });

    it('ABOUT_PAGE_SEO.jsonLd 應包含 SpeakableSpecification', () => {
      expect(hasSpeakable(ABOUT_PAGE_SEO.jsonLd)).toBe(true);
    });

    it('SELL_RATE_VS_MID_RATE_PAGE.jsonLd 應包含 SpeakableSpecification', () => {
      expect(hasSpeakable(SELL_RATE_VS_MID_RATE_PAGE.jsonLd)).toBe(true);
    });

    it('CASH_VS_SPOT_RATE_PAGE.jsonLd 應包含 SpeakableSpecification', () => {
      expect(hasSpeakable(CASH_VS_SPOT_RATE_PAGE.jsonLd)).toBe(true);
    });

    it('CARD_RATE_GUIDE_PAGE.jsonLd 應包含 SpeakableSpecification', () => {
      expect(hasSpeakable(CARD_RATE_GUIDE_PAGE.jsonLd)).toBe(true);
    });
  });
});
