/**
 * 匯率資料服務
 * 從台灣銀行 API 獲取即時匯率
 */

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
// jsdelivr 快取說明：
// - 預設快取 7 天
// - 可用 ?timestamp 查詢參數破壞快取
// - 或使用 /gh/user/repo@commit-hash/ 指定特定版本
const CDN_URLS = [
  // jsdelivr CDN (主要) - 加入時間戳記破壞快取
  () => {
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // 每 5 分鐘更新一次
    return `https://cdn.jsdelivr.net/gh/haotool/app@main/public/rates/latest.json?t=${timestamp}`;
  },
  // jsdelivr CDN (無快取) - 作為第二選擇
  'https://cdn.jsdelivr.net/gh/haotool/app@main/public/rates/latest.json',
  // GitHub raw (備援) - 永遠是最新的
  'https://raw.githubusercontent.com/haotool/app/main/public/rates/latest.json',
];

const CACHE_KEY = 'exchangeRates';
const CACHE_DURATION = 30 * 60 * 1000; // 30 分鐘

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
    if (!cached) return null;

    const { data, timestamp }: CachedData = JSON.parse(cached);

    // 檢查快取是否過期
    if (Date.now() - timestamp > CACHE_DURATION) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to read from cache:', error);
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
    console.warn('Failed to save to cache:', error);
  }
}

/**
 * 從 CDN 獲取匯率資料（帶 fallback）
 */
async function fetchFromCDN(): Promise<ExchangeRateData> {
  const errors: Error[] = [];
  const startTime = Date.now();

  for (let i = 0; i < CDN_URLS.length; i++) {
    const urlOrFn = CDN_URLS[i];
    if (!urlOrFn) continue;
    const url = typeof urlOrFn === 'function' ? urlOrFn() : urlOrFn;

    try {
      console.log(`🔄 [${i + 1}/${CDN_URLS.length}] Trying: ${url.substring(0, 80)}...`);

      const response = await fetch(url, {
        cache: 'no-cache', // 確保拿到最新資料
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ExchangeRateData = await response.json();

      // 驗證資料格式
      if (!data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid data format');
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ Fetched rates from CDN #${i + 1} in ${elapsed}ms`);
      console.log(`📊 Data timestamp: ${data.updateTime}`);
      console.log(`💱 Currencies loaded: ${Object.keys(data.rates).length}`);

      return data;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      errors.push(error instanceof Error ? error : new Error(String(error)));
      console.warn(`❌ CDN #${i + 1} failed after ${elapsed}ms:`, error);
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
  // 1. 嘗試從快取讀取
  const cached = getFromCache();
  if (cached) {
    console.log('✅ Using cached exchange rates');
    return cached;
  }

  // 2. 從 CDN 獲取新資料
  try {
    const data = await fetchFromCDN();
    saveToCache(data);
    return data;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // 3. 如果完全失敗，嘗試使用過期的快取
    try {
      const staleCache = localStorage.getItem(CACHE_KEY);
      if (staleCache) {
        const { data } = JSON.parse(staleCache) as CachedData;
        console.warn('⚠️ Using stale cache due to fetch error');
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
  console.log('✅ Exchange rate cache cleared');
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
