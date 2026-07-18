import { useEffect, useState } from 'react';
import { type MarketSymbol } from '../config/market';
import { applyOrderbookMessage, EMPTY_ORDER_BOOK, type OrderBook } from '../services/orderbook';
import { marketWsFor } from '../lib/marketSource';

export function useOrderbook(symbol: MarketSymbol): OrderBook {
  const [epoch, setEpoch] = useState(0);
  const [state, setState] = useState<{ key: string; book: OrderBook }>({
    key: `${symbol}:${epoch}`,
    book: EMPTY_ORDER_BOOK,
  });

  useEffect(() => {
    const key = `${symbol}:${epoch}`;
    let book = EMPTY_ORDER_BOOK;
    const stop = marketWsFor(symbol).subscribe(`orderbook.50.${symbol}`, (message) => {
      const update = applyOrderbookMessage(book, message);
      book = update.book;
      setState({ key, book });
      if (update.resync) {
        // 序號缺口：清簿後換 epoch 重訂閱，強制 Bybit 重送 snapshot。
        setEpoch((value) => value + 1);
      }
    });
    return stop;
  }, [symbol, epoch]);

  return state.key === `${symbol}:${epoch}` ? state.book : EMPTY_ORDER_BOOK;
}
