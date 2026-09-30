import { describe, expect, it } from 'vitest';
import { normalizeMoneyboxSnapshot, type SelectionContext } from '@app/shared/fx';
import { estimateCrossPair } from '../fxCrossEstimate';

const quotes = normalizeMoneyboxSnapshot({
  timestamp: '2026-09-22T00:00:00Z',
  rates: { USD: { sell: 1300, buy: 1350 }, JPY: { sell: 900, buy: 950 } },
});
const context: SelectionContext = {
  now: '2026-09-22T00:10:00Z',
  country: 'KR',
  deliveryMethod: 'cash',
  channel: 'branch',
  branchId: 'myeongdong',
};

describe('estimateCrossPair', () => {
  it('routes through the provider pivot currency instead of assuming TWD', () => {
    const result = estimateCrossPair({
      request: { fromCurrency: 'USD', toCurrency: 'JPY', amount: '10', mode: 'EXACT_IN' },
      context,
      quotes,
      providerId: 'moneybox',
      best: false,
    });

    expect(result?.status).toBe('available');
    expect(result?.kind).toBe('derived_cross');
    const pivots = result?.legs.map((id) => quotes.find((quote) => quote.quoteId === id));
    expect(pivots?.map((quote) => [quote?.fromCurrency, quote?.toCurrency])).toEqual([
      ['USD', 'KRW'],
      ['KRW', 'JPY'],
    ]);
  });

  it('returns null when the provider has no route between the currencies', () => {
    expect(
      estimateCrossPair({
        request: { fromCurrency: 'USD', toCurrency: 'EUR', amount: '10', mode: 'EXACT_IN' },
        context,
        quotes,
        providerId: 'moneybox',
        best: false,
      }),
    ).toBeNull();
  });
});
