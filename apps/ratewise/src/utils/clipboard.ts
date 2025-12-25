/**
 * 剪貼簿工具函數
 *
 * 用途：提供統一的剪貼簿操作邏輯
 * 遵循 Linus KISS 原則：簡單、可靠、錯誤處理
 */

import type { ConversionHistoryEntry } from '../features/ratewise/types';

/**
 * 複製文字到剪貼簿
 *
 * @param text - 要複製的文字
 * @returns Promise<boolean> - 成功返回 true，失敗返回 false
 *
 * @example
 * const success = await copyToClipboard('1000 USD = 30900 TWD');
 * if (success) {
 *   console.log('複製成功');
 * } else {
 *   console.error('複製失敗');
 * }
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('複製失敗:', error);
    return false;
  }
}

/**
 * 格式化轉換記錄為可複製的字串
 *
 * @param entry - 轉換歷史記錄
 * @returns 格式化後的字串（例如："1000 USD = 30900 TWD"）
 *
 * @example
 * const entry = {
 *   from: 'USD',
 *   to: 'TWD',
 *   amount: '1000',
 *   result: '30900',
 *   time: '今天 14:30',
 *   timestamp: Date.now(),
 * };
 * const text = formatConversionForCopy(entry);
 * // "1000 USD = 30900 TWD"
 */
export function formatConversionForCopy(entry: ConversionHistoryEntry): string {
  return `${entry.amount} ${entry.from} = ${entry.result} ${entry.to}`;
}
