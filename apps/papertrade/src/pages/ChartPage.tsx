import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
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
import { useMarketPrefsStore } from '../stores/marketPrefsStore';
import { formatCompact, formatPrice, formatSignedPercent } from '../lib/format';
import { INDICATORS } from '../lib/indicators';
import { CandleChart } from '../components/CandleChart';
import { DepthChart } from '../components/DepthChart';
import { FundingRateBadge } from '../components/FundingRateBadge';
import { OrderBookPanel } from '../components/OrderBookPanel';
import { RecentTrades } from '../components/RecentTrades';
import { PriceFlash } from '../components/PriceFlash';
import { PairSelectorSheet } from '../components/trade/PairSelectorSheet';

function SymbolHeader({
  symbol,
  onOpenPicker,
}: {
  symbol: MarketSymbol;
  onOpenPicker: () => void;
}) {
  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const meta = SYMBOL_META[symbol];

  return (
    <header className="px-4 pb-3 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onOpenPicker}
            aria-label={`切換交易對，目前為 ${meta.base}/USDT`}
            className="-ml-1 flex min-h-11 min-w-11 items-center gap-1 rounded-control px-1 text-left active:bg-surface-2"
          >
            <h1 className="text-body font-semibold">
              {meta.base}
              <span className="text-text-3">/USDT 永續</span>
            </h1>
            <ChevronDown size={16} className="text-text-3" aria-hidden />
          </button>
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
      {/* 各項 min-w 固定：載入中 `--` 與實值等寬，避免統計列跳動（設計 SSOT）。 */}
      {/* 排序 v1.2：資金費率與持倉量置前，375px 首屏可視（QA 可發現性裁決）。 */}
      <dl className="mt-2 flex gap-4 overflow-x-auto text-caption text-text-3">
        <div className="flex min-w-40 shrink-0 gap-1">
          <dt>資金費率</dt>
          <dd>
            <FundingRateBadge
              rate={ticker?.fundingRate}
              nextFundingTime={ticker?.nextFundingTime}
            />
          </dd>
        </div>
        <div className="flex min-w-20 shrink-0 gap-1">
          <dt>持倉量</dt>
          <dd className="text-text-2 tabular-nums">
            {ticker?.openInterestValue !== undefined
              ? formatCompact(ticker.openInterestValue)
              : '--'}
          </dd>
        </div>
        <div className="flex min-w-24 shrink-0 gap-1">
          <dt>24h高</dt>
          <dd className="text-text-2 tabular-nums">
            {ticker ? formatPrice(ticker.highPrice24h) : '--'}
          </dd>
        </div>
        <div className="flex min-w-24 shrink-0 gap-1">
          <dt>24h低</dt>
          <dd className="text-text-2 tabular-nums">
            {ticker ? formatPrice(ticker.lowPrice24h) : '--'}
          </dd>
        </div>
        <div className="flex min-w-20 shrink-0 gap-1">
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
  const { bars, status, seriesKey, retry } = useKlines(symbol, timeframe);
  const indicators = useMarketPrefsStore((state) => state.indicators);

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-label text-text-3">
        <p>歷史 K 線載入失敗</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 min-w-11 rounded-control bg-surface-2 px-4 text-label font-medium text-text-2 active:bg-border"
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <>
      <CandleChart bars={bars} seriesKey={seriesKey} indicators={indicators} />
      {status === 'loading' && (
        <div className="absolute inset-0 skeleton-pulse rounded-card" aria-label="圖表載入中" />
      )}
    </>
  );
}

function IndicatorChips() {
  const indicators = useMarketPrefsStore((state) => state.indicators);
  const toggleIndicator = useMarketPrefsStore((state) => state.toggleIndicator);

  return (
    <div role="group" aria-label="技術指標" className="flex gap-1.5 overflow-x-auto px-4 pb-3">
      {INDICATORS.map((definition) => {
        const active = indicators.includes(definition.id);
        return (
          <button
            key={definition.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggleIndicator(definition.id)}
            className={clsx(
              'min-h-11 min-w-11 shrink-0 rounded-control px-3 text-label transition-colors',
              active ? 'bg-surface-2 font-semibold' : 'text-text-3 active:bg-surface-2',
            )}
            style={active ? { color: `var(${definition.colorToken})` } : undefined}
          >
            {definition.label}
          </button>
        );
      })}
    </div>
  );
}

type MarketPanelTab = 'orderbook' | 'trades' | 'depth';

const MARKET_PANEL_TABS: { id: MarketPanelTab; label: string }[] = [
  { id: 'orderbook', label: '訂單簿' },
  { id: 'trades', label: '最新成交' },
  { id: 'depth', label: '深度' },
];

// 非啟用分頁不掛載：未顯示的面板不訂閱、不計算、不渲染。
function MarketPanelBody({ tab, symbol }: { tab: MarketPanelTab; symbol: MarketSymbol }) {
  switch (tab) {
    case 'orderbook':
      return <OrderBookPanel symbol={symbol} />;
    case 'trades':
      return <RecentTrades symbol={symbol} />;
    case 'depth':
      return <DepthChart symbol={symbol} />;
    default:
      return tab satisfies never;
  }
}

function MarketPanels({ symbol }: { symbol: MarketSymbol }) {
  const [tab, setTab] = useState<MarketPanelTab>('orderbook');
  const sectionRef = useRef<HTMLElement>(null);

  // 切換分頁時若面板頂部已捲出視口，回捲對齊；reduced-motion 改瞬時捲動。
  function selectTab(next: MarketPanelTab) {
    setTab(next);
    const section = sectionRef.current;
    if (section === null || section.getBoundingClientRect().top >= 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section ref={sectionRef}>
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
            onClick={() => selectTab(id)}
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
      <MarketPanelBody tab={tab} symbol={symbol} />
    </section>
  );
}

interface ChartViewProps {
  symbol: MarketSymbol;
  timeframe: TimeframeId;
  onTimeframeChange: (timeframe: TimeframeId) => void;
}

function ChartView({ symbol, timeframe, onTimeframeChange }: ChartViewProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    // 桌機（lg）雙欄：左欄圖表、右欄常駐市場面板；行動版維持原有直向堆疊。
    <section className="flex flex-col pb-[4.5rem] lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-4 lg:px-4">
      <div className="flex flex-col lg:min-w-0">
        <SymbolHeader symbol={symbol} onOpenPicker={() => setPickerOpen(true)} />

        <div
          role="tablist"
          aria-label="時間框架"
          className="flex gap-1.5 overflow-x-auto px-4 pb-1.5"
        >
          {TIMEFRAMES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={timeframe === id}
              onClick={() => onTimeframeChange(id)}
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

        <IndicatorChips />

        <div className="relative mx-2 h-[45dvh] lg:h-[32rem]">
          <ChartArea symbol={symbol} timeframe={timeframe} />
        </div>
      </div>

      {/* lg 改停靠右欄底（static 入流），不再視窗置中浮蓋左欄圖表（R3 P2-2）。 */}
      <div className="lg:min-w-0">
        <MarketPanels symbol={symbol} />

        <div className="fixed inset-x-0 bottom-[calc(3.5rem+var(--sab))] z-10 mx-auto flex max-w-lg gap-3 bg-bg/95 px-4 py-3 backdrop-blur lg:static lg:z-auto lg:mx-0 lg:max-w-none lg:bg-transparent lg:px-4 lg:pb-0 lg:backdrop-blur-none">
          <Link
            to={`/trade?symbol=${symbol}&side=long`}
            className="flex h-12 min-w-11 flex-1 items-center justify-center rounded-control bg-long text-body font-semibold text-bg"
          >
            買多
          </Link>
          <Link
            to={`/trade?symbol=${symbol}&side=short`}
            className="flex h-12 min-w-11 flex-1 items-center justify-center rounded-control bg-short text-body font-semibold text-text"
          >
            賣空
          </Link>
        </div>
      </div>

      {pickerOpen && (
        <PairSelectorSheet
          open
          selected={symbol}
          onClose={() => setPickerOpen(false)}
          onSelect={(next) => navigate(`/chart/${next}`)}
        />
      )}
    </section>
  );
}

export function ChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  // 時間框架掛在路由層級：symbol 快切（key remount）後仍保留當前 TF（設計 SSOT）。
  const [timeframe, setTimeframe] = useState<TimeframeId>(DEFAULT_TIMEFRAME);
  if (symbol === undefined || !isMarketSymbol(symbol)) {
    return <Navigate to="/" replace />;
  }
  return (
    <ChartView
      key={symbol}
      symbol={symbol}
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
    />
  );
}
