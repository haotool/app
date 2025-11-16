/**
 * Calculator Feature - Input Validator
 * @file validator.ts
 * @description 計算機輸入驗證工具，確保表達式符合規則
 * @see docs/dev/010_calculator_keyboard_feature_spec.md Section 7.2
 */

import type { ValidationResult } from '../types';

/**
 * 允許的字元集合
 * @description 定義計算機接受的所有合法字元
 */
const ALLOWED_CHARS = /^[0-9+\-×÷.()\s]+$/;

/**
 * 運算符集合
 */
const OPERATORS = ['+', '-', '×', '÷'];

/**
 * 驗證表達式格式
 * @description 完整驗證表達式的合法性（字元、格式、語法）
 * @param expression - 待驗證的表達式
 * @returns 驗證結果（包含是否有效和錯誤訊息）
 *
 * @example
 * ```ts
 * validateExpression('100 + 50'); // { isValid: true, error: null }
 * validateExpression('100 +'); // { isValid: false, error: "運算符後缺少數字" }
 * validateExpression('abc'); // { isValid: false, error: "包含非法字元" }
 * ```
 */
export function validateExpression(expression: string): ValidationResult {
  // 空字串檢查
  if (!expression || expression.trim() === '') {
    return {
      isValid: false,
      error: '表達式不可為空',
    };
  }

  const trimmed = expression.trim();

  // 1. 字元合法性檢查
  if (!ALLOWED_CHARS.test(trimmed)) {
    return {
      isValid: false,
      error: '包含非法字元',
    };
  }

  // 2. 運算符位置檢查
  // 不可以運算符開頭（除了負號）
  if (OPERATORS.filter((op) => op !== '-').some((op) => trimmed.startsWith(op))) {
    return {
      isValid: false,
      error: '表達式不可以運算符開頭',
    };
  }

  // 不可以運算符結尾
  if (OPERATORS.some((op) => trimmed.endsWith(op))) {
    return {
      isValid: false,
      error: '運算符後缺少數字',
    };
  }

  // 3. 連續運算符檢查（例如："100 ++ 50"）
  const consecutiveOps = /[+\-×÷]{2,}/;
  if (consecutiveOps.test(trimmed.replace(/\s/g, ''))) {
    return {
      isValid: false,
      error: '運算符不可連續出現',
    };
  }

  // 4. 小數點檢查（連續小數點）
  if (trimmed.includes('..')) {
    return {
      isValid: false,
      error: '小數點格式錯誤',
    };
  }

  // 5. 括號匹配檢查
  const openParens = (trimmed.match(/\(/g) ?? []).length;
  const closeParens = (trimmed.match(/\)/g) ?? []).length;
  if (openParens !== closeParens) {
    return {
      isValid: false,
      error: '括號不匹配',
    };
  }

  // 6. 空括號檢查
  if (trimmed.includes('()')) {
    return {
      isValid: false,
      error: '括號內不可為空',
    };
  }

  // 所有檢查通過
  return {
    isValid: true,
    error: null,
  };
}

/**
 * 檢查是否可以添加運算符
 * @description 判斷當前表達式末尾是否允許添加運算符
 * @param expression - 當前表達式
 * @returns 是否可以添加運算符
 *
 * @example
 * ```ts
 * canAddOperator('100'); // true（數字後可以加運算符）
 * canAddOperator('100 +'); // false（已有運算符）
 * canAddOperator(''); // false（空表達式）
 * ```
 */
export function canAddOperator(expression: string): boolean {
  const trimmed = expression.trim();

  // 空表達式不可添加運算符
  if (trimmed === '') {
    return false;
  }

  // 最後一個字元已經是運算符
  if (OPERATORS.some((op) => trimmed.endsWith(op))) {
    return false;
  }

  // 最後一個字元是小數點
  if (trimmed.endsWith('.')) {
    return false;
  }

  // 最後一個字元是左括號
  if (trimmed.endsWith('(')) {
    return false;
  }

  return true;
}

/**
 * 檢查是否可以添加小數點
 * @description 判斷當前數字是否已包含小數點
 * @param expression - 當前表達式
 * @returns 是否可以添加小數點
 *
 * @example
 * ```ts
 * canAddDecimal('100'); // true
 * canAddDecimal('100.5'); // false（已有小數點）
 * canAddDecimal('100 + 50'); // true（新數字可以有小數點）
 * ```
 */
export function canAddDecimal(expression: string): boolean {
  const trimmed = expression.trim();

  // 空表達式，可以添加 "0."
  if (trimmed === '') {
    return true;
  }

  // 找到最後一個數字（從最後一個運算符或開頭算起）
  const lastNumberMatch = /[\d.]+$/.exec(trimmed);

  if (!lastNumberMatch) {
    return true; // 沒有匹配到數字，可以開始新數字
  }

  const lastNumber = lastNumberMatch[0];

  // 如果最後一個數字已包含小數點，不可再添加
  return !lastNumber.includes('.');
}

/**
 * 清理表達式
 * @description 移除多餘的空格和格式化表達式
 * @param expression - 原始表達式
 * @returns 清理後的表達式
 *
 * @example
 * ```ts
 * sanitizeExpression('  100  +  50  '); // "100 + 50"
 * sanitizeExpression('100+50'); // "100 + 50"
 * ```
 */
export function sanitizeExpression(expression: string): string {
  return expression
    .trim()
    .replace(/\s+/g, ' ') // 多個空格替換為單一空格
    .replace(/\s*([+\-×÷()])\s*/g, ' $1 ') // 運算符前後添加空格
    .trim();
}

/**
 * 檢查除以零
 * @description 檢測表達式是否包含除以零的情況
 * @param expression - 表達式
 * @returns 是否包含除以零
 *
 * @example
 * ```ts
 * hasDivisionByZero('100 ÷ 0'); // true
 * hasDivisionByZero('100 ÷ 5'); // false
 * hasDivisionByZero('100 + 0'); // false
 * ```
 */
export function hasDivisionByZero(expression: string): boolean {
  // 簡單模式匹配（÷ 0 或 / 0）
  return /[÷/]\s*0(?:\s|$)/.test(expression);
}

/**
 * 獲取最後一個數字
 * @description 從表達式中提取最後一個完整的數字
 * @param expression - 表達式
 * @returns 最後一個數字（字串形式），無數字則返回空字串
 *
 * @example
 * ```ts
 * getLastNumber('100 + 50'); // "50"
 * getLastNumber('100 +'); // ""
 * getLastNumber('123.45'); // "123.45"
 * ```
 */
export function getLastNumber(expression: string): string {
  const match = /[\d.]+$/.exec(expression.trim());
  return match ? match[0] : '';
}
