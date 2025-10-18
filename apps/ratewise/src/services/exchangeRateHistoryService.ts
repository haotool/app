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
 */
const CDN_URLS = {
  latest: [
    'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json',
    'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json',
  ],
  history: (date: string) => [
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
 * 檢查 URL 是否存在（使用 HEAD 請求避免下載內容，防止 404 出現在 console）
 * @param url - 要檢查的 URL
 * @returns 檔案是否存在
 */
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 從 URL 列表依序嘗試獲取資料
 * 使用 HEAD 請求先檢查檔案存在性，避免 404 錯誤出現在瀏覽器 console
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
      // 先用 HEAD 請求檢查檔案是否存在（避免 404 出現在 console）
      const exists = await checkUrlExists(url);
      if (!exists) {
        logger.debug(`Historical data not found (HEAD check): ${url}`, {
          service: 'exchangeRateHistoryService',
          statusCode: 404,
        });
        continue;
      }

      // 檔案存在，執行實際的 GET 請求
      logger.debug(`Fetching from ${url}`, { service: 'exchangeRateHistoryService' });
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-cache',
      });

      if (!response.ok) {
        logger.warn(`HTTP ${response.status} from ${url}`, {
          service: 'exchangeRateHistoryService',
          statusCode: response.status,
        });
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
 * 獲取過去 N 天的歷史匯率（並行執行）
 *
 * 使用 Promise.all 並行獲取，效能提升 ~78%：
 * - 舊版: 7 days × 200ms = 1.4s (sequential)
 * - 新版: max(7 parallel) ≈ 200-300ms
 */
export async function fetchHistoricalRatesRange(days = 30): Promise<HistoricalRateData[]> {
  const today = new Date();

  logger.info(`Fetching ${days} days of historical rates (parallel)`, {
    service: 'exchangeRateHistoryService',
  });

  // 建立日期列表
  const dates = Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date;
  });

  // 並行獲取所有歷史匯率
  const promises = dates.map(async (date) => {
    try {
      const data = await fetchHistoricalRates(date);
      return { date: formatDate(date), data };
    } catch {
      // 歷史資料可能尚未生成（GitHub Actions 每天首次執行才建立），
      // 這是正常現象，使用 debug level 避免 console 噪音
      logger.debug(`Historical data not yet available for ${formatDate(date)}`, {
        service: 'exchangeRateHistoryService',
        reason: 'File may not be created yet by scheduled workflow',
      });
      return null;
    }
  });

  // 等待所有請求完成，過濾掉失敗的結果
  const results = (await Promise.all(promises)).filter(
    (item): item is HistoricalRateData => item !== null,
  );

  logger.info(`Fetched ${results.length}/${days} historical records`, {
    service: 'exchangeRateHistoryService',
    fetched: results.length,
    requested: days,
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
