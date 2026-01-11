/**
 * 匯率資料服務
 * 從台灣銀行 API 獲取即時匯率
 * [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
 * [2025-12-10] 整合 Request ID 追蹤
 * [2026-01-11] Safari PWA 離線優化：雙重儲存策略 (localStorage + IndexedDB)
 */

import { logger } from '../utils/logger';
import { fetchWithRequestId } from '../utils/requestId';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';
import {
  saveExchangeRatesToIDB,
  getExchangeRatesFromIDBAnytime,
  type ExchangeRateData,
} from '../utils/offlineStorage';

/**
 * [fix:2026-01-08] 離線 fallback 預設匯率
 * 當用戶首次離線訪問（無 localStorage 快取）時使用
 * 數據來源: 2026-01 台灣銀行牌告匯率（近似值）
 * 這確保 PWA 在任何情況下都能顯示 UI，而非 Safari 的「無法打開網頁」錯誤
 */
const FALLBACK_RATES: Record<string, number> = {
  TWD: 1,
  USD: 32.5,
  HKD: 4.18,
  GBP: 41.0,
  AUD: 20.5,
  CAD: 22.8,
  SGD: 24.0,
  CHF: 36.5,
  JPY: 0.21,
  EUR: 33.8,
  KRW: 0.023,
  CNY: 4.45,
  NZD: 18.8,
  THB: 0.95,
  PHP: 0.56,
  IDR: 0.002,
  VND: 0.0013,
  MYR: 7.3,
};

// ExchangeRateData 類型從 offlineStorage.ts 導入，確保類型一致性

// CDN URLs
// 策略：只使用 GitHub raw，避免 CDN 快取延遲
// jsdelivr CDN 快取時間可達 12-24 小時，不適合即時匯率數據
// GitHub raw 直接從 data 分支讀取，無快取，永遠最新
const CDN_URLS = [
  // GitHub raw (主要) - 使用 data 分支，無快取，永遠最新
  'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json',
  // 備援策略：如需添加，建議使用支援 cache-busting 的 CDN
  // 或考慮自建 Cloudflare Workers/Pages Functions 作為中間層
];

// localStorage key 分離策略：
// 使用 storage-keys.ts 集中管理所有 localStorage keys
// - STORAGE_KEYS.EXCHANGE_RATES: 匯率數據快取（本檔案管理，5分鐘過期）
// - STORAGE_KEYS.CURRENCY_CONVERTER_MODE: 用戶界面模式（RateWise.tsx）
// - STORAGE_KEYS.FAVORITES: 用戶收藏的貨幣（RateWise.tsx）
// - STORAGE_KEYS.FROM_CURRENCY, TO_CURRENCY: 用戶選擇的貨幣（RateWise.tsx）
// clearExchangeRateCache() 只清除快取，不影響用戶數據
const CACHE_KEY = STORAGE_KEYS.EXCHANGE_RATES;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘

interface CachedData {
  data: ExchangeRateData;
  timestamp: number;
}

/**
 * 從快取讀取匯率資料（檢查有效性）
 *
 * [fix:2025-12-28] 離線快取保護改進：
 * - 不再刪除過期快取，保留給離線使用
 * - 過期只表示需要更新，不代表數據無效
 * - 只有成功獲取新數據時才覆蓋舊快取
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
      // [fix:2025-12-28] 不刪除過期快取！保留給離線使用
      // 返回 null 表示需要嘗試獲取新數據，但舊數據仍保留在 localStorage
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
 *
 * [fix:2026-01-11] 雙重儲存策略
 * - localStorage: 5 分鐘有效期（控制數據新鮮度）
 * - IndexedDB: 7 天有效期（Safari PWA 冷啟動離線備援）
 */
function saveToCache(data: ExchangeRateData): void {
  // 1. 儲存到 localStorage（5 分鐘有效期）
  try {
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    logger.warn('Failed to save to localStorage cache', { error });
  }

  // 2. 同時儲存到 IndexedDB（7 天有效期，作為離線備援）
  // 使用 fire-and-forget 模式，不阻塞主流程
  void saveExchangeRatesToIDB(data).catch((error) => {
    logger.warn('Failed to save to IndexedDB cache', { error });
  });
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

      // [2025-12-10] 使用 fetchWithRequestId 自動注入 X-Correlation-ID header
      const response = await fetchWithRequestId(url);

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
 * [fix:2025-12-28] 檢測網路狀態
 * 參考: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * [fix:2025-12-28] 嘗試讀取任何可用的快取（包括過期的）
 * 用於離線模式或網路請求失敗時的備援
 */
function getAnyCachedData(): ExchangeRateData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached) as CachedData;
      const ageMinutes = Math.floor((Date.now() - timestamp) / (60 * 1000));
      logger.debug(`Found cached data (${ageMinutes} minutes old)`, {
        updateTime: data.updateTime,
      });
      return data;
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

/**
 * 獲取匯率資料（帶快取和 fallback）
 *
 * [fix:2025-12-28] 離線優先策略改進：
 * 1. 離線時直接使用快取，不嘗試網路請求（節省資源）
 * 2. 在線時優先使用有效快取，過期才請求網路
 * 3. 網路失敗時使用任何可用快取（即使過期）
 *
 * [fix:2026-01-11] Safari PWA 冷啟動離線優化：
 * 4. 增加 IndexedDB 作為第二層備援（localStorage → IndexedDB → FALLBACK_RATES）
 * 5. IndexedDB 有效期 7 天，比 localStorage (5 分鐘) 更持久
 */
export async function getExchangeRates(): Promise<ExchangeRateData> {
  const online = isOnline();
  logger.debug('Getting exchange rates', { online });

  // [fix:2025-12-28] 離線時直接使用快取，不嘗試網路請求
  // [fix:2026-01-08] 離線無快取時使用 fallback 數據，避免 Safari 顯示「無法打開網頁」
  // [fix:2026-01-11] 增加 IndexedDB 備援層
  if (!online) {
    // 第一層：嘗試 localStorage
    const cachedData = getAnyCachedData();
    if (cachedData) {
      logger.info('Offline mode: using localStorage cache', {
        updateTime: cachedData.updateTime,
      });
      return cachedData;
    }

    // 第二層：嘗試 IndexedDB（Safari PWA 冷啟動關鍵備援）
    try {
      const idbData = await getExchangeRatesFromIDBAnytime();
      if (idbData) {
        logger.info('Offline mode: using IndexedDB cache (Safari PWA fallback)', {
          updateTime: idbData.updateTime,
        });
        return idbData;
      }
    } catch (idbError) {
      logger.warn('Offline mode: IndexedDB read failed', { error: idbError });
    }

    // 第三層：使用硬編碼 fallback 數據
    logger.warn('Offline mode: no cache available, using fallback rates');
    return {
      timestamp: new Date().toISOString(),
      updateTime: '離線模式 - 使用預設匯率',
      source: 'fallback',
      sourceUrl: '',
      base: 'TWD',
      rates: FALLBACK_RATES,
      details: {},
    };
  }

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

    // 3. 如果 CDN 完全失敗，嘗試多層備援
    // 3a. 嘗試 localStorage（即使過期）
    const staleData = getAnyCachedData();
    if (staleData) {
      logger.warn('Using stale localStorage cache as fallback due to fetch error', {
        updateTime: staleData.updateTime,
      });
      return staleData;
    }

    // 3b. 嘗試 IndexedDB（Safari PWA 冷啟動關鍵備援）
    try {
      const idbData = await getExchangeRatesFromIDBAnytime();
      if (idbData) {
        logger.warn('Using IndexedDB cache as fallback due to fetch error', {
          updateTime: idbData.updateTime,
        });
        return idbData;
      }
    } catch (idbError) {
      logger.warn('IndexedDB fallback read failed', { error: idbError });
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
