import { useEffect, useState } from 'react';
import { TRADES_DISPLAY_LIMIT, type MarketSymbol } from '../config/market';
import {
  backfillTrades,
  mergeTrades,
  parseTradeMessage,
  type PublicTrade,
} from '../services/trades';
import { fetchRecentTradesBySymbol, marketWsFor } from '../lib/marketSource';

const EMPTY_TRADES: PublicTrade[] = [];

export function useRecentTrades(symbol: MarketSymbol): PublicTrade[] {
  const [state, setState] = useState<{ symbol: MarketSymbol; trades: PublicTrade[] }>({
    symbol,
    trades: EMPTY_TRADES,
  });

  useEffect(() => {
    let cancelled = false;
    let trades = EMPTY_TRADES;
    const stop = marketWsFor(symbol).subscribe(`publicTrade.${symbol}`, (message) => {
      const incoming = parseTradeMessage(message);
      if (incoming.length === 0) return;
      trades = mergeTrades(trades, incoming, TRADES_DISPLAY_LIMIT);
      setState({ symbol, trades });
    });
    // WS 只推新成交：以 REST 回填最近成交，首開列表即完整。
    fetchRecentTradesBySymbol(symbol, TRADES_DISPLAY_LIMIT)
      .then((history) => {
        if (cancelled || history.length === 0) return;
        trades = backfillTrades(trades, history, TRADES_DISPLAY_LIMIT);
        setState({ symbol, trades });
      })
      .catch(() => {
        // 回填失敗時維持 WS 增量累積。
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [symbol]);

  return state.symbol === symbol ? state.trades : EMPTY_TRADES;
}
