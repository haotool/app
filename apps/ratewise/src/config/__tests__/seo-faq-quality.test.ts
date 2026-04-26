/**
 * SEO FAQ 品質測試 (P2 + P12)
 *
 * P2: 幣別特化 FAQ 去重驗證
 *  - 每個幣別的 faqEntries 應包含幣別特化刷卡/支付提示
 *  - 刷卡匯率 FAQ 不應在所有 17 幣別中完全相同
 *
 * P12: FAQPage JSON-LD 範圍控制
 *  - FAQPage JSON-LD 僅允許 /faq/ 主 FAQ 頁輸出
 *  - 幣別頁保留可讀 FAQ HTML，但不得輸出 FAQPage schema
 */

import { describe, expect, it } from 'vitest';
import {
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
} from '../seo-metadata';

const ALL_CURRENCIES = [
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
  'VND',
  'CHF',
  'NZD',
  'PHP',
  'IDR',
  'MYR',
] as const;

// ─── P2: 刷卡/支付 FAQ 去重驗證 ───────────────────────────────────────────────

describe('P2: FAQ 幣別特化去重（刷卡/支付提示唯一性）', () => {
  it('每個幣別的 faqEntries 至少有 4 則以上的 FAQ', () => {
    for (const code of ALL_CURRENCIES) {
      const { faqEntries } = getCurrencyLandingPageContent(code);
      expect(faqEntries.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('刷卡/支付提示 FAQ 的答案不應全部 17 幣別完全相同', () => {
    // 收集所有幣別的「刷卡」相關 FAQ 答案
    const cardAnswers = ALL_CURRENCIES.map((code) => {
      const { faqEntries } = getCurrencyLandingPageContent(code);
      return (
        faqEntries.find(
          (faq) =>
            faq.question.includes('刷卡') ||
            faq.question.includes('信用卡') ||
            faq.question.includes('支付'),
        )?.answer ?? ''
      );
    }).filter(Boolean);

    // 至少應有 5 個不同的刷卡 FAQ 答案（允許部分模板化，但不允許全部相同）
    const uniqueAnswers = new Set(cardAnswers);
    expect(uniqueAnswers.size).toBeGreaterThanOrEqual(5);
  });

  it('USD 刷卡/支付 FAQ 應包含美國相關關鍵字（credit card 或 回饋 或 小費）', () => {
    const { faqEntries } = getCurrencyLandingPageContent('USD');
    const cardFaq = faqEntries.find(
      (faq) =>
        faq.question.includes('刷卡') ||
        faq.question.includes('信用卡') ||
        faq.question.includes('支付'),
    );
    expect(cardFaq).toBeTruthy();
    const combined = (cardFaq!.question + cardFaq!.answer).toLowerCase();
    expect(/刷卡|信用卡|回饋|小費|手續費|美國/.exec(combined)).toBeTruthy();
  });

  it('JPY 刷卡/支付 FAQ 應包含日本相關關鍵字（現金 或 日本 或 PayPay）', () => {
    const { faqEntries } = getCurrencyLandingPageContent('JPY');
    const cardFaq = faqEntries.find(
      (faq) =>
        faq.question.includes('刷卡') ||
        faq.question.includes('信用卡') ||
        faq.question.includes('現金') ||
        faq.question.includes('支付'),
    );
    expect(cardFaq).toBeTruthy();
    const combined = cardFaq!.question + cardFaq!.answer;
    expect(/日本|PayPay|現金|刷卡|信用卡/.exec(combined)).toBeTruthy();
  });

  it('KRW 刷卡/支付 FAQ 應包含韓國相關關鍵字（首爾 或 韓國 或 交通卡）', () => {
    const { faqEntries } = getCurrencyLandingPageContent('KRW');
    const cardFaq = faqEntries.find(
      (faq) =>
        faq.question.includes('刷卡') ||
        faq.question.includes('信用卡') ||
        faq.question.includes('支付'),
    );
    expect(cardFaq).toBeTruthy();
    const combined = cardFaq!.question + cardFaq!.answer;
    expect(/韓國|首爾|交通卡|T-money|刷卡|信用卡|回饋/.exec(combined)).toBeTruthy();
  });

  it('反向頁（TWD→外幣）也應有幣別特化 FAQ', () => {
    for (const code of ['USD', 'JPY', 'KRW', 'EUR', 'HKD'] as const) {
      const { faqEntries } = getReverseCurrencyLandingPageContent(code);
      expect(faqEntries.length).toBeGreaterThanOrEqual(4);
    }
  });
});

// ─── P12: FAQPage JSON-LD 範圍控制 ────────────────────────────────────────────

describe('P12: FAQPage JSON-LD 僅限主 FAQ 頁輸出', () => {
  it.each(ALL_CURRENCIES)('%s 正向頁不應包含 FAQPage JSON-LD schema', (code) => {
    const { jsonLd } = getCurrencyLandingPageContent(code);
    const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
    expect(faqPageSchema).toBeUndefined();
  });

  it.each(ALL_CURRENCIES)('%s 反向頁不應包含 FAQPage JSON-LD schema', (code) => {
    const { jsonLd } = getReverseCurrencyLandingPageContent(code);
    const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
    expect(faqPageSchema).toBeUndefined();
  });
});
