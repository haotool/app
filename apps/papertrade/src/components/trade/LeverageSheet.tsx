import { useState } from 'react';
import clsx from 'clsx';
import { BottomSheet } from '../BottomSheet';
import { LEVERAGE_MAX, LEVERAGE_MIN, LEVERAGE_PRESETS } from '../../config/trading';

interface LeverageSheetProps {
  open: boolean;
  leverage: number;
  onClose: () => void;
  onConfirm: (leverage: number) => void;
}

export function LeverageSheet({ open, leverage, onClose, onConfirm }: LeverageSheetProps) {
  const [draft, setDraft] = useState(leverage);

  function handleClose() {
    setDraft(leverage);
    onClose();
  }

  return (
    <BottomSheet open={open} title="調整槓桿" onClose={handleClose}>
      <p className="text-center text-price-xl font-semibold tabular-nums text-primary">{draft}x</p>
      <input
        type="range"
        aria-label="槓桿倍數"
        min={LEVERAGE_MIN}
        max={LEVERAGE_MAX}
        step={1}
        value={draft}
        onChange={(event) => setDraft(Number(event.target.value))}
        className="mt-4 h-11 w-full accent-primary"
      />
      <div className="mt-1 flex justify-between text-caption text-text-3 tabular-nums">
        <span>{LEVERAGE_MIN}x</span>
        <span>{LEVERAGE_MAX}x</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {LEVERAGE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setDraft(preset)}
            className={clsx(
              'min-h-11 rounded-control text-label tabular-nums transition-colors',
              draft === preset
                ? 'bg-primary/15 font-semibold text-primary'
                : 'bg-surface-2 text-text-2 active:bg-border',
            )}
          >
            {preset}x
          </button>
        ))}
      </div>
      <p className="mt-3 text-caption leading-relaxed text-text-3">
        高槓桿會放大損益並使強平價貼近開倉價，請謹慎使用。
      </p>
      <button
        type="button"
        onClick={() => {
          onConfirm(draft);
          onClose();
        }}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-control bg-primary text-body font-semibold text-text active:bg-primary-pressed"
      >
        確認
      </button>
    </BottomSheet>
  );
}
