/**
 * Calculator Feature - Calculator Keyboard Component
 * @file CalculatorKeyboard.tsx
 * @description 計算機鍵盤主容器，包含佈局和 Bottom Sheet 行為
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 5.1, 7.4
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transitions } from '../../../config/animations';
import type { CalculatorKeyboardProps, KeyDefinition } from '../types';
import { useCalculator } from '../hooks/useCalculator';
import { useCalculatorKeyboard } from '../hooks/useCalculatorKeyboard';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { CalculatorKey } from './CalculatorKey';
import { ExpressionDisplay } from './ExpressionDisplay';
import { ChristmasEasterEgg } from '../easter-eggs/ChristmasEasterEgg';

/**
 * 鍵盤佈局定義（iOS 標準 4×5 網格，20 按鈕）
 * @description 符合 iOS 計算機標準佈局
 * @updated 2025-11-18 - 修正為 iOS 標準佈局（消除跨欄特殊情況）
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - Feature 4
 *
 * Linus 哲學：
 * - ✅ 消除特殊情況：所有按鈕等寬等高，無跨欄
 * - ✅ 簡潔執念：5 行 × 4 列，均勻分佈
 * - ✅ 實用主義：符合真實 iOS 佈局
 */
const KEYBOARD_LAYOUT: KeyDefinition[][] = [
  // 第 1 行：⌫, AC, %, ÷（功能鍵 + 除法）
  [
    { label: '⌫', value: 'backspace', type: 'action', ariaLabel: '刪除' },
    { label: 'AC', value: 'clear', type: 'action', ariaLabel: '清除全部' },
    { label: '%', value: 'percent', type: 'action', ariaLabel: '百分比' },
    { label: '÷', value: '÷', type: 'operator', ariaLabel: '除法' },
  ],
  // 第 2 行：7, 8, 9, ×（數字 + 乘法）
  [
    { label: '7', value: '7', type: 'number', ariaLabel: '數字 7' },
    { label: '8', value: '8', type: 'number', ariaLabel: '數字 8' },
    { label: '9', value: '9', type: 'number', ariaLabel: '數字 9' },
    { label: '×', value: '×', type: 'operator', ariaLabel: '乘法' },
  ],
  // 第 3 行：4, 5, 6, -（數字 + 減法）
  [
    { label: '4', value: '4', type: 'number', ariaLabel: '數字 4' },
    { label: '5', value: '5', type: 'number', ariaLabel: '數字 5' },
    { label: '6', value: '6', type: 'number', ariaLabel: '數字 6' },
    { label: '-', value: '-', type: 'operator', ariaLabel: '減法' },
  ],
  // 第 4 行：1, 2, 3, +（數字 + 加法）
  [
    { label: '1', value: '1', type: 'number', ariaLabel: '數字 1' },
    { label: '2', value: '2', type: 'number', ariaLabel: '數字 2' },
    { label: '3', value: '3', type: 'number', ariaLabel: '數字 3' },
    { label: '+', value: '+', type: 'operator', ariaLabel: '加法' },
  ],
  // 第 5 行：+/-, 0, ., =（正負號、0、小數點、計算）
  [
    { label: '+/-', value: 'negate', type: 'action', ariaLabel: '正負號切換' },
    { label: '0', value: '0', type: 'number', ariaLabel: '數字 0' },
    { label: '.', value: '.', type: 'decimal', ariaLabel: '小數點' },
    { label: '=', value: 'calculate', type: 'action', ariaLabel: '計算結果' },
  ],
];

/**
 * 計算機鍵盤元件
 * @description Bottom Sheet 樣式的計算機鍵盤，支援四則運算
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showCalculator, setShowCalculator] = useState(false);
 *
 *   return (
 *     <>
 *       <input onClick={() => setShowCalculator(true)} readOnly />
 *       <CalculatorKeyboard
 *         isOpen={showCalculator}
 *         onClose={() => setShowCalculator(false)}
 *         onConfirm={(result) => {
 *           console.log('Result:', result);
 *           setShowCalculator(false);
 *         }}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function CalculatorKeyboard({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
}: CalculatorKeyboardProps) {
  const { t } = useTranslation();

  // 🔧 Phase 2: 背景滾動鎖定（iOS/Android 兼容）
  // @see docs/dev/012_calculator_modal_sync_enhancement.md Feature 2
  useBodyScrollLock(isOpen);

  const {
    expression,
    result,
    error,
    preview,
    easterEgg,
    input,
    backspace,
    clear,
    calculate,
    negate,
    percent,
    closeEasterEgg,
  } = useCalculator(initialValue);

  /**
   * 處理按鍵點擊（iOS 標準功能）
   * @description 處理所有按鍵類型：數字、運算符、操作鍵
   * @updated 2025-11-18 - Added negate and percent handlers
   */
  const handleKeyClick = (value: string) => {
    switch (value) {
      case 'clear':
        clear();
        break;
      case 'backspace':
        backspace();
        break;
      case 'calculate': {
        const computedResult = calculate();
        if (computedResult !== null) {
          // 計算成功，將結果傳回父元件
          onConfirm(computedResult);
        }
        break;
      }
      case 'negate':
        // iOS 標準：正負號切換
        negate();
        break;
      case 'percent':
        // iOS 標準：百分比轉換
        percent();
        break;
      default:
        // 數字、運算符、小數點
        input(value);
    }
  };

  /**
   * 實體鍵盤快捷鍵支援
   */
  useCalculatorKeyboard({
    isOpen,
    onInput: input,
    onBackspace: backspace,
    onClear: clear,
    onCalculate: () => {
      const computedResult = calculate();
      if (computedResult !== null) {
        onConfirm(computedResult);
      }
    },
    onClose,
  });

  /**
   * 點擊背景關閉計算機
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * 處理向下滑動關閉
   * 🔧 Phase 3: 向下滑動關閉動畫 (>100px threshold)
   * @see docs/dev/012_calculator_modal_sync_enhancement.md Feature 3
   */
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number } },
  ) => {
    // 向下滑動超過 100px 則關閉
    if (info.offset.y > 100) {
      onClose();
    }
  };

  // Portal render to document.body with SSR guard
  if (typeof document === 'undefined') {
    return null; // Skip rendering during SSR
  }

  return createPortal(
    <>
      {/* 聖誕彩蛋 */}
      <ChristmasEasterEgg isVisible={easterEgg === 'christmas'} onClose={closeEasterEgg} />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              aria-hidden="true"
            />

            {/* Bottom Sheet 容器 */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={transitions.keyboardSheet}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              role="dialog"
              aria-modal="true"
              aria-label={t('calculator.title')}
            >
              {/* 拖曳指示器 */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-neutral-darker rounded-full" />
              </div>

              {/* 內容區域 */}
              <div className="px-6 pb-8">
                {/* 標題和關閉按鈕 */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-text">
                    {t('calculator.title')}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-neutral-text-muted hover:text-neutral-text-secondary transition-colors"
                    aria-label={t('calculator.close')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* 表達式顯示區 */}
                <ExpressionDisplay
                  expression={expression}
                  result={result}
                  error={error}
                  preview={preview}
                />

                {/* 鍵盤佈局（iOS 標準 5×4 網格，20 按鈕均勻分佈） */}
                <div className="space-y-3">
                  {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-4 gap-3">
                      {row.map((keyDef) => (
                        <CalculatorKey
                          key={keyDef.value}
                          keyDef={keyDef}
                          onClick={handleKeyClick}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
