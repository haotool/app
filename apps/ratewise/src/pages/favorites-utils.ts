/**
 * Favorites 頁面工具函式
 *
 * TWD 為台銀基準幣，永遠顯示在第一位，
 * 不存於 favorites 陣列中（隱式固定）。
 */

import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { CurrencyCode } from '../features/ratewise/types';

/**
 * 取得完整貨幣排序列表：
 * 1. TWD（永遠第一，固定基準幣）
 * 2. 其餘收藏幣（按用戶偏好順序）
 * 3. 非收藏幣（按字母順序）
 *
 * @param favorites - 用戶收藏列表（不含 TWD）
 * @returns 完整排序後的幣別代碼陣列，TWD 固定在首位
 */
export function getAllCurrenciesSorted(favorites: CurrencyCode[]): CurrencyCode[] {
  // 過濾 TWD（由 UI 固定顯示在第一位，不納入排序邏輯）
  const favWithoutTWD = favorites.filter((c) => c !== 'TWD');

  const allCodes = Object.keys(CURRENCY_DEFINITIONS).filter(
    (code) => code !== 'TWD',
  ) as CurrencyCode[];
  const favSet = new Set<CurrencyCode>(favWithoutTWD as CurrencyCode[]);

  const nonFavorites = allCodes.filter((code) => !favSet.has(code)).sort();

  // TWD 固定在第一位
  return ['TWD', ...favWithoutTWD, ...nonFavorites];
}
