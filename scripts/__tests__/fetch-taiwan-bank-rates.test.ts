import { describe, expect, it } from 'vitest';

import {
  assertRatesIntegrity,
  resolveMutationThreshold,
  parseTaiwanBankCSV,
  hasRateChanges,
  parseBoardPublishedAt,
} from '../fetch-taiwan-bank-rates.js';
import { parseSourceRate } from '../lib/source-quotes.mjs';
import { normalizeBankSnapshot } from '../../apps/shared/fx/index';

function csv(code: string, cashBuy: string, spotBuy: string, cashSell: string, spotSell: string) {
  const columns = Array<string>(14).fill('-');
  columns[0] = code;
  columns[2] = cashBuy;
  columns[3] = spotBuy;
  columns[12] = cashSell;
  columns[13] = spotSell;
  return `header\n${columns.join(',')}`;
}

describe('台銀完整牌告契約', () => {
  it('保留只有即期價格的幣別及原始十進位文字', () => {
    const result = parseTaiwanBankCSV(csv('ZAR', '-', '1.7', '-', '1.90'));
    expect(result.details['ZAR']!.spot).toEqual({ buy: 1.7, sell: 1.9 });
    expect(result.sourceQuotes['ZAR']!.spot.sell).toBe('1.90');
    expect(result.details['ZAR']!.cash).toEqual({ buy: null, sell: null });
  });

  it.each(['-3', '31x', 'Infinity', 'NaN'])('不合法價格 %s 只跳過該幣別，不中止整批', (invalid) => {
    const text = `${csv('USD', invalid, '31', '32', '31.5')}\n${csv('JPY', '0.2', '0.21', '0.22', '0.215').split('\n')[1]}`;
    const result = parseTaiwanBankCSV(text);
    expect(result.rates['USD']).toBeUndefined();
    expect(result.sourceQuotes['USD']).toBeUndefined();
    expect(result.rates['JPY']).toBe(0.22);
  });

  it.each(['cash.buy', 'spot.buy', 'spot.sell'])('單獨改變 %s 仍發布', (path) => {
    const before = parseTaiwanBankCSV(csv('USD', '30', '31', '32', '31.5'));
    const after = structuredClone(before);
    const [kind, side] = path.split('.') as ['cash' | 'spot', 'buy' | 'sell'];
    after.details['USD']![kind][side]! += 0.1;
    expect(hasRateChanges(after, before)).toBe(true);
    expect(hasRateChanges(before, before)).toBe(false);
  });

  it('上游 0 保留原文並正規化為 suppressed，v2 欄位與 main 一樣視為無報價', () => {
    expect(parseSourceRate('0.00000')).toBe('0.00000');
    expect(parseSourceRate('-')).toBeNull();
    const result = parseTaiwanBankCSV(csv('USD', '0.00000', '31.705', '32.05', '31.855'));
    expect(result.sourceQuotes['USD']!.cash.buy).toBe('0.00000');
    expect(result.details['USD']!.cash.buy).toBeNull();
    expect(result.rates['USD']).toBe(32.05);
    const quote = normalizeBankSnapshot({
      timestamp: '2026-09-28T00:31:00.000Z',
      sourceQuotes: result.sourceQuotes,
    }).find((q) => q.fromCurrency === 'USD' && q.sourceQuote.deliveryMethod === 'cash');
    expect(quote).toMatchObject({ status: 'unavailable', unavailableReason: 'suppressed' });
    // 全為 0 的幣別不進 v2 rates（避免熔斷把 0 當成壞值拒寫整份）。
    const zero = parseTaiwanBankCSV(csv('USD', '0', '0', '0', '0'));
    expect(zero.rates['USD']).toBeUndefined();
  });

  it('以 CSV Content-Disposition 檔名取得牌告掛牌時間（臺北時間）', () => {
    const now = new Date('2026-09-28T00:40:00Z');
    // 2026-09-28 實測：牌告頁「牌價最新掛牌時間：2026/09/28 08:31」，CSV 檔名 ExchangeRate@202609280831.csv。
    expect(parseBoardPublishedAt('attachment; filename="ExchangeRate@202609280831.csv"', now)).toBe(
      '2026-09-28T00:31:00.000Z',
    );
    expect(parseBoardPublishedAt(null, now)).toBeNull();
    expect(parseBoardPublishedAt('attachment; filename="rates.csv"', now)).toBeNull();
    expect(parseBoardPublishedAt('filename="ExchangeRate@202602301600.csv"', now)).toBeNull();
    expect(parseBoardPublishedAt('filename="ExchangeRate@202609281600.csv"', now)).toBeNull();
  });

  it('掛牌時間變更即使價格相同也視為有變化', () => {
    const before = {
      ...parseTaiwanBankCSV(csv('USD', '30', '31', '32', '31.5')),
      sourcePublishedAt: '2026-09-28T00:31:00.000Z',
    };
    expect(
      hasRateChanges({ ...before, sourcePublishedAt: '2026-09-28T01:02:00.000Z' }, before),
    ).toBe(true);
  });

  it('首次快照也拒絕負值與非有限價格', () => {
    expect(() => assertRatesIntegrity({ USD: -1 }, null, { minCurrencyCount: 1 })).toThrow();
    expect(() => assertRatesIntegrity({ USD: Infinity }, null, { minCurrencyCount: 1 })).toThrow();
  });
});

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
