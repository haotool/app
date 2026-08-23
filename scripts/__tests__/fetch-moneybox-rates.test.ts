import { describe, expect, it } from 'vitest';

import {
  assertMoneyBoxRatesIntegrity,
  shouldRefreshLatestSnapshot,
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
