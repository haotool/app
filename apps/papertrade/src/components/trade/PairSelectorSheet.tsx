import clsx from 'clsx';
import { BottomSheet } from '../BottomSheet';
import { SYMBOLS, SYMBOL_META, type MarketSymbol } from '../../config/market';
import { useMarketStore } from '../../stores/marketStore';
import { formatPrice, formatSignedPercent } from '../../lib/format';

interface PairSelectorSheetProps {
  open: boolean;
  selected: MarketSymbol;
  onClose: () => void;
  onSelect: (symbol: MarketSymbol) => void;
}

export function PairSelectorSheet({ open, selected, onClose, onSelect }: PairSelectorSheetProps) {
  const tickers = useMarketStore((state) => state.tickers);

  return (
    <BottomSheet open={open} title="選擇交易對" onClose={onClose}>
      <ul className="flex flex-col">
        {SYMBOLS.map((symbol) => {
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
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold text-bg"
                  style={{ backgroundColor: meta.accent }}
                >
                  {meta.base.slice(0, 2)}
                </span>
                <span className="flex-1">
                  <span className="block text-body font-medium">
                    {meta.base}
                    <span className="text-text-3">/USDT</span>
                  </span>
                  <span className="block text-caption text-text-3">{meta.name} 永續</span>
                </span>
                {ticker !== undefined && (
                  <span className="text-right">
                    <span className="block text-label font-medium tabular-nums">
                      {formatPrice(ticker.lastPrice)}
                    </span>
                    <span
                      className={clsx(
                        'block text-caption tabular-nums',
                        ticker.price24hPcnt >= 0 ? 'text-long' : 'text-short',
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
    </BottomSheet>
  );
}
