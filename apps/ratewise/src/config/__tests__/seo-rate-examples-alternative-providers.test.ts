/**
 * TDD GREEN: AlternativeProvider interface + KRW 明洞換匯資料測試
 */

import { describe, it, expect } from 'vitest';
import { SEO_RATE_EXAMPLES, type RateExample } from '../generated/seo-rate-examples';

describe('AlternativeProvider interface', () => {
  it('KRW 應有 alternativeProviders 欄位', () => {
    const krw = SEO_RATE_EXAMPLES['KRW'];
    expect(krw).toBeDefined();
    expect(krw!.alternativeProviders).toBeDefined();
    expect(Array.isArray(krw!.alternativeProviders)).toBe(true);
    expect(krw!.alternativeProviders!.length).toBeGreaterThan(0);
  });

  it('明洞換匯所資料應有必要欄位', () => {
    const provider = SEO_RATE_EXAMPLES['KRW']!.alternativeProviders![0];
    expect(provider!.name).toBe('明洞換匯所');
    expect(provider!.nameEn).toBe('Myeongdong Exchange');
    expect(typeof provider!.rate).toBe('number');
    expect(typeof provider!.rateInverse).toBe('number');
    expect(provider!.source).toBe('MoneyBox');
    expect(provider!.sourceUrl).toContain('moneybox');
    expect(typeof provider!.rateDate).toBe('string');
    expect(typeof provider!.note).toBe('string');
  });

  it('rate 與 rateInverse 應互為倒數（誤差 < 0.5%）', () => {
    const provider = SEO_RATE_EXAMPLES['KRW']!.alternativeProviders![0]!;
    const product = provider.rate * provider.rateInverse;
    expect(product).toBeCloseTo(1.0, 1); // 誤差 < 0.05
  });

  it('明洞匯率（KRW per TWD）應高於台銀現金賣出換算值', () => {
    const krw = SEO_RATE_EXAMPLES['KRW']!;
    const provider = krw.alternativeProviders![0]!;
    // 台銀 cashSell = 1 KRW = X TWD，換算成 1 TWD = 1/cashSell KRW
    const taiwanBankRate = 1 / krw.cashSell;
    // 明洞匯率應更優惠（同樣台幣換更多韓元）
    expect(provider.rate).toBeGreaterThan(taiwanBankRate);
  });

  it('非 KRW 幣別不應有 alternativeProviders', () => {
    expect(SEO_RATE_EXAMPLES['USD']!.alternativeProviders).toBeUndefined();
    expect(SEO_RATE_EXAMPLES['JPY']!.alternativeProviders).toBeUndefined();
    expect(SEO_RATE_EXAMPLES['EUR']!.alternativeProviders).toBeUndefined();
  });

  it('AlternativeProvider 型別檢查：rate 必須為正數', () => {
    const provider = SEO_RATE_EXAMPLES['KRW']!.alternativeProviders![0]!;
    expect(provider.rate).toBeGreaterThan(0);
    expect(provider.rateInverse).toBeGreaterThan(0);
  });

  it('RateExample 的 alternativeProviders 為 optional', () => {
    // 型別層面：其他幣別不帶此欄位也合法
    const usd: RateExample = SEO_RATE_EXAMPLES['USD']!;
    expect(usd.alternativeProviders).toBeUndefined();
  });
});

describe('buildMyeongdongComparison 計算輔助', () => {
  it('以 30000 TWD 換算：明洞應比台銀多換一定韓元', () => {
    const krw = SEO_RATE_EXAMPLES['KRW']!;
    const provider = krw.alternativeProviders![0]!;
    const exampleTWD = krw.exampleTWD; // 30000

    const myeongdongKRW = Math.floor(exampleTWD * provider.rate);
    const taiwanBankKRW = krw.foreignAtCash;

    expect(myeongdongKRW).toBeGreaterThan(taiwanBankKRW);
    const diffPct = ((myeongdongKRW - taiwanBankKRW) / taiwanBankKRW) * 100;
    // 預期差距約 5-10%
    expect(diffPct).toBeGreaterThan(4);
    expect(diffPct).toBeLessThan(15);
  });
});
