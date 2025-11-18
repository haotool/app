/**
 * Calculator Number Formatter
 * @file formatCalculatorNumber.ts
 * @description 計算機數字格式化工具（千位分隔符）
 *
 * Linus 哲學：
 * - ✅ 重用專案模式（參考 currencyFormatter.ts）
 * - ✅ 單一職責：只做格式化，不做計算
 * - ✅ 零依賴：使用原生 toLocaleString
 *
 * @see docs/dev/011_calculator_apple_ux_enhancements.md - Feature 7
 */

/**
 * 格式化計算機數字顯示（千位分隔符）
 *
 * 重用專案 toLocaleString 模式，確保與 currencyFormatter 一致性
 *
 * @param value - 數字或字串（支援兩種輸入）
 * @returns 格式化後的字串（千位分隔符）
 *
 * @example
 * formatCalculatorNumber(1234567) // "1,234,567"
 * formatCalculatorNumber("1234.5678") // "1,234.568"（四捨五入至小數點後 8 位）
 * formatCalculatorNumber(0.5) // "0.5"
 */
export function formatCalculatorNumber(value: number | string): string {
  // 解析輸入（支援字串和數字）
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // 邊界情況：NaN 或 Infinity
  if (!Number.isFinite(num)) {
    return value.toString();
  }

  // 使用 toLocaleString 格式化（zh-TW 使用逗號分隔千位數）
  return num.toLocaleString('zh-TW', {
    maximumFractionDigits: 8, // 計算機精度（足夠覆蓋小數運算）
    minimumFractionDigits: 0, // 整數不顯示 .0
  });
}

/**
 * 格式化算式中的數字（保留運算符）
 *
 * 將算式中的數字格式化，但保留運算符
 *
 * @param expression - 數學算式字串
 * @returns 格式化後的算式
 *
 * @example
 * formatExpression("1234 + 5678") // "1,234 + 5,678"
 * formatExpression("100 × 0.5") // "100 × 0.5"
 */
export function formatExpression(expression: string): string {
  // 正則：匹配數字（含小數點和負號）
  const numberRegex = /-?\d+\.?\d*/g;

  // 替換所有數字為格式化版本
  return expression.replace(numberRegex, (match) => {
    const num = parseFloat(match);
    // 只格式化有效數字
    return Number.isFinite(num) ? formatCalculatorNumber(num) : match;
  });
}
