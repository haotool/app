import { useCallback, useEffect, useState } from 'react';
import { KLINE_HISTORY_LIMIT, type MarketSymbol, type TimeframeId } from '../config/market';
import { mergeKline, mergeKlineHistory, parseKlineMessage, type Kline } from '../services/kline';
import { fetchKlinesBySymbol, marketWsFor } from '../lib/marketSource';
import { getCachedKlines, prefetchIdleTimeframes, setCachedKlines } from '../lib/klineCache';

export type KlineStatus = 'loading' | 'ready' | 'error';

export interface KlineFeed {
  bars: Kline[];
  status: KlineStatus;
  seriesKey: string;
  retry: () => void;
}

interface FeedState {
  key: string;
  bars: Kline[];
  status: KlineStatus;
}

const EMPTY_BARS: Kline[] = [];

export function useKlines(symbol: MarketSymbol, interval: TimeframeId): KlineFeed {
  const seriesKey = `${symbol}:${interval}`;
  const [epoch, setEpoch] = useState(0);
  // epoch 併入 feed key：retry 時 render 層即回 loading，不需在 effect 內同步 setState。
  const feedKey = `${seriesKey}:${epoch}`;
  // 首掛載即查快取：命中則首幀 ready（零 skeleton），SWR revalidate 交由 effect。
  const [feed, setFeed] = useState<FeedState>(() => {
    const cached = getCachedKlines(symbol, interval);
    return cached !== undefined
      ? { key: feedKey, bars: cached, status: 'ready' }
      : { key: feedKey, bars: EMPTY_BARS, status: 'loading' };
  });

  const retry = useCallback(() => setEpoch((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    const key = `${symbol}:${interval}:${epoch}`;
    const ws = marketWsFor(symbol);
    // SWR：命中快取即以快取序列起步（render 層已同步顯示），背景 revalidate 靜默更新。
    const cached = getCachedKlines(symbol, interval);
    let bars = cached ?? EMPTY_BARS;
    let historyReady = cached !== undefined;
    let cancelPrefetch: (() => void) | null = null;

    function startPrefetch() {
      if (cancelled || cancelPrefetch !== null) return;
      cancelPrefetch = prefetchIdleTimeframes(symbol, interval, (prefetchSymbol, prefetchTf) =>
        fetchKlinesBySymbol(prefetchSymbol, prefetchTf, KLINE_HISTORY_LIMIT),
      );
    }

    function loadHistory(mode: 'initial' | 'refresh') {
      fetchKlinesBySymbol(symbol, interval, KLINE_HISTORY_LIMIT)
        .then((history) => {
          if (cancelled) return;
          // refresh（快取起步或重連回補）：覆蓋重疊區間並保留兩端既有 bar，序列無空洞。
          bars = mode === 'refresh' && historyReady ? mergeKlineHistory(bars, history) : history;
          historyReady = true;
          setCachedKlines(symbol, interval, bars);
          setFeed({ key, bars, status: 'ready' });
          startPrefetch();
        })
        .catch(() => {
          // refresh 失敗保留既有序列，等待下一次重連或使用者重試。
          if (!cancelled && mode === 'initial') {
            setFeed({ key, bars: EMPTY_BARS, status: 'error' });
          }
        });
    }

    loadHistory(historyReady ? 'refresh' : 'initial');

    const stop = ws.subscribe(`kline.${interval}.${symbol}`, (message) => {
      if (cancelled || !historyReady) return;
      const incoming = parseKlineMessage(message);
      if (incoming.length === 0) return;
      bars = incoming.reduce(mergeKline, bars);
      // 即時更新回寫快取：確保下次切回本 TF 的快取不陳舊。
      setCachedKlines(symbol, interval, bars);
      setFeed({ key, bars, status: 'ready' });
    });

    // WS 斷線期間的 K 線不會重送：偵測 reconnecting→connected 後重抓 REST 回補缺口。
    let wasReconnecting = ws.getStatus() === 'reconnecting';
    const stopStatus = ws.onStatus((status) => {
      if (status === 'reconnecting') {
        wasReconnecting = true;
        return;
      }
      if (status === 'connected' && wasReconnecting) {
        wasReconnecting = false;
        if (!cancelled && historyReady) loadHistory('refresh');
      }
    });

    return () => {
      cancelled = true;
      cancelPrefetch?.();
      stop();
      stopStatus();
    };
  }, [symbol, interval, epoch]);

  if (feed.key !== feedKey) {
    // 尚未套用本 key 的 effect 結果：命中快取即同步渲染（零 skeleton），否則回 loading。
    const cached = getCachedKlines(symbol, interval);
    return cached !== undefined
      ? { bars: cached, status: 'ready', seriesKey, retry }
      : { bars: EMPTY_BARS, status: 'loading', seriesKey, retry };
  }
  return { bars: feed.bars, status: feed.status, seriesKey, retry };
}
