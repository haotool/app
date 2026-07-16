import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Inbox } from 'lucide-react';
import {
  DEFAULT_SYMBOL,
  isMarketSymbol,
  SYMBOL_META,
  TRADE_ORDERBOOK_LEVELS,
  type MarketSymbol,
} from '../config/market';
import { DEFAULT_LEVERAGE } from '../config/trading';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { formatAmount, formatPrice } from '../lib/format';
import { CoinBadge } from '../components/CoinBadge';
import { EmptyState } from '../components/EmptyState';
import { FundingRateBadge } from '../components/FundingRateBadge';
import { PriceFlash } from '../components/PriceFlash';
import { CompactOrderBook } from '../components/OrderBookPanel';
import { OrderForm, type OrderMode } from '../components/trade/OrderForm';
import { type Side } from '../engine/types';
import { LeverageSheet } from '../components/trade/LeverageSheet';
import { PairSelectorSheet } from '../components/trade/PairSelectorSheet';
import { PositionCard } from '../components/trade/PositionCard';
import { OrderList } from '../components/trade/OrderList';
import { trimNumberInput } from '../lib/tradeForm';

type SheetKind = 'pair' | 'leverage' | null;

function resolveInitialSymbol(raw: string | null): MarketSymbol {
  if (raw !== null && isMarketSymbol(raw)) return raw;
  return DEFAULT_SYMBOL;
}

function resolveInitialSide(raw: string | null): Side | null {
  return raw === 'long' || raw === 'short' ? raw : null;
}

function TradePageSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 px-4 pb-4 pt-4 lg:mx-auto lg:max-w-3xl"
      aria-label="交易頁載入中"
    >
      <div className="flex items-center justify-between">
        <span className="skeleton-pulse h-11 w-36 rounded-control" />
        <span className="skeleton-pulse h-11 w-16 rounded-control" />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-[0.58] flex-col gap-2.5">
          <span className="skeleton-pulse h-11 w-full rounded-control" />
          <span className="skeleton-pulse h-11 w-full rounded-control" />
          <span className="skeleton-pulse h-11 w-full rounded-control" />
          <span className="skeleton-pulse h-12 w-full rounded-control" />
        </div>
        <div className="flex flex-[0.42] flex-col gap-1.5">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="skeleton-pulse h-10 w-full rounded" />
          ))}
        </div>
      </div>
      <span className="skeleton-pulse h-24 w-full rounded-card" />
    </div>
  );
}

export function TradePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [symbol, setSymbol] = useState<MarketSymbol>(() =>
    resolveInitialSymbol(searchParams.get('symbol')),
  );
  // 圖表頁 CTA 帶入的方向：僅作視覺預選強調，不代下單。
  const [emphasisSide] = useState<Side | null>(() => resolveInitialSide(searchParams.get('side')));
  const [leverage, setLeverage] = useState(DEFAULT_LEVERAGE);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [mode, setMode] = useState<OrderMode>('market');
  const [limitPrice, setLimitPrice] = useState('');

  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const positions = useTradeStore((state) => state.account.positions);

  const meta = SYMBOL_META[symbol];

  function handlePriceSelect(price: number) {
    setMode('limit');
    setLimitPrice(trimNumberInput(price, 6));
  }

  if (ticker === undefined) {
    return <TradePageSkeleton />;
  }

  return (
    // pb-8：持倉卡操作鈕與固定 bottom nav 之間預留間距（375×812 免捲動可點）。
    <div className="flex flex-col pb-8 lg:mx-auto lg:max-w-3xl">
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={() => setSheet('pair')}
          aria-label={`切換交易對，目前為 ${meta.base}/USDT`}
          className="flex min-h-11 min-w-11 items-center gap-1.5 rounded-control px-1 text-left active:bg-surface-2"
        >
          <CoinBadge symbol={symbol} />
          <span>
            <span className="flex items-center gap-1 text-body font-semibold">
              {meta.base}
              <span className="text-text-3">/USDT</span>
              <ChevronDown size={16} className="text-text-3" aria-hidden />
            </span>
            <PriceFlash
              direction={ticker.direction}
              revision={ticker.revision}
              className="block text-label"
            >
              {formatPrice(ticker.lastPrice)}
            </PriceFlash>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSheet('leverage')}
          aria-label={`調整槓桿，目前 ${formatAmount(leverage, 1)} 倍`}
          className="min-h-11 min-w-11 rounded-control bg-primary/15 px-3 text-label font-semibold text-primary tabular-nums active:bg-primary/25"
        >
          {formatAmount(leverage, 1)}x
        </button>
      </header>

      <div className="flex items-center gap-1.5 px-4 pb-3 text-caption text-text-3">
        <span>資金費率</span>
        <FundingRateBadge rate={ticker.fundingRate} nextFundingTime={ticker.nextFundingTime} />
      </div>

      <div className="flex gap-3 px-4 lg:gap-6">
        <div className="min-w-0 flex-[0.58]">
          <OrderForm
            symbol={symbol}
            leverage={leverage}
            mode={mode}
            onModeChange={setMode}
            limitPrice={limitPrice}
            onLimitPriceChange={setLimitPrice}
            emphasisSide={emphasisSide}
          />
        </div>
        <div className="min-w-0 flex-[0.42]">
          <CompactOrderBook
            symbol={symbol}
            levels={TRADE_ORDERBOOK_LEVELS}
            onPriceSelect={handlePriceSelect}
          />
        </div>
      </div>

      <OrderList />

      <section aria-label="目前持倉" className="px-4 pt-4">
        <h2 className="text-label font-medium text-text-2">
          目前持倉 <span className="tabular-nums">({positions.length})</span>
        </h2>
        {positions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="尚無持倉"
            description="送出第一筆模擬訂單，體驗零風險合約交易。"
            className="mt-2"
          />
        ) : (
          <ul className="mt-2 flex flex-col gap-2.5">
            {positions.map((position) => (
              <li key={position.id}>
                <PositionCard position={position} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {sheet === 'pair' && (
        <PairSelectorSheet
          open
          selected={symbol}
          onClose={() => setSheet(null)}
          onSelect={(next) => {
            setSymbol(next);
            setLimitPrice('');
            // 同步 URL（replace 不堆歷史）：快切後可分享／重整回到同交易對，與圖表頁對稱。
            setSearchParams(
              (prev) => {
                const params = new URLSearchParams(prev);
                params.set('symbol', next);
                return params;
              },
              { replace: true },
            );
          }}
        />
      )}
      {sheet === 'leverage' && (
        <LeverageSheet
          open
          leverage={leverage}
          onClose={() => setSheet(null)}
          onConfirm={setLeverage}
        />
      )}
    </div>
  );
}
