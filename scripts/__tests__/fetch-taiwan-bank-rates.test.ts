import { describe, expect, it } from 'vitest';

import { assertRatesIntegrity, resolveMutationThreshold } from '../fetch-taiwan-bank-rates.js';

function makeRates(count: number, usd = 32.215): Record<string, number> {
  const rates: Record<string, number> = { USD: usd };
  for (let i = 1; i < count; i++) {
    rates[`C${String(i).padStart(2, '0')}`] = 10 + i;
  }
  return rates;
}

describe('fetch-taiwan-bank-rates / assertRatesIntegrity', () => {
  it('正常資料（17 幣、變動 <15%）通過熔斷', () => {
    const previous = makeRates(17, 32.16);
    const next = makeRates(17, 32.215);

    expect(() => assertRatesIntegrity(next, previous)).not.toThrow();
  });

  it('幣別數 <15 時拋出 AbortError 拒寫', () => {
    expect(() => assertRatesIntegrity(makeRates(10), null)).toThrow(
      /Currency count circuit breaker/,
    );
  });

  it('任一共同幣別突變 >15% 時拋出 AbortError 並列出異常幣別', () => {
    const previous = makeRates(17, 32.16);
    const next = makeRates(17, 40.5);

    expect(() => assertRatesIntegrity(next, previous)).toThrow(
      /Rate mutation circuit breaker.*USD: 32\.16 → 40\.5/,
    );
  });

  it('舊檔不存在（previousRates=null）時跳過突變檢查', () => {
    expect(() => assertRatesIntegrity(makeRates(17, 999), null)).not.toThrow();
  });

  it('resolveMutationThreshold 支援 env 覆寫並在非法值時回落預設 0.15', () => {
    expect(resolveMutationThreshold({ RATE_MUTATION_THRESHOLD: '0.5' })).toBe(0.5);
    expect(resolveMutationThreshold({ RATE_MUTATION_THRESHOLD: 'abc' })).toBe(0.15);
    expect(resolveMutationThreshold({})).toBe(0.15);
  });
});
