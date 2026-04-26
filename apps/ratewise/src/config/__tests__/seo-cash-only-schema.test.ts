/**
 * 現金專屬幣別 schema 與文案真實性測試。
 *
 * 台灣銀行對 KRW、PHP、IDR、MYR、VND 不提供即期匯率（spot.sell = null）。
 * RateWise 幣別頁已改為只輸出 ExchangeRateSpecification，不再輸出 FinancialService。
 */

import { describe, expect, it } from 'vitest';
import { SEO_RATE_EXAMPLES } from '../generated/seo-rate-examples';
import {
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
} from '../seo-metadata';
import type { CurrencyLandingCode, ReverseCurrencyLandingCode } from '../seo-metadata';

/** 已知台灣銀行不提供即期匯率的幣別（live rates.json 驗證）。 */
const CASH_ONLY_CURRENCIES: CurrencyLandingCode[] = ['KRW', 'PHP', 'IDR', 'MYR', 'VND'];

/** 已知台灣銀行同時提供即期與現金匯率的幣別（抽樣驗證）。 */
const SPOT_AVAILABLE_CURRENCIES: CurrencyLandingCode[] = ['USD', 'JPY', 'EUR', 'THB'];

describe('SEO_RATE_EXAMPLES spotAvailable 欄位', () => {
  it('現金專屬幣別應有 spotAvailable: false', () => {
    for (const code of CASH_ONLY_CURRENCIES) {
      const example = SEO_RATE_EXAMPLES[code];
      expect(example, `SEO_RATE_EXAMPLES 缺少 ${code}`).toBeDefined();
      expect(
        (example as unknown as { spotAvailable: boolean }).spotAvailable,
        `${code} 應為現金專屬（spotAvailable: false）`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別應有 spotAvailable: true', () => {
    for (const code of SPOT_AVAILABLE_CURRENCIES) {
      const example = SEO_RATE_EXAMPLES[code];
      expect(example, `SEO_RATE_EXAMPLES 缺少 ${code}`).toBeDefined();
      expect(
        (example as unknown as { spotAvailable: boolean }).spotAvailable,
        `${code} 應有即期匯率（spotAvailable: true）`,
      ).toBe(true);
    }
  });
});

type JsonLdBlock = Record<string, unknown>;

function getJsonLdTypes(jsonLd: readonly JsonLdBlock[]): string[] {
  return jsonLd.map((node) => {
    const type = node['@type'];
    return typeof type === 'string' ? type : '';
  });
}

describe('getCurrencyLandingPageContent 結構化資料矩陣（正向頁）', () => {
  it('現金專屬幣別不應再輸出 FinancialService', () => {
    for (const code of CASH_ONLY_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      const types = getJsonLdTypes(content.jsonLd as JsonLdBlock[]);
      expect(
        types.includes('FinancialService'),
        `${code} 幣別頁不應再輸出 FinancialService。當前 types: ${JSON.stringify(types)}`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別也不應再輸出 FinancialService', () => {
    for (const code of SPOT_AVAILABLE_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      const types = getJsonLdTypes(content.jsonLd as JsonLdBlock[]);
      expect(
        types.includes('FinancialService'),
        `${code} 幣別頁不應再輸出 FinancialService。當前 types: ${JSON.stringify(types)}`,
      ).toBe(false);
    }
  });

  it('所有幣別頁都應保留 ExchangeRateSpecification', () => {
    for (const code of [...CASH_ONLY_CURRENCIES, ...SPOT_AVAILABLE_CURRENCIES]) {
      const content = getCurrencyLandingPageContent(code);
      const types = getJsonLdTypes(content.jsonLd as JsonLdBlock[]);
      expect(
        types.includes('ExchangeRateSpecification'),
        `${code} 幣別頁應保留 ExchangeRateSpecification。當前 types: ${JSON.stringify(types)}`,
      ).toBe(true);
    }
  });
});

describe('getCurrencyLandingPageContent 頁面 description 精準性', () => {
  it('現金專屬幣別頁面 description 不應聲稱支援即期匯率切換', () => {
    for (const code of CASH_ONLY_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      expect(
        content.description.includes('支援現金與即期匯率切換') ||
          content.description.includes('現金與即期匯率切換'),
        `${code} 正向頁 description 不應宣稱支援即期匯率切換`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別頁面 description 可包含現金與即期切換說明', () => {
    for (const code of SPOT_AVAILABLE_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      expect(
        content.description.includes('即期') || content.description.includes('匯率'),
        `${code} 正向頁 description 應含匯率說明`,
      ).toBe(true);
    }
  });
});

describe('getReverseCurrencyLandingPageContent 頁面 description 精準性', () => {
  const CASH_ONLY_REVERSE = CASH_ONLY_CURRENCIES as unknown as ReverseCurrencyLandingCode[];
  const SPOT_AVAILABLE_REVERSE =
    SPOT_AVAILABLE_CURRENCIES as unknown as ReverseCurrencyLandingCode[];

  it('現金專屬幣別反向頁 description 不應聲稱支援即期匯率切換', () => {
    for (const code of CASH_ONLY_REVERSE) {
      const content = getReverseCurrencyLandingPageContent(code);
      expect(
        content.description.includes('支援現金與即期匯率切換') ||
          content.description.includes('現金與即期匯率切換'),
        `${code} 反向頁 description 不應宣稱支援即期匯率切換`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別反向頁 description 可包含現金與即期切換說明', () => {
    for (const code of SPOT_AVAILABLE_REVERSE) {
      const content = getReverseCurrencyLandingPageContent(code);
      expect(
        content.description.includes('即期') || content.description.includes('匯率'),
        `${code} 反向頁 description 應含匯率說明`,
      ).toBe(true);
    }
  });
});

interface FAQEntry {
  question: string;
  answer: string;
}

describe('getCurrencyLandingPageContent FAQ 內容精準性（正向頁）', () => {
  it('現金專屬幣別不應有「現金賣出和即期賣出有什麼差別」問題（該幣別無即期匯率）', () => {
    for (const code of CASH_ONLY_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      const faqEntries = content.faqEntries as FAQEntry[];
      const hasSpotVsCashFaq = faqEntries.some(
        (e) =>
          e.question.includes('即期賣出') &&
          e.question.includes('現金賣出') &&
          e.question.includes('差別'),
      );
      expect(
        hasSpotVsCashFaq,
        `${code} FAQ 不應有「現金賣出和即期賣出有什麼差別」問題（${code} 僅有現金牌告）`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別應有「現金賣出和即期賣出有什麼差別」問題', () => {
    for (const code of SPOT_AVAILABLE_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      const faqEntries = content.faqEntries as FAQEntry[];
      const hasSpotVsCashFaq = faqEntries.some(
        (e) =>
          e.question.includes('即期賣出') &&
          e.question.includes('現金賣出') &&
          e.question.includes('差別'),
      );
      expect(hasSpotVsCashFaq, `${code} FAQ 應有「現金賣出和即期賣出有什麼差別」問題`).toBe(true);
    }
  });
});

describe('getCurrencyLandingPageContent FAQ #1 答案精準性（正向頁）', () => {
  it('現金專屬幣別 FAQ #1 答案不應聲稱顯示即期賣出價', () => {
    for (const code of CASH_ONLY_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      const faqEntries = content.faqEntries as FAQEntry[];
      const firstFaq = faqEntries[0];
      expect(firstFaq, `${code} 缺少 FAQ #1`).toBeDefined();
      if (!firstFaq) continue;
      expect(
        firstFaq.answer.includes('現金賣出與即期賣出價'),
        `${code} FAQ #1 答案不應聲稱顯示即期賣出價（該幣別僅有現金牌告）`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別 FAQ #1 答案應聲稱顯示現金賣出與即期賣出價', () => {
    for (const code of SPOT_AVAILABLE_CURRENCIES) {
      const content = getCurrencyLandingPageContent(code);
      const faqEntries = content.faqEntries as FAQEntry[];
      const firstFaq = faqEntries[0];
      expect(firstFaq, `${code} 缺少 FAQ #1`).toBeDefined();
      if (!firstFaq) continue;
      expect(
        firstFaq.answer.includes('現金賣出與即期賣出價'),
        `${code} FAQ #1 答案應聲稱顯示現金賣出與即期賣出價`,
      ).toBe(true);
    }
  });
});

describe('getReverseCurrencyLandingPageContent FAQ 內容精準性（反向頁）', () => {
  const CASH_ONLY_REVERSE = CASH_ONLY_CURRENCIES as unknown as ReverseCurrencyLandingCode[];
  const SPOT_AVAILABLE_REVERSE =
    SPOT_AVAILABLE_CURRENCIES as unknown as ReverseCurrencyLandingCode[];

  it('現金專屬幣別反向頁不應有「外幣帳戶匯款哪種匯率較好」問題（暗示即期可選）', () => {
    for (const code of CASH_ONLY_REVERSE) {
      const content = getReverseCurrencyLandingPageContent(code);
      const faqEntries = content.faqEntries as FAQEntry[];
      const hasSpotAccountFaq = faqEntries.some(
        (e) =>
          e.question.includes('外幣帳戶') &&
          e.question.includes('匯款') &&
          e.question.includes('匯率較好'),
      );
      expect(
        hasSpotAccountFaq,
        `${code} 反向頁 FAQ 不應有暗示即期可選的「外幣帳戶匯款匯率較好」問題（${code} 僅有現金牌告）`,
      ).toBe(false);
    }
  });

  it('有即期匯率的幣別反向頁應有「外幣帳戶匯款哪種匯率較好」問題', () => {
    for (const code of SPOT_AVAILABLE_REVERSE) {
      const content = getReverseCurrencyLandingPageContent(code);
      const faqEntries = content.faqEntries as FAQEntry[];
      const hasSpotAccountFaq = faqEntries.some(
        (e) =>
          e.question.includes('外幣帳戶') &&
          e.question.includes('匯款') &&
          e.question.includes('匯率較好'),
      );
      expect(hasSpotAccountFaq, `${code} 反向頁 FAQ 應有「外幣帳戶匯款哪種匯率較好」問題`).toBe(
        true,
      );
    }
  });
});
