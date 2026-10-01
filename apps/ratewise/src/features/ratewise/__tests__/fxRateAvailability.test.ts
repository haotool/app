import { expect, it } from 'vitest';
import { normalizeQuote, normalizeMoneyboxSnapshot, type SelectionContext } from '@app/shared/fx';
import { getFxRateAvailability } from '../fxRateAvailability';

const context: SelectionContext = {
  now: '2026-10-02T00:00:00Z',
  country: 'TW',
  deliveryMethod: 'cash',
  channel: 'branch',
};
const source = {
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '30',
  providerSellPrice: '32',
  serviceCountry: 'TW',
  sourcePublishedAt: context.now,
  fetchedAt: context.now,
  lastSuccessfulCheckAt: context.now,
  deliveryMethod: 'cash' as const,
  channel: 'branch' as const,
  dataKind: 'published_board' as const,
};

it('checks the actual amount and input direction against provider amount limits', () => {
  const quotes = normalizeQuote({
    ...source,
    amountRange: { currency: 'TWD', min: '100', max: '10000' },
  });
  expect(getFxRateAvailability('TWD', 'USD', quotes, context, '1000').cash).toBe(true);
  expect(getFxRateAvailability('TWD', 'USD', quotes, context, '10').cash).toBe(false);
  expect(getFxRateAvailability('USD', 'TWD', quotes, context, '1000', 'EXACT_OUT').cash).toBe(true);
  expect(getFxRateAvailability('USD', 'TWD', quotes, context, '10', 'EXACT_OUT').cash).toBe(false);
});

it('does not enable account delivery just because a cash substitute is available', () => {
  expect(getFxRateAvailability('TWD', 'USD', normalizeQuote(source), context)).toEqual({
    cash: true,
    spot: false,
    exchangeShop: false,
  });
});

it('requires both cross-currency legs to use the same delivery method', () => {
  const usd = normalizeQuote(source);
  const jpy = {
    ...source,
    subjectCurrency: 'JPY',
    providerBuyPrice: '0.2',
    providerSellPrice: '0.21',
  };
  expect(getFxRateAvailability('USD', 'JPY', [...usd, ...normalizeQuote(jpy)], context).cash).toBe(
    true,
  );
  expect(
    getFxRateAvailability(
      'USD',
      'JPY',
      [
        ...usd,
        ...normalizeQuote({
          ...jpy,
          deliveryMethod: 'account',
          channel: 'online',
        }),
      ],
      context,
    ),
  ).toEqual({ cash: false, spot: false, exchangeShop: false });
});

it('supports the exchange-shop pivot without changing the requested location or branch', () => {
  const quotes = normalizeMoneyboxSnapshot({
    timestamp: context.now,
    rates: { USD: { sell: 1300, buy: 1350 }, JPY: { sell: 900, buy: 950 } },
  });
  const requested = { ...context, branchId: 'chosen-branch' };
  const before = { ...requested };
  expect(getFxRateAvailability('USD', 'JPY', quotes, requested).exchangeShop).toBe(true);
  expect(requested).toEqual(before);
});
