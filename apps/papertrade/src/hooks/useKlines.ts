import { useEffect, useState } from 'react';
import { KLINE_HISTORY_LIMIT, type MarketSymbol, type TimeframeId } from '../config/market';
import { fetchKlines, mergeKline, parseKlineMessage, type Kline } from '../services/kline';
import { marketWs } from '../services/marketWs';

export type KlineStatus = 'loading' | 'ready' | 'error';

export interface KlineFeed {
  bars: Kline[];
  status: KlineStatus;
  seriesKey: string;
}

interface FeedState {
  key: string;
  bars: Kline[];
  status: KlineStatus;
}

const EMPTY_BARS: Kline[] = [];

export function useKlines(symbol: MarketSymbol, interval: TimeframeId): KlineFeed {
  const seriesKey = `${symbol}:${interval}`;
  const [feed, setFeed] = useState<FeedState>({
    key: seriesKey,
    bars: EMPTY_BARS,
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    let historyReady = false;
    const key = `${symbol}:${interval}`;

    fetchKlines(symbol, interval, KLINE_HISTORY_LIMIT)
      .then((history) => {
        if (cancelled) return;
        historyReady = true;
        setFeed({ key, bars: history, status: 'ready' });
      })
      .catch(() => {
        if (!cancelled) setFeed({ key, bars: EMPTY_BARS, status: 'error' });
      });

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

    return () => {
      cancelled = true;
      stop();
    };
  }, [symbol, interval]);

  if (feed.key !== seriesKey) {
    return { bars: EMPTY_BARS, status: 'loading', seriesKey };
  }
  return { bars: feed.bars, status: feed.status, seriesKey };
}
