import {
  fromLegacyRateSource,
  getDefaultProvider,
  isProviderSupportedForCurrency,
} from '../../config/rateProviders';
import type { CurrencyCode, RateType } from './types';
import {
  type ProviderSelectionMode,
  type RateProviderId,
  type RateProviderPreference,
  type RateProviderRef,
  type RateSourceKind,
  type ResolvedRateProvider,
} from './rateProviderTypes';

export interface ProviderQuote {
  provider: RateProviderRef;
  rateType: RateType;
  sourceKind: RateSourceKind;
  unitRate: number;
  resultAmount: number;
  isAvailable: boolean;
}

export interface RankInput {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rateType: RateType;
  quotes: readonly ProviderQuote[];
}

export function rankProviderQuotes(input: RankInput): ProviderQuote[] {
  const available = input.quotes.filter((quote) => quote.isAvailable);
  return available
    .map((quote, index) => ({ quote, index }))
    .sort((a, b) => {
      if (b.quote.resultAmount !== a.quote.resultAmount) {
        return b.quote.resultAmount - a.quote.resultAmount;
      }
      return a.index - b.index;
    })
    .map(({ quote }) => quote);
}

export interface ResolvePreferenceInput {
  preference: RateProviderPreference;
  from: CurrencyCode;
  to: CurrencyCode;
  rateType: RateType;
  quotes: readonly ProviderQuote[];
}

export function resolveProviderPreference(input: ResolvePreferenceInput): ResolvedRateProvider {
  const { preference, from, to } = input;
  const selectionMode: ProviderSelectionMode = preference.mode;

  if (preference.mode === 'manual') {
    const manualProvider = preference.manualProvider;
    if (!manualProvider) {
      return buildFallbackDefault(selectionMode);
    }
    if (!isProviderSupportedForPair(manualProvider.providerId, from, to)) {
      return buildFallbackDefault(selectionMode, 'unsupported-pair');
    }
    return {
      selectionMode,
      sourceKind: manualProvider.sourceKind,
      providerId: manualProvider.providerId,
      reason: 'manual',
    };
  }

  const ranked = rankProviderQuotes({
    amount: 0,
    from: input.from,
    to: input.to,
    rateType: input.rateType,
    quotes: input.quotes,
  });
  const top = ranked[0];
  if (top) {
    return {
      selectionMode,
      sourceKind: top.provider.sourceKind,
      providerId: top.provider.providerId,
      reason: 'best-rate',
    };
  }
  return buildFallbackDefault(selectionMode);
}

function isProviderSupportedForPair(
  providerId: RateProviderId,
  from: CurrencyCode,
  to: CurrencyCode,
): boolean {
  const HOME_CURRENCY: CurrencyCode = 'TWD';
  if (
    isProviderSupportedForCurrency(providerId, from) &&
    isProviderSupportedForCurrency(providerId, to)
  ) {
    return true;
  }
  const fromIsHome = from === HOME_CURRENCY;
  const toIsHome = to === HOME_CURRENCY;
  if (!fromIsHome && !toIsHome) {
    return false;
  }
  const foreign = fromIsHome ? to : from;
  return isProviderSupportedForCurrency(providerId, foreign);
}

function buildFallbackDefault(
  selectionMode: ProviderSelectionMode,
  reason: ResolvedRateProvider['reason'] = 'fallback-default',
): ResolvedRateProvider {
  const fallback = getDefaultProvider('bank');
  if (!fallback) {
    const bankProvider = fromLegacyRateSource('bank');
    return {
      selectionMode,
      sourceKind: bankProvider.sourceKind,
      providerId: bankProvider.providerId,
      reason,
    };
  }
  return {
    selectionMode,
    sourceKind: fallback.sourceKind,
    providerId: fallback.id,
    reason,
  };
}
