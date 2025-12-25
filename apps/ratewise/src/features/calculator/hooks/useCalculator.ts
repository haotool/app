/**
 * Calculator Feature - Calculator Logic Hook
 * @file useCalculator.ts
 * @description 計算機核心邏輯的 React Hook
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 7.3
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - 即時預覽功能
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { CalculatorState, UseCalculatorReturn, EasterEggType } from '../types';
import { calculateExpression } from '../utils/evaluator';
import { validateExpression, canAddOperator, canAddDecimal, canAddDigit } from '../utils/validator';
import { useDebounce } from './useDebounce';
import { isChristmasEasterEgg } from '../easter-eggs/utils';

/**
 * 計算機 Hook
 * @description 管理計算機的狀態和操作邏輯
 * @param initialValue - 初始值（optional，用於編輯模式）
 * @returns 計算機狀態和操作函數
 *
 * @example
 * ```tsx
 * function Calculator() {
 *   const { expression, result, error, input, backspace, clear, calculate } = useCalculator();
 *
 *   return (
 *     <div>
 *       <div>{expression}</div>
 *       <div>{result}</div>
 *       <button onClick={() => input('100')}>100</button>
 *       <button onClick={() => input('+')}>+</button>
 *       <button onClick={calculate}>=</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCalculator(initialValue?: number): UseCalculatorReturn {
  // 初始化狀態
  const [state, setState] = useState<CalculatorState>({
    expression: initialValue?.toString() ?? '',
    result: null,
    error: null,
  });

  // 即時預覽狀態（獨立於主要結果）
  const [preview, setPreview] = useState<number | null>(null);

  // 彩蛋狀態
  const [easterEgg, setEasterEgg] = useState<EasterEggType>(null);

  /**
   * 同步 initialValue 變更
   * @description 修復計算機與輸入框數值不同步問題
   * @see BDD Test: 應在 initialValue 變更時重置表達式
   *
   * Linus 哲學：
   * - ✅ 解決實際問題：輸入框與計算機數值不同步
   * - ✅ 簡潔執念：只有 initialValue 變更時才重置
   * - ✅ 實用主義：不影響使用者正在輸入的運算式
   */
  useEffect(() => {
    setState({
      expression: initialValue?.toString() ?? '',
      result: null,
      error: null,
    });
    setPreview(null);
  }, [initialValue]);

  // 防抖表達式（50ms 延遲，極速響應 - iOS 標準！）
  // @updated 2025-11-19 - 極速優化（100ms → 50ms，< 60fps 一幀時間）
  const debouncedExpression = useDebounce(state.expression, 50);

  /**
   * 輸入數字或運算符
   * @param value - 輸入值（數字或運算符）
   */
  const input = useCallback((value: string) => {
    setState((prev) => {
      let newExpression = prev.expression;

      // 如果上次計算有結果，且輸入的是數字，清空表達式重新開始
      if (prev.result !== null && /^\d$/.test(value)) {
        newExpression = value;
      }
      // 如果上次計算有結果，且輸入的是運算符，以結果繼續計算
      else if (prev.result !== null && ['+', '-', '×', '÷'].includes(value)) {
        newExpression = `${prev.result} ${value} `;
      }
      // 運算符檢查
      else if (['+', '-', '×', '÷'].includes(value)) {
        if (!canAddOperator(newExpression)) {
          return prev; // 不允許添加運算符，保持原狀態
        }
        newExpression = `${newExpression} ${value} `;
      }
      // 小數點檢查
      else if (value === '.') {
        if (!canAddDecimal(newExpression)) {
          return prev; // 不允許添加小數點
        }
        // 如果表達式為空或最後是運算符，自動補 0
        if (newExpression === '' || /[+\-×÷]\s*$/.test(newExpression)) {
          newExpression = `${newExpression}0.`;
        } else {
          newExpression = `${newExpression}.`;
        }
      }
      // 數字輸入（新增：iOS 標準數字長度驗證）
      else {
        // iOS 標準：檢查數字長度（9 位整數 + 8 位小數）
        if (!canAddDigit(newExpression, value)) {
          return prev; // 超出範圍，拒絕輸入
        }
        newExpression = `${newExpression}${value}`;
      }

      return {
        expression: newExpression,
        result: null, // 新輸入時清除結果
        error: null,
      };
    });
  }, []);

  /**
   * 刪除最後一個字元（Backspace）
   */
  const backspace = useCallback(() => {
    setState((prev) => {
      if (prev.expression === '') {
        return prev;
      }

      // 移除最後一個字元
      let newExpression = prev.expression.slice(0, -1);

      // 如果刪除後末尾是空格，繼續刪除（移除整個運算符）
      while (newExpression.endsWith(' ')) {
        newExpression = newExpression.slice(0, -1);
      }

      return {
        expression: newExpression,
        result: null,
        error: null,
      };
    });
  }, []);

  /**
   * 清除所有內容（AC - All Clear）
   */
  const clear = useCallback(() => {
    setState({
      expression: '',
      result: null,
      error: null,
    });
  }, []);

  /**
   * 正負號切換（+/-）
   * @description iOS 標準功能：切換當前數字的正負號
   * @see docs/dev/011_calculator_apple_ux_enhancements.md - Feature 5
   *
   * Linus 哲學：
   * - ✅ 簡潔執念：正則匹配最後一個數字，直接操作
   * - ✅ 消除特殊情況：統一處理正數和負數
   */
  const negate = useCallback(() => {
    setState((prev) => {
      const { expression } = prev;

      // 空表達式：無操作
      if (expression === '') return prev;

      // 正則：匹配最後一個數字（含負號）
      // 例如："5 + 3" → 匹配 "3"
      // 例如："5 + -3" → 匹配 "-3"
      const lastNumberRegex = /-?\d+\.?\d*$/;
      const match = lastNumberRegex.exec(expression);

      if (!match) return prev; // 沒有數字可切換

      const lastNumber = match[0];
      const startIndex = match.index;

      // 切換正負號：如果有負號則移除，沒有則加上
      const toggledNumber = lastNumber.startsWith('-') ? lastNumber.slice(1) : `-${lastNumber}`;

      // 替換最後一個數字
      const newExpression = expression.slice(0, startIndex) + toggledNumber;

      return {
        expression: newExpression,
        result: null,
        error: null,
      };
    });
  }, []);

  /**
   * 百分比轉換（%）
   * @description iOS 標準功能：當前值 ÷ 100
   * @see docs/dev/011_calculator_apple_ux_enhancements.md - Feature 6
   *
   * Linus 哲學：
   * - ✅ 實用主義：簡單的數學運算，不引入複雜邏輯
   * - ✅ 簡潔執念：找到最後數字 → 除以 100 → 替換
   */
  const percent = useCallback(() => {
    setState((prev) => {
      const { expression } = prev;

      // 空表達式：無操作
      if (expression === '') return prev;

      // 正則：匹配最後一個數字
      const lastNumberRegex = /-?\d+\.?\d*$/;
      const match = lastNumberRegex.exec(expression);

      if (!match) return prev; // 沒有數字可轉換

      const lastNumber = parseFloat(match[0]);
      const startIndex = match.index;

      // 計算百分比：除以 100
      const percentValue = lastNumber / 100;

      // 替換最後一個數字
      const newExpression = expression.slice(0, startIndex) + percentValue;

      return {
        expression: newExpression,
        result: null,
        error: null,
      };
    });
  }, []);

  /**
   * 執行計算（等號）
   * @returns 計算結果或 null（發生錯誤時）
   */
  const calculate = useCallback(() => {
    // 彩蛋檢測：在計算前檢查是否為聖誕彩蛋表達式
    if (isChristmasEasterEgg(state.expression)) {
      setEasterEgg('christmas');
      // 仍然執行正常計算，但同時觸發彩蛋
    }

    // 驗證表達式
    const validation = validateExpression(state.expression);
    if (!validation.isValid) {
      setState((prev) => ({
        ...prev,
        error: validation.error,
        result: null,
      }));
      return null;
    }

    try {
      // 計算結果
      const result = calculateExpression(state.expression);

      setState((prev) => ({
        ...prev,
        result,
        error: null,
      }));

      // 清除預覽（已顯示最終結果）
      setPreview(null);

      return result;
    } catch (error) {
      // 錯誤處理
      const errorMessage = error instanceof Error ? error.message : '計算錯誤';

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        result: null,
      }));

      return null;
    }
  }, [state.expression]);

  /**
   * 關閉彩蛋
   */
  const closeEasterEgg = useCallback(() => {
    setEasterEgg(null);
  }, []);

  /**
   * 即時預覽計算（防抖後自動觸發）
   * 使用 useMemo 快取計算結果，避免不必要的重新計算
   */
  const calculatedPreview = useMemo(() => {
    // 不預覽空表達式
    if (!debouncedExpression || debouncedExpression.trim() === '') {
      return null;
    }

    // 不預覽已有最終結果的表達式
    if (state.result !== null) {
      return null;
    }

    // 驗證表達式（靜默失敗，不顯示錯誤）
    const validation = validateExpression(debouncedExpression);
    if (!validation.isValid) {
      return null;
    }

    try {
      // 計算預覽結果
      return calculateExpression(debouncedExpression);
    } catch {
      // 計算失敗時返回 null（不顯示預覽）
      return null;
    }
  }, [debouncedExpression, state.result]);

  /**
   * 更新預覽狀態（當計算結果變化時）
   */
  useEffect(() => {
    setPreview(calculatedPreview);
  }, [calculatedPreview]);

  return {
    expression: state.expression,
    result: state.result,
    error: state.error,
    preview, // 新增：即時預覽結果
    easterEgg, // 新增：彩蛋狀態
    input,
    backspace,
    clear,
    calculate,
    negate, // 新增：正負號切換（+/-）
    percent, // 新增：百分比轉換（%）
    closeEasterEgg, // 新增：關閉彩蛋
  };
}
