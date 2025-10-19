/**
 * 匯率資料服務
 * 從台灣銀行 API 獲取即時匯率
 * [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
 */

import { logger } from '../utils/logger';

interface ExchangeRateData {
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

// CDN URLs (優先使用 jsdelivr，fallback 到 GitHub)
// 策略：
// 1. GitHub raw (主要) - 永遠是最新的，無快取延遲
// 2. jsdelivr CDN (備援) - 有快取但速度快
const CDN_URLS = [
  // GitHub raw (主要) - 使用 data 分支，無快取，永遠最新
  'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json',
  // jsdelivr CDN (備援) - 使用 data 分支，有 CDN 加速但可能有快取延遲
  'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json',
];

// localStorage key 分離策略：
// - 'exchangeRates': 匯率數據快取（本檔案管理，5分鐘過期）
// - 'currencyConverterMode': 用戶界面模式（RateWise.tsx）
// - 'favorites': 用戶收藏的貨幣（RateWise.tsx）
// - 'fromCurrency', 'toCurrency': 用戶選擇的貨幣（RateWise.tsx）
// clearExchangeRateCache() 只清除 'exchangeRates'，不影響用戶數據
const CACHE_KEY = 'exchangeRates';
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘

interface CachedData {
  data: ExchangeRateData;
  timestamp: number;
}

/**
 * 從快取讀取匯率資料
 */
function getFromCache(): ExchangeRateData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      logger.debug('No cache found');
      return null;
    }

    const { data, timestamp } = JSON.parse(cached) as CachedData;
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / (60 * 1000));

    // 檢查快取是否過期
    if (ageMs > CACHE_DURATION) {
      logger.debug(
        `Cache expired: ${ageMinutes} minutes old (limit: ${CACHE_DURATION / 60000} minutes)`,
      );
      // 清除過期快取
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    logger.debug(`Cache valid: ${ageMinutes} minutes old, updateTime: ${data.updateTime}`);
    return data;
  } catch (error) {
    logger.warn('Failed to read from cache', { error });
    return null;
  }
}

/**
 * 儲存匯率資料到快取
 */
function saveToCache(data: ExchangeRateData): void {
  try {
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    logger.warn('Failed to save to cache', { error });
  }
}

/**
 * 從 CDN 獲取匯率資料（帶 fallback）
 */
async function fetchFromCDN(): Promise<ExchangeRateData> {
  const errors: Error[] = [];
  const startTime = Date.now();

  for (let i = 0; i < CDN_URLS.length; i++) {
    const url = CDN_URLS[i];
    if (!url) continue;

    try {
      logger.debug(`Trying CDN #${i + 1}/${CDN_URLS.length}`, { url: url.substring(0, 80) });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ExchangeRateData;

      // 驗證資料格式
      if (!data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid data format');
      }

      const elapsed = Date.now() - startTime;
      logger.info(`Fetched rates from CDN #${i + 1}`, {
        elapsedMs: elapsed,
        updateTime: data.updateTime,
        currencyCount: Object.keys(data.rates).length,
      });

      return data;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      errors.push(error instanceof Error ? error : new Error(String(error)));
      logger.warn(`CDN #${i + 1} failed`, { elapsedMs: elapsed, error });
      continue;
    }
  }

  throw new Error(
    `Failed to fetch from all ${CDN_URLS.length} sources:\n${errors.map((e, i) => `  ${i + 1}. ${e.message}`).join('\n')}`,
  );
}

/**
 * 獲取匯率資料（帶快取和 fallback）
 */
export async function getExchangeRates(): Promise<ExchangeRateData> {
  logger.debug('Getting exchange rates');

  // 1. 嘗試從快取讀取（getFromCache 會自動檢查並清除過期快取）
  const cached = getFromCache();
  if (cached) {
    return cached;
  }

  // 2. 快取無效或過期，從 CDN 獲取新資料
  logger.debug('Fetching fresh data from CDN');
  try {
    const data = await fetchFromCDN();
    saveToCache(data);
    logger.debug('Fresh data saved to cache');
    return data;
  } catch (error) {
    logger.error('Failed to fetch exchange rates', error instanceof Error ? error : undefined);

    // 3. 如果 CDN 完全失敗，嘗試使用任何可用的快取（即使過期）
    try {
      const staleCache = localStorage.getItem(CACHE_KEY);
      if (staleCache) {
        const { data } = JSON.parse(staleCache) as CachedData;
        logger.warn('Using stale cache as fallback due to fetch error', {
          cacheTime: data.updateTime,
        });
        return data;
      }
    } catch {
      // Ignore cache read errors
    }

    throw error;
  }
}

/**
 * 清除快取（用於測試或強制重新載入）
 */
export function clearExchangeRateCache(): void {
  localStorage.removeItem(CACHE_KEY);
  logger.debug('Exchange rate cache cleared');
}

/**
 * 轉換匯率資料為應用程式使用的格式
 * 從台灣銀行的即期買入價轉換為應用需要的匯率
 */
export function transformRates(data: ExchangeRateData): Record<string, number> {
  const transformed: Record<string, number> = {};

  // 台灣銀行的匯率是 1 外幣 = X 台幣
  // 但我們的應用需要 1 台幣 = X 外幣
  Object.entries(data.rates).forEach(([code, rate]) => {
    transformed[code] = 1 / rate; // 轉換為 TWD 基準
  });

  return transformed;
}
