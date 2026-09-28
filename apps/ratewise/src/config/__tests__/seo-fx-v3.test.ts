import { describe, it, expect } from 'vitest';
import { estimate, normalizeQuote, type QuoteSnapshot } from '@app/shared/fx';
import { SEO_RATE_EXAMPLES } from '../generated/seo-rate-examples';
import {
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
  type CurrencyLandingCode,
} from '../seo-metadata/currency-landing';
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

describe('SEO projection stays equivalent to the shared estimate without loading it', () => {
  const amounts = ['1', '100', '1000', '5000', '30000', '1000000', '12345.67', '0.01', '2.5'];
  const allQuotes = Object.values(SEO_RATE_EXAMPLES).flatMap((example) => [
    ...example.quotes,
    ...(example.alternativeProviders ?? []).flatMap((provider) => provider.quotes),
  ]);

  it('matches estimate() for every generated SEO quote, amount and direction', () => {
    expect(allQuotes.length).toBeGreaterThan(30);
    for (const quote of allQuotes) {
      const direction = quote.fromCurrency === 'TWD' ? 'twd-to-foreign' : 'to-twd';
      const currency = direction === 'to-twd' ? quote.fromCurrency : quote.toCurrency;
      for (const amount of amounts) {
        const expected = estimate(quote, {
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          amount,
          mode: 'EXACT_IN',
        });
        const projected = projectSeoQuote([quote], currency, direction, amount);
        if (expected.status !== 'available') {
          expect(projected).toBeNull();
          continue;
        }
        expect(projected).toMatchObject({ rate: expected.rate, amount: expected.toAmount });
      }
    }
  });

  it('rounds half to even at the target minor unit and rejects invalid amounts', () => {
    const [usdToTwd] = normalizeQuote({
      providerId: 'bot',
      subjectCurrency: 'USD',
      priceCurrency: 'TWD',
      unitAmount: '1',
      providerBuyPrice: '31.005',
      providerSellPrice: '32',
      sourcePublishedAt: null,
      fetchedAt: '2026-09-21T00:00:00Z',
      lastSuccessfulCheckAt: '2026-09-21T00:00:00Z',
      serviceCountry: 'TW',
      deliveryMethod: 'cash',
      channel: 'branch',
      dataKind: 'published_board',
    });
    const quote = [usdToTwd!];
    expect(projectSeoQuote(quote, 'USD', 'to-twd', '1')?.amount).toBe('31');
    expect(projectSeoQuote(quote, 'USD', 'to-twd', '3')?.amount).toBe('93.02');
    for (const amount of ['-1', '1e3', '9007199254740992', '0.123456789'])
      expect(projectSeoQuote(quote, 'USD', 'to-twd', amount)).toBeNull();
  });
});

describe('flag-off landing copy', () => {
  it('never prints an unknown source publication time', () => {
    const codes = Object.keys(SEO_RATE_EXAMPLES) as CurrencyLandingCode[];
    expect(codes).toHaveLength(17);
    const answers = codes
      .flatMap((code) => [
        getCurrencyLandingPageContent(code),
        getReverseCurrencyLandingPageContent(code),
      ])
      .flatMap((content) => content.faqEntries.map((entry) => entry.answer));
    expect(answers.length).toBeGreaterThan(100);
    for (const answer of answers) expect(answer).not.toMatch(/來源發布時間[ ：:]*未知/);
  });
});
