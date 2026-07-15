import { useState } from 'react';
import clsx from 'clsx';
import { BottomSheet } from '../BottomSheet';
import { type Position } from '../../engine/types';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { unrealizedPnl } from '../../engine/math';
import { formatAmount, formatPrice } from '../../lib/format';
import { parsePositiveInput, TRADE_ERROR_MESSAGES, trimNumberInput } from '../../lib/tradeForm';
import { CLOSE_PERCENT_PRESETS, QTY_DISPLAY_DECIMALS } from '../../config/trading';

interface CloseSheetProps {
  open: boolean;
  position: Position;
  onClose: () => void;
}

type CloseMode = 'market' | 'limit';

export function CloseSheet({ open, position, onClose }: CloseSheetProps) {
  const [mode, setMode] = useState<CloseMode>('market');
  const [percent, setPercent] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ticker = useMarketStore((state) => state.tickers[position.symbol]);
  const closeMarketOrder = useTradeStore((state) => state.closeMarketOrder);
  const placeCloseLimitOrder = useTradeStore((state) => state.placeCloseLimitOrder);
  const pushToast = useTradeStore((state) => state.pushToast);

  const mark = ticker?.markPrice;
  const closeQty = position.qty * (percent / 100);
  const limitPriceValue = parsePositiveInput(limitPrice);
  const previewPrice = mode === 'market' ? (mark ?? null) : limitPriceValue;
  const previewPnl =
    previewPrice !== null
      ? unrealizedPnl(position.side, position.entryPrice, previewPrice, closeQty)
      : null;

  function confirm() {
    if (mode === 'market') {
      if (mark === undefined) {
        setError('行情尚未就緒，請稍候');
        return;
      }
      const result = closeMarketOrder({
        positionId: position.id,
        fraction: percent / 100,
        price: mark,
      });
      if (!result.ok) {
        setError(TRADE_ERROR_MESSAGES[result.error]);
        return;
      }
      pushToast({
        tone: (previewPnl ?? 0) >= 0 ? 'long' : 'short',
        title: `市價平倉成功（${percent}%）`,
        description:
          previewPnl !== null
            ? `${previewPnl >= 0 ? '+' : '−'}${formatAmount(Math.abs(previewPnl), 2)} USDT`
            : undefined,
      });
    } else {
      if (limitPriceValue === null) {
        setError('請輸入大於 0 的限價');
        return;
      }
      const result = placeCloseLimitOrder({
        positionId: position.id,
        qty: closeQty,
        limitPrice: limitPriceValue,
      });
      if (!result.ok) {
        setError(TRADE_ERROR_MESSAGES[result.error]);
        return;
      }
      pushToast({
        tone: position.side,
        title: `限價平倉掛單成功（${percent}%）`,
        description: `${formatAmount(closeQty, QTY_DISPLAY_DECIMALS)} @ ${formatPrice(limitPriceValue)}`,
      });
    }
    setError(null);
    onClose();
  }

  return (
    <BottomSheet open={open} title="平倉" onClose={onClose}>
      <div role="tablist" aria-label="平倉方式" className="flex rounded-control bg-surface-2 p-0.5">
        {(
          [
            { id: 'market', label: '市價平倉' },
            { id: 'limit', label: '限價平倉' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
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
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-caption text-text-3">限價（USDT）</span>
          <input
            type="text"
            inputMode="decimal"
            value={limitPrice}
            onChange={(event) => {
              setLimitPrice(event.target.value);
              setError(null);
            }}
            placeholder={mark !== undefined ? trimNumberInput(mark, 6) : '0.0'}
            className="h-11 w-full rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
          />
        </label>
      )}

      <div className="mt-3" role="group" aria-label="平倉比例">
        <div className="flex justify-between text-caption text-text-3">
          <span>平倉比例</span>
          <span className="tabular-nums">
            {percent}%（{formatAmount(closeQty, QTY_DISPLAY_DECIMALS)}）
          </span>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {CLOSE_PERCENT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPercent(preset)}
              className={clsx(
                'min-h-11 min-w-11 flex-1 rounded text-caption tabular-nums transition-colors',
                percent === preset
                  ? 'bg-primary/15 font-semibold text-primary'
                  : 'bg-surface-2 text-text-2 active:bg-border',
              )}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-3 flex flex-col gap-1 text-caption">
        <div className="flex justify-between">
          <dt className="text-text-3">開倉價</dt>
          <dd className="text-text-2 tabular-nums">{formatPrice(position.entryPrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-3">{mode === 'market' ? '標記價' : '限價'}</dt>
          <dd className="text-text-2 tabular-nums">
            {previewPrice !== null ? formatPrice(previewPrice) : '--'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-3">預估損益</dt>
          <dd className={clsx('tabular-nums', (previewPnl ?? 0) >= 0 ? 'text-long' : 'text-short')}>
            {previewPnl !== null
              ? `${previewPnl >= 0 ? '+' : '−'}${formatAmount(Math.abs(previewPnl), 2)} USDT`
              : '--'}
          </dd>
        </div>
      </dl>

      {error !== null && (
        <p role="alert" className="mt-3 rounded bg-short-bg px-2.5 py-1.5 text-caption text-short">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={confirm}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-control bg-primary text-body font-semibold text-text active:bg-primary-pressed"
      >
        確認平倉
      </button>
    </BottomSheet>
  );
}
