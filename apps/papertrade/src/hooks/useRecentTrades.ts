import { useEffect, useState } from 'react';
import { TRADES_DISPLAY_LIMIT, type MarketSymbol } from '../config/market';
import { mergeTrades, parseTradeMessage, type PublicTrade } from '../services/trades';
import { marketWs } from '../services/marketWs';

const EMPTY_TRADES: PublicTrade[] = [];

export function useRecentTrades(symbol: MarketSymbol): PublicTrade[] {
  const [state, setState] = useState<{ symbol: MarketSymbol; trades: PublicTrade[] }>({
    symbol,
    trades: EMPTY_TRADES,
  });

  useEffect(() => {
    let trades = EMPTY_TRADES;
    const stop = marketWs.subscribe(`publicTrade.${symbol}`, (message) => {
      const incoming = parseTradeMessage(message);
      if (incoming.length === 0) return;
      trades = mergeTrades(trades, incoming, TRADES_DISPLAY_LIMIT);
      setState({ symbol, trades });
    });
    return stop;
  }, [symbol]);

  return state.symbol === symbol ? state.trades : EMPTY_TRADES;
}
