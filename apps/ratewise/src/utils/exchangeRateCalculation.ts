/**
 * 匯率計算工具函數
 * @file exchangeRateCalculation.ts
 * @description 統一的匯率計算邏輯，消除 DRY 違反
 * @see docs/dev/006_exchange_rate_calculation_api.md
 *
 * Linus 原則：消除特殊情況，一個函數處理所有情況
 */

import type { RateDetails } from '../features/ratewise/hooks/useExchangeRates';
import type { CurrencyCode, RateType } from '../features/ratewise/types';
import { logger } from './logger';

/**
 * 獲取指定貨幣的匯率（帶 fallback 機制）
 * @description 統一的匯率獲取邏輯，優先使用指定類型，失敗時自動 fallback
 * @param code - 貨幣代碼
 * @param details - 詳細匯率數據
 * @param rateType - 匯率類型（spot/cash）
 * @param exchangeRates - 簡化匯率數據（最終 fallback）
 * @returns 匯率值或 null
 *
 * Fallback 順序：
 * 1. details[code][rateType].sell
 * 2. details[code][fallbackType].sell
 * 3. exchangeRates[code]
 *
 * @example
 * ```ts
 * const rate = getExchangeRate('USD', details, 'spot', exchangeRates);
 * // 返回 30.97 或 null
 * ```
 */
export function getExchangeRate(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): number | null {
  // TWD 固定為 1（基準貨幣）
  if (code === 'TWD') return 1;

  // 優先使用 details + rateType（精確匯率）
  if (details?.[code]) {
    const detail = details[code];
    let rate = detail[rateType]?.sell;

    // Fallback 機制：如果當前類型沒有匯率，嘗試另一種類型
    if (rate == null) {
      const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
      rate = detail[fallbackType]?.sell;

      // 開發模式：記錄 fallback（幫助調試）
      if (rate != null) {
        logger.debug(`Exchange rate fallback for ${code}`, {
          from: rateType,
          to: fallbackType,
          rate,
        });
      }
    }

    if (rate != null) {
      return rate;
    }
  }

  // 最終 fallback：使用簡化的 exchangeRates
  if (!exchangeRates) return null;
  const rate = exchangeRates[code];
  if (rate !== null && rate !== undefined && typeof rate === 'number') {
    return rate;
  }

  return null;
}

/**
 * 計算兩貨幣間的交叉匯率
 * @description 計算從 baseCurrency 到 targetCurrency 的匯率
 * @param baseCurrency - 基準貨幣
 * @param targetCurrency - 目標貨幣
 * @param details - 詳細匯率數據
 * @param rateType - 匯率類型
 * @returns 交叉匯率或 null
 *
 * 計算公式：
 * - TWD → 外幣：1 / targetRate
 * - 外幣 → TWD：baseRate
 * - 外幣 → 外幣：baseRate / targetRate
 *
 * @example
 * ```ts
 * // 計算 USD → JPY 匯率
 * const rate = calculateCrossRate('USD', 'JPY', details, 'spot');
 * // 返回 151.8137（1 USD = 151.8137 JPY）
 * ```
 */
export function calculateCrossRate(
  baseCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
): number | null {
  // 相同貨幣：匯率為 1
  if (baseCurrency === targetCurrency) return 1;

  // TWD 為基準貨幣：反向計算
  if (baseCurrency === 'TWD') {
    const targetRate = getExchangeRate(targetCurrency, details, rateType);
    if (targetRate == null) return null;
    return 1 / targetRate;
  }

  // 目標是 TWD：直接使用基準貨幣的匯率
  if (targetCurrency === 'TWD') {
    return getExchangeRate(baseCurrency, details, rateType);
  }

  // 外幣 → 外幣：交叉匯率計算
  const baseRate = getExchangeRate(baseCurrency, details, rateType);
  const targetRate = getExchangeRate(targetCurrency, details, rateType);

  if (baseRate == null || targetRate == null) return null;

  return baseRate / targetRate;
}

/**
 * 轉換金額從一種貨幣到另一種貨幣
 * @description 統一的金額轉換邏輯
 * @param amount - 金額
 * @param fromCurrency - 來源貨幣
 * @param toCurrency - 目標貨幣
 * @param details - 詳細匯率數據
 * @param rateType - 匯率類型
 * @param exchangeRates - 簡化匯率數據（fallback）
 * @returns 轉換後的金額
 *
 * @example
 * ```ts
 * const result = convertCurrencyAmount(1000, 'USD', 'TWD', details, 'spot');
 * // 返回 30970（1000 USD = 30970 TWD）
 * ```
 */
export function convertCurrencyAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): number {
  // 相同貨幣：不轉換
  if (fromCurrency === toCurrency) return amount;

  // TWD → 外幣：除以目標匯率
  if (fromCurrency === 'TWD') {
    const rate = getExchangeRate(toCurrency, details, rateType, exchangeRates);
    if (!rate) return 0;
    return amount / rate;
  }

  // 外幣 → TWD：乘以來源匯率
  if (toCurrency === 'TWD') {
    const rate = getExchangeRate(fromCurrency, details, rateType, exchangeRates);
    if (!rate) return 0;
    return amount * rate;
  }

  // 外幣 → 外幣：交叉匯率轉換
  const fromRate = getExchangeRate(fromCurrency, details, rateType, exchangeRates);
  const toRate = getExchangeRate(toCurrency, details, rateType, exchangeRates);

  if (!fromRate || !toRate) return 0;

  return amount * (fromRate / toRate);
}

/**
 * 檢查是否只有單一匯率類型可用
 * @description 用於 UI 判斷是否顯示匯率類型切換按鈕
 * @param details - 詳細匯率數據
 * @returns 是否只有單一匯率類型
 *
 * @example
 * ```ts
 * const showToggle = !hasOnlyOneRateType(details);
 * ```
 */
export function hasOnlyOneRateType(details: Record<string, RateDetails> | undefined): boolean {
  if (!details) return true;

  const currencies = Object.values(details);
  if (currencies.length === 0) return true;

  // 檢查是否所有貨幣都只有一種類型
  const hasSpot = currencies.some(
    (d) => d.spot.sell !== null && d.spot.sell !== undefined && d.spot.sell !== 0,
  );
  const hasCash = currencies.some(
    (d) => d.cash.sell !== null && d.cash.sell !== undefined && d.cash.sell !== 0,
  );

  return !(hasSpot && hasCash);
}
