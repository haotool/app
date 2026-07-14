import { useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import { type Position } from '../../engine/types';
import { useTradeStore } from '../../stores/tradeStore';
import { formatPrice } from '../../lib/format';
import { parsePositiveInput, TRADE_ERROR_MESSAGES } from '../../lib/tradeForm';

interface TrailingSheetProps {
  open: boolean;
  position: Position;
  onClose: () => void;
}

export function TrailingSheet({ open, position, onClose }: TrailingSheetProps) {
  const [activation, setActivation] = useState(position.trailing?.activationPrice.toString() ?? '');
  const [distance, setDistance] = useState(position.trailing?.distance.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const setPositionTrailing = useTradeStore((state) => state.setPositionTrailing);

  function confirm() {
    const activationValue = parsePositiveInput(activation);
    const distanceValue = parsePositiveInput(distance);
    if (activationValue === null || distanceValue === null) {
      setError('啟動價與回撤距離皆須為大於 0 的數字');
      return;
    }
    const result = setPositionTrailing(position.id, {
      activationPrice: activationValue,
      distance: distanceValue,
    });
    if (!result.ok) {
      setError(TRADE_ERROR_MESSAGES[result.error]);
      return;
    }
    setError(null);
    onClose();
  }

  function clearTrailing() {
    setPositionTrailing(position.id, null);
    setActivation('');
    setDistance('');
    setError(null);
    onClose();
  }

  const hint =
    position.side === 'long'
      ? '標記價升破啟動價後開始追蹤最高點，回撤達距離即市價平倉。'
      : '標記價跌破啟動價後開始追蹤最低點，反彈達距離即市價平倉。';

  return (
    <BottomSheet open={open} title="追蹤止損" onClose={onClose}>
      <p className="text-caption leading-relaxed text-text-3">
        開倉價 {formatPrice(position.entryPrice)}。{hint}
      </p>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-caption text-text-3">啟動價（USDT）</span>
        <input
          type="text"
          inputMode="decimal"
          value={activation}
          onChange={(event) => {
            setActivation(event.target.value);
            setError(null);
          }}
          placeholder="0.0"
          className="h-11 rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
        />
      </label>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-caption text-text-3">回撤距離（USDT）</span>
        <input
          type="text"
          inputMode="decimal"
          value={distance}
          onChange={(event) => {
            setDistance(event.target.value);
            setError(null);
          }}
          placeholder="0.0"
          className="h-11 rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none focus:border-primary"
        />
      </label>

      {error !== null && (
        <p role="alert" className="mt-3 rounded bg-short-bg px-2.5 py-1.5 text-caption text-short">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {position.trailing !== null && (
          <button
            type="button"
            onClick={clearTrailing}
            className="flex h-12 flex-1 items-center justify-center rounded-control border border-border text-body text-text-2 active:bg-surface-2"
          >
            移除追蹤
          </button>
        )}
        <button
          type="button"
          onClick={confirm}
          className="flex h-12 flex-1 items-center justify-center rounded-control bg-primary text-body font-semibold text-text active:bg-primary-pressed"
        >
          確認
        </button>
      </div>
    </BottomSheet>
  );
}
