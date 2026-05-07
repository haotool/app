/**
 * 換匯所匯率服務
 * 從 CDN 取得換匯所（如明洞換匯所）匯率，對齊台銀快取策略
 * [2026-05-07] 初始建立：CDN + ETag + localStorage 5 分鐘快取 + 離線後備值
 */

import { logger } from '../utils/logger';
import {
  getExchangeShopProvider,
  hasExchangeShopProvider,
  type ExchangeShopConfig,
} from '../config/exchangeShopProviders';
import type { CurrencyCode } from '../features/ratewise/types';

const CACHE_DURATION_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_KEY_PREFIX = 'exchangeShopRate_';

export interface ExchangeShopRate {
  /** 客戶買入外幣匯率：1 TWD = sell 外幣 */
  sell: number;
  /** 客戶賣出外幣匯率：buy 外幣 = 1 TWD */
  buy: number;
  updateTime: string;
  source: string;
  sourceUrl: string;
  providerName: string;
  isFallback: boolean;
}

interface CacheEntry {
  rate: ExchangeShopRate;
  timestamp: number;
  etag?: string;
}

function getCacheKey(currency: CurrencyCode): string {
  return `${CACHE_KEY_PREFIX}${currency}`;
}

function readCache(currency: CurrencyCode): CacheEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(currency));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
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

function buildFallbackRate(config: ExchangeShopConfig): ExchangeShopRate {
  return {
    sell: config.fallbackSell,
    buy: config.fallbackBuy,
    updateTime: '—',
    source: config.source,
    sourceUrl: config.sourceUrl,
    providerName: config.providerName,
    isFallback: true,
  };
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

    const sell = config.getSellRate(raw);
    const buy = config.getBuyRate(raw);

    if (!sell || !buy) {
      logger.warn(`Exchange shop rate parse failed for ${currency}, using fallback`);
      return buildFallbackRate(config);
    }

    const rawData = raw as { updateTime?: string } | null;
    const rate: ExchangeShopRate = {
      sell,
      buy,
      updateTime: rawData?.updateTime ?? '—',
      source: config.source,
      sourceUrl: config.sourceUrl,
      providerName: config.providerName,
      isFallback: false,
    };

    writeCache(currency, { rate, timestamp: Date.now(), etag });
    return rate;
  } catch (e) {
    logger.warn(`fetchExchangeShopRate failed for ${currency}`, { error: e });
    return cached?.rate ?? buildFallbackRate(config);
  }
}

export function computeConverterRate(
  rate: ExchangeShopRate,
  from: CurrencyCode,
  to: CurrencyCode,
): number | null {
  if (from === 'TWD' && hasExchangeShopProvider(to)) {
    return rate.sell;
  }
  if (to === 'TWD' && hasExchangeShopProvider(from)) {
    return 1 / rate.buy;
  }
  return null;
}
