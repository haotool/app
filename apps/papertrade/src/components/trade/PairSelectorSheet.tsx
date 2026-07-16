import { useState } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import { CoinBadge } from '../CoinBadge';
import { SYMBOL_META, type MarketSymbol } from '../../config/market';
import { useMarketStore } from '../../stores/marketStore';
import { formatPrice, formatSignedPercent } from '../../lib/format';
import { filterSymbolsByQuery } from '../../lib/symbolSearch';

interface PairSelectorSheetProps {
  open: boolean;
  selected: MarketSymbol;
  onClose: () => void;
  onSelect: (symbol: MarketSymbol) => void;
}

export function PairSelectorSheet({ open, selected, onClose, onSelect }: PairSelectorSheetProps) {
  const tickers = useMarketStore((state) => state.tickers);
  const [query, setQuery] = useState('');
  const visibleSymbols = filterSymbolsByQuery(query);

  return (
    <BottomSheet open={open} title="選擇交易對" onClose={onClose}>
      <label className="mb-2 flex h-11 items-center gap-2 rounded-control border border-border bg-surface-2 px-3">
        <Search size={16} className="shrink-0 text-text-3" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋交易對"
          aria-label="搜尋交易對"
          className="min-h-11 w-full bg-transparent text-body text-text outline-none placeholder:text-text-3"
        />
      </label>
      {visibleSymbols.length === 0 ? (
        <p className="py-8 text-center text-label text-text-3">找不到符合的交易對</p>
      ) : (
        <ul className="flex flex-col">
          {visibleSymbols.map((symbol) => {
            const meta = SYMBOL_META[symbol];
            const ticker = tickers[symbol];
            const isSelected = symbol === selected;
            return (
              <li key={symbol}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(symbol);
                    onClose();
                  }}
                  className={clsx(
                    'flex min-h-13 w-full items-center gap-3 rounded-control px-2 py-2 text-left',
                    isSelected ? 'bg-primary/10' : 'active:bg-surface-2',
                  )}
                >
                  <CoinBadge symbol={symbol} />
                  <span className="flex-1 text-body font-medium">
                    {meta.base}
                    <span className="text-text-3">/USDT</span>
                  </span>
                  {ticker !== undefined && (
                    <span className="flex flex-col items-end gap-0.5 text-right">
                      <span className="text-label font-medium tabular-nums">
                        {formatPrice(ticker.lastPrice)}
                      </span>
                      <span
                        className={clsx(
                          'rounded px-1.5 py-0.5 text-caption font-medium tabular-nums',
                          ticker.price24hPcnt >= 0
                            ? 'bg-long-bg text-long'
                            : 'bg-short-bg text-short',
                        )}
                      >
                        {formatSignedPercent(ticker.price24hPcnt)}
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
