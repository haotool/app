import type { RateSource } from './types';

export type RateSourceKind = RateSource;

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

export function toLegacyRateSource(ref: RateProviderRef): RateSource {
  return ref.sourceKind;
}
