/**
 * 匯率計算工具函數
 * @file exchangeRateCalculation.ts
 * @description 統一的匯率計算邏輯，消除 DRY 違反
 * @see docs/dev/006_exchange_rate_calculation_api.md
 *
 * Linus 原則：消除特殊情況，一個函數處理所有情況
 */

import type { RateDetails } from './offlineStorage';
import type { CurrencyCode, RateMode, RateSource, RateType } from '../features/ratewise/types';
import { computeConverterRate, type ExchangeShopRate } from '../services/moneyboxRateService';
import { logger } from './logger';
import { DEFAULT_RATE_SOURCE } from '../features/ratewise/constants';

export interface RateTypeAvailability {
  spot: boolean;
  cash: boolean;
}

interface UnitExchangeRateOptions {
  rateSource?: RateSource;
  exchangeShopRate?: ExchangeShopRate | null;
}

const hasValidSellRate = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined;

/**
 * 取得單一幣別的匯率類型可用性
 * @description TWD 視為同時支援即期與現金，其他幣別依 details 判斷
 */
export function getCurrencyRateTypeAvailability(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
): RateTypeAvailability {
  if (code === 'TWD') {
    return { spot: true, cash: true };
  }

  const detail = details?.[code];
  if (!detail) {
    return { spot: false, cash: false };
  }

  return {
    spot: hasValidSellRate(detail.spot?.sell),
    cash: hasValidSellRate(detail.cash?.sell),
  };
}

/**
 * 取得單幣別換算（來源/目標幣別對）的匯率類型可用性
 * @description 僅當來源與目標都支援該類型時，該類型才可用
 */
export function getPairRateTypeAvailability(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
): RateTypeAvailability {
  const fromAvailability = getCurrencyRateTypeAvailability(fromCurrency, details);
  const toAvailability = getCurrencyRateTypeAvailability(toCurrency, details);

  return {
    spot: fromAvailability.spot && toAvailability.spot,
    cash: fromAvailability.cash && toAvailability.cash,
  };
}

/**
 * 根據可用性解析最終可用的匯率類型
 * @description 優先維持原選擇，不可用時嘗試另一種；若兩者都不可用則回傳原值
 */
export function resolveRateTypeByAvailability(
  preferred: RateType,
  availability: RateTypeAvailability,
): RateType {
  if (availability[preferred]) {
    return preferred;
  }

  const fallbackType: RateType = preferred === 'spot' ? 'cash' : 'spot';
  if (availability[fallbackType]) {
    return fallbackType;
  }

  return preferred;
}

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

// ── RateMode 擴充功能 ─────────────────────────────────────────────────────────

const hasValidBuyRate = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && value !== 0;

/**
 * 取得指定貨幣的「買入價」（帶 fallback 機制）
 *
 * Fallback 順序：
 * 1. details[code][rateType].buy（有效且非零）
 * 2. details[code][fallbackType].buy（有效且非零）
 * 3. details[code] sell rate（最終兜底）
 * 4. exchangeRates[code]（簡化匯率）
 */
export function getBuyRate(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): number | null {
  if (code === 'TWD') return 1;

  if (details?.[code]) {
    const detail = details[code];
    let rate = detail[rateType]?.buy;

    if (!hasValidBuyRate(rate)) {
      const fallbackType: RateType = rateType === 'spot' ? 'cash' : 'spot';
      rate = detail[fallbackType]?.buy;
    }

    if (hasValidBuyRate(rate)) return rate;
  }

  // 最終 fallback：用 sell rate 或簡化匯率
  return getExchangeRate(code, details, rateType, exchangeRates);
}

/**
 * 取得指定貨幣的「中間價」= (買入 + 賣出) / 2
 *
 * 若任一側缺失，以可用的一側為準；若兩側均缺，回傳 null。
 */
export function getMidRate(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): number | null {
  if (code === 'TWD') return 1;

  const sellRate = getExchangeRate(code, details, rateType, exchangeRates);
  const buyRate = getBuyRate(code, details, rateType, exchangeRates);

  if (sellRate == null && buyRate == null) return null;
  if (sellRate == null) return buyRate;
  if (buyRate == null) return sellRate;

  return (buyRate + sellRate) / 2;
}

/**
 * 根據 RateMode 轉換金額
 *
 * | mode | FROM 幣別取值 | TO 幣別取值 | 說明 |
 * |------|------------|-----------|------|
 * | auto | 買入價（buy） | 賣出價（sell）| 依換算方向自動套用（客戶視角）|
 * | sell | 賣出價（sell）| 賣出價（sell）| 台銀賣出牌告（現行預設）|
 * | mid  | 中間價（mid） | 中間價（mid） | 市場參考中間價 |
 *
 * TWD 為基準幣，永遠視作 1。
 *
 * auto 模式客戶視角：
 * - 外幣→TWD（客戶賣外幣）：銀行以買入價收購外幣，FROM 用 buy
 * - TWD→外幣（客戶買外幣）：銀行以賣出價賣出外幣，TO 用 sell
 *
 * @example
 * // auto: USD→JPY = amount * (USD.buy / JPY.sell) = 1000 * (30.87/0.204) ≈ 151324
 * convertCurrencyAmountWithMode(1000, 'USD', 'JPY', details, 'spot', 'auto')
 */
export function convertCurrencyAmountWithMode(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  rateMode: RateMode,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): number {
  if (fromCurrency === toCurrency) return amount;

  // sell 模式：維持現有行為，直接委派
  if (rateMode === 'sell') {
    return convertCurrencyAmount(
      amount,
      fromCurrency,
      toCurrency,
      details,
      rateType,
      exchangeRates,
    );
  }

  // 取得各幣別的匯率（依模式選擇函數）
  const getRateFrom = (code: CurrencyCode): number | null => {
    if (code === 'TWD') return 1;
    return rateMode === 'mid'
      ? getMidRate(code, details, rateType, exchangeRates)
      : getBuyRate(code, details, rateType, exchangeRates); // auto: FROM 外幣用買入（客戶賣外幣給銀行）
  };

  const getRateTo = (code: CurrencyCode): number | null => {
    if (code === 'TWD') return 1;
    return rateMode === 'mid'
      ? getMidRate(code, details, rateType, exchangeRates)
      : getExchangeRate(code, details, rateType, exchangeRates); // auto: TO 外幣用賣出（客戶向銀行買外幣）
  };

  // TWD → 外幣：amount / toRate
  if (fromCurrency === 'TWD') {
    const toRate = getRateTo(toCurrency);
    if (!toRate) return 0;
    return amount / toRate;
  }

  // 外幣 → TWD：amount * fromRate
  if (toCurrency === 'TWD') {
    const fromRate = getRateFrom(fromCurrency);
    if (!fromRate) return 0;
    return amount * fromRate;
  }

  // 外幣 → 外幣：交叉匯率（via TWD）
  const fromRate = getRateFrom(fromCurrency);
  const toRate = getRateTo(toCurrency);
  if (!fromRate || !toRate) return 0;
  return amount * (fromRate / toRate);
}

export function getUnitExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  rateMode: RateMode,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
  options: UnitExchangeRateOptions = {},
): number {
  const { rateSource = DEFAULT_RATE_SOURCE, exchangeShopRate = null } = options;

  if (rateSource === 'exchange-shop' && exchangeShopRate) {
    const shopRate = computeConverterRate(exchangeShopRate, fromCurrency, toCurrency);
    if (shopRate !== null) {
      return shopRate;
    }
  }

  return convertCurrencyAmountWithMode(
    1,
    fromCurrency,
    toCurrency,
    details,
    rateType,
    rateMode,
    exchangeRates,
  );
}

export function getReciprocalExchangeRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return 1 / rate;
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
