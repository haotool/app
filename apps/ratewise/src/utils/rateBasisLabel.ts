import type { CurrencyCode, RateMode, RateSource } from '../features/ratewise/types';

export type RateBasisKind =
  | 'bank-sell'
  | 'bank-buy'
  | 'bank-cross'
  | 'bank-sell-only'
  | 'mid'
  | 'shop-sell'
  | 'shop-buy'
  | 'shop-mid';

export const RATE_BASIS_LIST_NOTE_KEY = 'rateBasis.listBasisNote' as const;

export function getRateBasisLabelKey(kind: RateBasisKind): `rateBasis.${RateBasisKind}` {
  return `rateBasis.${kind}`;
}

export function getRateBasisKind(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rateMode: RateMode,
  rateSource: RateSource,
): RateBasisKind {
  if (rateSource === 'exchange-shop') {
    if (rateMode === 'mid') return 'shop-mid';
    if (rateMode === 'sell') return 'shop-sell';
    return fromCurrency === 'TWD' ? 'shop-sell' : 'shop-buy';
  }
  if (rateMode === 'mid') return 'mid';
  if (rateMode === 'sell') return 'bank-sell-only';
  if (fromCurrency === 'TWD') return 'bank-sell';
  if (toCurrency === 'TWD') return 'bank-buy';
  return 'bank-cross';
}
