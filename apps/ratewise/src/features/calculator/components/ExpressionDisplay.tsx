/**
 * Calculator Feature - Expression Display Component
 * @file ExpressionDisplay.tsx
 * @description 表達式和結果顯示區域
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 7.4
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - 即時預覽顯示
 */

import { motion, AnimatePresence } from 'motion/react';
import type { ExpressionDisplayProps } from '../types';
import { formatResult } from '../utils/evaluator';

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
  return (
    <div className="mb-6 space-y-2">
      {/* 表達式顯示區 */}
      <div className="min-h-[3rem] rounded-xl bg-slate-50 px-4 py-3 relative">
        <div
          className="text-right text-2xl text-slate-700 font-mono tabular-nums overflow-x-auto scrollbar-hide"
          role="status"
          aria-label="當前表達式"
        >
          {expression || (
            <span className="text-slate-400 text-base font-sans">輸入數字或表達式</span>
          )}
        </div>

        {/* 即時預覽（Apple 風格：淡化文字，顯示於表達式下方） */}
        <AnimatePresence>
          {preview !== null && preview !== undefined && !result && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-right text-lg text-slate-400 font-mono tabular-nums mt-1"
              role="status"
              aria-label={`預覽結果 ${formatResult(preview)}`}
              aria-live="polite"
            >
              = {formatResult(preview)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 結果顯示區 */}
      {result !== null && !error && (
        <motion.div
          className="rounded-xl bg-violet-50 px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-sm text-violet-600 font-medium mb-1">計算結果</div>
          <div
            className="text-right text-3xl font-bold text-violet-700 font-mono tabular-nums"
            role="status"
            aria-label={`計算結果為 ${formatResult(result)}`}
            aria-live="polite"
          >
            = {formatResult(result)}
          </div>
        </motion.div>
      )}

      {/* 錯誤訊息顯示區 */}
      {error && (
        <motion.div
          className="rounded-xl bg-red-50 px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0"
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
            <div className="text-red-700 font-medium">{error}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
