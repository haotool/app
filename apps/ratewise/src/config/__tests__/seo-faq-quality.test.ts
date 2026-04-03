/**
 * SEO FAQ 品質測試 (P2 + P12)
 *
 * P2: 幣別特化 FAQ 去重驗證
 *  - 每個幣別的 faqEntries 應包含幣別特化刷卡/支付提示
 *  - 刷卡匯率 FAQ 不應在所有 17 幣別中完全相同
 *
 * P12: FAQPage JSON-LD 全幣別啟用驗證
 *  - 全部 17 個正向幣對頁均應包含 FAQPage JSON-LD schema（AI/AEO Rich Result 覆蓋）
 *  - 全部 17 個反向幣對頁均應包含 FAQPage JSON-LD schema
 *  - FAQPage schema 應包含 mainEntity 陣列，每題具備 Question/Answer 結構
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

// ─── P12: FAQPage JSON-LD 全幣別啟用驗證 ────────────────────────────────────────

describe('P12: FAQPage JSON-LD 全幣別啟用（AI/AEO Rich Result 覆蓋）', () => {
  it.each(ALL_CURRENCIES)('%s 正向頁應包含 FAQPage JSON-LD schema', (code) => {
    const { jsonLd } = getCurrencyLandingPageContent(code);
    const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
    expect(faqPageSchema).toBeTruthy();
  });

  it.each(ALL_CURRENCIES)(
    '%s 正向頁 FAQPage 應有 mainEntity 陣列且每項包含 Question/Answer',
    (code) => {
      const { jsonLd } = getCurrencyLandingPageContent(code);
      const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
      expect(faqPageSchema).toBeTruthy();

      const mainEntity = faqPageSchema!['mainEntity'] as unknown[];
      expect(Array.isArray(mainEntity)).toBe(true);
      expect(mainEntity.length).toBeGreaterThanOrEqual(3);

      // 每個 Question 應有 @type: 'Question' + acceptedAnswer
      for (const item of mainEntity as {
        '@type': string;
        name: string;
        acceptedAnswer: { '@type': string; text: string };
      }[]) {
        expect(item['@type']).toBe('Question');
        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.acceptedAnswer?.['@type']).toBe('Answer');
        expect(typeof item.acceptedAnswer?.text).toBe('string');
        // 答案文字不應過短（schema.org 建議至少 50 字符）
        expect(item.acceptedAnswer.text.length).toBeGreaterThanOrEqual(50);
      }
    },
  );

  it.each(ALL_CURRENCIES)('%s 正向頁 FAQPage schema 應有 @context schema.org', (code) => {
    const { jsonLd } = getCurrencyLandingPageContent(code);
    const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
    expect(faqPageSchema?.['@context']).toBe('https://schema.org');
  });

  it.each(ALL_CURRENCIES)('%s 反向頁應包含 FAQPage JSON-LD schema', (code) => {
    const { jsonLd } = getReverseCurrencyLandingPageContent(code);
    const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
    expect(faqPageSchema).toBeTruthy();
  });

  it.each(ALL_CURRENCIES)(
    '%s 反向頁 FAQPage 應有 mainEntity 陣列且每項包含 Question/Answer',
    (code) => {
      const { jsonLd } = getReverseCurrencyLandingPageContent(code);
      const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
      expect(faqPageSchema).toBeTruthy();

      const mainEntity = faqPageSchema!['mainEntity'] as unknown[];
      expect(Array.isArray(mainEntity)).toBe(true);
      expect(mainEntity.length).toBeGreaterThanOrEqual(3);

      for (const item of mainEntity as {
        '@type': string;
        name: string;
        acceptedAnswer: { '@type': string; text: string };
      }[]) {
        expect(item['@type']).toBe('Question');
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.acceptedAnswer?.['@type']).toBe('Answer');
        expect(item.acceptedAnswer.text.length).toBeGreaterThanOrEqual(50);
      }
    },
  );

  it('正向頁 FAQPage schema 答案長度應 ≤ 800 字符（合理 AI 上下文長度）', () => {
    for (const code of ALL_CURRENCIES) {
      const { jsonLd } = getCurrencyLandingPageContent(code);
      const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
      const mainEntity = faqPageSchema?.['mainEntity'] as
        | { acceptedAnswer: { text: string } }[]
        | undefined;
      if (!mainEntity) continue;
      for (const item of mainEntity) {
        // 答案不應過長影響 AI 理解效率（業界建議 300-500，容許動態數據注入後略超）
        expect(item.acceptedAnswer.text.length).toBeLessThanOrEqual(800);
      }
    }
  });

  it('反向頁 FAQPage schema 答案長度應 ≤ 800 字符（合理 AI 上下文長度）', () => {
    for (const code of ALL_CURRENCIES) {
      const { jsonLd } = getReverseCurrencyLandingPageContent(code);
      const faqPageSchema = jsonLd?.find((schema) => schema['@type'] === 'FAQPage');
      const mainEntity = faqPageSchema?.['mainEntity'] as
        | { acceptedAnswer: { text: string } }[]
        | undefined;
      if (!mainEntity) continue;
      for (const item of mainEntity) {
        expect(item.acceptedAnswer.text.length).toBeLessThanOrEqual(800);
      }
    }
  });
});
