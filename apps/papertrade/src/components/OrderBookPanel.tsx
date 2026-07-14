import { ORDERBOOK_DISPLAY_LEVELS, type MarketSymbol } from '../config/market';
import { type OrderBookLevel } from '../services/orderbook';
import { useOrderbook } from '../hooks/useOrderbook';
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

function OrderBookSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 p-3" aria-label="訂單簿載入中">
      {Array.from({ length: ORDERBOOK_DISPLAY_LEVELS }, (_, index) => (
        <span key={index} className="skeleton-pulse h-5 w-full rounded" />
      ))}
    </div>
  );
}

export function OrderBookPanel({ symbol }: OrderBookPanelProps) {
  const book = useOrderbook(symbol);
  const bids = book.bids.slice(0, ORDERBOOK_DISPLAY_LEVELS);
  const asks = book.asks.slice(0, ORDERBOOK_DISPLAY_LEVELS);

  if (bids.length === 0 && asks.length === 0) {
    return <OrderBookSkeleton />;
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

interface CompactOrderBookProps {
  symbol: MarketSymbol;
  levels?: number;
  onPriceSelect?: (price: number) => void;
}

export function CompactOrderBook({
  symbol,
  levels = ORDERBOOK_DISPLAY_LEVELS,
  onPriceSelect,
}: CompactOrderBookProps) {
  const book = useOrderbook(symbol);
  const bids = book.bids.slice(0, levels);
  const asks = book.asks.slice(0, levels).reverse();

  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="flex flex-col gap-1.5" aria-label="訂單簿載入中">
        {Array.from({ length: levels * 2 }, (_, index) => (
          <span key={index} className="skeleton-pulse h-5 w-full rounded" />
        ))}
      </div>
    );
  }

  const maxSize = Math.max(...bids.map(([, size]) => size), ...asks.map(([, size]) => size), 1);

  function renderRows(rows: OrderBookLevel[], side: 'bid' | 'ask') {
    const isBid = side === 'bid';
    return rows.map(([price, size]) => (
      <li key={`${side}-${price}`}>
        <button
          type="button"
          onClick={() => onPriceSelect?.(price)}
          className="relative flex h-6 w-full items-center justify-between px-1 text-left"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 right-0 rounded-sm"
            style={{
              width: `${Math.min((size / maxSize) * 100, 100)}%`,
              backgroundColor: isBid ? 'var(--color-long-bg)' : 'var(--color-short-bg)',
            }}
          />
          <span
            className={`relative z-10 text-caption font-medium tabular-nums ${isBid ? 'text-long' : 'text-short'}`}
          >
            {formatPrice(price)}
          </span>
          <span className="relative z-10 text-caption text-text-2 tabular-nums">
            {formatAmount(size)}
          </span>
        </button>
      </li>
    ));
  }

  return (
    <section aria-label="訂單簿" className="select-none">
      <div className="mb-1 flex justify-between px-1 text-caption text-text-3">
        <span>價格</span>
        <span>數量</span>
      </div>
      <ol className="flex flex-col gap-0.5">{renderRows(asks, 'ask')}</ol>
      <div className="my-1.5 border-t border-border" aria-hidden />
      <ol className="flex flex-col gap-0.5">{renderRows(bids, 'bid')}</ol>
    </section>
  );
}
