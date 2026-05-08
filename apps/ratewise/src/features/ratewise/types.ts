import { type CURRENCY_DEFINITIONS } from './constants';

export type CurrencyCode = keyof typeof CURRENCY_DEFINITIONS;
export type CurrencyMeta = (typeof CURRENCY_DEFINITIONS)[CurrencyCode];

export type ConverterMode = 'single' | 'multi';
export type AmountField = 'from' | 'to';
export type RateType = 'spot' | 'cash';

/**
 * 匯率資料來源選擇（legacy compatibility）
 *
 * - 'bank': 台灣銀行牌告匯率（預設）
 * - 'exchange-shop': 換錢所即時匯率（僅適用於有 provider 的幣別）
 *
 * @deprecated 新邏輯請改用 `rateProviderTypes.ts` 的 `RateSourceKind + RateProviderRef`。
 *   此型別僅作為相容層，讓尚未遷移到 provider SSOT 的舊程式碼可繼續運作；
 *   不可再用 `RateSource` 表達「具體 provider 身分」。
 *   遷移輔助：`toLegacyRateSource` / `fromLegacyRateSource`（位於 rateProviderTypes.ts）。
 */
export type RateSource = 'bank' | 'exchange-shop';

/** 匯率模式：自動方向 / 賣出價為主 / 中間價 */
export type RateMode = 'auto' | 'sell' | 'mid';
export type MultiAmountsState = Record<CurrencyCode, string>;

export interface ConversionHistoryEntry {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: string;
  result: string;
  time: string; // 顯示用（相對時間，如 "今天 14:30"）
  timestamp: number; // 完整時間戳記（用於排序、過期判斷、生成唯一 key）
}
