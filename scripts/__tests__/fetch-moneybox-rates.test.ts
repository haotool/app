import { describe, expect, it } from 'vitest';

import {
  assertMoneyBoxRatesIntegrity,
  deriveMidpoint,
  mapUpstreamRow,
  shouldRefreshLatestSnapshot,
  toLegacyQuoteUnit,
} from '../fetch-moneybox-rates.js';

const baseRates = {
  TWD: { sell: 46.1, buy: 46.7, base: 47.95, spbuy: 54.23, spsell: 43.16 },
};

describe('fetch-moneybox-rates / shouldRefreshLatestSnapshot', () => {
  it('跨到首爾新的一天時，即使牌價未變也刷新 latest snapshot', () => {
    const oldData = {
      timestamp: '2026-05-31T11:56:44.177Z',
      updateTime: '2026/05/31 20:56:44',
      rates: baseRates,
    };
    const newData = {
      timestamp: '2026-05-31T16:36:06.583Z',
      updateTime: '2026/06/01 01:36:06',
      rates: baseRates,
    };

    expect(shouldRefreshLatestSnapshot(oldData, newData)).toMatchObject({
      shouldUpdate: true,
      reason: 'date-rollover',
      oldSnapshotDate: '2026-05-31',
      newSnapshotDate: '2026-06-01',
    });
  });

  it('同一首爾日且牌價未變時不刷新', () => {
    const oldData = {
      timestamp: '2026-05-31T11:56:44.177Z',
      updateTime: '2026/05/31 20:56:44',
      rates: baseRates,
    };
    const newData = {
      timestamp: '2026-05-31T12:01:44.177Z',
      updateTime: '2026/05/31 21:01:44',
      rates: baseRates,
    };

    expect(shouldRefreshLatestSnapshot(oldData, newData)).toMatchObject({
      shouldUpdate: false,
      reason: 'unchanged',
    });
  });

  it('牌價有變化時刷新（reason=rate-changed）', () => {
    const oldData = { updateTime: '2026/05/31 20:56:44', rates: baseRates };
    const newData = {
      updateTime: '2026/05/31 21:01:44',
      rates: { TWD: { ...baseRates.TWD, sell: 46.2 } },
    };

    const decision = shouldRefreshLatestSnapshot(oldData, newData);
    expect(decision.shouldUpdate).toBe(true);
    expect(decision.reason).toBe('rate-changed');
    expect(decision.rateChanges.length).toBeGreaterThan(0);
  });
});

function makeMoneyBoxRates(count: number, twdSell = 45.9) {
  const rates: Record<string, { currency: string; sell: number | null; buy: number | null }> = {
    TWD: { currency: 'TWD', sell: twdSell, buy: 46.7 },
  };
  for (let i = 1; i < count; i++) {
    const code = `C${String(i).padStart(2, '0')}`;
    rates[code] = { currency: code, sell: 10 + i, buy: 11 + i };
  }
  return rates;
}

describe('fetch-moneybox-rates / assertMoneyBoxRatesIntegrity', () => {
  it('正常資料（幣別足夠、TWD.sell 合理、變動 <15%）通過熔斷', () => {
    const previous = makeMoneyBoxRates(10, 45.5);
    const next = makeMoneyBoxRates(10, 45.9);

    expect(() => assertMoneyBoxRatesIntegrity(next, previous)).not.toThrow();
  });

  it('幣別數 <5 時拋出 AbortError 拒寫', () => {
    expect(() => assertMoneyBoxRatesIntegrity(makeMoneyBoxRates(3), null)).toThrow(
      /Currency count circuit breaker/,
    );
  });

  it('上游對多數幣別停供 sell（回傳 0）時，報為來源停供而非 TWD 個案異常', () => {
    // 2026-08-22 實際事故：上游對 18/20 幣別回傳 "0.0000"，parseFloat 後經 `|| null` 轉成 null。
    const rates = makeMoneyBoxRates(20);
    for (const [code, rate] of Object.entries(rates)) {
      if (code !== 'CAD') rate.sell = null;
    }

    expect(() => assertMoneyBoxRatesIntegrity(rates, null)).toThrow(/Upstream sell-quote outage/);
    // 不得再誤報成 TWD 單一幣別的數值區間問題
    expect(() => assertMoneyBoxRatesIntegrity(rates, null)).not.toThrow(
      /TWD\.sell sanity circuit breaker/,
    );
  });

  it('少數幣別缺 sell 時不誤判為上游停供，仍走既有的 TWD 檢查', () => {
    const rates = makeMoneyBoxRates(20);
    for (const code of ['C01', 'C02']) {
      const rate = rates[code];
      if (rate) rate.sell = null;
    }

    expect(() => assertMoneyBoxRatesIntegrity(rates, null)).not.toThrow();
  });

  it('TWD.sell 超出 30-70 KRW/TWD 合理區間時拋出 AbortError', () => {
    expect(() => assertMoneyBoxRatesIntegrity(makeMoneyBoxRates(10, 4.59), null)).toThrow(
      /TWD\.sell sanity circuit breaker/,
    );
    expect(() => assertMoneyBoxRatesIntegrity(makeMoneyBoxRates(10, 459), null)).toThrow(
      /TWD\.sell sanity circuit breaker/,
    );
  });

  it('TWD.sell 相對舊檔突變 >15% 時拋出 AbortError', () => {
    const previous = makeMoneyBoxRates(10, 45.9);
    const next = makeMoneyBoxRates(10, 60.5);

    expect(() => assertMoneyBoxRatesIntegrity(next, previous)).toThrow(
      /Rate mutation circuit breaker.*TWD\.sell 45\.9 → 60\.5/,
    );
  });

  it('舊檔不存在（previousRates=null）時跳過突變檢查', () => {
    expect(() => assertMoneyBoxRatesIntegrity(makeMoneyBoxRates(10, 60.5), null)).not.toThrow();
  });
});

describe('fetch-moneybox-rates / 新 API 欄位對應（PRD 049 §2.2）', () => {
  it('legacy sell 來自上游 buyRate、legacy buy 來自上游 sellRate——語意相反不可照字面對接', () => {
    const mapped = mapUpstreamRow({ currencyCode: 'TWD', buyRate: 42.15, sellRate: 42.3 });

    expect(mapped).not.toBeNull();
    const [code, quote] = mapped!;
    expect(code).toBe('TWD');
    // 換匯所買入 TWD ＝ 旅客持 TWD 換 KRW 的到手匯率 ＝ 我方 sell
    expect(quote.sell).toBe(42.15);
    expect(quote.buy).toBe(42.3);
    // 反向對接會取到價差的錯誤那一側
    expect(quote.sell).not.toBe(42.3);
  });

  it('價差方向維持 sell < buy（店家低買高賣）', () => {
    const [, quote] = mapUpstreamRow({ currencyCode: 'TWD', buyRate: 42.15, sellRate: 42.3 })!;

    expect(quote.sell!).toBeLessThan(quote.buy!);
  });

  it('上游無 base / spbuy / spsell：base 由兩側中點推導，其餘一律 null 不得填補', () => {
    const [, quote] = mapUpstreamRow({ currencyCode: 'TWD', buyRate: 42.15, sellRate: 42.3 })!;

    expect(quote.base).toBe(42.225);
    expect(quote.spbuy).toBeNull();
    expect(quote.spsell).toBeNull();
  });

  it('0 與非有限值視為上游未報價（null），不得當成有效匯率', () => {
    const [, zero] = mapUpstreamRow({ currencyCode: 'USD', buyRate: 0, sellRate: 0 })!;
    expect(zero.sell).toBeNull();
    expect(zero.buy).toBeNull();
    expect(zero.base).toBeNull();

    const [, nan] = mapUpstreamRow({ currencyCode: 'USD', buyRate: 'x', sellRate: null })!;
    expect(nan.sell).toBeNull();
    expect(nan.buy).toBeNull();
  });

  it('缺 currencyCode 的列被丟棄', () => {
    expect(mapUpstreamRow({ buyRate: 1, sellRate: 2 })).toBeNull();
    expect(mapUpstreamRow({ currencyCode: '  ', buyRate: 1, sellRate: 2 })).toBeNull();
  });
});

describe('fetch-moneybox-rates / per-100 單位還原（PRD 049 §2.3）', () => {
  it('JPY / IDR / VND 由上游 per-1 還原為既有 per-100 慣例', () => {
    expect(toLegacyQuoteUnit('JPY', 8.72)).toBe(872);
    expect(toLegacyQuoteUnit('IDR', 0.09)).toBe(9);
    expect(toLegacyQuoteUnit('VND', 0.056)).toBe(5.6);
  });

  it('其餘幣別不縮放', () => {
    expect(toLegacyQuoteUnit('TWD', 42.15)).toBe(42.15);
    expect(toLegacyQuoteUnit('USD', 1383)).toBe(1383);
  });

  // 8.72 * 100 在 JS 得 872.0000000000001；(42.15+42.3)/2 得 42.224999999999994。
  // 上游原本直接提供乾淨值，換算後若不收斂會使公開產物出現浮點雜訊。
  it('換算結果不得帶二進位浮點雜訊', () => {
    expect(String(toLegacyQuoteUnit('JPY', 8.72))).toBe('872');
    expect(String(toLegacyQuoteUnit('VND', 0.056))).toBe('5.6');
    expect(String(deriveMidpoint(42.3, 42.15))).toBe('42.225');
    expect(String(deriveMidpoint(872, 868))).toBe('870');
  });

  it('中點在任一側缺報價時為 null', () => {
    expect(deriveMidpoint(null, 42.15)).toBeNull();
    expect(deriveMidpoint(42.3, null)).toBeNull();
  });
});
