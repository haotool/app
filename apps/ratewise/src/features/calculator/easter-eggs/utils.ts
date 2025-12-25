/**
 * Easter Eggs - Utility Functions
 * @file utils.ts
 * @description 彩蛋檢測工具函數
 *
 * 聖誕彩蛋觸發條件：
 * - 表達式：106575 ÷ 1225
 * - 結果：87
 * - 隱藏含義：1225 = 12月25日聖誕節
 */

/**
 * 標準化表達式（用於彩蛋檢測）
 * @description 移除空格並統一除法符號
 * @param expression - 原始表達式
 * @returns 標準化後的表達式
 */
export function normalizeExpressionForEasterEgg(expression: string): string {
  return expression
    .replace(/\s+/g, '') // 移除所有空格
    .replace(/\//g, '÷'); // 統一除法符號
}

/**
 * 聖誕彩蛋目標表達式
 * @description 106575 ÷ 1225 = 87
 */
const CHRISTMAS_EXPRESSION = '106575÷1225';

/**
 * 檢測是否為聖誕彩蛋表達式
 * @description 檢查表達式是否為 106575 ÷ 1225
 * @param expression - 用戶輸入的表達式
 * @returns 是否為聖誕彩蛋
 */
export function isChristmasEasterEgg(expression: string): boolean {
  const normalized = normalizeExpressionForEasterEgg(expression);
  return normalized === CHRISTMAS_EXPRESSION;
}

/**
 * 聖誕彩蛋持續時間（毫秒）
 * @description 1 分鐘 = 60000 毫秒
 */
export const CHRISTMAS_EASTER_EGG_DURATION = 60000;
