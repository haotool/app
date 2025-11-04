/**
 * 匯率歷史資料服務
 *
 * 功能：
 * - 讀取最新匯率（latest.json）
 * - 讀取歷史匯率（history/YYYY-MM-DD.json）
 * - 提供最多 30 天的歷史資料
 * - 支援未來趨勢圖功能
 *
 * CDN 來源：
 * - Latest: https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
 * - History: https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/YYYY-MM-DD.json
 *
 * @author GitHub Actions Bot
 * @created 2025-10-13T22:59:32+08:00
 */

import { logger } from '../utils/logger';
import type { CurrencyCode } from '../features/ratewise/types';

/**
 * 匯率資料結構
 */
export interface ExchangeRateData {
  updateTime: string;
  source: string;
  rates: Record<CurrencyCode, number | null>;
}

/**
 * 歷史匯率資料結構
 */
export interface HistoricalRateData {
  date: string;
  data: ExchangeRateData;
}

/**
 * CDN URLs（使用 data 分支）
 *
 * 策略:
 * - latest.json: 只使用 GitHub raw，確保匯率即時性（避免 CDN 快取延遲）
 * - history/*.json: CDN 優先，歷史數據不變，可安全快取
 */
const CDN_URLS = {
  latest: [
    // 只使用 GitHub raw，確保最新匯率即時性
    'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json',
  ],
  history: (date: string) => [
    // 歷史數據使用 CDN 優先（快取合理，因為數據不變）
    `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/${date}.json`,
    `https://raw.githubusercontent.com/haotool/app/data/public/rates/history/${date}.json`,
  ],
};

/**
 * 快取配置
 */
const CACHE_KEY_PREFIX = 'exchange-rates';
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘

/**
 * 動態探測配置
 */
const CONFIG = {
  MAX_HISTORY_DAYS: 30, // 最多探測30天
  FALLBACK_RETRIES: 7, // Fallback最多回溯7天
  RANGE_CACHE_KEY: `${CACHE_KEY_PREFIX}-date-range`,
  RANGE_CACHE_DURATION: 60 * 60 * 1000, // 1小時
} as const;

/**
 * 可用日期範圍
 */
export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  availableDays: number;
  timestamp: number;
}

/**
 * 記憶體快取
 */
const cache = new Map<string, { data: unknown; timestamp: number }>();

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

/**
 * 從 URL 列表依序嘗試獲取資料
 */
async function fetchWithFallback<T>(urls: string[], cacheKey: string): Promise<T> {
  // 先檢查快取
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for ${cacheKey}`, { service: 'exchangeRateHistoryService' });
    return cached;
  }

  // 依序嘗試 URL
  for (const url of urls) {
    try {
      logger.debug(`Fetching from ${url}`, { service: 'exchangeRateHistoryService' });
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
      });

      if (!response.ok) {
        // 404 是預期的錯誤（歷史資料可能尚未生成），降級為 debug level
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

      const data = (await response.json()) as ExchangeRateData;

      // 存入快取
      saveToCache(cacheKey, data);

      logger.info(`Successfully fetched from ${url}`, { service: 'exchangeRateHistoryService' });
      return data as T;
    } catch (error) {
      logger.debug(`Failed to fetch from ${url}`, {
        service: 'exchangeRateHistoryService',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new Error(`Failed to fetch data from all URLs: ${urls.join(', ')}`);
}

/**
 * 獲取最新匯率
 */
export async function fetchLatestRates(): Promise<ExchangeRateData> {
  try {
    const data = await fetchWithFallback<ExchangeRateData>(
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
export async function fetchHistoricalRates(date: Date): Promise<ExchangeRateData> {
  const dateStr = formatDate(date);

  try {
    const data = await fetchWithFallback<ExchangeRateData>(
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
  // 動態探測可用範圍
  const range = await detectAvailableDateRange();
  const actualDays = Math.min(maxDays, range.availableDays);

  if (actualDays === 0) {
    logger.warn('No historical data available', { service: 'exchangeRateHistoryService' });
    return [];
  }

  logger.info(`Fetching ${actualDays} days of historical rates (dynamic range, parallel)`, {
    service: 'exchangeRateHistoryService',
    availableDays: range.availableDays,
    requestedDays: maxDays,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 建立日期列表 - 從昨天開始往前推
  const dates = Array.from({ length: actualDays }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (i + 1));
    return date;
  });

  // 並行獲取所有歷史匯率（使用Fallback機制）
  const promises = dates.map(async (date) => {
    const data = await fetchHistoricalRatesWithFallback(date);
    if (data) {
      return { date: formatDate(date), data };
    }
    return null;
  });

  // 等待所有請求完成，過濾掉null結果
  const results = (await Promise.all(promises)).filter(
    (item): item is HistoricalRateData => item !== null,
  );

  logger.info(`Fetched ${results.length}/${actualDays} historical records`, {
    service: 'exchangeRateHistoryService',
    fetched: results.length,
    requested: actualDays,
  });

  return results;
}

/**
 * 清除快取
 */
export function clearCache(): void {
  cache.clear();
  logger.info('Cache cleared', { service: 'exchangeRateHistoryService' });
}

/**
 * 動態探測可用的歷史數據範圍
 *
 * 從今天往前探測，找出最舊的可用日期
 * 結果會快取1小時，減少不必要的探測請求
 */
export async function detectAvailableDateRange(): Promise<DateRange> {
  // 檢查快取
  const cached = getFromCache<DateRange>(CONFIG.RANGE_CACHE_KEY);
  if (cached) {
    logger.debug('Using cached date range', { service: 'exchangeRateHistoryService' });
    return cached;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let oldestAvailableDate = today;
  let availableDays = 0;

  logger.info(`Detecting available date range (max ${CONFIG.MAX_HISTORY_DAYS} days)`, {
    service: 'exchangeRateHistoryService',
  });

  // 從昨天開始往前探測（今天的數據可能尚未生成）
  for (let i = 1; i <= CONFIG.MAX_HISTORY_DAYS; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() - i);

    try {
      await fetchHistoricalRates(testDate);
      oldestAvailableDate = testDate;
      availableDays = i;
    } catch {
      // 遇到404表示沒有更早的數據了
      break;
    }
  }

  const range: DateRange = {
    startDate: formatDate(oldestAvailableDate),
    endDate: formatDate(today),
    availableDays,
    timestamp: Date.now(),
  };

  // 快取結果
  saveToCache(CONFIG.RANGE_CACHE_KEY, range);

  logger.info(`Detected ${availableDays} days of historical data`, {
    service: 'exchangeRateHistoryService',
    startDate: range.startDate,
    endDate: range.endDate,
  });

  return range;
}

/**
 * 獲取指定日期的歷史匯率（帶Fallback機制）
 *
 * 如果指定日期的數據不存在，會自動往前找最近的可用日期
 * 最多回溯 CONFIG.FALLBACK_RETRIES 天
 *
 * @param date 目標日期
 * @returns 匯率數據，或null（回溯範圍內無可用數據）
 */
export async function fetchHistoricalRatesWithFallback(
  date: Date,
): Promise<ExchangeRateData | null> {
  for (let i = 0; i < CONFIG.FALLBACK_RETRIES; i++) {
    const retryDate = new Date(date);
    retryDate.setDate(date.getDate() - i);

    try {
      const data = await fetchHistoricalRates(retryDate);
      if (i > 0) {
        logger.info(
          `Fallback succeeded: used ${formatDate(retryDate)} instead of ${formatDate(date)}`,
          {
            service: 'exchangeRateHistoryService',
            fallbackDays: i,
          },
        );
      }
      return data;
    } catch {
      // 繼續嘗試前一天
      continue;
    }
  }

  logger.warn(
    `No historical data available within ${CONFIG.FALLBACK_RETRIES} days from ${formatDate(date)}`,
    {
      service: 'exchangeRateHistoryService',
    },
  );

  return null;
}
