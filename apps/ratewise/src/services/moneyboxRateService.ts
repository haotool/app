/**
 * 換匯所匯率服務
 *
 * 從 CDN 取得換匯所（如明洞換匯所）匯率資料，對齊 exchangeRateService 快取策略：
 * - 5 分鐘 localStorage 快取（CACHE_DURATION_MS）
 * - jsDelivr CDN 主要 URL + ETag 條件式請求（節省頻寬）
 * - GitHub Raw 備援 URL（ETag 不可用）
 * - 離線或全部失敗時回傳後備值（isFallback: true）
 */

import { logger } from '../utils/logger';
import {
  getExchangeShopProvider,
  hasExchangeShopProvider,
  type ExchangeShopConfig,
} from '../config/exchangeShopProviders';
import type { CurrencyCode } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

const CACHE_DURATION_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
export interface ExchangeShopRate {
  /** 此匯率資料所屬的換錢所幣別；避免新增 provider 後跨幣別誤用 */
  currency: CurrencyCode;
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
  return `${STORAGE_KEYS.EXCHANGE_SHOP_RATE_PREFIX}${currency}`;
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
      // ETag only on jsDelivr (primary); GitHub Raw doesn't support conditional GET
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

    if (
      sell === null ||
      !Number.isFinite(sell) ||
      sell <= 0 ||
      buy === null ||
      !Number.isFinite(buy) ||
      buy <= 0
    ) {
      logger.warn(`Exchange shop rate parse failed for ${currency}, using fallback`);
      return buildFallbackRate(currency, config);
    }

    const rawData = raw as { updateTime?: string } | null;
    const rate: ExchangeShopRate = {
      currency,
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
    return cached?.rate ?? buildFallbackRate(currency, config);
  }
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
