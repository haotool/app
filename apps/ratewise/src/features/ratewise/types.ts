import {
  type CONVERTER_MODES,
  type CURRENCY_DEFINITIONS,
  type RATE_MODES,
  type RATE_SOURCES,
  type RATE_TYPES,
} from './constants';

export type CurrencyCode = keyof typeof CURRENCY_DEFINITIONS;
export type CurrencyMeta = (typeof CURRENCY_DEFINITIONS)[CurrencyCode];

export type ConverterMode = (typeof CONVERTER_MODES)[number];
export type AmountField = 'from' | 'to';
export type RateType = (typeof RATE_TYPES)[number];

export type RateSource = (typeof RATE_SOURCES)[number];

export type RateMode = (typeof RATE_MODES)[number];
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
  sourceKind?: RateSource;
  providerId?: string;
  providerSelectionMode?: 'best' | 'manual';
  rateMode?: RateMode;
  schemaVersion?: 2;
}
