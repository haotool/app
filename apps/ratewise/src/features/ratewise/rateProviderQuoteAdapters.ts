import type { RateProviderConfig } from '../../config/rateProviders';
import { getAllRateProviders, getProviderPrimaryRateType } from '../../config/rateProviders';
import { computeConverterRate, type ExchangeShopRate } from '../../services/moneyboxRateService';
import { getUnitExchangeRate } from '../../utils/exchangeRateCalculation';
import type { RateMode } from './types';
import type { RateDetails } from './hooks/useExchangeRates';
import type { CurrencyCode, RateType } from './types';
import type { RateProviderId } from './rateProviderTypes';
import type { ProviderQuote } from './rateProviderRanking';

export interface BuildProviderQuoteInput {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rateType: RateType;
  rateMode: RateMode;
  exchangeRates?: Record<string, number | null>;
  details?: Record<string, RateDetails>;
  exchangeShopRate: ExchangeShopRate | null;
}

export interface RateProviderQuoteAdapterContext extends BuildProviderQuoteInput {
  provider: RateProviderConfig;
}

export type RateProviderQuoteAdapter = (
  context: RateProviderQuoteAdapterContext,
) => ProviderQuote | null;

export type RateProviderQuoteAdapters = Partial<Record<RateProviderId, RateProviderQuoteAdapter>>;

export interface BuildProviderQuotesOptions {
  providers?: readonly RateProviderConfig[];
  adapters?: RateProviderQuoteAdapters;
}

const DEFAULT_ADAPTERS: RateProviderQuoteAdapters = {
  bot: ({ provider, amount, from, to, details, rateType, rateMode, exchangeRates }) => {
    const unitRate = getUnitExchangeRate(from, to, details, rateType, rateMode, exchangeRates, {
      rateSource: provider.sourceKind,
      exchangeShopRate: null,
    });

    return {
      provider: { sourceKind: provider.sourceKind, providerId: provider.id },
      sourceKind: provider.sourceKind,
      rateType,
      unitRate,
      resultAmount: amount * unitRate,
      isAvailable: unitRate > 0,
    };
  },
  moneybox: ({ provider, amount, from, to, rateMode, exchangeShopRate }) => {
    const unitRate = exchangeShopRate
      ? computeConverterRate(exchangeShopRate, from, to, rateMode)
      : null;

    return {
      provider: { sourceKind: provider.sourceKind, providerId: provider.id },
      sourceKind: provider.sourceKind,
      rateType: getProviderPrimaryRateType(provider),
      unitRate: unitRate ?? 0,
      resultAmount: unitRate ? amount * unitRate : 0,
      isAvailable: unitRate !== null && unitRate > 0,
    };
  },
};

export function buildProviderQuotes(
  input: BuildProviderQuoteInput,
  options: BuildProviderQuotesOptions = {},
): ProviderQuote[] {
  const providers = options.providers ?? getAllRateProviders();
  const adapters = options.adapters ?? DEFAULT_ADAPTERS;

  return providers.flatMap((provider) => {
    const adapter = adapters[provider.id];
    if (!adapter) return [];
    const quote = adapter({ ...input, provider });
    return quote ? [quote] : [];
  });
}
