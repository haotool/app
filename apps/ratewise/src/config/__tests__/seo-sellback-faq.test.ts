import { describe, expect, it } from 'vitest';
import { SEO_RATE_EXAMPLES, SEO_RATE_EXAMPLES_BOARD_DATE } from '../generated/seo-rate-examples';
import {
  buildCashBuyRateSentence,
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
  type CurrencyLandingCode,
  type ReverseCurrencyLandingCode,
} from '../seo-metadata';
import { INDEXABLE_FORWARD_AMOUNTS, INDEXABLE_REVERSE_TWD_AMOUNTS } from '../seo-paths';

describe('美元與日圓現鈔賣回 FAQ', () => {
  it.each([
    ['USD', '美元', 1000],
    ['JPY', '日圓', 100000],
  ] as const)('%s 頁以台銀現金買入價試算', (code, currencyName, amount) => {
    const content = getCurrencyLandingPageContent(code);
    const faq = content.faqEntries.find((entry) => entry.question.includes('手上有'));
    const cashBuy = SEO_RATE_EXAMPLES[code]?.cashBuy;
    const hasValidCashBuy = typeof cashBuy === 'number' && Number.isFinite(cashBuy) && cashBuy > 0;

    expect(faq?.question).toBe(`手上有${currencyName}現鈔，換回台幣要看哪個匯率？`);
    expect(faq?.answer).toContain('現金買入價');
    expect(faq?.answer).toContain('即期買入價');
    if (hasValidCashBuy) {
      expect(faq?.answer).toContain(
        `${amount.toLocaleString('zh-TW')} ${code} × ${cashBuy} = 預估 ${Math.round(amount * cashBuy).toLocaleString('zh-TW')} 元台幣`,
      );
      expect(faq?.answer).toContain('未含手續費');
      expect(faq?.answer).toContain('以台銀當日牌告為準');
      if (SEO_RATE_EXAMPLES_BOARD_DATE) {
        expect(faq?.answer).toContain(SEO_RATE_EXAMPLES_BOARD_DATE);
      }
      expect(faq?.answer).toContain('臺灣銀行通常僅收購外幣紙鈔，硬幣一般不收兌');
    } else {
      expect(faq?.answer).not.toContain('牌告試算：');
      expect(faq?.answer).toContain('現金買入價');
      expect(faq?.answer).toContain('即期買入價');
      expect(faq?.answer).toContain('臺灣銀行通常僅收購外幣紙鈔，硬幣一般不收兌');
    }
  });

  it('cashBuy 缺漏或無效時省略數字試算句', () => {
    expect(buildCashBuyRateSentence('USD', 1000, { cashBuy: undefined })).toBe('');
    expect(buildCashBuyRateSentence('USD', 1000, { cashBuy: 0 })).toBe('');
    expect(buildCashBuyRateSentence('USD', 1000, { cashBuy: Number.NaN })).toBe('');
  });

  it('只有美元與日圓正向頁 FAQ 使用現鈔賣回內容', () => {
    const codes = Object.keys(SEO_RATE_EXAMPLES) as CurrencyLandingCode[];
    // 以關鍵字判別賣回問答；措辭若超出這些關鍵字可能漏判（已知限制）。
    const isSellbackExample = ({ question, answer }: { question: string; answer: string }) =>
      question.includes('手上有') ||
      (answer.includes('現金買入價') &&
        ['換回', '賣回', '拿回'].some((phrase) => answer.includes(phrase))) ||
      (answer.includes('牌告試算：') && answer.includes('現金買入價'));

    for (const code of codes) {
      const forwardFaq = getCurrencyLandingPageContent(code).faqEntries;
      const reverseFaq = getReverseCurrencyLandingPageContent(
        code as ReverseCurrencyLandingCode,
      ).faqEntries;
      const expectedSellbackFaq = code === 'USD' || code === 'JPY';

      for (const faq of [forwardFaq, reverseFaq]) {
        if (expectedSellbackFaq && faq === forwardFaq) {
          expect(faq.filter(isSellbackExample)).toHaveLength(1);
        } else {
          expect(faq.filter(isSellbackExample)).toEqual([]);
        }
      }
    }

    for (const [code, amounts] of Object.entries(INDEXABLE_FORWARD_AMOUNTS)) {
      if (code === 'usd' || code === 'jpy') continue;
      const faq = getCurrencyLandingPageContent(
        code.toUpperCase() as CurrencyLandingCode,
      ).faqEntries;
      expect(amounts.length).toBeGreaterThan(0);
      expect(faq.filter(isSellbackExample)).toEqual([]);
    }

    for (const [code, amounts] of Object.entries(INDEXABLE_REVERSE_TWD_AMOUNTS)) {
      const faq = getReverseCurrencyLandingPageContent(
        code.toUpperCase() as ReverseCurrencyLandingCode,
      ).faqEntries;
      expect(amounts.length).toBeGreaterThan(0);
      expect(faq.filter(isSellbackExample)).toEqual([]);
    }
  });

  it('保留原標題、描述與每頁 FAQPage schema 數量', () => {
    const expected = {
      USD: {
        title: '即時美金匯率 — 台銀實際賣出價 | USD/TWD',
        description:
          '即時查看台銀美金現金賣出價（非中間價），換匯前確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，約每 5 分鐘檢查更新，支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖。適合美國旅遊與海外付款費用估算使用。',
      },
      JPY: {
        title: '即時日圓匯率 — 台銀實際賣出價 | JPY/TWD',
        description:
          '即時查看台銀日圓現金賣出價（非中間價），換匯前確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，約每 5 分鐘檢查更新，支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖。適合日本旅遊換匯費用估算使用。',
      },
    } as const;

    for (const code of ['USD', 'JPY'] as const) {
      const content = getCurrencyLandingPageContent(code);
      expect(content.title).toBe(expected[code].title);
      expect(content.description).toBe(expected[code].description);
      expect(content.jsonLd?.filter((block) => block['@type'] === 'FAQPage')).toHaveLength(0);
    }
  });
});
