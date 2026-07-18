import { useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import { type Position } from '../../engine/types';
import { useTradeStore } from '../../stores/tradeStore';
import { unrealizedPnl } from '../../engine/math';
import { formatAmount, formatPrice } from '../../lib/format';
import { parsePositiveInput, TPSL_INPUT_MESSAGES, TRADE_ERROR_MESSAGES } from '../../lib/tradeForm';

interface TpSlSheetProps {
  open: boolean;
  position: Position;
  onClose: () => void;
}

function previewPnl(position: Position, priceInput: string): string | null {
  const price = parsePositiveInput(priceInput);
  if (price === null) return null;
  const pnl = unrealizedPnl(position.side, position.entryPrice, price, position.qty);
  return `${pnl >= 0 ? '+' : '−'}${formatAmount(Math.abs(pnl), 2)} USDT`;
}

export function TpSlSheet({ open, position, onClose }: TpSlSheetProps) {
  const [tp, setTp] = useState(position.takeProfit?.toString() ?? '');
  const [sl, setSl] = useState(position.stopLoss?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const setPositionTpSl = useTradeStore((state) => state.setPositionTpSl);

  function confirm() {
    const tpValue = tp.trim() === '' ? null : parsePositiveInput(tp);
    const slValue = sl.trim() === '' ? null : parsePositiveInput(sl);
    if (tp.trim() !== '' && tpValue === null) {
      setError(TPSL_INPUT_MESSAGES.tp);
      return;
    }
    if (sl.trim() !== '' && slValue === null) {
      setError(TPSL_INPUT_MESSAGES.sl);
      return;
    }

    // 單一原子 action：TP／SL 任一驗證失敗都不會留下半套設定。
    const result = setPositionTpSl(position.id, tpValue, slValue);
    if (!result.ok) {
      setError(TRADE_ERROR_MESSAGES[result.error]);
      return;
    }
    setError(null);
    onClose();
  }

  const tpPreview = previewPnl(position, tp);
  const slPreview = previewPnl(position, sl);

  return (
    <BottomSheet open={open} title="止盈止損" onClose={onClose}>
      <p className="text-caption text-text-3">
        開倉價 {formatPrice(position.entryPrice)}，標記價觸發後以市價平倉；留空代表不設定。
      </p>
      <label className="mt-3 flex flex-col gap-1">
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
        {tpPreview !== null && (
          <span className="text-caption text-text-3 tabular-nums">觸發預估損益 {tpPreview}</span>
        )}
      </label>
      <label className="mt-3 flex flex-col gap-1">
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
        {slPreview !== null && (
          <span className="text-caption text-text-3 tabular-nums">觸發預估損益 {slPreview}</span>
        )}
      </label>

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
        確認
      </button>
    </BottomSheet>
  );
}
