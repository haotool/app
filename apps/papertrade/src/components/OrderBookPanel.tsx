import { useEffect, useState } from 'react';
import { ORDERBOOK_DISPLAY_LEVELS, type MarketSymbol } from '../config/market';
import {
  applyOrderbookMessage,
  EMPTY_ORDER_BOOK,
  type OrderBook,
  type OrderBookLevel,
} from '../services/orderbook';
import { marketWs } from '../services/marketWs';
import { formatAmount, formatPrice } from '../lib/format';

interface OrderBookPanelProps {
  symbol: MarketSymbol;
}

interface SideColumnProps {
  levels: OrderBookLevel[];
  side: 'bid' | 'ask';
}

function SideColumn({ levels, side }: SideColumnProps) {
  const maxSize = Math.max(...levels.map(([, size]) => size), 1);
  const isBid = side === 'bid';

  return (
    <ol className="flex flex-1 flex-col gap-1">
      {levels.map(([price, size]) => (
        <li key={price} className="relative flex h-6 items-center justify-between px-1">
          <span
            aria-hidden
            className="absolute inset-y-0 rounded-sm"
            style={{
              [isBid ? 'right' : 'left']: 0,
              width: `${Math.min((size / maxSize) * 100, 100)}%`,
              backgroundColor: isBid ? 'var(--color-long-bg)' : 'var(--color-short-bg)',
            }}
          />
          {isBid ? (
            <>
              <span className="relative z-10 text-caption text-text-2 tabular-nums">
                {formatAmount(size)}
              </span>
              <span className="relative z-10 text-caption font-medium text-long tabular-nums">
                {formatPrice(price)}
              </span>
            </>
          ) : (
            <>
              <span className="relative z-10 text-caption font-medium text-short tabular-nums">
                {formatPrice(price)}
              </span>
              <span className="relative z-10 text-caption text-text-2 tabular-nums">
                {formatAmount(size)}
              </span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

export function OrderBookPanel({ symbol }: OrderBookPanelProps) {
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

  const book = state.symbol === symbol ? state.book : EMPTY_ORDER_BOOK;
  const bids = book.bids.slice(0, ORDERBOOK_DISPLAY_LEVELS);
  const asks = book.asks.slice(0, ORDERBOOK_DISPLAY_LEVELS);

  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 p-3" aria-label="訂單簿載入中">
        {Array.from({ length: ORDERBOOK_DISPLAY_LEVELS }, (_, index) => (
          <span key={index} className="skeleton-pulse h-5 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <section aria-label="訂單簿" className="p-3">
      <div className="mb-1.5 flex justify-between px-1 text-caption text-text-3">
        <span>買量｜買價</span>
        <span>賣價｜賣量</span>
      </div>
      <div className="flex gap-2">
        <SideColumn levels={bids} side="bid" />
        <SideColumn levels={asks} side="ask" />
      </div>
    </section>
  );
}
