/**
 * Calculator Feature - Expression Evaluator
 * @file evaluator.ts
 * @description 數學表達式求值器，封裝 expr-eval 套件
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 2.1
 *
 * @requires expr-eval - 安裝指令: pnpm add expr-eval
 * @requires @types/expr-eval - 安裝指令: pnpm add -D @types/expr-eval
 */

import { Parser } from 'expr-eval';

/**
 * 運算符對應表
 * @description 將用戶友善的符號轉換為 expr-eval 可識別的符號
 */
const OPERATOR_MAP: Record<string, string> = {
  '×': '*', // 乘號轉換為星號
  '÷': '/', // 除號轉換為斜線
  '+': '+', // 加號不變
  '-': '-', // 減號不變
};

/**
 * 標準化表達式
 * @description 將表達式中的用戶友善符號轉換為標準數學符號
 * @param expression - 原始表達式（例如："100 + 50 × 2"）
 * @returns 標準化後的表達式（例如："100 + 50 * 2"）
 *
 * @example
 * ```ts
 * normalizeExpression('100 ÷ 5 × 2'); // "100 / 5 * 2"
 * normalizeExpression('50 + 30 - 10'); // "50 + 30 - 10"
 * ```
 */
function normalizeExpression(expression: string): string {
  let normalized = expression;

  // 替換所有運算符為標準符號
  Object.entries(OPERATOR_MAP).forEach(([userSymbol, standardSymbol]) => {
    normalized = normalized.replace(new RegExp(`\\${userSymbol}`, 'g'), standardSymbol);
  });

  return normalized.trim();
}

/**
 * 計算數學表達式
 * @description 安全地計算數學表達式，遵循運算優先級（PEMDAS）
 * @param expression - 數學表達式（支援 +, -, ×, ÷ 運算符）
 * @returns 計算結果（數字）
 * @throws {Error} 當表達式無效或除以零時拋出錯誤
 *
 * @example
 * ```ts
 * calculateExpression('100 + 50 × 2'); // 200 (先乘後加)
 * calculateExpression('10 + 20 × 3 - 15 ÷ 3'); // 65
 * calculateExpression('(100 + 50) ÷ 2'); // 75 (括號優先)
 * calculateExpression('100 ÷ 0'); // 拋出錯誤: "除以零錯誤"
 * ```
 */
export function calculateExpression(expression: string): number {
  // 空表達式處理
  if (!expression || expression.trim() === '') {
    throw new Error('表達式不可為空');
  }

  try {
    // 標準化表達式（轉換符號）
    const normalized = normalizeExpression(expression);

    // 使用 expr-eval 進行計算
    const parser = new Parser();
    const result = parser.evaluate(normalized);

    // 檢查結果是否為有效數字
    if (!Number.isFinite(result)) {
      throw new Error('計算結果無效');
    }

    // 除以零檢查
    if (normalized.includes('/ 0') || normalized.includes('/0')) {
      throw new Error('除以零錯誤');
    }

    return result;
  } catch (error) {
    // 統一錯誤處理
    if (error instanceof Error) {
      // 自定義錯誤訊息映射
      if (error.message.includes('parse')) {
        throw new Error('表達式格式錯誤');
      }
      if (error.message.includes('undefined')) {
        throw new Error('表達式包含未定義的變數');
      }
      throw error;
    }
    throw new Error('未知計算錯誤');
  }
}

/**
 * 驗證表達式是否可計算
 * @description 檢查表達式格式是否正確，不執行實際計算
 * @param expression - 待驗證的表達式
 * @returns 是否有效
 *
 * @example
 * ```ts
 * isValidExpression('100 + 50'); // true
 * isValidExpression('100 +'); // false (運算符後無數字)
 * isValidExpression('abc'); // false (包含非數字字元)
 * ```
 */
export function isValidExpression(expression: string): boolean {
  if (!expression || expression.trim() === '') {
    return false;
  }

  try {
    const normalized = normalizeExpression(expression);
    const parser = new Parser();
    // 嘗試解析但不求值
    parser.parse(normalized);
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式化計算結果
 * @description 將數字格式化為易讀的字串（四捨五入到指定小數位）
 * @param value - 計算結果
 * @param decimalPlaces - 小數位數（預設 2 位）
 * @returns 格式化後的字串
 *
 * @example
 * ```ts
 * formatResult(123.456789); // "123.46"
 * formatResult(100); // "100"
 * formatResult(0.123456, 4); // "0.1235"
 * ```
 */
export function formatResult(value: number, decimalPlaces = 2): string {
  // 整數直接返回
  if (Number.isInteger(value)) {
    return value.toString();
  }

  // 四捨五入到指定小數位
  const rounded = Number(value.toFixed(decimalPlaces));

  // 移除尾部的 0（例如："1.20" → "1.2"）
  return rounded.toString();
}

/**
 * 安全計算表達式（不拋出錯誤）
 * @description calculateExpression 的安全版本，返回結果或 null
 * @param expression - 數學表達式
 * @returns 計算結果或 null（發生錯誤時）
 *
 * @example
 * ```ts
 * safeCalculate('100 + 50'); // 150
 * safeCalculate('invalid'); // null
 * safeCalculate('100 ÷ 0'); // null
 * ```
 */
export function safeCalculate(expression: string): number | null {
  try {
    return calculateExpression(expression);
  } catch {
    return null;
  }
}
