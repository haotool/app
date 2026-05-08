/**
 * localStorage Keys 集中管理
 *
 * 根據 CLAUDE.md 規範，localStorage keys 分為兩類：
 * 1. 快取數據：可定期清除，有過期時間
 * 2. 用戶數據：永久保存，不可自動清除
 *
 * ⚠️ STABLE IDENTIFIER POLICY ⚠️
 * 本檔案內所有字串值（包含 'ratewise-converter'、'ratewise-history-cache'、
 * 'exchangeRates'、'app_version' 等）為 **永久穩定識別符**，刻在使用者瀏覽器中：
 *
 * - 改名 → 既有使用者的收藏 / 歷史 / 偏好設定全部消失
 * - 與「品牌 shortName」完全解耦：即使未來把品牌改名，這裡的字串也 **不可** 跟著改
 * - 視為與 URL path（/ratewise/）同等級的對外契約
 *
 * 若真的必須改名（例如資料結構不相容的破壞性升級），需要：
 * 1. 寫遷移腳本（讀舊 key → 寫新 key → 刪舊 key）
 * 2. major version bump
 * 3. release notes 明確告知使用者
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

  /** 換錢所匯率快取 key prefix - 5 分鐘過期，由 moneyboxRateService.ts 管理 */
  EXCHANGE_SHOP_RATE_PREFIX: 'exchangeShopRate_',

  // === 系統數據 (版本管理) ===

  /** 當前應用版本號 - 由 versionManager.ts 管理 */
  APP_VERSION: 'app_version',

  /** 版本更新歷史 - 最近 10 筆，由 versionManager.ts 管理 */
  VERSION_HISTORY: 'version_history',

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

  /** 匯率來源選擇 (bank/exchange-shop) - 用戶偏好的匯率資料來源，預設為 bank */
  RATE_SOURCE: 'rateSource',

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
 * 快取類型的 Key Prefixes (可清除)
 *
 * 用於每個幣別各自建立 cache key 的資料，例如 exchangeShopRate_KRW。
 */
export const CACHE_KEY_PREFIXES = [STORAGE_KEYS.EXCHANGE_SHOP_RATE_PREFIX] as const;

/**
 * 用戶數據類型的 Keys (不可清除)
 * 註: 這些 keys 由 versionManager.ts 在清除快取時保留
 *
 * 遷移說明（v2.7.1+）：
 * - fromCurrency / toCurrency / currencyConverterMode / favorites
 *   已遷移至 Zustand store，統一由 'ratewise-converter' key 管理
 * - 舊的個別 keys 在首次啟動時由 converterStore migration 自動清除
 *
 * 遷移說明（v2.22.21+）：
 * - rateType / rateSource 也併入 'ratewise-converter'，
 *   converterStore.__migrateFromLegacy 會於首次 hydrate 時讀取舊 key 並刪除。
 *   仍保留在本清單中以保護過渡期使用者資料不被快取清除流程誤刪。
 */
export const USER_DATA_KEYS = [
  'ratewise-converter', // Zustand store（含 fromCurrency/toCurrency/mode/rateMode/rateType/rateSource/favorites/history）
  STORAGE_KEYS.RATE_TYPE,
  STORAGE_KEYS.RATE_SOURCE,
  STORAGE_KEYS.CONVERSION_HISTORY,
] as const;
