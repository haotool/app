import { useState } from 'react';
import clsx from 'clsx';
import { SYMBOL_META, type MarketSymbol } from '../../config/market';
import {
  MAKER_FEE_RATE,
  QTY_DISPLAY_DECIMALS,
  SIZE_PERCENT_PRESETS,
  TAKER_FEE_RATE,
} from '../../config/trading';
import { liquidationPrice } from '../../engine/math';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { formatAmount, formatPrice } from '../../lib/format';
import {
  maxOpenNotional,
  parseOrderForm,
  parsePositiveInput,
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
}: OrderFormProps) {
  const [unit, setUnit] = useState<AmountUnit>('usdt');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ticker = useMarketStore((state) => state.tickers[symbol]);
  const available = useTradeStore((state) => state.account.balance);
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

  function applyPercent(pct: number) {
    if (priceForCalc === null) return;
    const notional = maxOpenNotional(available, leverage, feeRate) * (pct / 100);
    if (notional <= 0) return;
    setError(null);
    setAmount(
      unit === 'usdt'
        ? trimNumberInput(notional, 2)
        : trimNumberInput(notional / priceForCalc, QTY_DISPLAY_DECIMALS),
    );
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

    const result =
      mode === 'market'
        ? openMarketOrder({ symbol, side, qty: parsed.qty, price: parsed.price, leverage })
        : placeLimitOrder({ symbol, side, qty: parsed.qty, limitPrice: parsed.price, leverage });

    if (!result.ok) {
      setError(TRADE_ERROR_MESSAGES[result.error]);
      return;
    }

    setError(null);
    setAmount('');
    const sideText = side === 'long' ? '買多' : '賣空';
    pushToast({
      tone: side,
      title: mode === 'market' ? `市價${sideText}成功` : `限價${sideText}掛單成功`,
      description: `${base}/USDT ${formatAmount(parsed.qty, QTY_DISPLAY_DECIMALS)} ${base}`,
    });
  }

  const liqPreviewLong =
    priceForCalc !== null ? liquidationPrice('long', priceForCalc, leverage) : null;
  const liqPreviewShort =
    priceForCalc !== null ? liquidationPrice('short', priceForCalc, leverage) : null;

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
              'min-h-11 flex-1 rounded-[10px] text-label transition-colors',
              mode === id ? 'bg-surface font-semibold text-text' : 'text-text-3',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'limit' && (
        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-3">限價（USDT）</span>
          <input
            type="text"
            inputMode="decimal"
            value={limitPrice}
            onChange={(event) => onLimitPriceChange(event.target.value)}
            placeholder={
              markPrice !== undefined ? formatPrice(markPrice).replaceAll(',', '') : '0.0'
            }
            className="h-11 rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between text-caption text-text-3">
          數量
          <button
            type="button"
            onClick={toggleUnit}
            className="flex min-h-11 items-center rounded px-2 text-caption font-medium text-primary active:bg-primary/10"
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
          className="h-11 rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
        />
        {converted !== null && (
          <span className="text-caption text-text-3 tabular-nums">{converted}</span>
        )}
      </label>

      <div className="flex gap-1.5" role="group" aria-label="數量快捷比例">
        {SIZE_PERCENT_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => applyPercent(pct)}
            className="min-h-11 flex-1 rounded bg-surface-2 text-caption text-text-2 tabular-nums active:bg-border"
          >
            {pct}%
          </button>
        ))}
      </div>

      <dl className="flex flex-col gap-1 text-caption">
        <div className="flex justify-between">
          <dt className="text-text-3">可用資金</dt>
          <dd className="text-text-2 tabular-nums">{formatAmount(available, 2)} USDT</dd>
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

      {error !== null && (
        <p role="alert" className="rounded bg-short-bg px-2.5 py-1.5 text-caption text-short">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit('long')}
          className="flex h-12 flex-1 items-center justify-center rounded-control bg-long text-body font-semibold text-bg active:opacity-90"
        >
          買多
        </button>
        <button
          type="button"
          onClick={() => submit('short')}
          className="flex h-12 flex-1 items-center justify-center rounded-control bg-short text-body font-semibold text-text active:opacity-90"
        >
          賣空
        </button>
      </div>
    </form>
  );
}
