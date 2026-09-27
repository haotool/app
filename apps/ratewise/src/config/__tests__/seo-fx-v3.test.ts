import { describe, it, expect } from 'vitest';
import { normalizeQuote, type QuoteSnapshot } from '@app/shared/fx';
import { projectSeoQuote } from '../seo-metadata/fx-projection';
import { buildSeoExamples } from '../../../scripts/update-seo-rate-examples.mjs';
const quotes = normalizeQuote({
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '31',
  providerSellPrice: '32',
  sourcePublishedAt: null,
  fetchedAt: '2026-09-21T00:00:00Z',
  lastSuccessfulCheckAt: '2026-09-21T00:00:00Z',
  serviceCountry: 'TW',
  deliveryMethod: 'cash',
  channel: 'branch',
  dataKind: 'published_board',
});
describe('SEO directional projection', () => {
  it('uses buy for USD to TWD and preserves unknown source time', () => {
    expect(projectSeoQuote(quotes, 'USD', 'to-twd', '100')).toMatchObject({
      rate: '31',
      amount: '3100',
      sourcePublishedAt: null,
    });
  });
  it('uses sell reciprocal for TWD to USD and never swaps missing sides', () => {
    expect(projectSeoQuote(quotes, 'USD', 'twd-to-foreign', '100')).toMatchObject({
      rate: '0.03125',
      amount: '3.12',
    });
    expect(
      projectSeoQuote(
        quotes.filter((q) => q.fromCurrency === 'TWD'),
        'USD',
        'to-twd',
        '100',
      ),
    ).toBeNull();
  });
});

describe('SEO alternative provider projection', () => {
  const availableRate = (quotes: readonly QuoteSnapshot[], from: string, to: string) =>
    quotes.find((q) => q.fromCurrency === from && q.toCurrency === to && q.status === 'available')
      ?.rate;
  const bank = {
    timestamp: '2026-09-21T00:00:00Z',
    details: { KRW: { cash: { buy: '0.02', sell: '0.03' } } },
  };

  it('keeps the TWD to KRW provider when the reverse side is missing', () => {
    const result = buildSeoExamples(bank, {
      timestamp: bank.timestamp,
      rates: { TWD: { buy: null, sell: '45' } },
    });

    const quotes = result['KRW']?.alternativeProviders?.[0]?.quotes ?? [];
    expect(availableRate(quotes, 'TWD', 'KRW')).toBe('45');
    expect(availableRate(quotes, 'KRW', 'TWD')).toBeUndefined();
  });

  it('keeps the KRW to TWD provider when the forward side is missing', () => {
    const result = buildSeoExamples(bank, {
      timestamp: bank.timestamp,
      rates: { TWD: { buy: '46', sell: null } },
    });

    const quotes = result['KRW']?.alternativeProviders?.[0]?.quotes ?? [];
    expect(availableRate(quotes, 'TWD', 'KRW')).toBeUndefined();
    expect(Number(availableRate(quotes, 'KRW', 'TWD'))).toBeCloseTo(1 / 46);
  });
});
