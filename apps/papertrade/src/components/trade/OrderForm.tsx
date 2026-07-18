import { useState, type RefObject } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { SYMBOL_META, type MarketSymbol } from '../../config/market';
import { type BestQuote } from '../OrderBookPanel';
import {
  MAKER_FEE_RATE,
  QTY_DISPLAY_DECIMALS,
  SIZE_SLIDER_TICKS,
  TAKER_FEE_RATE,
} from '../../config/trading';
import { liquidationPrice } from '../../engine/math';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { formatAmount, formatPrice } from '../../lib/format';
import {
  amountToPercent,
  maxOpenNotional,
  parseOrderForm,
  parsePositiveInput,
  TPSL_INPUT_MESSAGES,
  TRADE_ERROR_MESSAGES,
  trimNumberInput,
} from '../../lib/tradeForm';
import { type Side } from '../../engine/types';

export type OrderMode = 'market' | 'limit';
type AmountUnit = 'usdt' | 'base';

interface OrderFormProps {
  symbol: MarketSymbol;
  leverage: number;
  mode: OrderMode;
  onModeChange: (mode: OrderMode) => void;
  limitPrice: string;
  onLimitPriceChange: (value: string) => void;
  // 圖表頁 CTA 帶入的預選方向：強調該側按鈕、淡化另一側。
  emphasisSide?: Side | null;
  // 訂單簿頂檔快照：買1／賣1 快捷鈕點擊時讀取，不隨簿 tick 重渲表單。
  bestQuoteRef?: RefObject<BestQuote>;
}

const MODE_TABS: { id: OrderMode; label: string }[] = [
  { id: 'market', label: '市價' },
  { id: 'limit', label: '限價' },
];

export function OrderForm({
  symbol,
  leverage,
  mode,
  onModeChange,
  limitPrice,
  onLimitPriceChange,
  emphasisSide = null,
  bestQuoteRef,
}: OrderFormProps) {
  const [unit, setUnit] = useState<AmountUnit>('usdt');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tpslOpen, setTpslOpen] = useState(false);
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');

  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const available = useTradeStore((state) => state.account.balance);
  // 目前 symbol 持倉方向：同向下單＝加倉，沿用倉上 TP/SL，表單欄位不生效（B1/S1）。
  const heldSide = useTradeStore(
    (state) => state.account.positions.find((position) => position.symbol === symbol)?.side ?? null,
  );
  const openMarketOrder = useTradeStore((state) => state.openMarketOrder);
  const placeLimitOrder = useTradeStore((state) => state.placeLimitOrder);
  const pushToast = useTradeStore((state) => state.pushToast);

  const base = SYMBOL_META[symbol].base;
  const markPrice = ticker?.markPrice;
  const limitPriceValue = parsePositiveInput(limitPrice);
  const priceForCalc = mode === 'limit' ? limitPriceValue : (markPrice ?? null);
  const feeRate = mode === 'limit' ? MAKER_FEE_RATE : TAKER_FEE_RATE;

  const amountValue = parsePositiveInput(amount);
  const qty =
    amountValue === null
      ? null
      : unit === 'base'
        ? amountValue
        : priceForCalc !== null
          ? amountValue / priceForCalc
          : null;

  const converted =
    qty !== null && priceForCalc !== null
      ? unit === 'usdt'
        ? `≈ ${formatAmount(qty, QTY_DISPLAY_DECIMALS)} ${base}`
        : `≈ ${formatAmount(qty * priceForCalc, 2)} USDT`
      : null;

  const maxNotional = maxOpenNotional(available, leverage, feeRate);
  const sliderPct = amountToPercent(amountValue, unit, priceForCalc, maxNotional);
  const sliderDisabled = priceForCalc === null || maxNotional <= 0;

  function applyPercent(pct: number) {
    if (priceForCalc === null) return;
    setError(null);
    const notional = maxNotional * (pct / 100);
    if (notional <= 0) {
      setAmount('');
      return;
    }
    setAmount(
      unit === 'usdt'
        ? trimNumberInput(notional, 2)
        : trimNumberInput(notional / priceForCalc, QTY_DISPLAY_DECIMALS),
    );
  }

  function applyBestQuote(side: keyof BestQuote) {
    const price = bestQuoteRef?.current[side] ?? null;
    if (price === null) return;
    setError(null);
    onLimitPriceChange(trimNumberInput(price, 6));
  }

  function toggleUnit() {
    const nextUnit: AmountUnit = unit === 'usdt' ? 'base' : 'usdt';
    if (amountValue !== null && priceForCalc !== null) {
      setAmount(
        nextUnit === 'usdt'
          ? trimNumberInput(amountValue * priceForCalc, 2)
          : trimNumberInput(amountValue / priceForCalc, QTY_DISPLAY_DECIMALS),
      );
    }
    setUnit(nextUnit);
  }

  // 收合即清空：已輸入值不留存，送出永遠只帶展開中的欄位，狀態單一真相。
  function toggleTpsl() {
    if (tpslOpen) {
      setTp('');
      setSl('');
    }
    setTpslOpen(!tpslOpen);
    setError(null);
  }

  function submit(side: Side) {
    let price: number;
    if (mode === 'market') {
      if (markPrice === undefined) {
        setError('行情尚未就緒，請稍候');
        return;
      }
      price = markPrice;
    } else {
      if (limitPriceValue === null) {
        setError('請輸入大於 0 的限價');
        return;
      }
      price = limitPriceValue;
    }

    const parsed = parseOrderForm({ amount, unit, price, leverage });
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    // 加倉（同向持倉存在）不解析也不傳送 TP/SL：引擎沿用倉上既有值，避免假性拒單。
    const scalingIn = side === heldSide;
    const tpValue = scalingIn || tp.trim() === '' ? undefined : parsePositiveInput(tp);
    if (tpValue === null) {
      setError(TPSL_INPUT_MESSAGES.tp);
      return;
    }
    const slValue = scalingIn || sl.trim() === '' ? undefined : parsePositiveInput(sl);
    if (slValue === null) {
      setError(TPSL_INPUT_MESSAGES.sl);
      return;
    }

    const result =
      mode === 'market'
        ? openMarketOrder({
            symbol,
            side,
            qty: parsed.qty,
            price: parsed.price,
            leverage,
            tp: tpValue,
            sl: slValue,
          })
        : placeLimitOrder({
            symbol,
            side,
            qty: parsed.qty,
            limitPrice: parsed.price,
            leverage,
            tp: tpValue,
            sl: slValue,
          });

    if (!result.ok) {
      setError(TRADE_ERROR_MESSAGES[result.error]);
      return;
    }

    setError(null);
    setAmount('');
    setTp('');
    setSl('');
    const sideText = side === 'long' ? '買多' : '賣空';
    pushToast({
      tone: side,
      title: mode === 'market' ? `市價${sideText}成功` : `限價${sideText}掛單成功`,
      description: `${base}/USDT ${formatAmount(parsed.qty, QTY_DISPLAY_DECIMALS)} ${base} @ ${formatPrice(parsed.price)}`,
    });
  }

  const liqPreviewLong =
    priceForCalc !== null ? liquidationPrice('long', priceForCalc, leverage) : null;
  const liqPreviewShort =
    priceForCalc !== null ? liquidationPrice('short', priceForCalc, leverage) : null;

  const notional = qty !== null && priceForCalc !== null ? qty * priceForCalc : null;
  const marginPreview = notional !== null ? notional / leverage : null;
  const feePreview = notional !== null ? notional * feeRate : null;

  return (
    <form
      aria-label="下單表單"
      className="flex flex-col gap-2.5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div role="tablist" aria-label="下單類型" className="flex rounded-control bg-surface-2 p-0.5">
        {MODE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              onModeChange(id);
              setError(null);
            }}
            className={clsx(
              'min-h-11 min-w-11 flex-1 rounded-[10px] text-label transition-colors',
              mode === id ? 'bg-surface font-semibold text-text' : 'text-text-3',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'limit' && (
        // 快捷鈕不得包在 label 內：label 點擊會轉發回 input，改以 aria-label 提供名稱。
        <div className="flex flex-col gap-1">
          <span className="text-caption text-text-3">限價（USDT）</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              value={limitPrice}
              onChange={(event) => onLimitPriceChange(event.target.value)}
              placeholder={
                markPrice !== undefined ? formatPrice(markPrice).replaceAll(',', '') : '0.0'
              }
              aria-label="限價（USDT）"
              className="h-11 min-w-11 flex-1 rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => applyBestQuote('bid')}
              aria-label="帶入買1價"
              className="min-h-11 min-w-11 shrink-0 rounded-control bg-surface-2 px-2 text-caption font-medium text-long active:bg-border"
            >
              買1
            </button>
            <button
              type="button"
              onClick={() => applyBestQuote('ask')}
              aria-label="帶入賣1價"
              className="min-h-11 min-w-11 shrink-0 rounded-control bg-surface-2 px-2 text-caption font-medium text-short active:bg-border"
            >
              賣1
            </button>
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between text-caption text-text-3">
          數量
          <button
            type="button"
            onClick={toggleUnit}
            className="flex min-h-11 min-w-11 items-center rounded px-2 text-caption font-medium text-primary active:bg-primary/10"
          >
            {unit === 'usdt' ? 'USDT' : base} ⇄
          </button>
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setError(null);
          }}
          placeholder="0.0"
          aria-label={`數量（${unit === 'usdt' ? 'USDT' : base}）`}
          className="h-11 w-full rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
        />
        {converted !== null && (
          <span className="text-caption text-text-3 tabular-nums">{converted}</span>
        )}
      </label>

      {/* 滑桿＝amount 對最大可開的比例投影：amount 為單一真相，拖曳依 % 回寫。
          軌道自繪；填充與刻度以 calc 對齊 20px 把手的行程（兩端各內縮 10px）。 */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
            style={{ width: `calc(10px + (100% - 20px) * ${sliderPct / 100})` }}
          />
          {SIZE_SLIDER_TICKS.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className={clsx(
                'pointer-events-none absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
                sliderPct >= tick && !sliderDisabled ? 'bg-primary' : 'bg-border',
              )}
              style={{ left: `calc(10px + (100% - 20px) * ${tick / 100})` }}
            />
          ))}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderPct}
            disabled={sliderDisabled}
            onChange={(event) => applyPercent(Number(event.target.value))}
            aria-label="數量比例"
            aria-valuetext={`${sliderPct}%`}
            className="range-input relative h-11 w-full"
          />
        </div>
        <span className="w-10 shrink-0 text-right text-caption text-text-2 tabular-nums">
          {sliderPct}%
        </span>
      </div>

      <dl className="flex flex-col gap-1 text-caption">
        <div className="flex justify-between">
          <dt className="text-text-3">可用資金</dt>
          <dd className="text-text-2 tabular-nums">{formatAmount(available, 2)} USDT</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-3">保證金</dt>
          <dd className="text-text-2 tabular-nums">
            {marginPreview !== null ? `≈ ${formatAmount(marginPreview, 2)} USDT` : '--'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-3">預估手續費（{mode === 'limit' ? 'Maker' : 'Taker'}）</dt>
          <dd className="text-text-2 tabular-nums">
            {/* 小額手續費以 4 位小數避免顯示為 0；一般金額 2 位即可單行收納。 */}
            {feePreview !== null
              ? `≈ ${formatAmount(feePreview, feePreview < 1 ? 4 : 2)} USDT`
              : '--'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-3">多單預估強平</dt>
          <dd className="text-text-2 tabular-nums">
            {liqPreviewLong !== null ? formatPrice(liqPreviewLong) : '--'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-3">空單預估強平</dt>
          <dd className="text-text-2 tabular-nums">
            {liqPreviewShort !== null ? formatPrice(liqPreviewShort) : '--'}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={toggleTpsl}
          aria-expanded={tpslOpen}
          className="flex min-h-11 w-full items-center justify-between rounded-control text-caption text-text-2 active:bg-surface-2"
        >
          止盈/止損（選填）
          <ChevronDown
            size={16}
            className={clsx('text-text-3 transition-transform', tpslOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
        {tpslOpen && (
          <>
            {heldSide !== null && (
              // 沿用語義僅限同向加倉：反向下單仍套用並驗證本欄，文案綁定持倉方向避免誤示。
              <p className="text-caption text-text-3">
                {`同向加倉（${heldSide === 'long' ? '買多' : '賣空'}）沿用持倉現有止盈止損，本欄不生效；請由持倉卡調整`}
              </p>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-3">止盈價（USDT）</span>
              <input
                type="text"
                inputMode="decimal"
                value={tp}
                onChange={(event) => {
                  setTp(event.target.value);
                  setError(null);
                }}
                placeholder="未設定"
                className="h-11 w-full rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-long"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-3">止損價（USDT）</span>
              <input
                type="text"
                inputMode="decimal"
                value={sl}
                onChange={(event) => {
                  setSl(event.target.value);
                  setError(null);
                }}
                placeholder="未設定"
                className="h-11 w-full rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-short"
              />
            </label>
            {mode === 'limit' && (
              <p className="text-caption text-text-3">限價更優成交後，請以實際開倉價檢視止盈止損</p>
            )}
          </>
        )}
      </div>

      {error !== null && (
        <p role="alert" className="rounded bg-short-bg px-2.5 py-1.5 text-caption text-short">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit('long')}
          className={clsx(
            'flex h-12 min-w-11 flex-1 items-center justify-center rounded-control bg-long text-body font-semibold text-bg active:opacity-90',
            emphasisSide === 'short' && 'opacity-55',
          )}
        >
          買多
        </button>
        <button
          type="button"
          onClick={() => submit('short')}
          className={clsx(
            'flex h-12 min-w-11 flex-1 items-center justify-center rounded-control bg-short text-body font-semibold text-text active:opacity-90',
            emphasisSide === 'long' && 'opacity-55',
          )}
        >
          賣空
        </button>
      </div>
    </form>
  );
}
