/**
 * Calculator Feature - Keyboard Shortcuts Hook
 * @file useCalculatorKeyboard.ts
 * @description 處理實體鍵盤輸入，支援數字、運算符和操作鍵
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 7.5
 */

import { useEffect } from 'react';

// 常駐鍵盤情境下 Enter/Escape 應讓路的互動元素（交還原生語意）。
const INTERACTIVE_TARGET_SELECTOR = 'button, a[href], select, summary, [role="button"]';

interface UseCalculatorKeyboardProps {
  /** 計算機是否開啟 */
  isOpen: boolean;
  /** 輸入數字或運算符 */
  onInput: (value: string) => void;
  /** 刪除最後一個字元 */
  onBackspace: () => void;
  /** 清除全部 */
  onClear: () => void;
  /** 計算結果 */
  onCalculate: () => void;
  /** 關閉計算機 */
  onClose: () => void;
  /**
   * 常駐鍵盤情境（如 v2 keypad）：Enter/Escape 落在互動元素上時不攔截，
   * 保留按鈕、連結的原生鍵盤語意。預設 false 維持 v1 modal 行為。
   */
  respectInteractiveTarget?: boolean;
}

/**
 * 實體鍵盤快捷鍵 Hook
 *
 * @description 支援的按鍵:
 * - 數字: 0-9
 * - 小數點: .
 * - 運算符: + - * / (自動轉換 × ÷)
 * - Enter: 計算結果
 * - Backspace: 刪除
 * - Escape: 清除或關閉
 * - Delete: 清除全部
 *
 * @example
 * ```tsx
 * useCalculatorKeyboard({
 *   isOpen: true,
 *   onInput: input,
 *   onBackspace: backspace,
 *   onClear: clear,
 *   onCalculate: calculate,
 *   onClose: () => setIsOpen(false)
 * });
 * ```
 */
export function useCalculatorKeyboard({
  isOpen,
  onInput,
  onBackspace,
  onClear,
  onCalculate,
  onClose,
  respectInteractiveTarget = false,
}: UseCalculatorKeyboardProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 系統快捷鍵讓路：Cmd/Ctrl/Alt 組合（如 Cmd+'-' 瀏覽器縮放）不得攔截或寫入表達式。
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // 防止影響其他輸入框
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 常駐鍵盤情境：Enter/Escape 落在互動元素上時交還原生語意（如按鈕觸發、row 切換）。
      if (
        respectInteractiveTarget &&
        (e.key === 'Enter' || e.key === 'Escape') &&
        e.target instanceof HTMLElement &&
        e.target.closest(INTERACTIVE_TARGET_SELECTOR) !== null
      ) {
        return;
      }

      // 數字和小數點
      if (/^[0-9.]$/.test(e.key)) {
        e.preventDefault();
        onInput(e.key);
      }
      // 加法
      else if (e.key === '+') {
        e.preventDefault();
        onInput('+');
      }
      // 減法
      else if (e.key === '-') {
        e.preventDefault();
        onInput('-');
      }
      // 乘法 (鍵盤 * 轉換為 ×)
      else if (e.key === '*') {
        e.preventDefault();
        onInput('×');
      }
      // 除法 (鍵盤 / 轉換為 ÷)
      else if (e.key === '/') {
        e.preventDefault();
        onInput('÷');
      }
      // 計算結果
      else if (e.key === 'Enter') {
        e.preventDefault();
        onCalculate();
      }
      // 刪除最後一個字元
      else if (e.key === 'Backspace') {
        e.preventDefault();
        onBackspace();
      }
      // ESC: 清除或關閉
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Delete: 清除全部
      else if (e.key === 'Delete') {
        e.preventDefault();
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onInput, onBackspace, onClear, onCalculate, onClose, respectInteractiveTarget]);
}
