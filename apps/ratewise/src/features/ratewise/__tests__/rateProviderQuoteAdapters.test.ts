import { describe, expect, it } from 'vitest';
import type { RateProviderConfig } from '../../../config/rateProviders';
import { buildProviderQuotes } from '../rateProviderQuoteAdapters';
import type { ProviderQuote } from '../rateProviderRanking';

const futureBankProvider: RateProviderConfig = {
  id: 'future-bank',
  sourceKind: 'bank',
  label: 'Future Bank',
  shortLabel: 'Future',
  supportedRateTypes: ['spot', 'cash'],
  supportedCurrencies: 'all',
  apiPaths: {
    latest: 'future-bank/latest.json',
    history: 'future-bank/history/{YYYY-MM-DD}.json',
  },
  priority: 90,
  isDefault: false,
};

describe('buildProviderQuotes', () => {
  it('枚舉傳入 provider 並委派 adapter，未來新增銀行不需要改 hook', () => {
    const quotes = buildProviderQuotes(
      {
        amount: 100,
        from: 'USD',
        to: 'TWD',
        rateType: 'spot',
        rateMode: 'auto',
        exchangeRates: { TWD: 1, USD: 31 },
        details: {},
        exchangeShopRate: null,
      },
      {
        providers: [futureBankProvider],
        adapters: {
          'future-bank': ({ provider, amount }): ProviderQuote => ({
            provider: { sourceKind: provider.sourceKind, providerId: provider.id },
            sourceKind: provider.sourceKind,
            rateType: 'spot',
            unitRate: 32,
            resultAmount: amount * 32,
            isAvailable: true,
          }),
        },
      },
    );

    expect(quotes).toEqual([
      {
        provider: { sourceKind: 'bank', providerId: 'future-bank' },
        sourceKind: 'bank',
        rateType: 'spot',
        unitRate: 32,
        resultAmount: 3200,
        isAvailable: true,
      },
    ]);
  });

  it('缺少 adapter 的 provider 不產生 quote，避免沒有資料來源時誤參與推薦', () => {
    const quotes = buildProviderQuotes(
      {
        amount: 100,
        from: 'USD',
        to: 'TWD',
        rateType: 'spot',
        rateMode: 'auto',
        exchangeRates: { TWD: 1, USD: 31 },
        details: {},
        exchangeShopRate: null,
      },
      {
        providers: [futureBankProvider],
        adapters: {},
      },
    );

    expect(quotes).toEqual([]);
  });
});
