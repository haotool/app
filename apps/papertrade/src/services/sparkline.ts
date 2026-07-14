import {
  SPARKLINE_CACHE_TTL_MS,
  SPARKLINE_INTERVAL,
  SPARKLINE_MAX_CONCURRENCY,
  SPARKLINE_POINTS,
  type MarketSymbol,
} from '../config/market';
import { fetchKlines } from './kline';

interface CacheEntry {
  at: number;
  closes: number[];
}

const cache = new Map<MarketSymbol, CacheEntry>();
const inflight = new Map<MarketSymbol, Promise<number[]>>();

let activeCount = 0;
const waiters: (() => void)[] = [];

async function withConcurrencyLimit<T>(task: () => Promise<T>): Promise<T> {
  if (activeCount >= SPARKLINE_MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  activeCount += 1;
  try {
    return await task();
  } finally {
    activeCount -= 1;
    waiters.shift()?.();
  }
}

export function fetchSparkline(symbol: MarketSymbol): Promise<number[]> {
  const cached = cache.get(symbol);
  if (cached !== undefined && Date.now() - cached.at < SPARKLINE_CACHE_TTL_MS) {
    return Promise.resolve(cached.closes);
  }

  const pending = inflight.get(symbol);
  if (pending !== undefined) {
    return pending;
  }

  const request = withConcurrencyLimit(() =>
    fetchKlines(symbol, SPARKLINE_INTERVAL, SPARKLINE_POINTS),
  )
    .then((klines) => {
      const closes = klines.map((kline) => kline.close);
      cache.set(symbol, { at: Date.now(), closes });
      return closes;
    })
    .finally(() => {
      inflight.delete(symbol);
    });

  inflight.set(symbol, request);
  return request;
}

export function clearSparklineCache(): void {
  cache.clear();
}
