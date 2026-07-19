import { TIMEFRAMES, type MarketSymbol, type TimeframeId } from '../config/market';
import { type Kline } from '../services/kline';

// 快取鍵數上限：寫入即刷新新鮮度的 LRU，滿載時淘汰最舊鍵。
export const KLINE_CACHE_MAX_KEYS = 32;
// 無 requestIdleCallback 環境（Safari）的 prefetch 退避延遲。
const IDLE_FALLBACK_DELAY_MS = 300;

export type KlineFetcher = (symbol: MarketSymbol, interval: TimeframeId) => Promise<Kline[]>;

const cache = new Map<string, Kline[]>();

function cacheKey(symbol: MarketSymbol, interval: TimeframeId): string {
  return `${symbol}:${interval}`;
}

// 純查找不刷新新鮮度：允許 render 期間呼叫（無副作用）。
export function getCachedKlines(symbol: MarketSymbol, interval: TimeframeId): Kline[] | undefined {
  return cache.get(cacheKey(symbol, interval));
}

export function setCachedKlines(symbol: MarketSymbol, interval: TimeframeId, bars: Kline[]): void {
  const key = cacheKey(symbol, interval);
  cache.delete(key);
  if (cache.size >= KLINE_CACHE_MAX_KEYS) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, bars);
}

export function clearKlineCache(): void {
  cache.clear();
}

type IdleHandle =
  | { kind: 'idle'; id: number }
  | { kind: 'timeout'; id: ReturnType<typeof setTimeout> };

function scheduleIdle(callback: () => void): IdleHandle {
  if (typeof requestIdleCallback === 'function') {
    return { kind: 'idle', id: requestIdleCallback(() => callback()) };
  }
  return { kind: 'timeout', id: setTimeout(callback, IDLE_FALLBACK_DELAY_MS) };
}

function cancelIdle(handle: IdleHandle): void {
  if (handle.kind === 'idle') {
    cancelIdleCallback(handle.id);
  } else {
    clearTimeout(handle.id);
  }
}

// 當前 TF 載妥後於瀏覽器閒置時逐一預抓同 symbol 其餘 TF（一次一個、失敗靜默不重試）。
// 回傳取消函式：切 symbol／卸載時停止排程，未完成佇列即棄。
export function prefetchIdleTimeframes(
  symbol: MarketSymbol,
  currentInterval: TimeframeId,
  fetcher: KlineFetcher,
): () => void {
  const queue = TIMEFRAMES.map((timeframe) => timeframe.id).filter(
    (interval) => interval !== currentInterval && getCachedKlines(symbol, interval) === undefined,
  );
  let cancelled = false;
  let handle: IdleHandle | null = null;

  function next(): void {
    if (cancelled) return;
    const interval = queue.shift();
    if (interval === undefined) return;
    handle = scheduleIdle(() => {
      if (cancelled) return;
      fetcher(symbol, interval)
        .then((bars) => {
          if (!cancelled) setCachedKlines(symbol, interval, bars);
        })
        .catch(() => {
          // 預抓失敗靜默略過不重試；使用者實際切入該 TF 時仍走正常載入。
        })
        .finally(next);
    });
  }

  next();

  return () => {
    cancelled = true;
    if (handle !== null) cancelIdle(handle);
  };
}
