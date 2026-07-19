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
import { type MarginMode, type Side } from '../engine/types';
import { LeverageSheet } from '../components/trade/LeverageSheet';
import { PairSelectorSheet } from '../components/trade/PairSelectorSheet';
import { PositionCard } from '../components/trade/PositionCard';
import { OrderList } from '../components/trade/OrderList';
import { trimNumberInput } from '../lib/tradeForm';
import { PprDisclaimerChip } from '../features/ppr/PprBadge';

type SheetKind = 'pair' | 'leverage' | 'margin' | null;

const MARGIN_MODE_LABELS: Record<MarginMode, string> = { isolated: '逐倉', cross: '全倉' };

const MARGIN_MODE_DESCRIPTIONS: Record<MarginMode, string> = {
  isolated:
    '逐倉：每筆持倉的保證金與損益各自獨立，強平僅損失該筆持倉的保證金，不動用帳戶其餘可用資金。',
  cross:
    '全倉：全部全倉持倉共享帳戶可用資金，未實現盈虧即時計入；帳戶保證金率不足時，將由最虧損的持倉開始強平。',
};

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
      className="flex flex-col gap-4 px-4 pb-4 pt-[calc(1rem+var(--sat))] lg:mx-auto lg:max-w-3xl"
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
  // 保證金模式（R6-2）：只影響之後新開倉；既有持倉保留各自模式。
  const [marginMode, setMarginMode] = useState<MarginMode>('isolated');
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
      {/* sticky 頂欄：pair 選擇與資金費率捲動常駐；自帶背景避免內容透出。
          pt-[var(--sat)]：standalone 下背景延伸覆蓋狀態列區、內容自 safe-area 下方起（R6-1）。 */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 pt-[var(--sat)] backdrop-blur">
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
              aria-label={`保證金模式：${MARGIN_MODE_LABELS[marginMode]}，點擊切換`}
              className="min-h-11 min-w-11 rounded-control bg-surface-2 px-3 text-label font-semibold text-text-2 active:bg-border"
            >
              {MARGIN_MODE_LABELS[marginMode]}
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

        {/* 第二列兩端對齊：左 PPR 揭露 chip（如有）、右資金費率/倒數對齊 pills 正下方（R6-3）。 */}
        <div className="flex items-center gap-1.5 px-4 pb-3 text-caption text-text-3">
          <PprDisclaimerChip symbol={symbol} />
          <span className="ml-auto flex items-center gap-1.5">
            <span>資金費率/倒數</span>
            <FundingRateBadge rate={ticker.fundingRate} nextFundingTime={ticker.nextFundingTime} />
          </span>
        </div>
      </div>

      <div className="flex gap-3 px-4 pt-3 lg:gap-6">
        <div className="min-w-0 flex-[0.58]">
          {/* key=symbol：切換交易對重置表單內部狀態（數量、TP/SL 值與展開態），避免跨幣殘留。 */}
          <OrderForm
            key={symbol}
            symbol={symbol}
            leverage={leverage}
            marginMode={marginMode}
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
          <div
            role="tablist"
            aria-label="保證金模式選擇"
            className="flex rounded-control bg-surface-2 p-0.5"
          >
            {(['isolated', 'cross'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={marginMode === candidate}
                onClick={() => setMarginMode(candidate)}
                className={clsx(
                  'min-h-11 min-w-11 flex-1 rounded-[10px] text-label transition-colors',
                  marginMode === candidate ? 'bg-surface font-semibold text-text' : 'text-text-3',
                )}
              >
                {MARGIN_MODE_LABELS[candidate]}
              </button>
            ))}
          </div>
          <p className="pb-1 pt-3 text-label leading-relaxed text-text-2">
            {MARGIN_MODE_DESCRIPTIONS[marginMode]}
          </p>
          <p className="pb-2 text-caption text-text-3">
            選定模式只套用於之後的新開倉；既有持倉維持各自的模式不變。
          </p>
        </BottomSheet>
      )}
    </div>
  );
}
