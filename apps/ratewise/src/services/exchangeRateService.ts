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
  getExchangeRatesFromIDBWithStaleness,
  type ExchangeRateData,
} from '../utils/offlineStorage';
import buildTimeRates from '../config/generated/build-time-rates.json';

/**
 * 離線 fallback 預設匯率
 *
 * 當用戶首次離線訪問（無 localStorage 快取）時使用。
 * 數據來源: 台灣銀行牌告匯率（近似值）
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
// 策略：jsDelivr CDN 為主要端點，GitHub Raw 為備援。
// jsDelivr CDN edge 快取 12 小時（s-maxage=43200），但 update-latest-rates.yml 在每次
// 推送 data 分支後自動呼叫 jsDelivr Purge API，使快取立即失效 → 實際新鮮度約 5 分鐘。
// 優勢：全球 PoP 加速、無速率限制、支援 ETag 條件式請求（省頻寬）。
// GitHub Raw 作為備援：無快取但每 IP 每小時限 60 次請求，無 CORS ETag 暴露。
const CDN_URLS = [
  // jsDelivr CDN（主要）- Purge 後立即最新，支援 ETag，全球加速
  'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json',
  // GitHub Raw（備援）- 無快取，速率限制 60 req/hr/IP
  'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json',
];

// 單次 CDN fetch 逾時上限。行動網路平均 RTT 約 200-500ms，8 秒足以涵蓋 3G 網路，同時防止無限等待。
export const FETCH_TIMEOUT_MS = 8_000;

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
  etag?: string; // ETag 條件式請求（jsDelivr 支援 Access-Control-Expose-Headers: *）
}

interface FetchResult {
  data: ExchangeRateData;
  etag?: string;
}

export function getBuildTimeExchangeRates(): ExchangeRateData {
  return buildTimeRates as ExchangeRateData;
}

/**
 * 讀取完整快取條目（含 ETag）；不捕獲例外，由呼叫端決定錯誤處理方式。
 */
function getCachedEntry(): CachedData | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as CachedData; // 可能拋出 SyntaxError
}

/**
 * 從快取讀取匯率資料（檢查有效性）
 *
 * 離線快取保護策略：
 * - 不再刪除過期快取，保留給離線使用
 * - 過期只表示需要更新，不代表數據無效
 * - 只有成功獲取新數據時才覆蓋舊快取
 */
function getFromCache(): ExchangeRateData | null {
  try {
    const entry = getCachedEntry();
    if (!entry) {
      logger.debug('No cache found');
      return null;
    }

    const ageMs = Date.now() - entry.timestamp;
    const ageMinutes = Math.floor(ageMs / (60 * 1000));

    if (ageMs > CACHE_DURATION) {
      logger.debug(
        `Cache expired: ${ageMinutes} minutes old (limit: ${CACHE_DURATION / 60000} minutes)`,
      );
      return null;
    }

    logger.debug(`Cache valid: ${ageMinutes} minutes old, updateTime: ${entry.data.updateTime}`);
    return entry.data;
  } catch (error) {
    logger.warn('Failed to read from cache', { error });
    return null;
  }
}

/**
 * 儲存匯率資料到快取
 *
 * 雙重儲存策略：
 * - localStorage: 5 分鐘有效期（控制數據新鮮度）；可選保存 ETag 供下次條件式請求
 * - IndexedDB: 7 天有效期（Safari PWA 冷啟動離線備援）
 */
function saveToCache(data: ExchangeRateData, etag?: string): void {
  // 1. 儲存到 localStorage（5 分鐘有效期）
  try {
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
      ...(etag ? { etag } : {}),
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
 *
 * ETag 條件式請求策略（僅適用 CDN_URLS[0] jsDelivr）：
 * - jsDelivr 回應包含 Access-Control-Expose-Headers: *，瀏覽器可讀取 ETag。
 * - 若快取中有 ETag，發送 If-None-Match header；304 時重置快取時間戳，省去 ~5 KB 下載。
 * - GitHub Raw（index > 0）不暴露 ETag，條件式請求不適用。
 */
async function fetchFromCDN(signal?: AbortSignal): Promise<FetchResult> {
  const errors: Error[] = [];
  const startTime = Date.now();

  for (let i = 0; i < CDN_URLS.length; i++) {
    const url = CDN_URLS[i];
    if (!url) continue;

    try {
      logger.debug(`Trying CDN #${i + 1}/${CDN_URLS.length}`, { url: url.substring(0, 80) });

      // ETag 條件式請求（僅 CDN_URLS[0] jsDelivr 支援 CORS 暴露 ETag）。
      const cachedEntry = i === 0 ? getCachedEntry() : null;
      const storedETag = cachedEntry?.etag;
      const headers: Record<string, string> = {};
      if (storedETag) {
        headers['If-None-Match'] = storedETag;
      }

      // [2025-12-10] 使用 fetchWithRequestId 自動注入 X-Correlation-ID header
      const fetchInit: RequestInit = {
        ...(signal ? { signal } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };
      const response = await fetchWithRequestId(url, fetchInit);

      // 304 Not Modified：資料未變更，重置快取時間戳以延長 5 分鐘有效期。
      if (response.status === 304) {
        if (cachedEntry) {
          logger.info('ETag hit: 304 Not Modified, refreshing cache timestamp', {
            etag: storedETag,
          });
          return { data: cachedEntry.data, etag: cachedEntry.etag };
        }
        // 304 但無快取（不應發生，安全起見繼續嘗試下一個來源）
        throw new Error('304 Not Modified but no cached data available');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ExchangeRateData;

      // 驗證資料格式
      if (!data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid data format');
      }

      // 讀取 ETag（jsDelivr 透過 Access-Control-Expose-Headers: * 暴露；GitHub Raw 回傳 null）。
      const newETag = response.headers?.get('etag') ?? undefined;

      const elapsed = Date.now() - startTime;
      logger.info(`Fetched rates from CDN #${i + 1}`, {
        elapsedMs: elapsed,
        updateTime: data.updateTime,
        currencyCount: Object.keys(data.rates).length,
        hasETag: !!newETag,
      });

      return { data, etag: newETag };
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
 * 帶逾時保護的 CDN fetch。
 * 使用 AbortController 防止行動網路卡頓時無限等待。
 */
async function fetchWithTimeout(): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.warn(`CDN fetch timed out after ${FETCH_TIMEOUT_MS}ms`);
  }, FETCH_TIMEOUT_MS);

  try {
    return await fetchFromCDN(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 檢測網路狀態
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * 嘗試讀取任何可用的快取（包括過期的）
 *
 * 用於離線模式或網路請求失敗時的備援；靜默吞噬例外（損壞快取不影響備援流程）。
 */
function getAnyCachedData(): ExchangeRateData | null {
  try {
    const entry = getCachedEntry();
    if (entry) {
      const ageMinutes = Math.floor((Date.now() - entry.timestamp) / (60 * 1000));
      logger.debug(`Found cached data (${ageMinutes} minutes old)`, {
        updateTime: entry.data.updateTime,
      });
      return entry.data;
    }
  } catch {
    // 損壞快取：靜默忽略，避免阻斷備援流程
  }
  return null;
}

/**
 * 獲取匯率資料（帶快取和 fallback）
 *
 * 離線優先策略：
 * 1. 離線時直接使用快取，不嘗試網路請求（節省資源）
 * 2. 在線時優先使用有效快取，過期才請求網路
 * 3. 網路失敗時使用任何可用快取（即使過期）
 *
 * Safari PWA 冷啟動離線優化：
 * 4. 增加 IndexedDB 作為第二層備援（localStorage → IndexedDB → FALLBACK_RATES）
 * 5. IndexedDB 有效期 7 天，比 localStorage (5 分鐘) 更持久
 */
export async function getExchangeRates(): Promise<ExchangeRateData> {
  const online = isOnline();
  logger.debug('Getting exchange rates', { online });

  // Offline: use cache directly without network request; fallback to static data
  if (!online) {
    // 第一層：嘗試 localStorage
    const cachedData = getAnyCachedData();
    if (cachedData) {
      logger.info('Offline mode: using localStorage cache', {
        updateTime: cachedData.updateTime,
      });
      return cachedData;
    }

    // Second layer: try IndexedDB (critical fallback for Safari PWA cold start)
    try {
      const { data: idbData, staleness } = await getExchangeRatesFromIDBWithStaleness();
      if (idbData) {
        // 如果資料已過期（> 7 天），記錄警告但仍使用 fallback 更安全
        if (staleness.isExpired) {
          logger.warn('Offline mode: IndexedDB data expired, using fallback rates', {
            updateTime: idbData.updateTime,
            staleness: staleness.level,
            ageDays: staleness.ageDays,
            message: staleness.message,
          });
          // 超過 7 天，回落到 FALLBACK_RATES 避免誤導用戶
        } else {
          logger.info('Offline mode: using IndexedDB cache (Safari PWA fallback)', {
            updateTime: idbData.updateTime,
            staleness: staleness.level,
            shouldWarn: staleness.shouldWarn,
          });
          return idbData;
        }
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

  // 1. 嘗試從快取讀取（getFromCache 只返回 5 分鐘內的新鮮資料）
  const cached = getFromCache();
  if (cached) {
    return cached;
  }

  // 2. Stale-while-revalidate：有過期快取時立即返回，背景更新。
  // 根本解決骨架屏卡住問題：不讓 UI 等待 CDN 回應（行動網路可能很慢）。
  const staleData = getAnyCachedData();
  if (staleData) {
    logger.info('Stale-while-revalidate: serving stale cache, refreshing in background', {
      updateTime: staleData.updateTime,
    });
    void fetchWithTimeout()
      .then(({ data, etag }) => {
        saveToCache(data, etag);
        logger.debug('Background cache refresh completed', { updateTime: data.updateTime });
      })
      .catch((err: unknown) => {
        logger.warn('Background cache refresh failed', { error: err });
      });
    return staleData;
  }

  // 3. 完全無快取（首次啟動）：帶逾時保護的 CDN fetch
  logger.debug('No cache available, fetching from CDN with timeout');
  try {
    const { data, etag } = await fetchWithTimeout();
    saveToCache(data, etag);
    logger.debug('Fresh data saved to cache');
    return data;
  } catch (error) {
    logger.error('Failed to fetch exchange rates', error instanceof Error ? error : undefined);

    // 4. 嘗試 IndexedDB 作為最後防線（Safari PWA 冷啟動）
    try {
      const { data: idbData, staleness } = await getExchangeRatesFromIDBWithStaleness();
      if (idbData && !staleness.isExpired) {
        logger.warn('Using IndexedDB cache as fallback due to fetch error', {
          updateTime: idbData.updateTime,
          staleness: staleness.level,
          shouldWarn: staleness.shouldWarn,
          message: staleness.message,
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
