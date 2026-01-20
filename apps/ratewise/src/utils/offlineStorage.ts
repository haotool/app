/**
 * 離線儲存工具 - IndexedDB 備援策略
 *
 * [fix:2026-01-11] Safari PWA 冷啟動離線問題解決方案
 *
 * 問題根因：
 * - Safari 的 Cache Storage 只持續到瀏覽器關閉或從記憶體卸載
 * - iOS 對 PWA 有 50MB 的限制，且 7 天未使用可能被清除
 * - 將 PWA 從背景滑掉後重啟，Cache Storage 可能已被清空
 *
 * 解決方案：
 * - 使用 IndexedDB 作為備援（限制 500MB，比 Cache API 更持久）
 * - 雙重儲存策略：localStorage (5 分鐘) + IndexedDB (7 天)
 *
 * [fix:2026-01-11] SSR/SSG 相容性修復
 * - 使用 lazy initialization 避免在模組載入時存取 indexedDB
 * - 參考: [Vue.js SSR Guide](https://vuejs.org/guide/scaling-up/ssr.html)
 *
 * 參考:
 * - [Apple Developer Forums: Safari iOS PWA Data Persistence](https://developer.apple.com/forums/thread/710157)
 * - [idb-keyval: Simple key-value store](https://github.com/jakearchibald/idb-keyval)
 *
 * @module offlineStorage
 */

import { get, set, del, createStore } from 'idb-keyval';
import { logger } from './logger';

// Lazy initialization pattern for SSR/SSG
// 問題：createStore() 在模組載入時存取 indexedDB，導致 SSR/SSG 失敗
// 解決：延遲到第一次使用時才創建 store
// ============================================================

// Use ReturnType for type inference (UseStore is internal to idb-keyval)
type IDBStore = ReturnType<typeof createStore>;

let offlineStore: IDBStore | null = null;

/**
 * 獲取或創建 IndexedDB store（延遲初始化）
 *
 * @returns IDBStore | null - IndexedDB store 或 null（SSR 環境）
 */
function getStore(): IDBStore | null {
  // SSR/SSG 環境檢查
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  // Lazy initialization
  if (!offlineStore) {
    try {
      offlineStore = createStore('ratewise-offline-db', 'offline-store');
    } catch (error) {
      logger.warn('IndexedDB: failed to create store', { error });
      return null;
    }
  }

  return offlineStore;
}

// 儲存時間戳的 key 後綴
const TIMESTAMP_SUFFIX = '_timestamp';

// 預設過期時間：7 天（毫秒）
const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * 儲存資料到 IndexedDB
 *
 * @param key 儲存的 key
 * @param value 儲存的資料
 * @returns Promise<boolean> 是否儲存成功
 */
export async function setOfflineData<T>(key: string, value: T): Promise<boolean> {
  const store = getStore();
  if (!store) {
    return false;
  }

  try {
    // 儲存資料
    await set(key, value, store);
    // 儲存時間戳
    await set(`${key}${TIMESTAMP_SUFFIX}`, Date.now(), store);
    logger.debug('IndexedDB: data saved', { key });
    return true;
  } catch (error) {
    logger.warn('IndexedDB: failed to save data', { key, error });
    return false;
  }
}

/**
 * 從 IndexedDB 讀取資料
 *
 * @param key 儲存的 key
 * @param maxAge 最大有效期（毫秒），預設 7 天
 * @returns Promise<T | null> 資料或 null
 */
export async function getOfflineData<T>(
  key: string,
  maxAge: number = DEFAULT_EXPIRATION,
): Promise<T | null> {
  const store = getStore();
  if (!store) {
    return null;
  }

  try {
    // 讀取時間戳
    const timestamp = await get<number>(`${key}${TIMESTAMP_SUFFIX}`, store);

    // 檢查是否過期
    if (timestamp) {
      const age = Date.now() - timestamp;
      if (age > maxAge) {
        logger.debug('IndexedDB: data expired', {
          key,
          ageMinutes: Math.floor(age / 60000),
          maxAgeMinutes: Math.floor(maxAge / 60000),
        });
        // 不刪除過期資料，保留作為最後備援
        // 返回 null 讓調用方決定是否使用過期資料
        return null;
      }
    }

    // 讀取資料
    const data = await get<T>(key, store);

    if (data !== undefined) {
      const ageMinutes = timestamp ? Math.floor((Date.now() - timestamp) / 60000) : 0;
      logger.debug('IndexedDB: data retrieved', { key, ageMinutes });
      return data;
    }

    return null;
  } catch (error) {
    logger.warn('IndexedDB: failed to retrieve data', { key, error });
    return null;
  }
}

/**
 * 從 IndexedDB 讀取資料（忽略過期時間，用於緊急離線備援）
 *
 * @param key 儲存的 key
 * @returns Promise<T | null> 資料或 null
 */
export async function getOfflineDataAnyAge<T>(key: string): Promise<T | null> {
  const store = getStore();
  if (!store) {
    return null;
  }

  try {
    const data = await get<T>(key, store);
    const timestamp = await get<number>(`${key}${TIMESTAMP_SUFFIX}`, store);

    if (data !== undefined) {
      const ageMinutes = timestamp ? Math.floor((Date.now() - timestamp) / 60000) : 0;
      logger.debug('IndexedDB: data retrieved (any age)', { key, ageMinutes });
      return data;
    }

    return null;
  } catch (error) {
    logger.warn('IndexedDB: failed to retrieve data (any age)', { key, error });
    return null;
  }
}

/**
 * 從 IndexedDB 刪除資料
 *
 * @param key 儲存的 key
 * @returns Promise<boolean> 是否刪除成功
 */
export async function deleteOfflineData(key: string): Promise<boolean> {
  const store = getStore();
  if (!store) {
    return false;
  }

  try {
    await del(key, store);
    await del(`${key}${TIMESTAMP_SUFFIX}`, store);
    logger.debug('IndexedDB: data deleted', { key });
    return true;
  } catch (error) {
    logger.warn('IndexedDB: failed to delete data', { key, error });
    return false;
  }
}

/**
 * 檢查 IndexedDB 是否可用
 *
 * @returns Promise<boolean> 是否可用
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
  const store = getStore();
  if (!store) {
    return false;
  }

  try {
    // 嘗試寫入和讀取測試資料
    const testKey = '__idb_test__';
    const testValue = Date.now();
    await set(testKey, testValue, store);
    const result = await get<number>(testKey, store);
    await del(testKey, store);
    return result === testValue;
  } catch {
    return false;
  }
}

// ============================================================
// 匯率專用 API
// ============================================================

// IndexedDB 中匯率資料的 key
export const EXCHANGE_RATES_IDB_KEY = 'exchange_rates';

// 匯率資料在 IndexedDB 中的有效期：7 天
export const EXCHANGE_RATES_IDB_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// ============================================================
// 資料陳舊度分級
// ============================================================
// 參考: https://www.droidcon.com/2025/12/16/the-complete-guide-to-offline-first-architecture-in-android/
// - Fresh (< 5 分鐘): 無需警告
// - Recent (5-30 分鐘): 顯示時間戳
// - Stale (30 分鐘 - 24 小時): 顯示警告
// - Very Stale (> 24 小時): 強烈警告
// - Expired (> 7 天): 應該使用 fallback 資料
// ============================================================

export enum DataStaleness {
  FRESH = 'fresh', // < 5 分鐘
  RECENT = 'recent', // 5-30 分鐘
  STALE = 'stale', // 30 分鐘 - 24 小時
  VERY_STALE = 'very_stale', // 24 小時 - 7 天
  EXPIRED = 'expired', // > 7 天
}

export interface StalenessInfo {
  level: DataStaleness;
  ageMs: number;
  ageMinutes: number;
  ageHours: number;
  ageDays: number;
  isExpired: boolean;
  shouldWarn: boolean;
  message: string;
}

// 陳舊度閾值（毫秒）
const STALENESS_THRESHOLDS = {
  FRESH: 5 * 60 * 1000, // 5 分鐘
  RECENT: 30 * 60 * 1000, // 30 分鐘
  STALE: 24 * 60 * 60 * 1000, // 24 小時
  VERY_STALE: 7 * 24 * 60 * 60 * 1000, // 7 天
};

/**
 * 計算資料陳舊度資訊
 *
 * @param timestamp 資料時間戳
 * @returns StalenessInfo 陳舊度資訊
 */
export function calculateStaleness(timestamp: number | null): StalenessInfo {
  if (!timestamp) {
    return {
      level: DataStaleness.EXPIRED,
      ageMs: Infinity,
      ageMinutes: Infinity,
      ageHours: Infinity,
      ageDays: Infinity,
      isExpired: true,
      shouldWarn: true,
      message: '無法確定資料時間',
    };
  }

  const ageMs = Date.now() - timestamp;
  const ageMinutes = Math.floor(ageMs / 60000);
  const ageHours = Math.floor(ageMs / (60 * 60 * 1000));
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  let level: DataStaleness;
  let shouldWarn: boolean;
  let message: string;

  if (ageMs < STALENESS_THRESHOLDS.FRESH) {
    level = DataStaleness.FRESH;
    shouldWarn = false;
    message = '資料已是最新';
  } else if (ageMs < STALENESS_THRESHOLDS.RECENT) {
    level = DataStaleness.RECENT;
    shouldWarn = false;
    message = `更新於 ${ageMinutes} 分鐘前`;
  } else if (ageMs < STALENESS_THRESHOLDS.STALE) {
    level = DataStaleness.STALE;
    shouldWarn = true;
    message = ageHours > 0 ? `更新於 ${ageHours} 小時前` : `更新於 ${ageMinutes} 分鐘前`;
  } else if (ageMs < STALENESS_THRESHOLDS.VERY_STALE) {
    level = DataStaleness.VERY_STALE;
    shouldWarn = true;
    message = ageDays > 0 ? `更新於 ${ageDays} 天前` : `更新於 ${ageHours} 小時前`;
  } else {
    level = DataStaleness.EXPIRED;
    shouldWarn = true;
    message = `資料已過期（${ageDays} 天前）`;
  }

  return {
    level,
    ageMs,
    ageMinutes,
    ageHours,
    ageDays,
    isExpired: level === DataStaleness.EXPIRED,
    shouldWarn,
    message,
  };
}

/**
 * 匯率資料結構（與 exchangeRateService.ts 相同）
 */
export interface ExchangeRateData {
  timestamp: string;
  updateTime: string;
  source: string;
  sourceUrl: string;
  base: string;
  rates: Record<string, number>;
  details: Record<
    string,
    {
      name: string;
      spot: { buy: number; sell: number | null };
      cash: { buy: number | null; sell: number | null };
    }
  >;
}

/**
 * 儲存匯率資料到 IndexedDB
 *
 * @param data 匯率資料
 * @returns Promise<boolean> 是否儲存成功
 */
export async function saveExchangeRatesToIDB(data: ExchangeRateData): Promise<boolean> {
  return setOfflineData(EXCHANGE_RATES_IDB_KEY, data);
}

/**
 * 從 IndexedDB 讀取匯率資料（檢查 7 天有效期）
 *
 * @returns Promise<ExchangeRateData | null> 匯率資料或 null
 */
export async function getExchangeRatesFromIDB(): Promise<ExchangeRateData | null> {
  return getOfflineData<ExchangeRateData>(EXCHANGE_RATES_IDB_KEY, EXCHANGE_RATES_IDB_EXPIRATION);
}

/**
 * 從 IndexedDB 讀取匯率資料（忽略過期，緊急離線備援）
 *
 * @returns Promise<ExchangeRateData | null> 匯率資料或 null
 * @deprecated 使用 getExchangeRatesFromIDBWithStaleness() 以獲取陳舊度資訊
 */
export async function getExchangeRatesFromIDBAnytime(): Promise<ExchangeRateData | null> {
  return getOfflineDataAnyAge<ExchangeRateData>(EXCHANGE_RATES_IDB_KEY);
}

/**
 * 從 IndexedDB 讀取匯率資料並返回陳舊度資訊
 *
 * [fix:2026-01-11] 修復離線備援忽略 7 天有效期問題
 * - 返回陳舊度資訊讓調用方決定如何處理
 * - 超過 7 天的資料會標記為 EXPIRED，建議使用 fallback
 *
 * @returns Promise<{ data: ExchangeRateData | null; staleness: StalenessInfo }> 資料與陳舊度資訊
 */
export async function getExchangeRatesFromIDBWithStaleness(): Promise<{
  data: ExchangeRateData | null;
  staleness: StalenessInfo;
}> {
  const store = getStore();
  if (!store) {
    return {
      data: null,
      staleness: calculateStaleness(null),
    };
  }

  try {
    const data = await get<ExchangeRateData>(EXCHANGE_RATES_IDB_KEY, store);
    const timestamp = await get<number>(`${EXCHANGE_RATES_IDB_KEY}${TIMESTAMP_SUFFIX}`, store);
    const staleness = calculateStaleness(timestamp ?? null);

    if (data !== undefined) {
      logger.debug('IndexedDB: data retrieved with staleness', {
        key: EXCHANGE_RATES_IDB_KEY,
        level: staleness.level,
        ageMinutes: staleness.ageMinutes,
        isExpired: staleness.isExpired,
      });
      return { data, staleness };
    }

    return { data: null, staleness };
  } catch (error) {
    logger.warn('IndexedDB: failed to retrieve data with staleness', {
      key: EXCHANGE_RATES_IDB_KEY,
      error,
    });
    return {
      data: null,
      staleness: calculateStaleness(null),
    };
  }
}

/**
 * 清除 IndexedDB 中的匯率資料
 *
 * @returns Promise<boolean> 是否清除成功
 */
export async function clearExchangeRatesFromIDB(): Promise<boolean> {
  return deleteOfflineData(EXCHANGE_RATES_IDB_KEY);
}
