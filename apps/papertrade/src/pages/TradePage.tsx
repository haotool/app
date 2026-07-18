import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import {
  DEFAULT_SYMBOL,
  isMarketSymbol,
  SYMBOL_META,
  TRADE_ORDERBOOK_LEVELS,
  type MarketSymbol,
} from '../config/market';
import { DEFAULT_LEVERAGE, HIGH_LEVERAGE_THRESHOLD } from '../config/trading';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { formatAmount, formatPrice } from '../lib/format';
import { BottomSheet } from '../components/BottomSheet';
import { CoinBadge } from '../components/CoinBadge';
import { FundingRateBadge } from '../components/FundingRateBadge';
import { PriceFlash } from '../components/PriceFlash';
import { CompactOrderBook, type BestQuote } from '../components/OrderBookPanel';
import { OrderForm, type OrderMode } from '../components/trade/OrderForm';
import { type Side } from '../engine/types';
import { LeverageSheet } from '../components/trade/LeverageSheet';
import { PairSelectorSheet } from '../components/trade/PairSelectorSheet';
import { PositionCard } from '../components/trade/PositionCard';
import { OrderList } from '../components/trade/OrderList';
import { trimNumberInput } from '../lib/tradeForm';
import { PprDisclaimerChip } from '../features/ppr/PprBadge';

type SheetKind = 'pair' | 'leverage' | 'margin' | null;

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
  const bestQuoteRef = useRef<BestQuote>({ bid: null, ask: null });

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
      {/* sticky 頂欄：pair 選擇與資金費率捲動常駐；自帶背景避免內容透出。 */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
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
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSheet('margin')}
              aria-label="保證金模式說明：逐倉"
              className="min-h-11 min-w-11 rounded-control bg-surface-2 px-3 text-label font-semibold text-text-2 active:bg-border"
            >
              逐倉
            </button>
            <button
              type="button"
              onClick={() => setSheet('leverage')}
              aria-label={`調整槓桿，目前 ${formatAmount(leverage, 1)} 倍`}
              className={clsx(
                'min-h-11 min-w-11 rounded-control px-3 text-label font-semibold tabular-nums',
                leverage > HIGH_LEVERAGE_THRESHOLD
                  ? 'bg-warning/15 text-warning active:bg-warning/25'
                  : 'bg-primary/15 text-primary active:bg-primary/25',
              )}
            >
              {formatAmount(leverage, 1)}x
            </button>
          </div>
        </header>

        <div className="flex items-center gap-1.5 px-4 pb-3 text-caption text-text-3">
          <span>資金費率</span>
          <FundingRateBadge rate={ticker.fundingRate} nextFundingTime={ticker.nextFundingTime} />
          <PprDisclaimerChip symbol={symbol} />
        </div>
      </div>

      <div className="flex gap-3 px-4 pt-3 lg:gap-6">
        <div className="min-w-0 flex-[0.58]">
          {/* key=symbol：切換交易對重置表單內部狀態（數量、TP/SL 值與展開態），避免跨幣殘留。 */}
          <OrderForm
            key={symbol}
            symbol={symbol}
            leverage={leverage}
            mode={mode}
            onModeChange={setMode}
            limitPrice={limitPrice}
            onLimitPriceChange={setLimitPrice}
            emphasisSide={emphasisSide}
            bestQuoteRef={bestQuoteRef}
          />
        </div>
        {/* 右欄等高契約：cell 不參與撐高，訂單簿以 absolute 填滿左欄表單自然高度。 */}
        <div className="relative min-w-0 flex-[0.42]">
          <div className="absolute inset-0">
            <CompactOrderBook
              symbol={symbol}
              levels={TRADE_ORDERBOOK_LEVELS}
              onPriceSelect={handlePriceSelect}
              quoteRef={bestQuoteRef}
            />
          </div>
        </div>
      </div>

      {/* R5-5：持倉與委託雙區塊堆疊同顯（非 tab），空狀態單行精簡。 */}
      <section aria-label="持倉" className="px-4 pt-4">
        <h2 className="text-label font-medium text-text-2">
          持倉 <span className="tabular-nums">({positions.length})</span>
        </h2>
        {positions.length === 0 ? (
          <p className="mt-2 text-caption text-text-3">尚無持倉</p>
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

      <OrderList />

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
      {sheet === 'margin' && (
        <BottomSheet open title="保證金模式" onClose={() => setSheet(null)}>
          <p className="pb-2 text-label leading-relaxed text-text-2">
            本模擬固定採「逐倉」隔離保證金：每筆持倉的保證金與損益各自獨立，觸發強平時僅損失該筆持倉的保證金，不會動用帳戶其餘可用資金。
          </p>
        </BottomSheet>
      )}
    </div>
  );
}
