import { describe, expect, it } from 'vitest';
import {
  ABOUT_PAGE_SEO,
  APP_ONLY_PAGE_SEO,
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
  buildPersonJsonLd,
  buildSiteJsonLd,
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

  it('核心內容頁的 title 與 description 應達到可索引且可點擊的最低品質門檻', () => {
    const keyPages = [
      FAQ_PAGE_SEO,
      GUIDE_PAGE_SEO,
      ABOUT_PAGE_SEO,
      SELL_RATE_VS_MID_RATE_PAGE,
      CASH_VS_SPOT_RATE_PAGE,
      CARD_RATE_GUIDE_PAGE,
    ];

    for (const page of keyPages) {
      expect(page.title.length).toBeGreaterThanOrEqual(24);
      expect(page.description.length).toBeGreaterThanOrEqual(80);
    }
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

  // 根據 schema.org 規範，SpeakableSpecification 必須嵌套在 WebPage 的 speakable 屬性中。
  describe('首頁 Speakable Schema', () => {
    it('HOMEPAGE_SEO.jsonLd 應包含 SpeakableSpecification（嵌套在 WebPage 中）', () => {
      const jsonLdArray = Array.isArray(HOMEPAGE_SEO.jsonLd)
        ? HOMEPAGE_SEO.jsonLd
        : HOMEPAGE_SEO.jsonLd
          ? [HOMEPAGE_SEO.jsonLd]
          : [];
      const hasSpeakable = jsonLdArray.some((block) => {
        // 檢查頂層 SpeakableSpecification（舊格式）
        if (block['@type'] === 'SpeakableSpecification') return true;
        // 檢查嵌套在 WebPage 的 speakable 屬性中（正確格式）
        const speakable = (block as Record<string, unknown>)['speakable'] as
          | Record<string, unknown>
          | undefined;
        if (speakable?.['@type'] === 'SpeakableSpecification') return true;
        return false;
      });
      expect(hasSpeakable).toBe(true);
    });
  });

  // 根據 schema.org 規範，SpeakableSpecification 必須嵌套在 Article/WebPage 的 speakable 屬性中。
  describe('FAQ 頁 Speakable Schema', () => {
    it('FAQ_PAGE_SEO.jsonLd 應包含 SpeakableSpecification（嵌套在 Article 中）', () => {
      const jsonLdArray = Array.isArray(FAQ_PAGE_SEO.jsonLd)
        ? FAQ_PAGE_SEO.jsonLd
        : FAQ_PAGE_SEO.jsonLd
          ? [FAQ_PAGE_SEO.jsonLd]
          : [];
      const hasSpeakable = jsonLdArray.some((block) => {
        // 檢查頂層 SpeakableSpecification（舊格式）
        if (block['@type'] === 'SpeakableSpecification') return true;
        // 檢查嵌套在 Article 的 speakable 屬性中（正確格式）
        const speakable = (block as Record<string, unknown>)['speakable'] as
          | Record<string, unknown>
          | undefined;
        if (speakable?.['@type'] === 'SpeakableSpecification') return true;
        return false;
      });
      expect(hasSpeakable).toBe(true);
    });
  });

  // ─── 內容頁 Speakable Schema ───────────────────────────────────────────────
  // 根據 schema.org 規範，SpeakableSpecification 必須嵌套在 Article/WebPage 的 speakable 屬性中。
  // 參考：https://schema.org/speakable
  describe('內容頁 Speakable Schema 覆蓋', () => {
    function hasSpeakable(jsonLd: unknown): boolean {
      if (!jsonLd) return false;
      const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      return arr.some((block: Record<string, unknown>) => {
        // 檢查頂層 SpeakableSpecification（舊格式，已棄用）
        if (block['@type'] === 'SpeakableSpecification') return true;
        // 檢查嵌套在 Article/WebPage 的 speakable 屬性中（正確格式）
        const speakable = block['speakable'] as Record<string, unknown> | undefined;
        if (speakable?.['@type'] === 'SpeakableSpecification') return true;
        return false;
      });
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

  // ─── Entity Authority Signals（knowsAbout）─────────────────────────────────
  describe('Entity knowsAbout 權威信號（2026 AI Mode 要求）', () => {
    it('buildSiteJsonLd() Organization 應包含 knowsAbout 陣列', () => {
      const blocks = buildSiteJsonLd();
      const org = blocks.find((b) => b['@type'] === 'Organization');
      expect(org).toBeDefined();
      expect(Array.isArray(org!['knowsAbout'])).toBe(true);
      expect((org!['knowsAbout'] as string[]).length).toBeGreaterThan(0);
    });

    it('Organization knowsAbout 應含台銀匯率與換匯相關核心主題', () => {
      const blocks = buildSiteJsonLd();
      const org = blocks.find((b) => b['@type'] === 'Organization');
      const topics = (org!['knowsAbout'] as string[]).join(' ');
      // 核心業務主題必須涵蓋
      expect(topics).toMatch(/匯率|exchange rate/i);
      expect(topics).toMatch(/台幣|TWD|台灣/i);
    });

    it('buildPersonJsonLd() 應包含 knowsAbout 陣列', () => {
      const person = buildPersonJsonLd();
      expect(Array.isArray(person['knowsAbout'])).toBe(true);
      expect((person['knowsAbout'] as string[]).length).toBeGreaterThan(0);
    });

    it('Person knowsAbout 應含匯率與 Web 開發相關主題', () => {
      const person = buildPersonJsonLd();
      const topics = (person['knowsAbout'] as string[]).join(' ');
      expect(topics).toMatch(/匯率|exchange rate/i);
    });
  });

  // ─── AnswerCapsule 覆蓋率：AEO/GEO 快速答案區塊必須存在 ────────────────────
  describe('AnswerCapsule 覆蓋率（AEO/GEO 必要信號）', () => {
    const CURRENCY_CODES = [
      'USD',
      'JPY',
      'EUR',
      'GBP',
      'CNY',
      'KRW',
      'HKD',
      'AUD',
      'CAD',
      'SGD',
      'THB',
      'NZD',
      'CHF',
      'VND',
      'PHP',
      'IDR',
      'MYR',
    ] as const;

    it('所有 17 個正向幣別頁（xxx-twd）應有非空 answerCapsule', () => {
      for (const code of CURRENCY_CODES) {
        const content = getCurrencyLandingPageContent(code);
        expect(
          content.answerCapsule,
          `getCurrencyLandingPageContent('${code}').answerCapsule 不存在`,
        ).toBeDefined();
        expect(
          content.answerCapsule!.length,
          `getCurrencyLandingPageContent('${code}').answerCapsule 為空`,
        ).toBeGreaterThan(0);
      }
    });

    it('所有 17 個反向幣別頁（twd-xxx）應有非空 answerCapsule', () => {
      for (const code of CURRENCY_CODES) {
        const content = getReverseCurrencyLandingPageContent(code);
        expect(
          content.answerCapsule,
          `getReverseCurrencyLandingPageContent('${code}').answerCapsule 不存在`,
        ).toBeDefined();
        expect(
          content.answerCapsule!.length,
          `getReverseCurrencyLandingPageContent('${code}').answerCapsule 為空`,
        ).toBeGreaterThan(0);
      }
    });
  });

  // ─── AEO/GEO 快速答案覆蓋率（answerCapsule）──────────────────────────────
  describe('AEO/GEO answerCapsule 覆蓋率', () => {
    it('HOMEPAGE_SEO 應有非空 answerCapsule（首頁是 AI 引擎最常引用的頁面）', () => {
      expect(HOMEPAGE_SEO).toHaveProperty('answerCapsule');
      expect((HOMEPAGE_SEO as { answerCapsule?: unknown[] }).answerCapsule).toBeDefined();
      expect(
        (HOMEPAGE_SEO as { answerCapsule?: unknown[] }).answerCapsule!.length,
      ).toBeGreaterThanOrEqual(2);
    });

    it('FAQ_PAGE_SEO 應有非空 answerCapsule（FAQ 頁是高頻搜尋落地頁）', () => {
      expect(FAQ_PAGE_SEO).toHaveProperty('answerCapsule');
      expect((FAQ_PAGE_SEO as { answerCapsule?: unknown[] }).answerCapsule).toBeDefined();
      expect(
        (FAQ_PAGE_SEO as { answerCapsule?: unknown[] }).answerCapsule!.length,
      ).toBeGreaterThanOrEqual(2);
    });

    it('HOMEPAGE_SEO.answerCapsule 每項應有 question 與 non-empty answer', () => {
      const capsule = (HOMEPAGE_SEO as { answerCapsule?: { question: string; answer: string }[] })
        .answerCapsule;
      if (!capsule) return;
      for (const item of capsule) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThanOrEqual(20);
      }
    });

    it('FAQ_PAGE_SEO.answerCapsule 每項應有 question 與 non-empty answer', () => {
      const capsule = (FAQ_PAGE_SEO as { answerCapsule?: { question: string; answer: string }[] })
        .answerCapsule;
      if (!capsule) return;
      for (const item of capsule) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThanOrEqual(20);
      }
    });
  });

  // ─── /seo-tech/ 可索引頁面 SEO metadata 正確性 ─────────────────────────────
  describe('/seo-tech/ 可索引頁面 SEO metadata 正確性', () => {
    it('APP_ONLY_PAGE_SEO.seoTech.pathname 應以尾斜線結尾（與 CONTENT_SEO_PATHS 對齊）', () => {
      // 理由：/seo-tech/ 在 CONTENT_SEO_PATHS 有尾斜線；pathname 缺尾斜線會導致
      // buildCanonicalUrl 產生的 canonical 與 sitemap URL 不一致。
      expect(APP_ONLY_PAGE_SEO.seoTech.pathname).toMatch(/\/$/);
    });

    it('APP_ONLY_PAGE_SEO.seoTech.breadcrumb 第二項 item 應以尾斜線結尾', () => {
      const breadcrumb = APP_ONLY_PAGE_SEO.seoTech.breadcrumb;
      expect(breadcrumb).toBeDefined();
      expect(breadcrumb).toHaveLength(2);
      const secondItem = breadcrumb![1];
      expect(secondItem!.item).toMatch(/\/$/);
    });

    it('APP_ONLY_PAGE_SEO.seoTech.jsonLd 應已定義（Article JSON-LD 必須存在）', () => {
      expect(APP_ONLY_PAGE_SEO.seoTech.jsonLd).toBeDefined();
    });

    it('APP_ONLY_PAGE_SEO.seoTech robots 應為 index, follow（可索引頁面，不應含 noindex）', () => {
      expect(APP_ONLY_PAGE_SEO.seoTech.robots).toMatch(/^index/);
      expect(APP_ONLY_PAGE_SEO.seoTech.robots).not.toContain('noindex');
    });
  });
});
