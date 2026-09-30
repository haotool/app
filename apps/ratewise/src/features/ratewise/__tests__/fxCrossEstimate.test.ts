import { describe, expect, it } from 'vitest';
import { normalizeMoneyboxSnapshot, normalizeQuote, type SelectionContext } from '@app/shared/fx';
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

  describe('best mode', () => {
    const NOW = '2026-09-30T00:00:00Z';
    const leg = (providerId: string, subject: string, buy: string, sell: string, at: string) =>
      normalizeQuote({
        providerId,
        subjectCurrency: subject,
        priceCurrency: 'TWD',
        unitAmount: '1',
        providerBuyPrice: buy,
        providerSellPrice: sell,
        sourcePublishedAt: at,
        fetchedAt: NOW,
        lastSuccessfulCheckAt: NOW,
        serviceCountry: 'TW',
        deliveryMethod: 'cash',
        channel: 'branch',
        dataKind: 'published_board',
      });
    const twContext: SelectionContext = {
      now: NOW,
      country: 'TW',
      deliveryMethod: 'cash',
      channel: 'branch',
    };
    const request = {
      fromCurrency: 'USD',
      toCurrency: 'JPY',
      amount: '10',
      mode: 'EXACT_IN' as const,
    };

    it('does not let a stale BoT fallback route outrank a fresh ranked route', () => {
      // 過期台銀匯率刻意更優：若被當作備援一併比較，會勝過有效來源。
      const quotes = [
        ...leg('bot', 'USD', '40', '41', '2020-01-01T00:00:00Z'),
        ...leg('bot', 'JPY', '0.2', '0.21', '2020-01-01T00:00:00Z'),
        ...leg('good-bank', 'USD', '30', '32', NOW),
        ...leg('good-bank', 'JPY', '0.2', '0.25', NOW),
      ];

      const result = estimateCrossPair({
        request,
        context: twContext,
        quotes,
        best: true,
        providerStatuses: new Map([
          ['bot', 'ok'],
          ['good-bank', 'ok'],
        ]),
      });

      const providers = result?.legs.map(
        (id) => quotes.find((quote) => quote.quoteId === id)?.providerId,
      );
      expect(new Set(providers)).toEqual(new Set(['good-bank']));
    });

    it('still falls back to the BoT route when no ranked route exists', () => {
      const quotes = [
        ...leg('bot', 'USD', '30', '32', '2020-01-01T00:00:00Z'),
        ...leg('bot', 'JPY', '0.2', '0.25', '2020-01-01T00:00:00Z'),
      ];

      const result = estimateCrossPair({
        request,
        context: twContext,
        quotes,
        best: true,
        providerStatuses: new Map([['bot', 'ok']]),
      });

      expect(result?.status).toBe('available');
    });
  });
});
