/**
 * 匯率歷史資料服務
 *
 * 功能：
 * - 讀取最新匯率（latest.json）
 * - 讀取歷史匯率（history/YYYY-MM-DD.json）
 * - 提供最多 30 天的歷史資料
 * - 支援未來趨勢圖功能
 *
 * CDN 來源（見 src/config/api-endpoints.ts）：
 * - Latest: RAW_DATA_BASE（GitHub raw，無快取）
 * - History: CDN_DATA_BASE（jsDelivr 優先） + RAW_DATA_BASE（備援）
 *
 * @author GitHub Actions Bot
 * @created 2025-10-13T22:59:32+08:00
 * @updated 2025-12-10 整合 Request ID 追蹤
 */

import { logger } from '../utils/logger';
import { fetchWithRequestId } from '../utils/requestId';
import type { CurrencyCode } from '../features/ratewise/types';
import { CDN_DATA_BASE, RAW_DATA_BASE, RATES_API } from '../config/api-endpoints';

/**
 * 歷史服務專用的精簡匯率快照型別。
 * 只包含趨勢圖需要的欄位；完整型別請見 offlineStorage.ts 的 RateSnapshot。
 */
export interface RateSnapshot {
  updateTime: string;
  source: string;
  rates: Record<CurrencyCode, number | null>;
}

/**
 * 歷史匯率資料結構
 */
export interface HistoricalRateData {
  date: string;
  data: RateSnapshot;
}

/**
 * CDN URLs（使用 data 分支）
 *
 * 策略:
 * - latest.json: 只使用 GitHub raw，確保匯率即時性（避免 CDN 快取延遲）
 * - history/*.json: CDN 優先，歷史數據不變，可安全快取
 * URL 從 api-endpoints.ts 統一管理，此處不硬編碼。
 */
const CDN_URLS = {
  latest: [RATES_API.latestRaw],
  history: (date: string) => [
    `${CDN_DATA_BASE}/public/rates/history/${date}.json`,
    `${RAW_DATA_BASE}/public/rates/history/${date}.json`,
  ],
};

const IS_LHCI_OFFLINE = import.meta.env['VITE_LHCI_OFFLINE'] === 'true';

/**
 * 為 Lighthouse / CI 提供離線固定匯率，避免 404 造成 console error
 */
const LHCI_BASE_RATES: RateSnapshot = {
  updateTime: '2025-01-01T00:00:00Z',
  source: 'LHCI-MOCK',
  rates: {
    TWD: 1,
    USD: 31.07,
    HKD: 4.01,
    GBP: 41.96,
    AUD: 20.47,
    CAD: 22.43,
    SGD: 24.05,
    CHF: 39.13,
    JPY: 0.2055,
    EUR: 36.31,
    KRW: 0.0236,
    CNY: 4.39,
    NZD: 19.5,
    THB: 0.87,
    PHP: 0.55,
    IDR: 0.0021,
    VND: 0.0013,
    MYR: 6.6,
  },
};

function buildLhciMockRates(date: Date): RateSnapshot {
  const dateStr = formatDate(date);
  return {
    ...LHCI_BASE_RATES,
    updateTime: `${dateStr}T00:00:00Z`,
  };
}

/**
 * 快取配置
 *
 * 雙層快取策略：
 * - 記憶體快取：5 分鐘過期，用於減少重複請求
 * - localStorage 快取：30 天過期，用於離線使用
 */
const CACHE_KEY_PREFIX = 'exchange-rates';
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘（記憶體快取）
const STORAGE_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 天（localStorage 快取）
const STORAGE_HISTORY_KEY = 'ratewise-history-cache'; // localStorage key

const CONFIG = {
  MAX_HISTORY_DAYS: 30,
  BATCH_SIZE: 5,
  MAX_CONSECUTIVE_MISSING: 5,
} as const;

/**
 * 記憶體快取
 */
const cache = new Map<string, { data: unknown; timestamp: number }>();

/** localStorage 歷史數據快取結構 */
interface StorageHistoryCache {
  version: number;
  lastUpdated: number;
  rates: Record<string, { data: RateSnapshot; timestamp: number }>;
}

/** 從 localStorage 讀取歷史快取 */
function getStorageCache(): StorageHistoryCache | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StorageHistoryCache;
  } catch {
    return null;
  }
}

/** 儲存歷史數據到 localStorage */
function saveToStorageCache(dateKey: string, data: RateSnapshot): void {
  try {
    if (typeof localStorage === 'undefined') return;

    const cache = getStorageCache() ?? { version: 1, lastUpdated: Date.now(), rates: {} };

    // 更新快取
    cache.rates[dateKey] = { data, timestamp: Date.now() };
    cache.lastUpdated = Date.now();

    // 清理過期數據（超過 30 天的歷史）
    const now = Date.now();
    const keys = Object.keys(cache.rates);
    for (const key of keys) {
      const entry = cache.rates[key];
      if (entry && now - entry.timestamp > STORAGE_CACHE_DURATION) {
        delete cache.rates[key];
      }
    }

    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(cache));
  } catch (error) {
    // localStorage 可能已滿或不可用，靜默處理
    logger.debug('Failed to save to localStorage', {
      service: 'exchangeRateHistoryService',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** 從 localStorage 讀取指定日期的歷史數據 */
function getFromStorageCache(dateKey: string): RateSnapshot | null {
  const cache = getStorageCache();
  if (!cache) return null;

  const entry = cache.rates[dateKey];
  if (!entry) return null;

  // 檢查是否過期（30 天）
  if (Date.now() - entry.timestamp > STORAGE_CACHE_DURATION) {
    return null;
  }

  return entry.data;
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 從快取中取得資料
 */
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * 將資料存入快取
 */
function saveToCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/** 檢測網路狀態 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * 從 URL 列表依序嘗試獲取資料
 *
 * 離線優先快取策略：
 * 1. 記憶體快取（5 分鐘）- 減少網路請求
 * 2. 網路請求（如果在線）
 * 3. localStorage 快取（30 天）- 離線備援
 */
async function fetchWithFallback<T>(urls: string[], cacheKey: string): Promise<T> {
  // 1. 先檢查記憶體快取
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for ${cacheKey}`, { service: 'exchangeRateHistoryService' });
    return cached;
  }

  // Extract date key for localStorage
  const dateKey = cacheKey.replace(`${CACHE_KEY_PREFIX}-`, '');

  // 2. 離線時直接使用 localStorage 快取
  if (!isOnline()) {
    const storedData = getFromStorageCache(dateKey);
    if (storedData) {
      logger.debug(`Offline: using localStorage cache for ${cacheKey}`, {
        service: 'exchangeRateHistoryService',
      });
      // 同時更新記憶體快取
      saveToCache(cacheKey, storedData);
      return storedData as T;
    }
    throw new Error(`Offline and no cached data for ${cacheKey}`);
  }

  // 3. 依序嘗試 URL
  for (const url of urls) {
    try {
      logger.debug(`Fetching from ${url}`, { service: 'exchangeRateHistoryService' });

      // Silently handle 404 to avoid PageSpeed Insights errors
      // [2025-12-10] 使用 fetchWithRequestId 自動注入 X-Correlation-ID header
      const response = await fetchWithRequestId(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
      }).catch((error) => {
        // 網路錯誤（如 CORS、連線失敗）靜默處理
        logger.debug(`Network error for ${url}`, {
          service: 'exchangeRateHistoryService',
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      });

      if (!response) {
        continue;
      }

      if (!response.ok) {
        // 404 是預期的錯誤（歷史資料可能尚未生成），完全靜默
        if (response.status === 404) {
          logger.debug(`Historical data not found: ${url}`, {
            service: 'exchangeRateHistoryService',
            statusCode: 404,
          });
        } else {
          logger.warn(`HTTP ${response.status} from ${url}`, {
            service: 'exchangeRateHistoryService',
            statusCode: response.status,
          });
        }
        continue;
      }

      const data = (await response.json()) as RateSnapshot;

      // 存入記憶體快取
      saveToCache(cacheKey, data);
      // Also save to localStorage for offline use
      saveToStorageCache(dateKey, data);

      logger.info(`Successfully fetched from ${url}`, { service: 'exchangeRateHistoryService' });
      return data as T;
    } catch (error) {
      logger.debug(`Failed to fetch from ${url}`, {
        service: 'exchangeRateHistoryService',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 4. 所有 URL 都失敗，嘗試 localStorage 快取作為最後備援
  const fallbackData = getFromStorageCache(dateKey);
  if (fallbackData) {
    logger.debug(`Network failed, using localStorage fallback for ${cacheKey}`, {
      service: 'exchangeRateHistoryService',
    });
    saveToCache(cacheKey, fallbackData);
    return fallbackData as T;
  }

  throw new Error(`Failed to fetch data from all URLs: ${urls.join(', ')}`);
}

/**
 * 獲取最新匯率
 */
export async function fetchLatestRates(): Promise<RateSnapshot> {
  if (IS_LHCI_OFFLINE) {
    // CI / Lighthouse 模式使用固定匯率，避免外部 404 造成 console error
    return buildLhciMockRates(new Date());
  }

  try {
    const data = await fetchWithFallback<RateSnapshot>(
      CDN_URLS.latest,
      `${CACHE_KEY_PREFIX}-latest`,
    );

    logger.info(`Latest rates fetched: ${data.updateTime}`, {
      service: 'exchangeRateHistoryService',
    });
    return data;
  } catch (error) {
    logger.error(
      'Failed to fetch latest rates',
      error instanceof Error ? error : new Error(String(error)),
      { service: 'exchangeRateHistoryService' },
    );
    throw error;
  }
}

/**
 * 獲取指定日期的歷史匯率
 */
export async function fetchHistoricalRates(date: Date): Promise<RateSnapshot> {
  if (IS_LHCI_OFFLINE) {
    return buildLhciMockRates(date);
  }

  const dateStr = formatDate(date);

  try {
    const data = await fetchWithFallback<RateSnapshot>(
      CDN_URLS.history(dateStr),
      `${CACHE_KEY_PREFIX}-${dateStr}`,
    );

    logger.info(`Historical rates fetched for ${dateStr}`, {
      service: 'exchangeRateHistoryService',
    });
    return data;
  } catch (error) {
    // 歷史資料取得失敗（可能檔案尚未生成）使用 debug level
    // 避免在 console 產生誤導性的錯誤訊息
    logger.debug(`Failed to fetch historical rates for ${dateStr}`, {
      service: 'exchangeRateHistoryService',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * 獲取過去 N 天的歷史匯率（動態範圍，並行執行）
 *
 * [2025-11-04] 改為動態探測數據範圍，避免404錯誤
 * - 先探測實際可用的數據天數
 * - 只請求存在的日期，避免無效請求
 * - 使用Fallback機制處理缺失數據
 *
 * 使用 Promise.all 並行獲取，效能提升 ~78%：
 * - 舊版: 7 days × 200ms = 1.4s (sequential)
 * - 新版: max(7 parallel) ≈ 200-300ms
 *
 * @param maxDays 最多獲取天數（預設30，實際天數以探測結果為準）
 */
export async function fetchHistoricalRatesRange(
  maxDays: number = CONFIG.MAX_HISTORY_DAYS,
): Promise<HistoricalRateData[]> {
  const startTime = performance.now(); // 🎯 效能測量開始
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.min(Math.max(1, Math.floor(maxDays)), CONFIG.MAX_HISTORY_DAYS);
  logger.info(`Fetching up to ${totalDays} days of historical rates (batched parallel)`, {
    service: 'exchangeRateHistoryService',
    requestedDays: maxDays,
  });

  const results: HistoricalRateData[] = [];
  const missingDates: string[] = [];
  let consecutiveMissing = 0;

  for (let batchStart = 0; batchStart < totalDays; batchStart += CONFIG.BATCH_SIZE) {
    const batchDates = Array.from(
      { length: Math.min(CONFIG.BATCH_SIZE, totalDays - batchStart) },
      (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (batchStart + i + 1));
        return date;
      },
    );

    const settled = await Promise.allSettled(
      batchDates.map(async (date) => ({
        date: formatDate(date),
        data: await fetchHistoricalRates(date),
      })),
    );

    settled.forEach((outcome, index) => {
      const date = batchDates[index];
      if (!date) return; // 安全檢查：跳過無效索引

      const targetDate = formatDate(date);
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value);
        consecutiveMissing = 0;
      } else {
        missingDates.push(targetDate);
        consecutiveMissing += 1;
        logger.debug(`Skipped missing historical data for ${targetDate}`, {
          service: 'exchangeRateHistoryService',
          reason:
            outcome.reason instanceof Error
              ? outcome.reason.message
              : String(outcome.reason ?? 'unknown'),
        });
      }
    });

    if (consecutiveMissing >= CONFIG.MAX_CONSECUTIVE_MISSING) {
      logger.info('Stopped fetching historical data due to consecutive missing days', {
        service: 'exchangeRateHistoryService',
        consecutiveMissing,
        stopDate: missingDates[missingDates.length - 1],
      });
      break;
    }
  }

  // 🎯 效能測量結束與輸出
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  logger.info(`Fetched ${results.length}/${totalDays} historical records in ${duration}ms`, {
    service: 'exchangeRateHistoryService',
    fetched: results.length,
    missingDates,
    performanceMs: duration,
  });

  // 🚀 DEV 模式額外輸出效能數據（驗證 71-78% 提升）
  logger.debug('Historical rates fetch performance', {
    duration,
    fetched: results.length,
    total: totalDays,
  });

  return results;
}

/**
 * 清除快取
 *
 * 清除記憶體和 localStorage 快取
 * @param includeStorage - 是否同時清除 localStorage 快取（預設 false，保留離線數據）
 */
export function clearCache(includeStorage = false): void {
  cache.clear();
  if (includeStorage) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_HISTORY_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  logger.info('Cache cleared', {
    service: 'exchangeRateHistoryService',
    includeStorage,
  });
}
