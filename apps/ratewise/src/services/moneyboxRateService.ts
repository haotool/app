import { logger } from '../utils/logger';
import {
  getExchangeShopProvider,
  hasExchangeShopProvider,
  type ExchangeShopConfig,
} from '../config/exchangeShopProviders';
import { CDN_DATA_BASE, PROVIDER_RATES_PATH, RAW_DATA_BASE } from '../config/api-endpoints';
import { buildPublicRateProviderMetadata } from '../config/rateProviderPublicMetadata';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { CurrencyCode, RateMode } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

const CACHE_DURATION_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const HISTORY_AGGREGATE_TTL_MS = 5 * 60 * 1000;
const EXCHANGE_SHOP_PROVIDER_ID = 'moneybox';

export interface ExchangeShopRate {
  currency: CurrencyCode;
  sell: number;
  buy: number;
  updateTime: string;
  source: string;
  sourceUrl: string;
  providerName: string;
  isFallback: boolean;
}

export type ExchangeShopRatesByCurrency = Partial<Record<CurrencyCode, ExchangeShopRate>>;
export interface ExchangeShopHistoricalRate {
  date: string;
  rate: ExchangeShopRate;
}

interface ExchangeShopAggregateSnapshot {
  date: string;
  raw: unknown;
}

interface ExchangeShopAggregateData {
  providerId?: string;
  generatedAt?: string;
  snapshots: ExchangeShopAggregateSnapshot[];
}

const historyAggregateCache = new Map<
  string,
  { data: ExchangeShopHistoricalRate[]; timestamp: number }
>();

interface CacheEntry {
  rate: ExchangeShopRate;
  timestamp: number;
  etag?: string;
}

function getCacheKey(currency: CurrencyCode): string {
  return `${STORAGE_KEYS.EXCHANGE_SHOP_RATE_PREFIX}${currency}`;
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readCache(currency: CurrencyCode): CacheEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(currency));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (parsed.rate.currency && parsed.rate.currency !== currency) return null;
    return {
      ...parsed,
      rate: {
        ...parsed.rate,
        currency,
      },
    };
  } catch {
    return null;
  }
}

function writeCache(currency: CurrencyCode, entry: CacheEntry): void {
  try {
    localStorage.setItem(getCacheKey(currency), JSON.stringify(entry));
  } catch (e) {
    logger.warn('Failed to save exchange shop rate to cache', { error: e });
  }
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

function buildFallbackRate(currency: CurrencyCode, config: ExchangeShopConfig): ExchangeShopRate {
  return {
    currency,
    sell: config.fallbackSell,
    buy: config.fallbackBuy,
    updateTime: '—',
    source: config.source,
    sourceUrl: config.sourceUrl,
    providerName: config.providerName,
    isFallback: true,
  };
}

function parseExchangeShopRate(
  currency: CurrencyCode,
  config: ExchangeShopConfig,
  raw: unknown,
): ExchangeShopRate | null {
  const sell = config.getSellRate(raw);
  const buy = config.getBuyRate(raw);

  if (
    sell === null ||
    !Number.isFinite(sell) ||
    sell <= 0 ||
    buy === null ||
    !Number.isFinite(buy) ||
    buy <= 0
  ) {
    return null;
  }

  const rawData = raw as { updateTime?: string } | null;
  return {
    currency,
    sell,
    buy,
    updateTime: rawData?.updateTime ?? '—',
    source: config.source,
    sourceUrl: config.sourceUrl,
    providerName: config.providerName,
    isFallback: false,
  };
}

function getExchangeShopHistoryUrls(currency: CurrencyCode, date: string): string[] {
  const metadata = buildPublicRateProviderMetadata({
    dataBaseUrl: `${RAW_DATA_BASE}/public/rates`,
    cdnBaseUrl: `${CDN_DATA_BASE}/public/rates`,
    supportedCurrencies: Object.keys(CURRENCY_DEFINITIONS),
    historyDateToken: date,
  });
  const provider = metadata.providers.find(
    (item) => item.sourceKind === 'exchange-shop' && item.supportedCurrencies.includes(currency),
  );

  return [provider?.cdnHistoryEndpoint, provider?.historyEndpoint].filter(
    (url): url is string => !!url,
  );
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromCDN(config: ExchangeShopConfig): Promise<{ raw: unknown; etag?: string }> {
  const urls = [config.cdnUrl, config.cdnUrlFallback];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url);

      if (!res.ok) {
        logger.warn(`Exchange shop CDN returned ${res.status}`, { url });
        continue;
      }

      const raw: unknown = await res.json();
      const etag = res.headers.get('etag') ?? undefined;
      return { raw, etag };
    } catch (e) {
      logger.warn(`Exchange shop CDN fetch failed`, { url, error: e });
    }
  }

  throw new Error('All CDN URLs failed');
}

export async function fetchExchangeShopRate(
  currency: CurrencyCode,
): Promise<ExchangeShopRate | null> {
  if (!hasExchangeShopProvider(currency)) return null;

  const config = getExchangeShopProvider(currency);
  if (!config) return null;
  const cached = readCache(currency);

  if (cached && isCacheValid(cached)) {
    logger.debug(`Exchange shop cache hit for ${currency}`);
    return cached.rate;
  }

  try {
    const { raw, etag } = await fetchFromCDN(config);

    const rate = parseExchangeShopRate(currency, config, raw);

    if (!rate) {
      logger.warn(`Exchange shop rate parse failed for ${currency}, using fallback`);
      return buildFallbackRate(currency, config);
    }

    writeCache(currency, { rate, timestamp: Date.now(), etag });
    return rate;
  } catch (e) {
    logger.warn(`fetchExchangeShopRate failed for ${currency}`, { error: e });
    return cached?.rate ?? buildFallbackRate(currency, config);
  }
}

function getExchangeShopAggregateUrls(): string[] {
  const path = PROVIDER_RATES_PATH.aggregate(EXCHANGE_SHOP_PROVIDER_ID);
  return [`${CDN_DATA_BASE}${path}`, `${RAW_DATA_BASE}${path}`];
}

function getAggregateCacheKey(currency: CurrencyCode, totalDays: number): string {
  return `${EXCHANGE_SHOP_PROVIDER_ID}:${currency}:${totalDays}`;
}

async function tryFetchExchangeShopAggregate(
  currency: CurrencyCode,
  config: ExchangeShopConfig,
  totalDays: number,
): Promise<ExchangeShopHistoricalRate[] | null> {
  for (const url of getExchangeShopAggregateUrls()) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;

      const data = (await res.json()) as ExchangeShopAggregateData;
      if (!data || !Array.isArray(data.snapshots)) {
        logger.warn('Invalid exchange shop aggregate shape', { url });
        continue;
      }

      const points: ExchangeShopHistoricalRate[] = [];
      for (const snapshot of data.snapshots) {
        if (!snapshot?.date) continue;
        const rate = parseExchangeShopRate(currency, config, snapshot.raw);
        if (rate) points.push({ date: snapshot.date, rate });
      }
      if (points.length === 0) continue;

      return points.sort((a, b) => b.date.localeCompare(a.date)).slice(0, totalDays);
    } catch (e) {
      logger.debug(`Exchange shop aggregate fetch failed for ${url}`, { error: e });
    }
  }
  return null;
}

async function fetchExchangeShopHistoricalRatesFromDailyEndpoints(
  currency: CurrencyCode,
  config: ExchangeShopConfig,
  totalDays: number,
): Promise<ExchangeShopHistoricalRate[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settled = await Promise.allSettled(
    Array.from({ length: totalDays }, async (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - index);
      const dateKey = formatLocalDateKey(date);
      const urls = getExchangeShopHistoryUrls(currency, dateKey);

      for (const url of urls) {
        try {
          const res = await fetchWithTimeout(url);
          if (!res.ok) continue;

          const rate = parseExchangeShopRate(currency, config, await res.json());
          if (rate) return { date: dateKey, rate };
        } catch (e) {
          logger.debug(`Exchange shop history fetch failed for ${currency} ${dateKey}`, {
            url,
            error: e,
          });
        }
      }

      return null;
    }),
  );

  return settled
    .flatMap((item) => (item.status === 'fulfilled' && item.value ? [item.value] : []))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchExchangeShopHistoricalRatesRange(
  currency: CurrencyCode,
  maxDays = 30,
): Promise<ExchangeShopHistoricalRate[]> {
  if (!hasExchangeShopProvider(currency)) return [];

  const config = getExchangeShopProvider(currency);
  if (!config) return [];

  const totalDays = Math.max(1, Math.floor(maxDays));
  const cacheKey = getAggregateCacheKey(currency, totalDays);

  const cached = historyAggregateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < HISTORY_AGGREGATE_TTL_MS) {
    return cached.data;
  }

  const result =
    (await tryFetchExchangeShopAggregate(currency, config, totalDays)) ??
    (await fetchExchangeShopHistoricalRatesFromDailyEndpoints(currency, config, totalDays));

  if (result.length > 0) {
    historyAggregateCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

/**
 * 換錢所單位匯率 SSOT：依 rateMode 選價，禁止在呼叫端硬編碼買賣價方向。
 *
 * | mode | TWD→外幣 | 外幣→TWD | 說明 |
 * |------|---------|---------|------|
 * | auto | sell    | 1/buy   | 客戶視角（預設，維持既有行為）|
 * | sell | sell    | 1/sell  | 換錢所賣出牌價 |
 * | mid  | (buy+sell)/2 | 1/mid | 市場參考中間價 |
 */
export function computeConverterRate(
  rate: ExchangeShopRate,
  from: CurrencyCode,
  to: CurrencyCode,
  rateMode: RateMode = 'auto',
): number | null {
  const midRate = (rate.buy + rate.sell) / 2;

  if (from === 'TWD' && to === rate.currency && hasExchangeShopProvider(to)) {
    if (rateMode === 'mid') return midRate;
    return rate.sell;
  }
  if (to === 'TWD' && from === rate.currency && hasExchangeShopProvider(from)) {
    if (rateMode === 'mid') return 1 / midRate;
    if (rateMode === 'sell') return 1 / rate.sell;
    return 1 / rate.buy;
  }
  return null;
}

export function getExchangeShopRateForPair(
  from: CurrencyCode,
  to: CurrencyCode,
  ratesByCurrency: ExchangeShopRatesByCurrency,
): ExchangeShopRate | null {
  if (from === 'TWD' && hasExchangeShopProvider(to)) {
    return ratesByCurrency[to] ?? null;
  }
  if (to === 'TWD' && hasExchangeShopProvider(from)) {
    return ratesByCurrency[from] ?? null;
  }
  return null;
}
