import { describe, it, expect } from 'vitest';
import { normalizeQuote } from '@app/shared/fx';
import { projectSeoQuote } from '../seo-metadata/fx-projection';
import { buildSeoExamples } from '../../../scripts/update-seo-rate-examples.mjs';
const quotes = normalizeQuote({
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  buy: '31',
  sell: '32',
  sourcePublishedAt: null,
  fetchedAt: '2026-09-21T00:00:00Z',
  lastSuccessfulCheckAt: '2026-09-21T00:00:00Z',
  serviceCountry: 'TW',
  deliveryMethod: 'cash',
  channel: 'branch',
});
describe('SEO directional projection', () => {
  it('uses buy for USD to TWD and preserves unknown source time', () => {
    expect(projectSeoQuote(quotes, 'USD', 'to-twd', '100')).toMatchObject({
      rate: '31',
      amount: '3100',
      providerSide: 'buy',
      sourcePublishedAt: null,
    });
  });
  it('uses sell reciprocal for TWD to USD and never swaps missing sides', () => {
    expect(projectSeoQuote(quotes, 'USD', 'twd-to-foreign', '100')).toMatchObject({
      rate: '0.03125',
      amount: '3.12',
      providerSide: 'sell',
    });
    expect(
      projectSeoQuote(
        quotes.filter((q) => q.providerSide === 'sell'),
        'USD',
        'to-twd',
        '100',
      ),
    ).toBeNull();
  });
});

describe('SEO alternative provider projection', () => {
  const bank = {
    timestamp: '2026-09-21T00:00:00Z',
    details: { KRW: { cash: { buy: '0.02', sell: '0.03' } } },
  };

  it('keeps the TWD to KRW provider when the reverse side is missing', () => {
    const result = buildSeoExamples(bank, {
      timestamp: bank.timestamp,
      rates: { TWD: { buy: null, sell: '45' } },
    });

    expect(result['KRW']?.alternativeProviders?.[0]).toMatchObject({
      rate: 45,
      rateBuy: null,
    });
  });

  it('keeps the KRW to TWD provider when the forward side is missing', () => {
    const result = buildSeoExamples(bank, {
      timestamp: bank.timestamp,
      rates: { TWD: { buy: '46', sell: null } },
    });

    expect(result['KRW']?.alternativeProviders?.[0]?.rate).toBeNull();
    expect(result['KRW']?.alternativeProviders?.[0]?.rateBuy).toBeCloseTo(1 / 46);
  });
});
