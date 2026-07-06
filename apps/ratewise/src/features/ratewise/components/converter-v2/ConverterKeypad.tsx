/**
 * E3 v2 常駐計算機：4×4 鍵盤，沿用既有計算引擎（useCalculator），僅重排呈現層。
 * Toss 式扁平：無漸層、無重陰影，press 態 scale(0.97)+opacity。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../../../calculator/hooks/useCalculator';
import { useCalculatorKeyboard } from '../../../calculator/hooks/useCalculatorKeyboard';
import { lightHaptic, mediumHaptic } from '../../../calculator/utils/haptics';

export interface ConverterKeypadProps {
  /**
   * 活躍列的種子值。父層以 key remount 重新播種；掛載後僅在使用者尚未有任何
   * 被接受按鍵（閘門關閉）時，外部變更會同步重播種子，其餘時間為唯讀。
   */
  initialValue: number;
  /** 鍵入後的即時等值（純數字直出、含運算子時取引擎 preview）。 */
  onValueChange: (value: number) => void;
  /** 實體鍵盤是否啟用；sheet 開啟時由父層關閉，避免與 sheet 鍵盤語意衝突。預設啟用。 */
  keyboardEnabled?: boolean;
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
    return `${base} bg-primary/10 text-primary-on-surface`;
  }
  if (kind === 'backspace') {
    return `${base} bg-surface-elevated text-neutral-text-secondary text-xl`;
  }
  return `${base} bg-surface-elevated text-text`;
}

export function ConverterKeypad({
  initialValue,
  onValueChange,
  keyboardEnabled = true,
}: ConverterKeypadProps) {
  const { t } = useTranslation();
  // 掛載時鎖定種子：初始同步為唯讀，回寫後的 prop 變更不得重置進行中的表達式。
  const [seedValue, setSeedValue] = useState(initialValue);
  const { expression, preview, input, backspace, clear, calculate } = useCalculator(seedValue);
  const lastSentRef = useRef<number | null>(null);
  // 回寫閘門：僅「引擎實際接受」的按鍵後開啟；remount 或種子同步不得以捨入反推值改寫另一列。
  const hasUserInputRef = useRef(false);
  // 按鍵意圖：使用者曾按鍵（可能被引擎拒絕）；閘門僅在表達式確實變動時才開啟。
  const keyPressedRef = useRef(false);
  const prevExpressionRef = useRef(expression);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  // 鍵入即時回寫活躍列：純數字直接送出，含運算子時等引擎 preview（50ms 防抖）。
  useEffect(() => {
    const expressionChanged = expression !== prevExpressionRef.current;
    prevExpressionRef.current = expression;
    // 被拒按鍵不開閘門：僅在引擎確實改寫表達式的首次按鍵後，才進入回寫流程。
    if (!hasUserInputRef.current) {
      if (!expressionChanged || !keyPressedRef.current) return;
      hasUserInputRef.current = true;
    }
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

  // stale seed 修復：閘門開啟前外部值變動（如費率模式切換重算）時，同步種子重播表達式。
  // 必須排在回寫 effect 之後，確保首次有效按鍵先開啟閘門，自身回寫不會觸發重播。
  // 同步重置按鍵意圖，避免被拒按鍵殘留誤開閘門。
  useEffect(() => {
    if (hasUserInputRef.current || initialValue === seedValue) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 閘門關閉時同步外部種子，需依 ref 判斷不可於 render 期間讀取
    setSeedValue(initialValue);
    keyPressedRef.current = false;
  }, [initialValue, seedValue]);

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
      keyPressedRef.current = true;
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
      keyPressedRef.current = true;
      lightHaptic();
      backspace();
      return;
    }

    keyPressedRef.current = true;
    lightHaptic();
    input(key.value);
  };

  // #587：實體鍵盤直通同一計算引擎；鍵盤輸入視同按鍵意圖（與虛擬鍵共用回寫閘門）。
  const handlePhysicalInput = useCallback(
    (value: string) => {
      keyPressedRef.current = true;
      input(value);
    },
    [input],
  );
  const handlePhysicalBackspace = useCallback(() => {
    keyPressedRef.current = true;
    backspace();
  }, [backspace]);
  const handlePhysicalClear = useCallback(() => {
    keyPressedRef.current = true;
    clear();
  }, [clear]);
  // 常駐鍵盤無「關閉」語意；Esc 關 sheet 由 BottomSheet 自行處理（stopPropagation）。
  const handlePhysicalClose = useCallback(() => undefined, []);

  useCalculatorKeyboard({
    isOpen: keyboardEnabled,
    onInput: handlePhysicalInput,
    onBackspace: handlePhysicalBackspace,
    onClear: handlePhysicalClear,
    onCalculate: calculate,
    onClose: handlePhysicalClose,
    respectInteractiveTarget: true,
  });

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
