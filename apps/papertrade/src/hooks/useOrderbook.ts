import { useEffect, useState } from 'react';
import { type MarketSymbol } from '../config/market';
import { applyOrderbookMessage, EMPTY_ORDER_BOOK, type OrderBook } from '../services/orderbook';
import { marketWs } from '../services/marketWs';

export function useOrderbook(symbol: MarketSymbol): OrderBook {
  const [state, setState] = useState<{ symbol: MarketSymbol; book: OrderBook }>({
    symbol,
    book: EMPTY_ORDER_BOOK,
  });

  useEffect(() => {
    const stop = marketWs.subscribe(`orderbook.50.${symbol}`, (message) => {
      setState((previous) => ({
        symbol,
        book: applyOrderbookMessage(
          previous.symbol === symbol ? previous.book : EMPTY_ORDER_BOOK,
          message,
        ),
      }));
    });
    return stop;
  }, [symbol]);

  return state.symbol === symbol ? state.book : EMPTY_ORDER_BOOK;
}
