import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX, Star, X } from 'lucide-react';
import clsx from 'clsx';
import { SYMBOL_META, type MarketSymbol } from '../config/market';
import { useMarketStore } from '../stores/marketStore';
import { useMarketPrefsStore } from '../stores/marketPrefsStore';
import { fetchSparklineBySymbol } from '../lib/marketSource';
import { formatCompact, formatPrice, formatSignedPercent } from '../lib/format';
import { filterSymbolsByQuery } from '../lib/symbolSearch';
import { CoinBadge } from '../components/CoinBadge';
import { EmptyState } from '../components/EmptyState';
import { PriceFlash } from '../components/PriceFlash';
import { Sparkline } from '../components/Sparkline';
import { PprTag } from '../features/ppr/PprBadge';

type MarketListTab = 'all' | 'favorites';

const LIST_TABS: { id: MarketListTab; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorites', label: '自選' },
];

function useSparklineData(symbol: MarketSymbol): number[] {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchSparklineBySymbol(symbol)
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

function FavoriteToggle({ symbol }: { symbol: MarketSymbol }) {
  const isFavorite = useMarketPrefsStore((state) => state.favorites.includes(symbol));
  const toggleFavorite = useMarketPrefsStore((state) => state.toggleFavorite);
  const pair = `${SYMBOL_META[symbol].base}/USDT`;

  return (
    <button
      type="button"
      aria-label={isFavorite ? `移除自選 ${pair}` : `加入自選 ${pair}`}
      aria-pressed={isFavorite}
      onClick={() => toggleFavorite(symbol)}
      className="flex size-11 shrink-0 items-center justify-center rounded-control active:bg-surface-2"
    >
      <Star
        size={18}
        aria-hidden
        className={isFavorite ? 'fill-warning text-warning' : 'text-text-3'}
      />
    </button>
  );
}

function MarketRow({ symbol }: { symbol: MarketSymbol }) {
  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const sparkline = useSparklineData(symbol);
  const meta = SYMBOL_META[symbol];

  return (
    <li className="flex items-center pr-2">
      <Link
        to={`/chart/${symbol}`}
        className="flex min-h-16 w-full min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-1 transition-colors active:bg-surface-2"
      >
        <CoinBadge symbol={symbol} size="md" variant="soft" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-body font-medium">
            <span>
              {meta.base}
              <span className="text-text-3">/USDT</span>
            </span>
            <PprTag symbol={symbol} />
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
                {formatSignedPercent(ticker.price24hPcnt * 100)}
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
      <FavoriteToggle symbol={symbol} />
    </li>
  );
}

export function MarketsPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<MarketListTab>('all');
  const favorites = useMarketPrefsStore((state) => state.favorites);

  const visibleSymbols = useMemo(
    () => filterSymbolsByQuery(query, tab === 'favorites' ? favorites : undefined),
    [query, tab, favorites],
  );

  const showFavoritesEmpty = tab === 'favorites' && favorites.length === 0 && query.trim() === '';

  return (
    <section className="lg:mx-auto lg:max-w-2xl">
      {/* R6-1 safe-area：sticky 底條流內佔位推開標題，捲動時常駐覆蓋狀態列區；
          標題在工具列上方（h1 自然捲走），故工具列 sticky 錨點取 top-[var(--sat)] 銜接底條。 */}
      <div aria-hidden className="sticky top-0 z-20 h-[var(--sat)] bg-bg/95 backdrop-blur" />
      <h1 className="px-4 pt-4 text-price-lg font-semibold">行情</h1>
      {/* sticky 搜尋與清單切換：標題自然捲走，工具列捲動常駐（與交易頁同樣式族）。 */}
      <header className="sticky top-[var(--sat)] z-20 border-b border-border bg-bg/95 px-4 pb-3 pt-3 backdrop-blur">
        <label className="flex h-11 items-center gap-2 rounded-control border border-border bg-surface pl-3">
          <Search size={18} className="shrink-0 text-text-3" aria-hidden />
          <input
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
              onClick={() => setQuery('')}
              aria-label="清除搜尋"
              className="flex size-11 shrink-0 items-center justify-center text-text-3 active:text-text"
            >
              <X size={16} aria-hidden />
            </button>
          ) : (
            <span className="w-3 shrink-0" aria-hidden />
          )}
        </label>
        <div
          role="tablist"
          aria-label="行情清單"
          className="mt-3 flex rounded-control bg-surface-2 p-0.5"
        >
          {LIST_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={clsx(
                'min-h-11 min-w-11 flex-1 rounded-[10px] text-label transition-colors',
                tab === id ? 'bg-surface font-semibold text-text' : 'text-text-3',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      {showFavoritesEmpty ? (
        <EmptyState icon={Star} title="輕點星號加入自選" className="mx-4 mt-4" />
      ) : visibleSymbols.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="找不到符合的交易對"
          description="請改用其他關鍵字或幣種代號。"
          className="mx-4 mt-4"
          action={
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-1 min-h-11 min-w-11 rounded-control bg-surface-2 px-4 text-label font-medium text-text-2 active:bg-border"
            >
              清除搜尋
            </button>
          }
        />
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
