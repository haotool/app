import { describe, expect, it } from 'vitest';
import { normalizeQuote } from './index';

export const row = {
  providerId: 'bot',
  subjectCurrency: 'KRW',
  priceCurrency: 'TWD',
  unitAmount: '1',
  buy: '0.023',
  sell: '0.025',
  sourcePublishedAt: '2026-09-22T00:00:00Z',
  fetchedAt: '2026-09-22T00:05:00Z',
  lastSuccessfulCheckAt: '2026-09-22T00:05:00Z',
  serviceCountry: 'TW',
  deliveryMethod: 'cash' as const,
  channel: 'branch' as const,
};
describe('directional quotes', () => {
  it('uses the provider buy side for foreign to local and sell side for local to foreign', () => {
    const quotes = normalizeQuote(row);
    expect(quotes.map((q) => [q.fromCurrency, q.toCurrency, q.rate, q.providerSide])).toEqual([
      ['KRW', 'TWD', '0.023', 'buy'],
      ['TWD', 'KRW', '40', 'sell'],
    ]);
  });
});

import {
  estimate,
  rankQuotes,
  normalizeMoneyboxSnapshot,
  isValidAmount,
  boardMidpoint,
} from './index';
it('rejects unavailable quotes and keeps zero distinct', () => {
  const quotes = normalizeQuote({ ...row, buy: null });
  expect(
    estimate(quotes[0]!, { fromCurrency: 'KRW', toCurrency: 'TWD', amount: '10', mode: 'EXACT_IN' })
      .status,
  ).toBe('unavailable');
  expect(
    estimate(quotes[1]!, { fromCurrency: 'TWD', toCurrency: 'KRW', amount: '0', mode: 'EXACT_IN' })
      .toAmount,
  ).toBe('0');
});
it('validates amount boundaries strictly', () => {
  for (const amount of ['-1', 'Infinity', '1oops', '1e3', '9007199254740992', '1.123456789'])
    expect(isValidAmount(amount)).toBe(false);
  for (const amount of ['0', '1.12345678', '9007199254740991'])
    expect(isValidAmount(amount)).toBe(true);
});
it('exact out is sufficient and minimal with IDR ISO two decimals', () => {
  const q = normalizeQuote({
    ...row,
    subjectCurrency: 'USD',
    priceCurrency: 'IDR',
    sell: '3',
    buy: '2',
  })[1]!;
  expect(
    estimate(q, { fromCurrency: 'IDR', toCurrency: 'USD', amount: '1', mode: 'EXACT_OUT' })
      .fromAmount,
  ).toBe('3.01');
});
it('normalizes per 100 and MoneyBox legacy side names', () => {
  const q = normalizeMoneyboxSnapshot({
    timestamp: row.fetchedAt,
    rates: { JPY: { sell: 900, buy: 950 } },
  });
  expect(q.map((x) => x.rate)).toEqual(['9', '0.1052631578947368421052631578947368']);
  expect(boardMidpoint({ ...row, unitAmount: '100', buy: '900', sell: '950' })).toBe('9.25');
});
it('filters stale, qualification and denomination then ranks real results', () => {
  const q = normalizeQuote(row)[1]!;
  const other = normalizeQuote({
    ...row,
    providerId: 'third-bank',
    sell: '0.02',
    denominations: ['100'],
    qualifications: ['member'],
  })[1]!;
  const req = { fromCurrency: 'TWD', toCurrency: 'KRW', amount: '100', mode: 'EXACT_IN' as const };
  const context = {
    now: '2026-09-22T00:10:00Z',
    country: 'TW',
    deliveryMethod: 'cash' as const,
    channel: 'branch' as const,
  };
  expect(rankQuotes([q, other], req, context).map((x) => x.quote.providerId)).toEqual(['bot']);
  expect(
    rankQuotes([q, other], req, {
      ...context,
      denomination: '100',
      qualifications: ['member'],
    }).map((x) => x.quote.providerId),
  ).toEqual(['third-bank', 'bot']);
  expect(rankQuotes([q], req, { ...context, now: '2026-09-23T00:10:00Z' })).toEqual([]);
  expect(rankQuotes([q], req, context, new Map([['bot', 'failed'] as const]))).toEqual([]);
});
import { validateQuoteSnapshot } from './index';
it('rejects forged normalized rates and unsupported fee claims', () => {
  const q = normalizeQuote(row)[1]!;
  expect(validateQuoteSnapshot({ ...q, rate: '999' })).toBe(false);
  expect(() => normalizeQuote({ ...row, feeStatus: 'no_additional_fee' })).toThrow();
});
import { deriveCrossQuote, exportLegacyRates } from './index';
it('derives a same-provider cross route with both legs, never a direct recommended quote', () => {
  const usd = normalizeQuote({ ...row, subjectCurrency: 'USD', buy: '32', sell: '33' })[0]!;
  const krw = normalizeQuote(row)[1]!;
  const derived = deriveCrossQuote(usd, krw);
  expect(derived).toMatchObject({
    kind: 'derived_cross',
    fromCurrency: 'USD',
    toCurrency: 'KRW',
    rate: '1280',
    recommendable: false,
  });
  expect(derived?.legs).toEqual([usd.quoteId, krw.quoteId]);
  expect(deriveCrossQuote(usd, normalizeQuote({ ...row, providerId: 'third' })[1]!)).toBeNull();
});
it('reconstructs legacy fields from source values, not reciprocal canonical rates', () => {
  const quotes = normalizeMoneyboxSnapshot({
    timestamp: row.fetchedAt,
    sourceQuotes: {
      JPY: { buy: '9', sell: '9.5', unitAmount: '1' },
      TWD: { buy: '42', sell: '43', unitAmount: '1' },
    },
  });
  expect(exportLegacyRates(quotes, 'moneybox')).toEqual({
    JPY: { sell: '900', buy: '950' },
    TWD: { sell: '42', buy: '43' },
  });
});
it('keeps condition boundaries and exact-out ordering consistent for a third shop', () => {
  const base = {
    ...row,
    providerId: 'third-shop',
    serviceCountry: 'KR',
    branchId: 'seoul',
    amountRange: { currency: 'TWD', min: '100', max: '200' },
  };
  const q = normalizeQuote(base)[1]!;
  const request = {
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    amount: '100',
    mode: 'EXACT_IN' as const,
  };
  const ctx = {
    now: '2026-09-22T00:10:00Z',
    country: 'KR',
    deliveryMethod: 'cash' as const,
    channel: 'branch' as const,
    branchId: 'seoul',
  };
  expect(rankQuotes([q], request, ctx)).toHaveLength(1);
  expect(rankQuotes([q], { ...request, amount: '200' }, ctx)).toHaveLength(1);
  expect(rankQuotes([q], { ...request, amount: '200.01' }, ctx)).toHaveLength(0);
  expect(rankQuotes([q], request, { ...ctx, branchId: 'busan' })).toHaveLength(0);
  const better = normalizeQuote({ ...base, providerId: 'fourth-shop', sell: '0.02' })[1]!;
  expect(
    rankQuotes([q, better], { ...request, amount: '5000', mode: 'EXACT_OUT' }, ctx).map(
      (x) => x.quote.providerId,
    ),
  ).toEqual(['fourth-shop', 'third-shop']);
});
it('never recommends missing-time, fallback, reference, unsupported-fee or zero estimates', () => {
  const request = {
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    amount: '100',
    mode: 'EXACT_IN' as const,
  };
  const ctx = {
    now: '2026-09-22T00:10:00Z',
    country: 'TW',
    deliveryMethod: 'cash' as const,
    channel: 'branch' as const,
  };
  for (const change of [
    { sourcePublishedAt: null },
    { dataKind: 'fixed_fallback' as const },
    { dataKind: 'reference' as const },
    { feeStatus: 'unsupported' as const },
  ]) {
    expect(rankQuotes(normalizeQuote({ ...row, ...change }), request, ctx)).toEqual([]);
  }
  expect(rankQuotes(normalizeQuote(row), { ...request, amount: '0' }, ctx)).toEqual([]);
});
it('clones original evidence and rejects later mutations of a quoted source', () => {
  const mutable = { ...row };
  const q = normalizeQuote(mutable)[1]!;
  mutable.sell = '500';
  expect(q.sourceQuote.sell).toBe('0.025');
  q.sourceQuote.sell = '100';
  expect(validateQuoteSnapshot(q)).toBe(false);
});
it('has stable series IDs while quote IDs follow prices, not successful polling', () => {
  const original = normalizeQuote(row)[1]!;
  const checked = normalizeQuote({ ...row, lastSuccessfulCheckAt: '2026-09-22T00:06:00Z' })[1]!;
  const changed = normalizeQuote({ ...row, sell: '0.03' })[1]!;
  expect(original.quoteSeriesId).toBe(changed.quoteSeriesId);
  expect(original.quoteId).not.toBe(changed.quoteId);
  expect(original.quoteId).toBe(checked.quoteId);
});
it('rejects a nonpositive side instead of borrowing the opposite side', () => {
  for (const bad of ['0', '-1', '1x', 'Infinity'])
    expect(() => normalizeQuote({ ...row, buy: bad })).toThrow();
  expect(boardMidpoint({ ...row, buy: null })).toBeNull();
});
it('does not invent a provider for identity conversion and rounds half-even', () => {
  expect(
    estimate(null, { fromCurrency: 'USD', toCurrency: 'USD', amount: '1', mode: 'EXACT_IN' }),
  ).toMatchObject({ quoteId: null, rate: '1', toAmount: '1' });
  const q = normalizeQuote({ ...row, subjectCurrency: 'USD', buy: '1.005' })[0]!;
  expect(
    estimate(q, { fromCurrency: 'USD', toCurrency: 'TWD', amount: '1', mode: 'EXACT_IN' }).toAmount,
  ).toBe('1');
});
import { estimateDerived } from './index';
it('computes a traceable cross estimate with canonical rate and no recommendation', () => {
  const first = normalizeQuote({ ...row, subjectCurrency: 'USD', buy: '32', sell: '33' })[0]!;
  const second = normalizeQuote(row)[1]!;
  expect(
    estimateDerived(first, second, {
      fromCurrency: 'USD',
      toCurrency: 'KRW',
      amount: '10',
      mode: 'EXACT_IN',
    }),
  ).toMatchObject({
    status: 'available',
    toAmount: '12800',
    kind: 'derived_cross',
    recommendable: false,
    legs: [first.quoteId, second.quoteId],
  });
});
import { validateProviderSnapshot, validateObjectReference, isQuoteApplicable } from './index';
it('validates the provider identity at the snapshot boundary', () => {
  expect(
    validateProviderSnapshot({
      schemaVersion: '3.0',
      providerId: 'other',
      quotes: normalizeQuote(row),
    }),
  ).toBe(false);
  expect(validateProviderSnapshot({ schemaVersion: '3.0', providerId: 'bot', quotes: [] })).toBe(
    false,
  );
});
it('rejects unsafe immutable object paths', () => {
  const sha256 = 'a'.repeat(64);
  for (const path of [
    '/objects/a.json',
    '../a.json',
    'objects/../a.json',
    'https://evil/a.json',
    'objects/a.json?q=x',
  ])
    expect(validateObjectReference({ path, sha256 })).toBe(false);
  expect(validateObjectReference({ path: 'objects/a.json', sha256 })).toBe(true);
});
it('allows explicitly selected stale data only when actual conditions still match', () => {
  const q = normalizeQuote(row)[1]!;
  const request = {
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    amount: '100',
    mode: 'EXACT_IN' as const,
  };
  const ctx = {
    now: '2026-09-25T00:10:00Z',
    country: 'TW',
    deliveryMethod: 'cash' as const,
    channel: 'branch' as const,
  };
  expect(isQuoteApplicable(q, request, ctx)).toBe(true);
  expect(isQuoteApplicable(q, request, { ...ctx, country: 'KR' })).toBe(false);
  expect(rankQuotes([q], request, ctx)).toEqual([]);
});

it('keeps a MoneyBox economic series stable across the legacy field mapping', () => {
  const time = '2026-09-21T01:00:00Z';
  const old = normalizeMoneyboxSnapshot({
    timestamp: time,
    rates: { TWD: { buy: '43', sell: '42' } },
  });
  const next = normalizeMoneyboxSnapshot({
    timestamp: time,
    sourceQuotes: { TWD: { buy: '42', sell: '43', unitAmount: '1' } },
  });
  expect(old.map((q) => q.quoteSeriesId)).toEqual(next.map((q) => q.quoteSeriesId));
});
it('keeps the economic series stable when source metadata and denominator change', () => {
  const legacy = normalizeQuote({
    ...row,
    providerId: 'moneybox',
    subjectCurrency: 'JPY',
    priceCurrency: 'KRW',
    unitAmount: '100',
    buy: '900',
    sell: '950',
    sourceUrl: 'https://legacy.example/rates',
    mappingVersion: 'legacy-1',
  });
  const canonical = normalizeQuote({
    ...row,
    providerId: 'moneybox',
    subjectCurrency: 'JPY',
    priceCurrency: 'KRW',
    unitAmount: '1',
    buy: '9',
    sell: '9.5',
    sourceUrl: 'https://canonical.example/rates',
    mappingVersion: 'canonical-2',
  });
  expect(legacy.map((quote) => quote.quoteSeriesId)).toEqual(
    canonical.map((quote) => quote.quoteSeriesId),
  );
  expect(legacy.map((quote) => quote.rate)).toEqual(canonical.map((quote) => quote.rate));
});
