import { type CURRENCY_DEFINITIONS } from './constants';

export type CurrencyCode = keyof typeof CURRENCY_DEFINITIONS;
export type CurrencyMeta = (typeof CURRENCY_DEFINITIONS)[CurrencyCode];

export type ConverterMode = 'single' | 'multi';
export type AmountField = 'from' | 'to';
export type RateType = 'spot' | 'cash';

export type RateSource = 'bank' | 'exchange-shop';

export type RateMode = 'auto' | 'sell' | 'mid';
export type MultiAmountsState = Record<CurrencyCode, string>;

export type ConversionHistoryCategory = 'spot' | 'cash' | 'exchange-shop' | 'legacy';

export interface ConversionHistoryEntry {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: string;
  result: string;
  time: string;
  timestamp: number;
  rateType?: RateType;
  sourceKind?: 'bank' | 'exchange-shop';
  providerId?: string;
  providerSelectionMode?: 'best' | 'manual';
  schemaVersion?: 2;
}
