import { useState, useCallback } from 'react';

/**
 * 計算機 Modal 狀態管理 Hook
 * @description 統一管理單幣別與多幣別計算機的狀態與邏輯
 * @template T - 欄位類型 (例如: 'from' | 'to' 或 CurrencyCode)
 */

export interface UseCalculatorModalOptions<T extends string> {
  /**
   * 確認計算結果的回調
   * @param field - 當前操作的欄位
   * @param result - 計算結果
   */
  onConfirm: (field: T, result: number) => void;

  /**
   * 獲取欄位的初始值
   * @param field - 當前操作的欄位
   * @returns 初始數值
   */
  getInitialValue: (field: T) => number;
}

export interface UseCalculatorModalReturn<T extends string> {
  /** 計算機是否開啟 */
  isOpen: boolean;

  /** 當前活動的欄位 */
  activeField: T | null;

  /** 當前欄位的初始值 */
  initialValue: number;

  /**
   * 打開計算機
   * @param field - 要編輯的欄位
   */
  openCalculator: (field: T) => void;

  /**
   * 關閉計算機
   */
  closeCalculator: () => void;

  /**
   * 處理計算結果確認
   * @param result - 計算結果
   */
  handleConfirm: (result: number) => void;
}

/**
 * 計算機 Modal Hook
 * @example
 * ```typescript
 * // 單幣別使用
 * const calculator = useCalculatorModal<'from' | 'to'>({
 *   onConfirm: (field, result) => {
 *     if (field === 'from') {
 *       onFromAmountChange(result.toString());
 *     } else {
 *       onToAmountChange(result.toString());
 *     }
 *   },
 *   getInitialValue: (field) => {
 *     return field === 'from' ? parseFloat(fromAmount) || 0 : parseFloat(toAmount) || 0;
 *   },
 * });
 *
 * // 多幣別使用
 * const calculator = useCalculatorModal<CurrencyCode>({
 *   onConfirm: (currency, result) => {
 *     onAmountChange(currency, result.toString());
 *   },
 *   getInitialValue: (currency) => {
 *     return parseFloat(multiAmounts[currency]) || 0;
 *   },
 * });
 * ```
 */
export function useCalculatorModal<T extends string>(
  options: UseCalculatorModalOptions<T>,
): UseCalculatorModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<T | null>(null);

  const openCalculator = useCallback((field: T) => {
    setActiveField(field);
    setIsOpen(true);
  }, []);

  const closeCalculator = useCallback(() => {
    setIsOpen(false);
    setActiveField(null);
  }, []);

  const handleConfirm = useCallback(
    (result: number) => {
      if (activeField) {
        options.onConfirm(activeField, result);
        closeCalculator();
      }
    },
    [activeField, options, closeCalculator],
  );

  const initialValue = activeField ? options.getInitialValue(activeField) : 0;

  return {
    isOpen,
    activeField,
    initialValue,
    openCalculator,
    closeCalculator,
    handleConfirm,
  };
}
