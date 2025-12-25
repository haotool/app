/**
 * localStorage Keys 集中管理
 *
 * 根據 CLAUDE.md 規範，localStorage keys 分為兩類：
 * 1. 快取數據：可定期清除，有過期時間
 * 2. 用戶數據：永久保存，不可自動清除
 *
 * 參考：/home/user/app/CLAUDE.md
 */

/**
 * localStorage Keys 常數
 */
export const STORAGE_KEYS = {
  // === 快取數據 (可清除) ===

  /** 匯率數據快取 - 5 分鐘過期，由 exchangeRateService.ts 管理 */
  EXCHANGE_RATES: 'exchangeRates',

  // === 用戶數據 (不可清除) ===

  /** 貨幣轉換器模式 (single/multi) - 用戶界面偏好 */
  CURRENCY_CONVERTER_MODE: 'currencyConverterMode',

  /** 收藏的貨幣列表 - 用戶自定義收藏 */
  FAVORITES: 'favorites',

  /** 來源貨幣選擇 - 用戶最後選擇的來源貨幣 */
  FROM_CURRENCY: 'fromCurrency',

  /** 目標貨幣選擇 - 用戶最後選擇的目標貨幣 */
  TO_CURRENCY: 'toCurrency',

  /** 匯率類型選擇 (spot/cash) - 用戶偏好的匯率類型，預設為 spot */
  RATE_TYPE: 'rateType',

  /** 轉換歷史記錄 - 用戶的轉換記錄，7 天後自動過期 */
  CONVERSION_HISTORY: 'conversionHistory',
} as const;

/**
 * localStorage Key 類型
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * 快取類型的 Keys (可清除)
 */
export const CACHE_KEYS = [STORAGE_KEYS.EXCHANGE_RATES] as const;

/**
 * 用戶數據類型的 Keys (不可清除)
 * 註: 這些 keys 由 versionManager.ts 在清除快取時保留
 */
export const USER_DATA_KEYS = [
  STORAGE_KEYS.CURRENCY_CONVERTER_MODE,
  STORAGE_KEYS.FAVORITES,
  STORAGE_KEYS.FROM_CURRENCY,
  STORAGE_KEYS.TO_CURRENCY,
  STORAGE_KEYS.RATE_TYPE,
  STORAGE_KEYS.CONVERSION_HISTORY,
] as const;
