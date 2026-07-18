import { useState } from 'react';
import clsx from 'clsx';
import { BottomSheet } from '../BottomSheet';
import {
  HIGH_LEVERAGE_THRESHOLD,
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  LEVERAGE_PRESETS,
} from '../../config/trading';
import { leverageToSlider, sliderToLeverage } from '../../lib/leverageScale';

interface LeverageSheetProps {
  open: boolean;
  leverage: number;
  onClose: () => void;
  onConfirm: (leverage: number) => void;
}

export function LeverageSheet({ open, leverage, onClose, onConfirm }: LeverageSheetProps) {
  const [draft, setDraft] = useState(leverage);
  const sliderValue = leverageToSlider(draft);

  return (
    <BottomSheet open={open} title="調整槓桿" onClose={onClose}>
      <p
        className={clsx(
          'text-center text-price-xl font-semibold tabular-nums',
          draft > HIGH_LEVERAGE_THRESHOLD ? 'text-warning' : 'text-primary',
        )}
      >
        {draft}x
      </p>
      <div className="relative mt-4">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{
            width: `calc(10px + (100% - 20px) * ${sliderValue / 100})`,
          }}
        />
        {/* log-scale 映射（ADR-R5-03）：滑桿 0–100 線性 → 1–1000 指數，低倍段解析度高。 */}
        <input
          type="range"
          aria-label="槓桿倍數"
          aria-valuetext={`${draft}x`}
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={(event) => setDraft(sliderToLeverage(Number(event.target.value)))}
          className="range-input relative h-11 w-full"
        />
      </div>
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
              'min-h-11 w-full rounded-control text-label tabular-nums transition-colors',
              draft === preset
                ? 'bg-primary/15 font-semibold text-primary'
                : 'bg-surface-2 text-text-2 active:bg-border',
            )}
          >
            {preset}x
          </button>
        ))}
      </div>
      {draft > HIGH_LEVERAGE_THRESHOLD ? (
        <p className="mt-3 text-caption leading-relaxed text-warning" role="alert">
          極高槓桿：微小價格波動即可能觸發強平，請務必控制倉位。
        </p>
      ) : (
        <p className="mt-3 text-caption leading-relaxed text-text-3">
          高槓桿會放大損益並使強平價貼近開倉價，請謹慎使用。
        </p>
      )}
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
