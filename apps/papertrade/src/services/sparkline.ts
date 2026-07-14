import {
  SPARKLINE_CACHE_TTL_MS,
  SPARKLINE_INTERVAL,
  SPARKLINE_POINTS,
  type MarketSymbol,
} from '../config/market';
import { fetchKlines } from './kline';

interface CacheEntry {
  at: number;
  closes: number[];
}

const cache = new Map<MarketSymbol, CacheEntry>();

export async function fetchSparkline(symbol: MarketSymbol): Promise<number[]> {
  const cached = cache.get(symbol);
  if (cached !== undefined && Date.now() - cached.at < SPARKLINE_CACHE_TTL_MS) {
    return cached.closes;
  }
  const klines = await fetchKlines(symbol, SPARKLINE_INTERVAL, SPARKLINE_POINTS);
  const closes = klines.map((kline) => kline.close);
  cache.set(symbol, { at: Date.now(), closes });
  return closes;
}

export function clearSparklineCache(): void {
  cache.clear();
}
