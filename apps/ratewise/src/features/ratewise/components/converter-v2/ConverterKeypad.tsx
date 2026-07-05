/**
 * E3 v2 常駐計算機：4×4 鍵盤，沿用既有計算引擎（useCalculator），僅重排呈現層。
 * Toss 式扁平：無漸層、無重陰影，press 態 scale(0.97)+opacity。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../../../calculator/hooks/useCalculator';
import { lightHaptic, mediumHaptic } from '../../../calculator/utils/haptics';

export interface ConverterKeypadProps {
  /** 活躍列的種子值；父層以 key remount 保證切列時表達式重置。 */
  initialValue: number;
  /** 鍵入後的即時等值（純數字直出、含運算子時取引擎 preview）。 */
  onValueChange: (value: number) => void;
}

interface KeypadKey {
  value: string;
  label: string;
  kind: 'number' | 'operator' | 'backspace';
}

// 4×4 硬規格：數字 0-9＋小數點＋四則運算＋退格（長按清空），無 AC/= 特殊鍵。
const KEYPAD_LAYOUT: KeypadKey[][] = [
  [
    { value: '7', label: '7', kind: 'number' },
    { value: '8', label: '8', kind: 'number' },
    { value: '9', label: '9', kind: 'number' },
    { value: '÷', label: '÷', kind: 'operator' },
  ],
  [
    { value: '4', label: '4', kind: 'number' },
    { value: '5', label: '5', kind: 'number' },
    { value: '6', label: '6', kind: 'number' },
    { value: '×', label: '×', kind: 'operator' },
  ],
  [
    { value: '1', label: '1', kind: 'number' },
    { value: '2', label: '2', kind: 'number' },
    { value: '3', label: '3', kind: 'number' },
    { value: '-', label: '−', kind: 'operator' },
  ],
  [
    { value: '0', label: '0', kind: 'number' },
    { value: '.', label: '.', kind: 'number' },
    { value: 'backspace', label: '⌫', kind: 'backspace' },
    { value: '+', label: '＋', kind: 'operator' },
  ],
];

const LONG_PRESS_CLEAR_MS = 500;

function getKeyClassName(kind: KeypadKey['kind']): string {
  const base =
    'flex h-[54px] short:h-[44px] items-center justify-center rounded-2xl text-2xl short:text-xl font-semibold select-none min-w-[44px]';
  if (kind === 'operator') {
    return `${base} bg-primary/10 text-primary`;
  }
  if (kind === 'backspace') {
    return `${base} bg-surface-elevated text-neutral-text-secondary text-xl`;
  }
  return `${base} bg-surface-elevated text-text`;
}

export function ConverterKeypad({ initialValue, onValueChange }: ConverterKeypadProps) {
  const { t } = useTranslation();
  const { expression, preview, input, backspace, clear } = useCalculator(initialValue);
  const lastSentRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  // 鍵入即時回寫活躍列：純數字直接送出，含運算子時等引擎 preview（50ms 防抖）。
  useEffect(() => {
    const trimmed = expression.trim();
    let live: number | null = null;

    if (trimmed === '') {
      live = 0;
    } else if (/^-?\d*\.?\d*$/.test(trimmed)) {
      const parsed = parseFloat(trimmed);
      live = Number.isFinite(parsed) ? parsed : null;
    } else {
      live = preview;
    }

    if (live === null || !Number.isFinite(live)) return;
    if (lastSentRef.current === live) return;
    lastSentRef.current = live;
    onValueChange(live);
  }, [expression, preview, onValueChange]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleBackspacePressStart = () => {
    longPressFiredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      mediumHaptic();
      clear();
    }, LONG_PRESS_CLEAR_MS);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleKeyTap = (key: KeypadKey) => {
    if (key.kind === 'backspace') {
      const wasLongPress = longPressFiredRef.current;
      clearLongPressTimer();
      if (wasLongPress) return;
      lightHaptic();
      backspace();
      return;
    }

    lightHaptic();
    input(key.value);
  };

  return (
    <div
      data-testid="converter-v2-keypad"
      role="group"
      aria-label={t('converterV2.keypadLabel')}
      className="rounded-2xl bg-surface px-1 pt-3 pb-2 short:pt-1.5 short:pb-1"
    >
      <div className="grid grid-cols-4 gap-2 short:gap-1.5">
        {KEYPAD_LAYOUT.flat().map((key) => (
          <motion.button
            key={key.value}
            type="button"
            className={getKeyClassName(key.kind)}
            whileTap={{ scale: 0.97, opacity: 0.85 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            aria-label={
              key.kind === 'backspace'
                ? `${t('converterV2.keyBackspace')}（${t('converterV2.keyBackspaceHint')}）`
                : key.label
            }
            data-testid={`converter-v2-key-${key.value === 'backspace' ? 'backspace' : key.value}`}
            onTapStart={key.kind === 'backspace' ? handleBackspacePressStart : undefined}
            onTap={() => handleKeyTap(key)}
            onTapCancel={key.kind === 'backspace' ? clearLongPressTimer : undefined}
          >
            {key.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
