import { describe, expect, it } from 'vitest';

import {
  CARD_RATE_CURRENCIES,
  MIN_CARD_RATE_CURRENCIES,
  validateCardRates,
} from '../lib/card-rates-schema.mjs';

function buildValidSnapshot() {
  const rates: Record<string, { visa?: number; mastercard?: number }> = {};
  for (const currency of CARD_RATE_CURRENCIES) {
    rates[currency] = { visa: 32.0, mastercard: 32.2 };
  }
  return {
    updateTime: '2026-07-07T19:17:57.063Z',
    source: {
      visa: { url: 'https://usa.visa.com/...', fetchedAt: '2026-07-07T19:18:23.088Z' },
      mastercard: { url: 'https://www.mastercard.com/...', fetchedAt: '2026-07-07T19:18:45.366Z' },
    },
    rates,
  };
}

describe('card-rates schema contract', () => {
  it('接受結構完整的快照', () => {
    expect(validateCardRates(buildValidSnapshot())).toEqual({ valid: true, errors: [] });
  });

  it('updateTime 非 UTC ISO 時失敗', () => {
    const snapshot = buildValidSnapshot();
    snapshot.updateTime = '2026/07/07 19:17:57';
    const result = validateCardRates(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('updateTime 非 UTC ISO 格式');
  });

  it('source.visa.fetchedAt 非 UTC ISO 時失敗', () => {
    const snapshot = buildValidSnapshot();
    snapshot.source.visa.fetchedAt = 'yesterday';
    expect(validateCardRates(snapshot).valid).toBe(false);
  });

  it('幣別數低於熔斷門檻時失敗', () => {
    const snapshot = buildValidSnapshot();
    const currencies = CARD_RATE_CURRENCIES as readonly string[];
    const only = currencies.slice(0, MIN_CARD_RATE_CURRENCIES - 1);
    snapshot.rates = Object.fromEntries(only.map((c) => [c, { visa: 32, mastercard: 32.2 }]));
    const result = validateCardRates(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('低於熔斷門檻'))).toBe(true);
  });

  it('非正數匯率視為髒資料', () => {
    const snapshot = buildValidSnapshot();
    snapshot.rates.USD = { visa: 0, mastercard: 32.2 };
    const result = validateCardRates(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rates.USD.visa 非正數');
  });

  it('未知幣別被拒', () => {
    const snapshot = buildValidSnapshot() as unknown as {
      rates: Record<string, { visa: number; mastercard: number }>;
    };
    snapshot.rates.XXX = { visa: 1, mastercard: 1 };
    const result = validateCardRates(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rates.XXX 非支援幣別');
  });

  it('單一 provider 缺失仍可接受（另一來源有效）', () => {
    const snapshot = buildValidSnapshot();
    snapshot.rates.USD = { visa: 32.0 };
    expect(validateCardRates(snapshot).valid).toBe(true);
  });

  it('幣別兩 provider 皆缺時失敗', () => {
    const snapshot = buildValidSnapshot();
    snapshot.rates.USD = {};
    const result = validateCardRates(snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rates.USD 無任何 provider 匯率');
  });

  it('拒絕非物件輸入', () => {
    expect(validateCardRates(null).valid).toBe(false);
    expect(validateCardRates('nope' as unknown).valid).toBe(false);
  });
});
