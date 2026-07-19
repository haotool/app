import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Search, SearchX, X } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import { CoinBadge } from '../CoinBadge';
import { EmptyState } from '../EmptyState';
import { SYMBOL_META, type MarketSymbol } from '../../config/market';
import { useMarketStore } from '../../stores/marketStore';
import { formatPrice, formatSignedPercent } from '../../lib/format';
import { filterSymbolsByQuery } from '../../lib/symbolSearch';
import { PprTag } from '../../features/ppr/PprBadge';

interface PairSelectorSheetProps {
  open: boolean;
  selected: MarketSymbol;
  onClose: () => void;
  onSelect: (symbol: MarketSymbol) => void;
}

// 列級訂閱單一 symbol：任一 tick 只重渲對應列，不整表重渲（對齊 MarketRow 慣例）。
function PairRow({
  symbol,
  isSelected,
  onPick,
}: {
  symbol: MarketSymbol;
  isSelected: boolean;
  onPick: (symbol: MarketSymbol) => void;
}) {
  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const meta = SYMBOL_META[symbol];

  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(symbol)}
        className={clsx(
          'flex min-h-13 w-full items-center gap-3 rounded-control px-2 py-2 text-left',
          isSelected ? 'bg-primary/10' : 'active:bg-surface-2',
        )}
      >
        <CoinBadge symbol={symbol} />
        <span className="flex flex-1 items-center gap-1.5 text-body font-medium">
          <span>
            {meta.base}
            <span className="text-text-3">/USDT</span>
          </span>
          <PprTag symbol={symbol} />
        </span>
        {ticker !== undefined && (
          <span className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-label font-medium tabular-nums">
              {formatPrice(ticker.lastPrice, symbol)}
            </span>
            <span
              className={clsx(
                'rounded px-1.5 py-0.5 text-caption font-medium tabular-nums',
                ticker.price24hPcnt >= 0 ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
              )}
            >
              {formatSignedPercent(ticker.price24hPcnt * 100)}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}

export function PairSelectorSheet({ open, selected, onClose, onSelect }: PairSelectorSheetProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleSymbols = filterSymbolsByQuery(query);

  const handlePick = (symbol: MarketSymbol) => {
    onSelect(symbol);
    onClose();
  };

  const handleClearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <BottomSheet open={open} title="選擇交易對" onClose={onClose}>
      <label className="mb-2 flex h-11 items-center gap-2 rounded-control border border-border bg-surface-2 pl-3">
        <Search size={16} className="shrink-0 text-text-3" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋交易對"
          aria-label="搜尋交易對"
          className="min-h-11 w-full bg-transparent text-body text-text outline-none placeholder:text-text-3"
        />
        {query !== '' ? (
          <button
            type="button"
            onClick={handleClearQuery}
            aria-label="清除搜尋"
            className="flex size-11 shrink-0 items-center justify-center text-text-3 active:text-text"
          >
            <X size={16} aria-hidden />
          </button>
        ) : (
          <span className="w-3 shrink-0" aria-hidden />
        )}
      </label>
      {visibleSymbols.length === 0 ? (
        <EmptyState
          size="sm"
          icon={SearchX}
          title="找不到符合的交易對"
          description="請改用其他關鍵字或幣種代號。"
        />
      ) : (
        <ul className="flex flex-col">
          {visibleSymbols.map((symbol) => (
            <PairRow
              key={symbol}
              symbol={symbol}
              isSelected={symbol === selected}
              onPick={handlePick}
            />
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
