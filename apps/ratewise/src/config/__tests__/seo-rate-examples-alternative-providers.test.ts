/**
 * TDD GREEN: AlternativeProvider interface + KRW 明洞換匯資料測試
 * 匯率一律由 canonical quotes 投影，不再發布同名但方向不明的 rate／rateBuy。
 */

import { describe, it, expect } from 'vitest';
import { SEO_RATE_EXAMPLES, type RateExample } from '../generated/seo-rate-examples';
import { projectSeoQuote } from '../seo-metadata/fx-projection';

const krw = SEO_RATE_EXAMPLES['KRW']!;
const provider = krw.alternativeProviders![0]!;

describe('AlternativeProvider interface', () => {
  it('KRW 應有 alternativeProviders 欄位', () => {
    expect(krw).toBeDefined();
    expect(krw.alternativeProviders).toBeDefined();
    expect(Array.isArray(krw.alternativeProviders)).toBe(true);
    expect(krw.alternativeProviders!.length).toBeGreaterThan(0);
  });

  it('明洞換匯所資料應有必要欄位', () => {
    expect(provider.name).toBe('明洞換匯所');
    expect(provider.nameEn).toBe('Myeongdong Exchange');
    expect(provider.providerId).toBe('moneybox');
    expect(Array.isArray(provider.quotes)).toBe(true);
    expect(provider.quotes.length).toBeGreaterThan(0);
    expect(provider.source).toBe('MoneyBox');
    expect(provider.sourceUrl).toContain('moneybox');
    expect(provider).toHaveProperty('sourcePublishedAt');
    expect(typeof provider.fetchedAt).toBe('string');
    expect(typeof provider.note).toBe('string');
  });

  it('不發布 legacy rate／rateBuy／rateInverse（同名反義地雷）', () => {
    for (const example of Object.values(SEO_RATE_EXAMPLES)) {
      for (const alternative of example.alternativeProviders ?? []) {
        expect(alternative).not.toHaveProperty('rate');
        expect(alternative).not.toHaveProperty('rateBuy');
        expect(alternative).not.toHaveProperty('rateInverse');
      }
    }
  });

  it('雙向 canonical 報價皆為正數且可試算', () => {
    const outward = projectSeoQuote(provider.quotes, 'KRW', 'twd-to-foreign', '1');
    const inward = projectSeoQuote(provider.quotes, 'KRW', 'to-twd', '1');
    expect(Number(outward?.rate)).toBeGreaterThan(0);
    expect(Number(inward?.rate)).toBeGreaterThan(0);
  });

  it('換匯所買入 KRW 的門檻比賣出寬鬆（往返後金額不增加）', () => {
    const outward = projectSeoQuote(provider.quotes, 'KRW', 'twd-to-foreign', '1');
    const inward = projectSeoQuote(provider.quotes, 'KRW', 'to-twd', '1');
    // TWD→KRW 與 KRW→TWD 皆為 canonical 方向率，乘積 < 1 代表存在買賣價差
    expect(Number(outward!.rate) * Number(inward!.rate)).toBeLessThan(1);
  });

  it('明洞匯率（KRW per TWD）應高於台銀現金賣出換算值', () => {
    expect(krw.cashSell).not.toBeNull();
    // 台銀 cashSell = 1 KRW = X TWD，換算成 1 TWD = 1/cashSell KRW
    const taiwanBankRate = 1 / krw.cashSell!;
    const outward = projectSeoQuote(provider.quotes, 'KRW', 'twd-to-foreign', '1');
    // 明洞匯率應更優惠（同樣台幣換更多韓元）
    expect(Number(outward!.rate)).toBeGreaterThan(taiwanBankRate);
  });

  it('非 KRW 幣別不應有 alternativeProviders', () => {
    expect(SEO_RATE_EXAMPLES['USD']!.alternativeProviders).toBeUndefined();
    expect(SEO_RATE_EXAMPLES['JPY']!.alternativeProviders).toBeUndefined();
    expect(SEO_RATE_EXAMPLES['EUR']!.alternativeProviders).toBeUndefined();
  });

  it('RateExample 的 alternativeProviders 為 optional', () => {
    // 型別層面：其他幣別不帶此欄位也合法
    const usd: RateExample = SEO_RATE_EXAMPLES['USD']!;
    expect(usd.alternativeProviders).toBeUndefined();
  });
});

describe('buildMyeongdongComparison 計算輔助', () => {
  it('以 30000 TWD 換算：明洞應比台銀多換一定韓元', () => {
    const exampleTWD = krw.exampleTWD; // 30000
    const projected = projectSeoQuote(provider.quotes, 'KRW', 'twd-to-foreign', String(exampleTWD));
    const myeongdongKRW = Number(projected!.amount);
    expect(krw.foreignAtCash).not.toBeNull();
    const taiwanBankKRW = krw.foreignAtCash!;

    expect(myeongdongKRW).toBeGreaterThan(taiwanBankKRW);
    const diffPct = ((myeongdongKRW - taiwanBankKRW) / taiwanBankKRW) * 100;
    // 預期差距約 5-10%
    expect(diffPct).toBeGreaterThan(4);
    expect(diffPct).toBeLessThan(15);
  });
});
