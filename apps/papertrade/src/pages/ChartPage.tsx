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
import { RecentTrades } from '../components/RecentTrades';
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

// kline tick 只重渲此子樹，隔離 SymbolHeader／訂單簿／CTA。
function ChartArea({ symbol, timeframe }: { symbol: MarketSymbol; timeframe: TimeframeId }) {
  const { bars, status, seriesKey } = useKlines(symbol, timeframe);

  if (status === 'error') {
    return (
      <div className="flex h-full items-center justify-center text-label text-text-3">
        歷史 K 線載入失敗，請稍後再試
      </div>
    );
  }

  return (
    <>
      <CandleChart bars={bars} seriesKey={seriesKey} />
      {status === 'loading' && (
        <div className="absolute inset-0 skeleton-pulse rounded-card" aria-label="圖表載入中" />
      )}
    </>
  );
}

type MarketPanelTab = 'orderbook' | 'trades';

const MARKET_PANEL_TABS: { id: MarketPanelTab; label: string }[] = [
  { id: 'orderbook', label: '訂單簿' },
  { id: 'trades', label: '最新成交' },
];

function MarketPanels({ symbol }: { symbol: MarketSymbol }) {
  const [tab, setTab] = useState<MarketPanelTab>('orderbook');

  return (
    <section>
      <div
        role="tablist"
        aria-label="市場資訊"
        className="flex gap-4 border-b border-border px-4 pt-4"
      >
        {MARKET_PANEL_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={clsx(
              'min-h-11 min-w-11 border-b-2 pb-1 text-label transition-colors',
              tab === id
                ? 'border-primary font-semibold text-text'
                : 'border-transparent text-text-3',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'orderbook' ? <OrderBookPanel symbol={symbol} /> : <RecentTrades symbol={symbol} />}
    </section>
  );
}

function ChartView({ symbol }: { symbol: MarketSymbol }) {
  const [timeframe, setTimeframe] = useState<TimeframeId>(DEFAULT_TIMEFRAME);

  return (
    <section className="flex flex-col pb-[4.5rem]">
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
              'min-h-11 min-w-11 shrink-0 rounded-control px-3 text-label transition-colors',
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
        <ChartArea symbol={symbol} timeframe={timeframe} />
      </div>

      <MarketPanels symbol={symbol} />

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+var(--sab))] z-10 mx-auto flex max-w-lg gap-3 bg-bg/95 px-4 py-3 backdrop-blur">
        <Link
          to={`/trade?symbol=${symbol}`}
          className="flex h-12 min-w-11 flex-1 items-center justify-center rounded-control bg-long text-body font-semibold text-bg"
        >
          買多
        </Link>
        <Link
          to={`/trade?symbol=${symbol}`}
          className="flex h-12 min-w-11 flex-1 items-center justify-center rounded-control bg-short text-body font-semibold text-text"
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
