import type { RateSource } from './types';

export type RateSourceKind = 'bank' | 'exchange-shop';

export type RateProviderId = 'bot' | 'moneybox' | (string & {});

export type ProviderSelectionMode = 'best' | 'manual';

export interface RateProviderRef {
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
}

export interface RateProviderPreference {
  mode: ProviderSelectionMode;
  manualProvider?: RateProviderRef;
}

export interface ResolvedRateProvider {
  selectionMode: ProviderSelectionMode;
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
  reason: 'manual' | 'best-rate' | 'fallback-default' | 'unsupported-pair';
}

const DEFAULT_PROVIDER_BY_SOURCE: Record<RateSourceKind, RateProviderId> = {
  bank: 'bot',
  'exchange-shop': 'moneybox',
};

export function toLegacyRateSource(ref: RateProviderRef): RateSource {
  return ref.sourceKind;
}

export function fromLegacyRateSource(rateSource: RateSource): RateProviderRef {
  return {
    sourceKind: rateSource,
    providerId: DEFAULT_PROVIDER_BY_SOURCE[rateSource],
  };
}
