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

// 可用匯率 SSOT guard：資料源異常（0 / NaN / Infinity / 負值）一律視為缺失，走 fallback。
const isUsableRate = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const hasValidSellRate = (value: number | null | undefined): value is number => isUsableRate(value);

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

    // Fallback 機制：如果當前類型沒有可用匯率（含 0/NaN），嘗試另一種類型
    if (!isUsableRate(rate)) {
      const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
      rate = detail[fallbackType]?.sell;

      // 開發模式：記錄 fallback（幫助調試）
      if (isUsableRate(rate)) {
        logger.debug(`Exchange rate fallback for ${code}`, {
          from: rateType,
          to: fallbackType,
          rate,
        });
      }
    }

    if (isUsableRate(rate)) {
      return rate;
    }
  }

  // 最終 fallback：使用簡化的 exchangeRates
  if (!exchangeRates) return null;
  const rate = exchangeRates[code];
  if (isUsableRate(rate)) {
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

const hasValidBuyRate = (value: number | null | undefined): value is number => isUsableRate(value);

// 單腿實際採用的牌價方向；fallback 後以實際取用側回報（QA-I D1 review）。
export type RateSide = 'buy' | 'sell' | 'mid';

// 單位匯率整體 basis：跨幣別兩腿方向不一致時為 'mixed'（UI 不得過度宣稱買/賣）。
export type UnitRateBasis = RateSide | 'mixed';

interface ResolvedLegRate {
  rate: number | null;
  side: RateSide;
}

function resolveSellLeg(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): ResolvedLegRate {
  return { rate: getExchangeRate(code, details, rateType, exchangeRates), side: 'sell' };
}

// 買入腿：買入價全缺時回落賣出，side 誠實回報 fallback 結果（QA-I D1 review Blocking 2）。
function resolveBuyLeg(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): ResolvedLegRate {
  if (code === 'TWD') return { rate: 1, side: 'buy' };

  if (details?.[code]) {
    const detail = details[code];
    let rate = detail[rateType]?.buy;

    if (!hasValidBuyRate(rate)) {
      const fallbackType: RateType = rateType === 'spot' ? 'cash' : 'spot';
      rate = detail[fallbackType]?.buy;
    }

    if (hasValidBuyRate(rate)) return { rate, side: 'buy' };
  }

  return resolveSellLeg(code, details, rateType, exchangeRates);
}

// 中間價腿：任一側缺失時退化為可用側，side 同步回報實際採用側。
function resolveMidLeg(
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): ResolvedLegRate {
  if (code === 'TWD') return { rate: 1, side: 'mid' };

  const sellRate = getExchangeRate(code, details, rateType, exchangeRates);
  const buyLeg = resolveBuyLeg(code, details, rateType, exchangeRates);

  if (sellRate == null && buyLeg.rate == null) return { rate: null, side: 'mid' };
  if (sellRate == null) return buyLeg;
  if (buyLeg.rate == null) return { rate: sellRate, side: 'sell' };
  // 買入腿已回落賣出：(sell+sell)/2 即賣出價，side 誠實回報 sell。
  if (buyLeg.side === 'sell') return { rate: sellRate, side: 'sell' };

  return { rate: (buyLeg.rate + sellRate) / 2, side: 'mid' };
}

// 依 rateMode 與腿別解析選價：引擎換算與 UI basis 標籤共用此唯一決策點，禁止平行推導。
function resolveConversionLeg(
  rateMode: RateMode,
  role: 'from' | 'to',
  code: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): ResolvedLegRate {
  switch (rateMode) {
    case 'sell':
      return resolveSellLeg(code, details, rateType, exchangeRates);
    case 'mid':
      return resolveMidLeg(code, details, rateType, exchangeRates);
    case 'auto':
      // 客戶視角：FROM 外幣（客戶賣外幣給銀行）用買入，TO 外幣（客戶向銀行買）用賣出。
      return role === 'from'
        ? resolveBuyLeg(code, details, rateType, exchangeRates)
        : resolveSellLeg(code, details, rateType, exchangeRates);
    default: {
      const exhaustive: never = rateMode;
      return exhaustive;
    }
  }
}

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
  return resolveBuyLeg(code, details, rateType, exchangeRates).rate;
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
  return resolveMidLeg(code, details, rateType, exchangeRates).rate;
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

  const fromLeg = resolveConversionLeg(
    rateMode,
    'from',
    fromCurrency,
    details,
    rateType,
    exchangeRates,
  );
  const toLeg = resolveConversionLeg(rateMode, 'to', toCurrency, details, rateType, exchangeRates);

  // TWD → 外幣：amount / toRate
  if (fromCurrency === 'TWD') {
    if (!toLeg.rate) return 0;
    return amount / toLeg.rate;
  }

  // 外幣 → TWD：amount * fromRate
  if (toCurrency === 'TWD') {
    if (!fromLeg.rate) return 0;
    return amount * fromLeg.rate;
  }

  // 外幣 → 外幣：交叉匯率（via TWD）
  if (!fromLeg.rate || !toLeg.rate) return 0;
  return amount * (fromLeg.rate / toLeg.rate);
}

export interface UnitExchangeRateWithBasis {
  rate: number;
  side: UnitRateBasis;
}

// 銀行路徑單位匯率＋實際採用 basis：與 convertCurrencyAmountWithMode 共用 resolveConversionLeg
// 的同一次選價決策；amount=1 時兩者數值完全一致。
function resolveUnitBankRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  rateMode: RateMode,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
): UnitExchangeRateWithBasis {
  if (fromCurrency === toCurrency) {
    return { rate: 1, side: rateMode === 'mid' ? 'mid' : 'sell' };
  }

  const fromLeg = resolveConversionLeg(
    rateMode,
    'from',
    fromCurrency,
    details,
    rateType,
    exchangeRates,
  );
  const toLeg = resolveConversionLeg(rateMode, 'to', toCurrency, details, rateType, exchangeRates);

  if (fromCurrency === 'TWD') {
    return { rate: toLeg.rate ? 1 / toLeg.rate : 0, side: toLeg.side };
  }

  if (toCurrency === 'TWD') {
    return { rate: fromLeg.rate ?? 0, side: fromLeg.side };
  }

  // 交叉匯率為兩腿混合價：兩腿方向一致回該方向；不一致回 'mixed'，
  // UI 僅標 rate type（現金／即期）不宣稱買/賣（QA-I D1 review PM 裁決）。
  const rate = fromLeg.rate && toLeg.rate ? fromLeg.rate / toLeg.rate : 0;
  return { rate, side: fromLeg.side === toLeg.side ? fromLeg.side : 'mixed' };
}

/**
 * 取得單位匯率與實際採用的 basis（UI 基準標籤唯一來源）。
 * side 由引擎選價結果回傳（含 fallback 後實際取用側），禁止在 UI 層平行推導。
 * 換錢所報價：TWD→外幣用店家賣出、外幣→TWD 用店家買入（computeConverterRate 語意）。
 */
export function getUnitExchangeRateWithBasis(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  details: Record<string, RateDetails> | undefined,
  rateType: RateType,
  rateMode: RateMode,
  exchangeRates?: Record<CurrencyCode, number | null> | null,
  options: UnitExchangeRateOptions = {},
): UnitExchangeRateWithBasis {
  const { rateSource = DEFAULT_RATE_SOURCE, exchangeShopRate = null } = options;

  if (rateSource === 'exchange-shop' && exchangeShopRate) {
    const shopRate = computeConverterRate(exchangeShopRate, fromCurrency, toCurrency);
    if (shopRate !== null) {
      return { rate: shopRate, side: toCurrency === 'TWD' ? 'buy' : 'sell' };
    }
  }

  return resolveUnitBankRate(fromCurrency, toCurrency, details, rateType, rateMode, exchangeRates);
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
  return getUnitExchangeRateWithBasis(
    fromCurrency,
    toCurrency,
    details,
    rateType,
    rateMode,
    exchangeRates,
    options,
  ).rate;
}

/**
 * 匯率卡倒數顯示（Google-style）：「1 TO = 1/rate FROM」
 *
 * 設計決策：使用數學倒數而非反向呼叫 getUnitExchangeRate，因為：
 * - 用戶視角：同一匯率的正向與倒數，可直接乘除快速換算
 * - 若用反向計算會得到不同匯率（買賣價差），造成用戶困惑
 */
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

  // 檢查是否所有貨幣都只有一種類型（optional chaining 防呆畸形資料）
  const hasSpot = currencies.some((d) => isUsableRate(d.spot?.sell));
  const hasCash = currencies.some((d) => isUsableRate(d.cash?.sell));

  return !(hasSpot && hasCash);
}
