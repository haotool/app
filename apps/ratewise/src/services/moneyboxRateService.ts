import { logger } from '../utils/logger';
import {
  getExchangeShopProvider,
  hasExchangeShopProvider,
  type ExchangeShopConfig,
} from '../config/exchangeShopProviders';
import { CDN_DATA_BASE, RAW_DATA_BASE } from '../config/api-endpoints';
import { buildPublicRateProviderMetadata } from '../config/rateProviderPublicMetadata';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { CurrencyCode } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

const CACHE_DURATION_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
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

async function fetchFromCDN(
  config: ExchangeShopConfig,
  cachedEtag?: string,
): Promise<{ raw: unknown; etag?: string; notModified: boolean }> {
  const urls = [config.cdnUrl, config.cdnUrlFallback];

  for (const url of urls) {
    try {
      const headers: Record<string, string> = {};
      if (url === config.cdnUrl && cachedEtag) {
        headers['If-None-Match'] = cachedEtag;
      }

      const res = await fetchWithTimeout(url, { headers });

      if (res.status === 304) {
        return { raw: null, notModified: true };
      }

      if (!res.ok) {
        logger.warn(`Exchange shop CDN returned ${res.status}`, { url });
        continue;
      }

      const raw: unknown = await res.json();
      const etag = res.headers.get('etag') ?? undefined;
      return { raw, etag, notModified: false };
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
    const { raw, etag, notModified } = await fetchFromCDN(config, cached?.etag);

    if (notModified && cached) {
      writeCache(currency, { ...cached, timestamp: Date.now() });
      return cached.rate;
    }

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

export async function fetchExchangeShopHistoricalRatesRange(
  currency: CurrencyCode,
  maxDays = 30,
): Promise<ExchangeShopHistoricalRate[]> {
  if (!hasExchangeShopProvider(currency)) return [];

  const config = getExchangeShopProvider(currency);
  if (!config) return [];

  const totalDays = Math.max(1, Math.floor(maxDays));
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

export function computeConverterRate(
  rate: ExchangeShopRate,
  from: CurrencyCode,
  to: CurrencyCode,
): number | null {
  if (from === 'TWD' && to === rate.currency && hasExchangeShopProvider(to)) {
    return rate.sell;
  }
  if (to === 'TWD' && from === rate.currency && hasExchangeShopProvider(from)) {
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
