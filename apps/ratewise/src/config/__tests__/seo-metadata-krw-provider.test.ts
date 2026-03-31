/**
 * TDD GREEN: KRW 明洞 FAQ 生成測試
 */

import { describe, it, expect } from 'vitest';
import { buildAlternativeProviderFaq } from '../seo-metadata';
import { SEO_RATE_EXAMPLES } from '../generated/seo-rate-examples';

describe('buildAlternativeProviderFaq', () => {
  const krw = SEO_RATE_EXAMPLES['KRW']!;
  const provider = krw.alternativeProviders![0]!;

  it('FAQ question 應包含「明洞」關鍵字', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw);
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs[0]!.question).toContain('明洞');
  });

  it('FAQ answer 應包含台銀換算金額', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw);
    const answer = faqs[0]!.answer;
    // 台銀金額 = foreignAtCash (1,296,456)
    expect(answer).toContain(krw.foreignAtCash.toLocaleString());
  });

  it('FAQ answer 應包含明洞換算金額', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw);
    const answer = faqs[0]!.answer;
    const myeongdongKRW = Math.floor(krw.exampleTWD * provider.rate);
    expect(answer).toContain(myeongdongKRW.toLocaleString());
  });

  it('FAQ answer 應包含差額百分比（%）', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw);
    const answer = faqs[0]!.answer;
    expect(answer).toMatch(/%/);
  });

  it('FAQ answer 應說明需現場前往', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw);
    const answer = faqs[0]!.answer;
    expect(answer).toMatch(/現場|親赴|親自/);
  });

  it('非 KRW（無 alternativeProviders）應回傳空陣列', () => {
    const usd = SEO_RATE_EXAMPLES['USD']!;
    const faqs = buildAlternativeProviderFaq('USD', usd);
    expect(faqs).toEqual([]);
  });
});
