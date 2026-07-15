import { useCallback, useEffect, useState } from 'react';
import { KLINE_HISTORY_LIMIT, type MarketSymbol, type TimeframeId } from '../config/market';
import {
  fetchKlines,
  mergeKline,
  mergeKlineHistory,
  parseKlineMessage,
  type Kline,
} from '../services/kline';
import { marketWs } from '../services/marketWs';

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
  const [feed, setFeed] = useState<FeedState>({
    key: feedKey,
    bars: EMPTY_BARS,
    status: 'loading',
  });

  const retry = useCallback(() => setEpoch((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    let historyReady = false;
    const key = `${symbol}:${interval}:${epoch}`;

    function loadHistory(mode: 'initial' | 'refill') {
      fetchKlines(symbol, interval, KLINE_HISTORY_LIMIT)
        .then((history) => {
          if (cancelled) return;
          historyReady = true;
          setFeed((previous) =>
            mode === 'refill' && previous.key === key && previous.status === 'ready'
              ? { key, bars: mergeKlineHistory(previous.bars, history), status: 'ready' }
              : { key, bars: history, status: 'ready' },
          );
        })
        .catch(() => {
          // refill 失敗保留既有序列，等待下一次重連或使用者重試。
          if (!cancelled && mode === 'initial') {
            setFeed({ key, bars: EMPTY_BARS, status: 'error' });
          }
        });
    }

    loadHistory('initial');

    const stop = marketWs.subscribe(`kline.${interval}.${symbol}`, (message) => {
      if (cancelled || !historyReady) return;
      const incoming = parseKlineMessage(message);
      if (incoming.length === 0) return;
      setFeed((previous) =>
        previous.key === key
          ? { ...previous, bars: incoming.reduce(mergeKline, previous.bars) }
          : previous,
      );
    });

    // WS 斷線期間的 K 線不會重送：偵測 reconnecting→connected 後重抓 REST 回補缺口。
    let wasReconnecting = marketWs.getStatus() === 'reconnecting';
    const stopStatus = marketWs.onStatus((status) => {
      if (status === 'reconnecting') {
        wasReconnecting = true;
        return;
      }
      if (status === 'connected' && wasReconnecting) {
        wasReconnecting = false;
        if (!cancelled && historyReady) loadHistory('refill');
      }
    });

    return () => {
      cancelled = true;
      stop();
      stopStatus();
    };
  }, [symbol, interval, epoch]);

  if (feed.key !== feedKey) {
    return { bars: EMPTY_BARS, status: 'loading', seriesKey, retry };
  }
  return { bars: feed.bars, status: feed.status, seriesKey, retry };
}
