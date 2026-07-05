/**
 * SegmentedControl primitive（E1 系統元件）
 *
 * radiogroup 語意的分段切換：roving tabindex＋方向鍵移動選取，觸控熱區 ≥44px。
 * - md：等分填滿容器（sheet／表單場景）。
 * - sm：緊湊 inline pill；以負邊距讓 44px 熱區不撐高列高（多幣別列場景）。
 * 選中面為 primary-strong 平色白字（AA 錨點），禁止漸層。
 */

import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: ReactNode;
  /** 選項的 aria-label（未提供時由 label 文字擔任可及名稱）。 */
  ariaLabel?: string;
  disabled?: boolean;
  testId?: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'md' | 'sm';
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const groupRef = useRef<HTMLDivElement | null>(null);

  const enabledOptions = options.filter((option) => !option.disabled);

  const moveSelection = (delta: 1 | -1) => {
    if (enabledOptions.length === 0) return;
    const currentIndex = enabledOptions.findIndex((option) => option.value === value);
    const nextIndex = (currentIndex + delta + enabledOptions.length) % enabledOptions.length;
    const next = enabledOptions[nextIndex];
    if (!next || next.value === value) return;
    onChange(next.value);
    // radiogroup 慣例：方向鍵移動選取時焦點跟隨新選項。
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-segmented-value="${next.value}"]`)
      ?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
    }
  };

  const isCompact = size === 'sm';
  const containerClass = isCompact
    ? 'inline-flex items-center'
    : `grid gap-1 rounded-control bg-surface-elevated p-1 ${GRID_COLS[Math.min(options.length, 4)] ?? 'grid-cols-3'}`;

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`${containerClass} ${className}`.trim()}
    >
      {options.map((option) => {
        const isChecked = option.value === value;
        const buttonClass = isCompact
          ? '-my-[10px] inline-flex min-h-11 min-w-11 items-center justify-center align-middle focus-visible:outline-none group/segment'
          : 'min-h-11 rounded-control text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ' +
            (isChecked
              ? 'bg-primary-strong text-white'
              : 'text-neutral-text-secondary hover:bg-primary/10') +
            (option.disabled ? ' cursor-not-allowed opacity-50' : '');

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isChecked}
            aria-label={option.ariaLabel}
            aria-disabled={option.disabled || undefined}
            tabIndex={isChecked ? 0 : -1}
            data-segmented-value={option.value}
            data-testid={option.testId}
            onClick={() => {
              if (option.disabled || isChecked) return;
              onChange(option.value);
            }}
            className={buttonClass}
          >
            {isCompact ? (
              <span
                className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold transition-colors group-focus-visible/segment:ring-2 group-focus-visible/segment:ring-primary/50 group-active/segment:scale-95 ${
                  isChecked
                    ? 'bg-primary-strong text-white'
                    : option.disabled
                      ? 'text-text-muted opacity-50'
                      : 'bg-primary/10 text-primary-dark'
                }`}
              >
                {option.label}
              </span>
            ) : (
              option.label
            )}
          </button>
        );
      })}
    </div>
  );
}
