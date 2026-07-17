import { useEffect, useRef, useState, type RefObject } from 'react';
import clsx from 'clsx';
import { ORDERBOOK_DISPLAY_LEVELS, type MarketSymbol } from '../config/market';
import { type OrderBookLevel } from '../services/orderbook';
import { useOrderbook } from '../hooks/useOrderbook';
import { useMarketStore } from '../stores/marketStore';
import { formatAmount, formatPrice } from '../lib/format';
import { PriceFlash } from './PriceFlash';

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

// 頂檔報價快照：以 ref 供下單表單點擊時讀取，避免訂單簿 tick 重渲表單。
export interface BestQuote {
  bid: number | null;
  ask: number | null;
}

interface CompactOrderBookProps {
  symbol: MarketSymbol;
  levels?: number;
  onPriceSelect?: (price: number) => void;
  quoteRef?: RefObject<BestQuote>;
}

// 中線錨定訂單簿的高度預算：檔位列 44px 觸控、表頭與中間價列為固定開銷估值。
const BOOK_ROW_PX = 44;
const BOOK_OVERHEAD_PX = 70;
const MIN_SIDE_LEVELS = 3;

// 依可用高度裁單側檔數：最少各 3 檔（不足時由容器內部捲動吸收）。
export function fitSideLevels(height: number, maxLevels: number): number {
  const fit = Math.floor((height - BOOK_OVERHEAD_PX) / 2 / BOOK_ROW_PX);
  return Math.min(maxLevels, Math.max(MIN_SIDE_LEVELS, fit));
}

// 中間價列自行訂閱 ticker：價格 tick 不重渲整本訂單簿。
function MidPriceRow({
  symbol,
  onPriceSelect,
}: {
  symbol: MarketSymbol;
  onPriceSelect?: (price: number) => void;
}) {
  const ticker = useMarketStore((state) => state.tickers[symbol]);

  if (ticker === undefined) {
    return <span className="skeleton-pulse my-0.5 h-11 w-full rounded" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => onPriceSelect?.(ticker.lastPrice)}
      aria-label={`以最新價 ${formatPrice(ticker.lastPrice)} 帶入限價`}
      className="my-0.5 flex min-h-11 w-full items-center justify-between gap-1 border-y border-border px-1 text-left"
    >
      <PriceFlash
        direction={ticker.direction}
        revision={ticker.revision}
        className={clsx(
          'text-price-lg font-semibold',
          ticker.direction === 'down' ? 'text-short' : 'text-long',
        )}
      >
        {formatPrice(ticker.lastPrice)}
      </PriceFlash>
      <span className="shrink-0 text-caption text-text-3 tabular-nums">
        標記 {formatPrice(ticker.markPrice)}
      </span>
    </button>
  );
}

export function CompactOrderBook({
  symbol,
  levels = ORDERBOOK_DISPLAY_LEVELS,
  onPriceSelect,
  quoteRef,
}: CompactOrderBookProps) {
  const book = useOrderbook(symbol);
  const rootRef = useRef<HTMLElement>(null);
  const [sideLevels, setSideLevels] = useState(levels);

  useEffect(() => {
    if (quoteRef !== undefined) {
      quoteRef.current = { bid: book.bids[0]?.[0] ?? null, ask: book.asks[0]?.[0] ?? null };
    }
  }, [quoteRef, book]);

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return undefined;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      if (height <= 0) return;
      setSideLevels(fitSideLevels(height, levels));
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [levels]);

  const bids = book.bids.slice(0, sideLevels);
  const asks = book.asks.slice(0, sideLevels).reverse();

  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="flex h-full flex-col gap-1.5 overflow-hidden" aria-label="訂單簿載入中">
        {Array.from({ length: levels * 2 }, (_, index) => (
          <span key={index} className="skeleton-pulse h-10 w-full shrink-0 rounded" />
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
          className="relative flex min-h-11 w-full items-center justify-between px-1 text-left"
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

  // 賣單在上、買單在下錨定中間價列；多餘高度由 justify 平均分配，不壓縮 44px 列高。
  return (
    <section
      ref={rootRef}
      aria-label="訂單簿"
      className="flex h-full select-none flex-col overflow-y-auto"
    >
      <div className="flex justify-between px-1 pb-1 text-caption text-text-3">
        <span>價格</span>
        <span>數量</span>
      </div>
      <ol className="flex flex-1 flex-col justify-evenly">{renderRows(asks, 'ask')}</ol>
      <MidPriceRow symbol={symbol} onPriceSelect={onPriceSelect} />
      <ol className="flex flex-1 flex-col justify-evenly">{renderRows(bids, 'bid')}</ol>
    </section>
  );
}
