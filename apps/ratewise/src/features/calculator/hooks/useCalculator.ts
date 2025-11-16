/**
 * Calculator Feature - Calculator Logic Hook
 * @file useCalculator.ts
 * @description 計算機核心邏輯的 React Hook
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 7.3
 */

import { useState, useCallback } from 'react';
import type { CalculatorState, UseCalculatorReturn } from '../types';
import { calculateExpression } from '../utils/evaluator';
import { validateExpression, canAddOperator, canAddDecimal } from '../utils/validator';

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
      // 數字輸入
      else {
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
   * 執行計算（等號）
   * @returns 計算結果或 null（發生錯誤時）
   */
  const calculate = useCallback(() => {
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

  return {
    expression: state.expression,
    result: state.result,
    error: state.error,
    input,
    backspace,
    clear,
    calculate,
  };
}
