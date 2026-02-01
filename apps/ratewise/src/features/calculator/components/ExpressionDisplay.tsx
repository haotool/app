/**
 * Calculator Feature - Expression Display Component
 * @file ExpressionDisplay.tsx
 * @description 表達式和結果顯示區域（全面套用千位分隔符格式化）
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 7.4
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - Feature 7, 8（即時預覽、格式化）
 * @updated 2025-11-19 - 算式區套用千位分隔符（提升 UX 可讀性，優於 iOS Calculator）
 *
 * Linus 哲學：
 * - ✅ 重用現有工具：使用 formatExpression 格式化算式
 * - ✅ 實用主義：改善可讀性，優於嚴格複製 iOS
 * - ✅ 簡潔執念：單一職責，formatExpression 處理算式格式化
 */

import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transitions } from '../../../config/animations';
import type { ExpressionDisplayProps } from '../types';
import { formatCalculatorNumber, formatExpression } from '../utils/formatCalculatorNumber';

/**
 * 表達式顯示元件
 * @description 顯示當前輸入的表達式、即時預覽、計算結果和錯誤訊息
 *
 * @example
 * ```tsx
 * <ExpressionDisplay
 *   expression="100 + 50 × 2"
 *   preview={200}
 *   result={null}
 *   error={null}
 * />
 * ```
 */
export function ExpressionDisplay({ expression, result, error, preview }: ExpressionDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 space-y-2">
      {/* 表達式顯示區（套用千位分隔符，提升 UX 可讀性） */}
      <div className="min-h-[3rem] rounded-xl bg-neutral-bg px-4 py-3 relative">
        <div
          className="text-right text-2xl text-neutral-text-secondary font-mono tabular-nums overflow-x-auto scrollbar-hide"
          role="status"
          aria-label={t('calculator.currentExpression')}
        >
          {expression ? (
            formatExpression(expression)
          ) : (
            <span className="text-neutral-text-muted text-base font-sans">
              {t('calculator.inputPlaceholder')}
            </span>
          )}
        </div>

        {/* 即時預覽（Apple 風格：淡化文字，顯示於表達式下方，含千位分隔符） */}
        <AnimatePresence>
          {preview !== null && preview !== undefined && !result && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={transitions.calculatorFeedback}
              className="text-right text-lg text-neutral-text-muted font-mono tabular-nums mt-1"
              role="status"
              aria-label={t('calculator.previewResult', { value: formatCalculatorNumber(preview) })}
              aria-live="polite"
            >
              = {formatCalculatorNumber(preview)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 結果顯示區（含千位分隔符格式化） */}
      {result !== null && !error && (
        <motion.div
          className="rounded-xl bg-primary-bg px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }} // iOS 極速回饋：150ms
        >
          <div className="text-sm text-primary font-medium mb-1">
            {t('calculator.calculationResult')}
          </div>
          <div
            className="text-right text-3xl font-bold text-primary-dark font-mono tabular-nums"
            role="status"
            aria-label={t('calculator.resultIs', { value: formatCalculatorNumber(result) })}
            aria-live="polite"
          >
            = {formatCalculatorNumber(result)}
          </div>
        </motion.div>
      )}

      {/* 錯誤訊息顯示區 */}
      {error && (
        <motion.div
          className="rounded-xl bg-danger-bg px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }} // iOS 極速回饋：150ms
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-danger-text flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-danger font-medium">{error}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
