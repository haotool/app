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
import { getCalculatorKeyClasses } from '@app/ratewise/utils/classnames';
import { transitions, calculatorKeyVariants } from '../../../config/animations';
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
   * 🔄 重構 2026-01-22: 遷移到計算機專用 Design Token 系統 (iOS-inspired)
   * - 數字鍵：calcNumber（深灰背景、白字）
   * - 運算符：calcOperator（橙色背景、白字）- 含等號
   * - 功能鍵：calcFunction（淺灰背景、深色字）- AC, ⌫, %, +/-
   *
   * @see src/utils/classnames.ts - 計算機專用 token 類別
   * @see src/index.css - 6 種風格的 CSS Variables 定義
   * @see Apple Calculator、UX Collective 最佳實踐
   *
   * 🐛 修復：移除通用 transition，避免與 Motion 動畫衝突
   * @see Bug Report 2025-11-19 - 按鈕放大動畫未顯現
   *
   * 🔄 重構 2026-01-23: 分離運算符與等號樣式
   * - 運算符（+, -, ×, ÷）：淺色背景、深色字
   * - 等號（=）：深色背景、淺色字（最高視覺優先）
   */
  const getKeyStyles = (): string => {
    // 數字鍵樣式（淺灰背景、深色字）- 背景級視覺優先
    if (type === 'number' || type === 'decimal') {
      return getCalculatorKeyClasses('calcNumber', { size: 'text-2xl' });
    }

    // 運算符鍵樣式（淺色背景、深色字）- 中等視覺優先級
    if (type === 'operator') {
      return getCalculatorKeyClasses('calcOperator', {
        size: 'text-2xl',
        customClass: 'calculator-key--operator',
      });
    }

    // 清除鍵樣式（淺灰背景、深色字）- iOS 標準
    if (value === 'clear') {
      return getCalculatorKeyClasses('calcFunction', { size: 'text-lg' });
    }

    // 刪除鍵樣式（淺灰背景、深色字）- iOS 標準
    if (value === 'backspace') {
      return getCalculatorKeyClasses('calcFunction', { size: 'text-lg' });
    }

    // 功能鍵樣式（%, +/-）- 淺灰背景、深色字
    if (value === 'percent' || value === 'negate') {
      return getCalculatorKeyClasses('calcFunction', { size: 'text-lg' });
    }

    // 等號鍵樣式（=）- 深色背景、淺色字（最高視覺優先級）
    if (value === 'calculate') {
      return getCalculatorKeyClasses('calcEquals', {
        size: 'text-2xl',
        customClass: 'calculator-key--equals',
      });
    }

    // 基礎樣式（應該不會到達這裡）
    return 'calculator-key relative h-16 rounded-lg font-semibold select-none overflow-hidden';
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
      whileTap={calculatorKeyVariants.tap}
      whileHover={calculatorKeyVariants.hover}
      transition={transitions.spring}
      // 🔧 修復 2025-11-20：使用 Motion.js 手勢 API 替代原生 touch 事件
      // 這確保移動裝置上 whileTap 動畫正常工作（不會被 onTouchStart/onTouchEnd 干擾）
      onTapStart={isBackspace ? handleLongPressStart : undefined}
      onTap={handleTap}
      onTapCancel={isBackspace ? handleTapCancel : undefined}
    >
      {/* 🔧 移除 Ripple 效果註解（CSS 動畫已移除，避免與 Motion 衝突） */}
      <span className="relative z-10">{label}</span>

      {/* 禁用狀態遮罩 */}
      {disabled && <div className="absolute inset-0 bg-neutral-darker/50 cursor-not-allowed" />}
    </motion.button>
  );
}
