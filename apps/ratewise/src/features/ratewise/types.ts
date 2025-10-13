import { type CURRENCY_DEFINITIONS } from './constants';

export type CurrencyCode = keyof typeof CURRENCY_DEFINITIONS;
export type CurrencyMeta = (typeof CURRENCY_DEFINITIONS)[CurrencyCode];

export type ConverterMode = 'single' | 'multi';
export type AmountField = 'from' | 'to';
export type TrendDirection = 'up' | 'down';

export type TrendState = Record<CurrencyCode, TrendDirection>;
export type MultiAmountsState = Record<CurrencyCode, string>;

export interface ConversionHistoryEntry {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: string;
  result: string;
  time: string;
}
