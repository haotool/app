import { describe, expect, it, vi } from 'vitest';
import { normalizeQuote } from './index';

export const row = {
  providerId: 'bot',
  subjectCurrency: 'KRW',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '0.023',
  providerSellPrice: '0.025',
  dataKind: 'published_board' as const,
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
    expect(quotes.map((q) => [q.fromCurrency, q.toCurrency, q.rate])).toEqual([
      ['KRW', 'TWD', '0.023'],
      ['TWD', 'KRW', '40'],
    ]);
  });
});

import {
  estimate,
  rankQuotes,
  normalizeMoneyboxSnapshot,
  isValidAmount,
  boardMidpoint,
  normalizeAmountInput,
  normalizeBankSnapshot,
  freshness,
  isQuoteApplicable,
} from './index';
it('rejects unavailable quotes and keeps zero distinct', () => {
  const quotes = normalizeQuote({ ...row, providerBuyPrice: null });
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
    providerSellPrice: '3',
    providerBuyPrice: '2',
  })[1]!;
  expect(
    estimate(q, { fromCurrency: 'IDR', toCurrency: 'USD', amount: '1', mode: 'EXACT_OUT' })
      .fromAmount,
  ).toBe('3');
});
it('normalizes per 100 and MoneyBox legacy side names', () => {
  const q = normalizeMoneyboxSnapshot({
    timestamp: row.fetchedAt,
    rates: { JPY: { sell: 900, buy: 950 } },
  });
  // PRD §18.4：倒數保留 12 位小數 ROUND_HALF_EVEN；來源直接值保留原始位數。
  expect(q.map((x) => x.rate)).toEqual(['9', '0.105263157895']);
  expect(
    boardMidpoint({ ...row, unitAmount: '100', providerBuyPrice: '900', providerSellPrice: '950' }),
  ).toBe('9.25');
});
it('filters stale, qualification and denomination then ranks real results', () => {
  const q = normalizeQuote(row)[1]!;
  const other = normalizeQuote({
    ...row,
    providerId: 'third-bank',
    providerSellPrice: '0.02',
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
  expect(rankQuotes([q], req, { ...context, now: '2026-09-23T12:00:01Z' })).toEqual([]);
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
  const usd = normalizeQuote({
    ...row,
    subjectCurrency: 'USD',
    providerBuyPrice: '32',
    providerSellPrice: '33',
  })[0]!;
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
  const better = normalizeQuote({
    ...base,
    providerId: 'fourth-shop',
    providerSellPrice: '0.02',
  })[1]!;
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
  mutable.providerSellPrice = '500';
  expect(q.sourceQuote.providerSellPrice).toBe('0.025');
  q.sourceQuote.providerSellPrice = '100';
  expect(validateQuoteSnapshot(q)).toBe(false);
});
it('keys quote IDs by source publication time, not successful polling (ADR B3 #5)', () => {
  const original = normalizeQuote(row)[1]!;
  const checked = normalizeQuote({ ...row, lastSuccessfulCheckAt: '2026-09-22T00:06:00Z' })[1]!;
  const republished = normalizeQuote({
    ...row,
    providerSellPrice: '0.03',
    sourcePublishedAt: '2026-09-22T01:00:00Z',
  })[1]!;
  expect(original.quoteSeriesId).toBe(republished.quoteSeriesId);
  expect(original.quoteId).not.toBe(republished.quoteId);
  expect(original.quoteId).toBe(checked.quoteId);
});
it('rejects a nonpositive side instead of borrowing the opposite side', () => {
  for (const bad of ['0', '-1', '1x', 'Infinity'])
    expect(() => normalizeQuote({ ...row, providerBuyPrice: bad })).toThrow();
  expect(boardMidpoint({ ...row, providerBuyPrice: null })).toBeNull();
});
it('does not invent a provider for identity conversion and rounds half-even', () => {
  expect(
    estimate(null, { fromCurrency: 'USD', toCurrency: 'USD', amount: '1', mode: 'EXACT_IN' }),
  ).toMatchObject({ quoteId: null, rate: '1', toAmount: '1' });
  const q = normalizeQuote({ ...row, subjectCurrency: 'USD', providerBuyPrice: '1.005' })[0]!;
  expect(
    estimate(q, { fromCurrency: 'USD', toCurrency: 'TWD', amount: '1', mode: 'EXACT_IN' }).toAmount,
  ).toBe('1');
});
it('recomputes a 17-currency multi view 100 times within the CI budget', () => {
  const currencies = [
    'USD',
    'EUR',
    'JPY',
    'KRW',
    'GBP',
    'AUD',
    'CAD',
    'CHF',
    'SGD',
    'CNY',
    'HKD',
    'THB',
    'PHP',
    'IDR',
    'VND',
    'NZD',
  ];
  const quotes = currencies.map(
    (subjectCurrency, index) =>
      normalizeQuote({
        ...row,
        subjectCurrency,
        providerBuyPrice: String(30 + index),
        providerSellPrice: String(31 + index),
      })[1]!,
  );
  const context = {
    now: '2026-09-22T00:10:00Z',
    country: 'TW',
    deliveryMethod: 'cash' as const,
    channel: 'branch' as const,
  };
  const recompute = (legacyValidation: boolean) => {
    for (let keypress = 1; keypress <= 100; keypress++) {
      for (const quote of quotes) {
        const request = {
          fromCurrency: 'TWD',
          toCurrency: quote.toCurrency,
          amount: String(keypress * 100),
          mode: 'EXACT_IN' as const,
        };
        if (legacyValidation) {
          validateQuoteSnapshot(quote);
          validateQuoteSnapshot(quote);
        }
        if (!isQuoteApplicable(quote, request, context)) continue;
        if (legacyValidation) validateQuoteSnapshot(quote);
        estimate(quote, request);
      }
    }
  };
  recompute(false);
  const beforeStarted = performance.now();
  recompute(true);
  const before = performance.now() - beforeStarted;
  const afterStarted = performance.now();
  recompute(false);
  const after = performance.now() - afterStarted;
  console.info(
    `FX v3 100 × 16 multi estimates: before ${before.toFixed(2)} ms, after ${after.toFixed(2)} ms`,
  );
  expect(after).toBeLessThan(50);
});
import { estimateDerived } from './index';
it('computes a traceable cross estimate with canonical rate and no recommendation', () => {
  const first = normalizeQuote({
    ...row,
    subjectCurrency: 'USD',
    providerBuyPrice: '32',
    providerSellPrice: '33',
  })[0]!;
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
import { validateProviderSnapshot, validateObjectReference } from './index';
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
    providerBuyPrice: '900',
    providerSellPrice: '950',
    sourceUrl: 'https://legacy.example/rates',
    mappingVersion: 'legacy-1',
  });
  const canonical = normalizeQuote({
    ...row,
    providerId: 'moneybox',
    subjectCurrency: 'JPY',
    priceCurrency: 'KRW',
    unitAmount: '1',
    providerBuyPrice: '9',
    providerSellPrice: '9.5',
    sourceUrl: 'https://canonical.example/rates',
    mappingVersion: 'canonical-2',
  });
  expect(legacy.map((quote) => quote.quoteSeriesId)).toEqual(
    canonical.map((quote) => quote.quoteSeriesId),
  );
  expect(legacy.map((quote) => quote.rate)).toEqual(canonical.map((quote) => quote.rate));
});

describe('R3a money correctness', () => {
  it('computes EXACT_OUT payment directly from the source board without overcharging', () => {
    const jpy = normalizeQuote({
      ...row,
      subjectCurrency: 'JPY',
      priceCurrency: 'TWD',
      providerBuyPrice: '0.1957',
      providerSellPrice: '0.2057',
    }).find((quote) => quote.fromCurrency === 'TWD')!;
    const result = estimate(jpy, {
      fromCurrency: 'TWD',
      toCurrency: 'JPY',
      amount: '10000',
      mode: 'EXACT_OUT',
    });
    expect(result.fromAmount).toBe('2057');
    expect(result.toAmount).toBe('10000');
  });

  it('normalizes calculator input to the currency minor unit at the app boundary', () => {
    expect(normalizeAmountInput('1.123456789', 'TWD')).toEqual({ amount: '1.12', negative: false });
    expect(normalizeAmountInput('12.5', 'KRW')).toEqual({ amount: '12', negative: false });
    expect(normalizeAmountInput('1e-7', 'USD')).toEqual({ amount: '0', negative: false });
    expect(normalizeAmountInput('-5.005', 'TWD')).toEqual({ amount: '5', negative: true });
    expect(normalizeAmountInput('-0.001', 'TWD')).toEqual({ amount: '0', negative: false });
    expect(normalizeAmountInput('abc', 'TWD')).toBeNull();
    expect(normalizeAmountInput('1'.repeat(5000) + 'x', 'TWD')).toBeNull();
    expect(normalizeAmountInput('12.', 'TWD')).toEqual({ amount: '12', negative: false });
    expect(normalizeAmountInput('1e30', 'TWD')).toBeNull();
    expect(isValidAmount(normalizeAmountInput('0.1234567891', 'XAU')!.amount)).toBe(true);
  });

  it.each(['cs', 'sk'])(
    'keeps quote identity and ranking independent of %s collation',
    (locale) => {
      const baseline = normalizeQuote(row).map((quote) => quote.quoteId);
      const collator = new Intl.Collator(locale);
      const spy = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(function (
        this: string,
        other: string,
      ) {
        return collator.compare(String(this), other);
      });
      try {
        // 'channel' 在 cs/sk 排在 'h' 之後，localeCompare 會改變 stable key 順序。
        expect(collator.compare('channel', 'deliveryMethod')).toBeGreaterThan(0);
        expect(normalizeQuote(row).map((quote) => quote.quoteId)).toEqual(baseline);
      } finally {
        spy.mockRestore();
      }
    },
  );

  it('marks a single-side 0 or invalid value unavailable instead of dropping the row (B3 #11)', () => {
    const bank = normalizeBankSnapshot({
      timestamp: row.fetchedAt,
      details: {
        USD: { cash: { buy: '31', sell: '32' } },
        JPY: { cash: { buy: 'broken', sell: '0.21' } },
        THB: { cash: { buy: '0', sell: '1.1' } },
      },
    });
    const side = (from: string, to: string) =>
      bank.find((quote) => quote.fromCurrency === from && quote.toCurrency === to)!;
    expect(side('JPY', 'TWD')).toMatchObject({
      status: 'unavailable',
      unavailableReason: 'not_collected',
      rate: null,
    });
    expect(side('TWD', 'JPY')).toMatchObject({ status: 'available', unavailableReason: null });
    expect(side('THB', 'TWD')).toMatchObject({
      status: 'unavailable',
      unavailableReason: 'suppressed',
    });
    expect(side('USD', 'TWD').status).toBe('available');
    for (const quote of bank) expect(validateQuoteSnapshot(quote)).toBe(true);
    const shop = normalizeMoneyboxSnapshot({
      timestamp: row.fetchedAt,
      rates: { TWD: { sell: 41.5, buy: 42 }, USD: { sell: -1, buy: 1400 } },
    });
    expect(shop.find((quote) => quote.fromCurrency === 'USD')?.unavailableReason).toBe(
      'not_collected',
    );
    expect(shop.filter((quote) => quote.status === 'available')).toHaveLength(3);
    expect(() => normalizeBankSnapshot({ details: {} })).toThrow('Missing provider fetch time');
  });
});

describe('R3a freshness thresholds (PRD SSOT)', () => {
  const at = (hours: number) =>
    new Date(Date.parse(row.sourcePublishedAt) + hours * 3600000).toISOString();
  it('uses source publication age only: Taiwan Bank 36h, MoneyBox 24h', () => {
    const bot = normalizeQuote({ ...row, lastSuccessfulCheckAt: row.sourcePublishedAt })[1]!;
    expect(freshness(bot, at(35))).toBe('fresh');
    expect(freshness(bot, at(37))).toBe('stale');
    const shop = normalizeQuote({ ...row, providerId: 'moneybox' })[1]!;
    expect(freshness(shop, at(23))).toBe('fresh');
    expect(freshness(shop, at(25))).toBe('stale');
  });
  it('reports unknown, not stale, when the source omits its publication time', () => {
    const quote = normalizeQuote({ ...row, sourcePublishedAt: null })[1]!;
    expect(freshness(quote, at(1))).toBe('unknown');
  });
});

import schema from './schema.json';
import { validateProducerQuoteSnapshot } from './producer-validators.js';
describe('B3 public contract', () => {
  const usd = normalizeQuote({
    ...row,
    subjectCurrency: 'USD',
    providerBuyPrice: '31.67',
    providerSellPrice: '32.17',
  });
  const twdToUsd = usd.find((quote) => quote.fromCurrency === 'TWD')!;

  it('computes EXACT_OUT from the source price, never the rounded reciprocal', () => {
    const request = { fromCurrency: 'TWD', toCurrency: 'USD', mode: 'EXACT_OUT' as const };
    expect(estimate(twdToUsd, { ...request, amount: '1' }).fromAmount).toBe('32.17');
    expect(estimate(twdToUsd, { ...request, amount: '100' }).fromAmount).toBe('3217');
  });

  it('keeps direct source values and rounds reciprocals to 12 dp HALF_EVEN', () => {
    expect(usd.find((quote) => quote.fromCurrency === 'USD')!.rate).toBe('31.67');
    expect(twdToUsd.rate).toBe('0.031084861672');
    const tie = (unitAmount: string) =>
      normalizeQuote({ ...row, unitAmount, providerSellPrice: '1' })[1]!.rate;
    expect(tie('0.0000000000025')).toBe('0.000000000002');
    expect(tie('0.0000000000035')).toBe('0.000000000004');
  });

  it('formats short quote and series IDs without embedded source JSON', () => {
    const shop = normalizeMoneyboxSnapshot({
      timestamp: '2026-09-27T02:14:28.446Z',
      rates: { TWD: { sell: 41.5, buy: 42 } },
    });
    expect(shop.map((quote) => quote.quoteSeriesId)).toEqual([
      'fx3:moneybox:cash:branch:KR:myeongdong:TWD-KRW',
      'fx3:moneybox:cash:branch:KR:myeongdong:KRW-TWD',
    ]);
    expect(twdToUsd.quoteSeriesId).toBe('fx3:bot:cash:branch:TW:-:TWD-USD');
    expect(twdToUsd.quoteId).toBe(`${twdToUsd.quoteSeriesId}@${row.sourcePublishedAt}`);
    for (const quote of [...shop, ...usd]) {
      expect(quote.quoteId.length).toBeLessThanOrEqual(256);
      expect(quote.quoteId).not.toMatch(/[{}"%]/);
      expect(quote).not.toHaveProperty('providerSide');
      expect(quote.sourceQuote).not.toHaveProperty('sourceUrl');
    }
  });

  it('rejects unknown fields at the producer while the consumer validator tolerates them', () => {
    const extended = { ...twdToUsd, futureField: 'x' };
    expect(validateProducerQuoteSnapshot(twdToUsd)).toBe(true);
    expect(validateProducerQuoteSnapshot(extended)).toBe(false);
    expect(validateQuoteSnapshot(extended)).toBe(true);
    const typo = { ...twdToUsd, sourceQuote: { ...twdToUsd.sourceQuote, providerSelPrice: '1' } };
    expect(validateProducerQuoteSnapshot(typo)).toBe(false);
  });

  it('defines the full unavailableReason enum once with ECB OBS_STATUS mapping', () => {
    const reason = schema.$defs.QuoteSnapshot.properties.unavailableReason;
    expect(reason.enum).toEqual([
      'not_quoted',
      'not_collected',
      'market_closed',
      'suppressed',
      null,
    ]);
    expect(reason['x-ecbObsStatus']).toEqual({
      not_quoted: 'M',
      not_collected: 'L',
      market_closed: 'H',
      suppressed: 'Q',
    });
    expect(schema).not.toHaveProperty('oneOf');
    expect(schema.$defs.SourceQuote.required).toContain('dataKind');
  });
});

describe('R5 boundary hardening', () => {
  it('computes the board midpoint exactly at the half unit', () => {
    expect(
      boardMidpoint({
        ...row,
        subjectCurrency: 'USD',
        providerBuyPrice: '42.15',
        providerSellPrice: '42.3',
      }),
    ).toBe('42.225');
  });

  it('bounds calculator exponents before expanding them', () => {
    const started = performance.now();
    expect(normalizeAmountInput('1e999999999', 'TWD')).toBeNull();
    expect(normalizeAmountInput('9.1e15', 'TWD')).toBeNull();
    expect(normalizeAmountInput('1e-999999999', 'TWD')).toEqual({ amount: '0', negative: false });
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it('marks results whose target amount exceeds the safe range as out of range', () => {
    const [krwToTwd, twdToKrw] = normalizeQuote({
      ...row,
      subjectCurrency: 'USD',
      priceCurrency: 'KRW',
      providerBuyPrice: '1400',
      providerSellPrice: '1500',
    });
    expect(
      estimate(krwToTwd!, {
        fromCurrency: 'USD',
        toCurrency: 'KRW',
        amount: '9000000000000000',
        mode: 'EXACT_IN',
      }),
    ).toMatchObject({ status: 'unavailable', reason: 'amount_out_of_range' });
    expect(twdToKrw).toBeDefined();
  });
});
