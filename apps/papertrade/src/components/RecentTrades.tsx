import { TRADES_DISPLAY_LIMIT, type MarketSymbol } from '../config/market';
import { useRecentTrades } from '../hooks/useRecentTrades';
import { formatAmount, formatClockTime, formatPrice } from '../lib/format';

interface RecentTradesProps {
  symbol: MarketSymbol;
}

export function RecentTrades({ symbol }: RecentTradesProps) {
  const trades = useRecentTrades(symbol);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 p-3" aria-label="最新成交載入中">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className="skeleton-pulse h-5 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <section aria-label="最新成交" className="p-3">
      <div className="mb-1.5 flex justify-between px-1 text-caption text-text-3">
        <span>價格</span>
        <span>數量</span>
        <span>時間</span>
      </div>
      <ol className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {trades.slice(0, TRADES_DISPLAY_LIMIT).map((trade) => (
          <li key={trade.id} className="flex h-6 items-center justify-between px-1">
            <span
              className={`text-caption font-medium tabular-nums ${
                trade.side === 'buy' ? 'text-long' : 'text-short'
              }`}
            >
              {formatPrice(trade.price)}
            </span>
            <span className="text-caption text-text-2 tabular-nums">
              {formatAmount(trade.size)}
            </span>
            <span className="text-caption text-text-3 tabular-nums">
              {formatClockTime(trade.time)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
