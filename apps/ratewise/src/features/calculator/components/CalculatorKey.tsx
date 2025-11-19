/**
 * Calculator Feature - Calculator Key Component
 * @file CalculatorKey.tsx
 * @description 計算機單一按鍵元件，支援 Ripple 效果和無障礙功能
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 5.1, 7.4
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - Apple UX 增強
 */

import { motion } from 'motion/react';
import type { CalculatorKeyProps } from '../types';
import { useLongPress } from '../hooks/useLongPress';
import { lightHaptic, mediumHaptic } from '../utils/haptics';
import '../styles/calculator-animations.css';

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
   *
   * 🐛 修復：移除 transition-all，避免與 Motion 動畫衝突
   * @see Bug Report 2025-11-19 - 按鈕放大動畫未顯現
   */
  const getKeyStyles = (): string => {
    // ✅ 移除 transition-all，讓 Motion 完全控制動畫（修復 whileTap 失效）
    const baseStyles =
      'calculator-key relative h-16 rounded-xl font-semibold select-none overflow-hidden';

    // 數字鍵樣式
    if (type === 'number' || type === 'decimal') {
      return `${baseStyles} bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 text-2xl`;
    }

    // 運算符鍵樣式（添加 calculator-key--operator 以支援客製化漣漪）
    if (type === 'operator') {
      return `${baseStyles} calculator-key--operator bg-violet-100 text-violet-700 hover:bg-violet-200 active:bg-violet-300 text-2xl`;
    }

    // 操作鍵樣式（AC, ⌫, %, +/-）
    if (value === 'clear') {
      return `${baseStyles} bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 text-lg`;
    }

    if (value === 'backspace') {
      return `${baseStyles} bg-amber-100 text-amber-700 hover:bg-amber-200 active:bg-amber-300 text-lg`;
    }

    // 功能鍵樣式（%, +/-）- iOS 標準淺灰色
    if (value === 'percent' || value === 'negate') {
      return `${baseStyles} bg-slate-200 text-slate-700 hover:bg-slate-300 active:bg-slate-400 text-lg`;
    }

    // 計算鍵樣式（=）- 移除 col-span-3，單一格大小
    if (value === 'calculate') {
      return `${baseStyles} calculator-key--equals bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 text-2xl`;
    }

    return baseStyles;
  };

  /**
   * 處理按鍵點擊（包含觸覺回饋）
   */
  const handleClick = () => {
    if (disabled) return;

    // 觸覺回饋（iOS 風格）
    if (value === 'calculate' || value === 'clear') {
      mediumHaptic(); // 重要操作使用中度震動
    } else {
      lightHaptic(); // 一般操作使用輕量震動
    }

    onClick(value);
  };

  /**
   * 長按處理（僅用於 backspace）
   * iOS 優化加速刪除：500ms 觸發 → 100ms 間隔（參考 iOS Calculator 標準）
   * @see Web Research 2025-11-19 - iOS backspace 初始延遲 0.5s，後續 0.1s 間隔
   *
   * 🐛 修復：移除 handleClick() 呼叫，避免雙重觸發（點一下刪兩個）
   * @see Bug Report 2025-11-19 - 用戶反饋刪除速度過快
   */
  const longPressProps = useLongPress({
    onLongPress: () => {
      if (disabled || value !== 'backspace') return;
      lightHaptic(); // 每次刪除都有觸覺回饋
      onClick(value);
    },
    onClick:
      value === 'backspace'
        ? () => {
            if (disabled) return;
            lightHaptic(); // 單擊觸覺回饋
            onClick(value); // ✅ 直接呼叫，避免雙重觸發（修復前：handleClick() 導致雙重呼叫）
          }
        : undefined,
    threshold: 500, // iOS 標準初始延遲：500ms（防止誤觸）
  });

  // Backspace 鍵使用長按；其他鍵使用一般點擊
  const isBackspace = value === 'backspace';

  return (
    <motion.button
      className={getKeyStyles()}
      onClick={isBackspace ? undefined : handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={{ scale: 1.1 }} // 放大到 110%：更明顯的視覺反饋
      whileHover={{ scale: 1.02 }} // 輕微放大：避免過度動畫
      transition={{
        duration: 0.1, // iOS 極速回饋：100ms（< 16ms 視覺回饋 + 動畫流暢）
        type: 'spring',
        stiffness: 500, // 提高剛性：更快反應
        damping: 30, // 提高阻尼：減少彈跳
      }}
      {...(isBackspace ? longPressProps : {})}
    >
      {/* Ripple 效果（由 CSS calculator-animations.css 提供） */}
      <span className="relative z-10">{label}</span>

      {/* 禁用狀態遮罩 */}
      {disabled && <div className="absolute inset-0 bg-slate-300/50 cursor-not-allowed" />}
    </motion.button>
  );
}
