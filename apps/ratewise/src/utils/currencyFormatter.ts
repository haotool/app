/**
 * 貨幣格式化工具函數
 * 使用瀏覽器原生 Intl.NumberFormat API
 * 符合 ISO 4217 國際貨幣標準
 *
 * @module currencyFormatter
 * @created 2025-11-05T00:20:00+08:00
 */

import type { CurrencyCode } from '../features/ratewise/types';

/**
 * 格式化貨幣數字（用於顯示）
 * 自動處理小數位數和千位分隔符
 *
 * @param value - 數值
 * @param currencyCode - ISO 4217 貨幣代碼
 * @returns 格式化後的字串（不含貨幣符號）
 *
 * @example
 * formatCurrency(1234.567, 'USD') // "1,234.57"
 * formatCurrency(1234.567, 'JPY') // "1,235"
 * formatCurrency(1234.567, 'TWD') // "1,235"
 */
export function formatCurrency(value: number, currencyCode: CurrencyCode): string {
  // 處理無效輸入
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return '0';
  }

  try {
    // 使用 Intl.NumberFormat 自動處理各貨幣的格式化規則
    const formatter = new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code', // 顯示 "USD" 而非 "$"
    });

    // 格式化並移除貨幣代碼，只保留數字
    return formatter.format(value).replace(currencyCode, '').trim();
  } catch {
    // Fallback: 使用 toLocaleString
    return value.toLocaleString('zh-TW', {
      minimumFractionDigits: getCurrencyDecimalPlaces(currencyCode),
      maximumFractionDigits: getCurrencyDecimalPlaces(currencyCode),
    });
  }
}

/**
 * 格式化匯率顯示（保留 4 位小數）
 *
 * @param value - 匯率數值
 * @returns 格式化後的字串
 *
 * @example
 * formatExchangeRate(30.9123) // "30.9123"
 * formatExchangeRate(0.2061) // "0.2061"
 */
export function formatExchangeRate(value: number): string {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return '0.0000';
  }

  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

/**
 * 取得貨幣的標準小數位數
 * 根據 ISO 4217 標準與實務慣例
 *
 * @param currencyCode - 貨幣代碼
 * @returns 小數位數
 */
export function getCurrencyDecimalPlaces(currencyCode: CurrencyCode): number {
  // ISO 4217 標準小數位數
  // 參考：https://zh.wikipedia.org/wiki/ISO_4217
  const decimalPlaces: Record<CurrencyCode, number> = {
    TWD: 2, // 台幣：ISO 4217 標準為 2 位小數（匯率、財務通常顯示兩位）
    JPY: 0, // 日圓：ISO 4217 標準為 0 位小數
    KRW: 0, // 韓元：ISO 4217 標準為 0 位小數
    USD: 2, // 美元：ISO 4217 標準為 2 位小數
    EUR: 2, // 歐元：ISO 4217 標準為 2 位小數
    GBP: 2, // 英鎊：ISO 4217 標準為 2 位小數
    AUD: 2, // 澳幣：ISO 4217 標準為 2 位小數
    CAD: 2, // 加幣：ISO 4217 標準為 2 位小數
    SGD: 2, // 新幣：ISO 4217 標準為 2 位小數
    CHF: 2, // 瑞郎：ISO 4217 標準為 2 位小數
    HKD: 2, // 港幣：ISO 4217 標準為 2 位小數
    CNY: 2, // 人民幣：ISO 4217 標準為 2 位小數
    // 新增幣別小數位數
    NZD: 2, // 紐元：ISO 4217 標準為 2 位小數
    THB: 2, // 泰銖：ISO 4217 標準為 2 位小數
    PHP: 2, // 菲律賓披索：ISO 4217 標準為 2 位小數
    IDR: 0, // 印尼盾：ISO 4217 標準為 0 位小數
    VND: 0, // 越南盾：ISO 4217 標準為 0 位小數
    MYR: 2, // 馬來幣：ISO 4217 標準為 2 位小數
  };

  return decimalPlaces[currencyCode] ?? 2;
}

/**
 * 格式化金額輸入（用於用戶輸入）
 * 保留小數但不添加千位分隔符（避免干擾輸入）
 *
 * @param value - 字串值
 * @param currencyCode - 貨幣代碼
 * @returns 格式化後的字串
 */
export function formatAmountInput(value: string, currencyCode: CurrencyCode): string {
  // 移除所有非數字和小數點的字符
  const cleaned = value.replace(/[^\d.]/g, '');

  // 確保只有一個小數點
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return (parts[0] ?? '') + '.' + parts.slice(1).join('');
  }

  // 限制小數位數
  const decimalPlaces = getCurrencyDecimalPlaces(currencyCode);
  if (parts.length === 2 && parts[1] && parts[1].length > decimalPlaces) {
    parts[1] = parts[1].slice(0, decimalPlaces);
    return parts.join('.');
  }

  return cleaned;
}

/**
 * 格式化金額顯示（用於 input value 顯示，包含千位分隔符）
 *
 * @param value - 數值或字串
 * @param currencyCode - 貨幣代碼
 * @returns 格式化後的字串（包含千位分隔符）
 */
export function formatAmountDisplay(value: string | number, currencyCode: CurrencyCode): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    if (value.trim() === '') return '';

    const numValue = parseFloat(value);
    if (!Number.isFinite(numValue) || Number.isNaN(numValue)) {
      return value;
    }

    return formatCurrency(numValue, currencyCode);
  }

  if (!Number.isFinite(value) || Number.isNaN(value)) return '';

  return formatCurrency(value, currencyCode);
}
