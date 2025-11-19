/**
 * Calculator Feature - Calculator Key Component
 * @file CalculatorKey.tsx
 * @description 計算機單一按鍵元件，支援 Ripple 效果和無障礙功能
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 5.1, 7.4
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - Apple UX 增強
 */

import { motion } from 'motion/react';
import { useRef } from 'react';
import type { CalculatorKeyProps } from '../types';
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
   * 長按計時器參考（僅用於 backspace）
   * 🔧 修復 2025-11-20：使用 Motion.js 手勢 API 替代原生事件，避免移動裝置動畫失效
   * 🔧 修復 2025-11-20 #122：添加長按狀態追蹤，防止長按後立即抬起導致雙重刪除
   */
  const longPressTimerRef = useRef<number | null>(null);
  const longPressIntervalRef = useRef<number | null>(null);
  const isLongPressActiveRef = useRef(false); // 追蹤是否已進入長按模式

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
   * 清除所有長按計時器和狀態
   * 🔧 修復 2025-11-20 #122：同時重置長按狀態標記
   */
  const clearLongPressTimers = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
    isLongPressActiveRef.current = false; // 重置長按狀態
  };

  /**
   * 處理長按開始（使用 Motion.js onTapStart）
   * 🔧 修復 2025-11-20：使用 Motion 手勢 API，確保移動裝置 whileTap 動畫正常
   * 🔧 修復 2025-11-20 #122：重置長按狀態，防止舊狀態干擾
   */
  const handleLongPressStart = () => {
    if (disabled || value !== 'backspace') return;

    // 重置長按狀態（每次新的按下都重置）
    isLongPressActiveRef.current = false;

    // 啟動長按計時器：500ms 後開始連續刪除
    longPressTimerRef.current = window.setTimeout(() => {
      // 標記進入長按模式
      isLongPressActiveRef.current = true;

      // 第一次觸發
      lightHaptic();
      onClick(value);

      // 啟動連續刪除：每 150ms 觸發一次
      longPressIntervalRef.current = window.setInterval(() => {
        lightHaptic();
        onClick(value);
      }, 150);
    }, 500);
  };

  /**
   * 處理 Tap 手勢（使用 Motion.js onTap）
   * 🔧 修復 2025-11-20：使用 Motion 手勢 API，確保移動裝置 whileTap 動畫正常
   * 🔧 修復 2025-11-20 #122：檢查長按狀態，防止長按後立即抬起導致雙重刪除
   */
  const handleTap = () => {
    if (disabled) return;

    // 檢查是否在長按模式（長按已觸發後抬起）
    const wasLongPress = isLongPressActiveRef.current;

    // 清除長按計時器和狀態
    clearLongPressTimers();

    // 如果是長按後抬起，不執行點擊（避免雙重刪除）
    if (wasLongPress) {
      return; // 長按已處理刪除，直接返回
    }

    // 短按才執行以下邏輯
    // 觸覺回饋（iOS 風格）
    if (value === 'calculate' || value === 'clear') {
      mediumHaptic(); // 重要操作使用中度震動
    } else {
      lightHaptic(); // 一般操作使用輕量震動
    }

    // 觸發點擊
    onClick(value);
  };

  /**
   * 處理 Tap 取消（使用 Motion.js onTapCancel）
   * 🔧 修復 2025-11-20：使用 Motion 手勢 API，確保移動裝置 whileTap 動畫正常
   * 🔧 修復 2025-11-20 #122：清除計時器和狀態（由 clearLongPressTimers 統一處理）
   */
  const handleTapCancel = () => {
    clearLongPressTimers(); // 清除計時器並重置 isLongPressActiveRef
  };

  /**
   * Backspace 鍵需要特殊處理（長按 + 短按）
   * 其他按鍵只需要短按
   */
  const isBackspace = value === 'backspace';

  return (
    <motion.button
      className={getKeyStyles()}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={{ scale: 1.1 }} // 🔧 放大到 110%：更明顯的視覺反饋
      whileHover={{ scale: 1.02 }} // 輕微放大：避免過度動畫
      transition={{
        duration: 0.1, // iOS 極速回饋：100ms
        type: 'spring',
        stiffness: 500, // 提高剛性：更快反應
        damping: 30, // 提高阻尼：減少彈跳
      }}
      // 🔧 修復 2025-11-20：使用 Motion.js 手勢 API 替代原生 touch 事件
      // 這確保移動裝置上 whileTap 動畫正常工作（不會被 onTouchStart/onTouchEnd 干擾）
      onTapStart={isBackspace ? handleLongPressStart : undefined}
      onTap={handleTap}
      onTapCancel={isBackspace ? handleTapCancel : undefined}
    >
      {/* 🔧 移除 Ripple 效果註解（CSS 動畫已移除，避免與 Motion 衝突） */}
      <span className="relative z-10">{label}</span>

      {/* 禁用狀態遮罩 */}
      {disabled && <div className="absolute inset-0 bg-slate-300/50 cursor-not-allowed" />}
    </motion.button>
  );
}
