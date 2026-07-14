import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  DEFAULT_TIMEFRAME,
  isMarketSymbol,
  SYMBOL_META,
  TIMEFRAMES,
  type MarketSymbol,
  type TimeframeId,
} from '../config/market';
import { useKlines } from '../hooks/useKlines';
import { useMarketStore } from '../stores/marketStore';
import { formatCompact, formatPrice, formatSignedPercent } from '../lib/format';
import { CandleChart } from '../components/CandleChart';
import { OrderBookPanel } from '../components/OrderBookPanel';
import { PriceFlash } from '../components/PriceFlash';

function SymbolHeader({ symbol }: { symbol: MarketSymbol }) {
  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const meta = SYMBOL_META[symbol];

  return (
    <header className="px-4 pb-3 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-body font-semibold">
            {meta.base}
            <span className="text-text-3">/USDT 永續</span>
          </h1>
          {ticker ? (
            <PriceFlash
              direction={ticker.direction}
              revision={ticker.revision}
              className="text-price-xl font-semibold"
            >
              {formatPrice(ticker.lastPrice)}
            </PriceFlash>
          ) : (
            <span className="skeleton-pulse mt-1 inline-block h-8 w-36 rounded" />
          )}
        </div>
        {ticker && (
          <span
            className={clsx(
              'mt-1 rounded px-2 py-1 text-label font-medium tabular-nums',
              ticker.price24hPcnt >= 0 ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
            )}
          >
            {formatSignedPercent(ticker.price24hPcnt)}
          </span>
        )}
      </div>
      <dl className="mt-2 flex gap-4 text-caption text-text-3">
        <div className="flex gap-1">
          <dt>24h高</dt>
          <dd className="text-text-2 tabular-nums">
            {ticker ? formatPrice(ticker.highPrice24h) : '--'}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>24h低</dt>
          <dd className="text-text-2 tabular-nums">
            {ticker ? formatPrice(ticker.lowPrice24h) : '--'}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>24h額</dt>
          <dd className="text-text-2 tabular-nums">
            {ticker ? formatCompact(ticker.turnover24h) : '--'}
          </dd>
        </div>
      </dl>
    </header>
  );
}

function ChartView({ symbol }: { symbol: MarketSymbol }) {
  const [timeframe, setTimeframe] = useState<TimeframeId>(DEFAULT_TIMEFRAME);
  const { bars, status, seriesKey } = useKlines(symbol, timeframe);

  return (
    <section className="flex flex-col">
      <SymbolHeader symbol={symbol} />

      <div role="tablist" aria-label="時間框架" className="flex gap-1.5 overflow-x-auto px-4 pb-3">
        {TIMEFRAMES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={timeframe === id}
            onClick={() => setTimeframe(id)}
            className={clsx(
              'min-h-9 shrink-0 rounded-control px-3 text-label transition-colors',
              timeframe === id
                ? 'bg-primary/15 font-semibold text-primary'
                : 'text-text-3 active:bg-surface-2',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative mx-2 h-[45dvh]">
        {status === 'error' ? (
          <div className="flex h-full items-center justify-center text-label text-text-3">
            歷史 K 線載入失敗，請稍後再試
          </div>
        ) : (
          <>
            <CandleChart bars={bars} seriesKey={seriesKey} />
            {status === 'loading' && (
              <div
                className="absolute inset-0 skeleton-pulse rounded-card"
                aria-label="圖表載入中"
              />
            )}
          </>
        )}
      </div>

      <h2 className="border-b border-border px-4 pb-2 pt-4 text-label font-medium text-text-2">
        訂單簿
      </h2>
      <OrderBookPanel symbol={symbol} />

      <div className="sticky bottom-[calc(3.5rem+var(--sab))] mt-2 flex gap-3 bg-bg/95 px-4 py-3 backdrop-blur">
        <Link
          to={`/trade?symbol=${symbol}`}
          className="flex h-12 flex-1 items-center justify-center rounded-control bg-long text-body font-semibold text-bg"
        >
          買多
        </Link>
        <Link
          to={`/trade?symbol=${symbol}`}
          className="flex h-12 flex-1 items-center justify-center rounded-control bg-short text-body font-semibold text-text"
        >
          賣空
        </Link>
      </div>
    </section>
  );
}

export function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  if (symbol === undefined || !isMarketSymbol(symbol)) {
    return <Navigate to="/" replace />;
  }
  return <ChartView key={symbol} symbol={symbol} />;
}
