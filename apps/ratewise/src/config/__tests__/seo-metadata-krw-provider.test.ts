/**
 * TDD GREEN: KRW 明洞 FAQ 生成測試（含雙向 direction 支援）
 */

import { describe, it, expect } from 'vitest';
import { buildAlternativeProviderFaq } from '../seo-metadata';
import { SEO_RATE_EXAMPLES } from '../generated/seo-rate-examples';

describe('buildAlternativeProviderFaq（twd-to-foreign，預設方向）', () => {
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

describe('buildAlternativeProviderFaq（to-twd，KRW→TWD 方向）', () => {
  const krw = SEO_RATE_EXAMPLES['KRW']!;
  const provider = krw.alternativeProviders![0]!;

  it('FAQ question 應包含「韓元」或「明洞」關鍵字', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw, 'to-twd');
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs[0]!.question).toMatch(/韓元|明洞/);
  });

  it('FAQ answer 應包含 rateBuy 換算後的台幣金額', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw, 'to-twd');
    const answer = faqs[0]!.answer;
    const rateBuy = provider.rateBuy ?? provider.rate;
    const providerTWD = Math.floor(1_000_000 / rateBuy);
    expect(answer).toContain(providerTWD.toLocaleString());
  });

  it('FAQ answer 應說明需現場前往', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw, 'to-twd');
    const answer = faqs[0]!.answer;
    expect(answer).toMatch(/現場|親自|現鈔/);
  });

  it('FAQ answer 應使用 rateBuy 而非 rate', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw, 'to-twd');
    const answer = faqs[0]!.answer;
    // rateBuy (46.7) 應出現在答案中（作為 KRW/TWD 匯率顯示）
    expect(answer).toContain(provider.rateBuy!.toFixed(1));
  });

  it('to-twd FAQ question 不應包含「去首爾前」（那是 twd-to-foreign 方向）', () => {
    const faqs = buildAlternativeProviderFaq('KRW', krw, 'to-twd');
    expect(faqs[0]!.question).not.toContain('去首爾前');
  });

  it('非 KRW（無 alternativeProviders）應回傳空陣列', () => {
    const usd = SEO_RATE_EXAMPLES['USD']!;
    const faqs = buildAlternativeProviderFaq('USD', usd, 'to-twd');
    expect(faqs).toEqual([]);
  });
});
