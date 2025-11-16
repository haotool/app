/**
 * Calculator Feature - Calculator Key Component
 * @file CalculatorKey.tsx
 * @description 計算機單一按鍵元件，支援 Ripple 效果和無障礙功能
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 5.1, 7.4
 */

import { motion } from 'motion/react';
import type { CalculatorKeyProps } from '../types';

/**
 * 計算機按鍵元件
 * @description 單一按鍵元件，支援數字、運算符、操作鍵
 *
 * @example
 * ```tsx
 * <CalculatorKey
 *   keyDef={{ label: '7', value: '7', type: 'number', ariaLabel: '數字 7' }}
 *   onClick={(value, type) => console.log(value, type)}
 * />
 * ```
 */
export function CalculatorKey({ keyDef, onClick, disabled = false }: CalculatorKeyProps) {
  const { label, value, type, ariaLabel } = keyDef;

  /**
   * 按鍵樣式映射
   * @description 根據按鍵類型返回對應的 Tailwind CSS 類別
   */
  const getKeyStyles = (): string => {
    const baseStyles =
      'relative h-16 rounded-xl font-semibold transition-all duration-200 select-none overflow-hidden';

    // 數字鍵樣式
    if (type === 'number' || type === 'decimal') {
      return `${baseStyles} bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 text-2xl`;
    }

    // 運算符鍵樣式
    if (type === 'operator') {
      return `${baseStyles} bg-violet-100 text-violet-700 hover:bg-violet-200 active:bg-violet-300 text-2xl`;
    }

    // 操作鍵樣式（AC, ⌫）
    if (value === 'clear') {
      return `${baseStyles} bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 text-lg`;
    }

    if (value === 'backspace') {
      return `${baseStyles} bg-amber-100 text-amber-700 hover:bg-amber-200 active:bg-amber-300 text-lg`;
    }

    // 計算鍵樣式（=）
    if (value === 'calculate') {
      return `${baseStyles} bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 text-2xl col-span-3`;
    }

    return baseStyles;
  };

  /**
   * 處理按鍵點擊
   */
  const handleClick = () => {
    if (disabled) return;
    onClick(value);
  };

  return (
    <motion.button
      className={getKeyStyles()}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.1 }}
    >
      {/* Ripple 效果（CSS only，不使用 JS） */}
      <span className="relative z-10">{label}</span>

      {/* 禁用狀態遮罩 */}
      {disabled && <div className="absolute inset-0 bg-slate-300/50 cursor-not-allowed" />}
    </motion.button>
  );
}
