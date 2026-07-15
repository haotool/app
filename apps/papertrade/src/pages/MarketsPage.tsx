import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { SYMBOLS, SYMBOL_META, type MarketSymbol } from '../config/market';
import { useMarketStore } from '../stores/marketStore';
import { fetchSparkline } from '../services/sparkline';
import { formatCompact, formatPrice, formatSignedPercent } from '../lib/format';
import { PriceFlash } from '../components/PriceFlash';
import { Sparkline } from '../components/Sparkline';

function useSparklineData(symbol: MarketSymbol): number[] {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchSparkline(symbol)
      .then((closes) => {
        if (!cancelled) setData(closes);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return data;
}

function MarketRow({ symbol }: { symbol: MarketSymbol }) {
  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const sparkline = useSparklineData(symbol);
  const meta = SYMBOL_META[symbol];

  return (
    <li>
      <Link
        to={`/chart/${symbol}`}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 transition-colors active:bg-surface-2"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-caption font-semibold text-text"
          style={{ backgroundColor: `color-mix(in srgb, ${meta.accent} 20%, transparent)` }}
        >
          {meta.base.slice(0, 3)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body font-medium">
            {meta.base}
            <span className="text-text-3">/USDT</span>
          </span>
          <span className="truncate text-caption text-text-3">
            量 {ticker ? formatCompact(ticker.turnover24h) : '--'}
          </span>
        </span>
        <Sparkline data={sparkline} />
        <span className="flex w-24 shrink-0 flex-col items-end gap-1">
          {ticker ? (
            <>
              <PriceFlash
                direction={ticker.direction}
                revision={ticker.revision}
                className="text-body font-semibold"
              >
                {formatPrice(ticker.lastPrice)}
              </PriceFlash>
              <span
                className={clsx(
                  'rounded px-1.5 py-0.5 text-caption font-medium tabular-nums',
                  ticker.price24hPcnt >= 0 ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
                )}
              >
                {formatSignedPercent(ticker.price24hPcnt)}
              </span>
            </>
          ) : (
            <>
              <span className="skeleton-pulse h-4 w-20 rounded" />
              <span className="skeleton-pulse h-4 w-14 rounded" />
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

export function MarketsPage() {
  const [query, setQuery] = useState('');

  const visibleSymbols = useMemo(() => {
    const keyword = query.trim().toUpperCase();
    if (keyword === '') return [...SYMBOLS];
    return SYMBOLS.filter((symbol) => {
      const meta = SYMBOL_META[symbol];
      return (
        symbol.includes(keyword) ||
        meta.base.includes(keyword) ||
        meta.name.toUpperCase().includes(keyword)
      );
    });
  }, [query]);

  return (
    <section>
      <header className="sticky top-0 z-10 bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <h1 className="mb-3 text-price-lg font-semibold">行情</h1>
        <label className="flex h-11 items-center gap-2 rounded-control border border-border bg-surface px-3">
          <Search size={18} className="shrink-0 text-text-3" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋交易對"
            aria-label="搜尋交易對"
            className="w-full bg-transparent text-body text-text outline-none placeholder:text-text-3"
          />
        </label>
      </header>
      {visibleSymbols.length === 0 ? (
        <p className="px-4 py-10 text-center text-label text-text-3">找不到符合的交易對</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {visibleSymbols.map((symbol) => (
            <MarketRow key={symbol} symbol={symbol} />
          ))}
        </ul>
      )}
    </section>
  );
}
