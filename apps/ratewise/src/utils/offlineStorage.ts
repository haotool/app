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
 * 參考:
 * - [Apple Developer Forums: Safari iOS PWA Data Persistence](https://developer.apple.com/forums/thread/710157)
 * - [idb-keyval: Simple key-value store](https://github.com/jakearchibald/idb-keyval)
 *
 * @module offlineStorage
 */

import { get, set, del, createStore } from 'idb-keyval';
import { logger } from './logger';

// 創建專用的 IndexedDB store（避免與其他應用衝突）
const offlineStore = createStore('ratewise-offline-db', 'offline-store');

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
  // SSR 檢查
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return false;
  }

  try {
    // 儲存資料
    await set(key, value, offlineStore);
    // 儲存時間戳
    await set(`${key}${TIMESTAMP_SUFFIX}`, Date.now(), offlineStore);
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
  // SSR 檢查
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }

  try {
    // 讀取時間戳
    const timestamp = await get<number>(`${key}${TIMESTAMP_SUFFIX}`, offlineStore);

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
    const data = await get<T>(key, offlineStore);

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
  // SSR 檢查
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }

  try {
    const data = await get<T>(key, offlineStore);
    const timestamp = await get<number>(`${key}${TIMESTAMP_SUFFIX}`, offlineStore);

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
  // SSR 檢查
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return false;
  }

  try {
    await del(key, offlineStore);
    await del(`${key}${TIMESTAMP_SUFFIX}`, offlineStore);
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
  // SSR 檢查
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return false;
  }

  try {
    // 嘗試寫入和讀取測試資料
    const testKey = '__idb_test__';
    const testValue = Date.now();
    await set(testKey, testValue, offlineStore);
    const result = await get<number>(testKey, offlineStore);
    await del(testKey, offlineStore);
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
 */
export async function getExchangeRatesFromIDBAnytime(): Promise<ExchangeRateData | null> {
  return getOfflineDataAnyAge<ExchangeRateData>(EXCHANGE_RATES_IDB_KEY);
}

/**
 * 清除 IndexedDB 中的匯率資料
 *
 * @returns Promise<boolean> 是否清除成功
 */
export async function clearExchangeRatesFromIDB(): Promise<boolean> {
  return deleteOfflineData(EXCHANGE_RATES_IDB_KEY);
}
