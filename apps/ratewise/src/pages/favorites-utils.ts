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

/**
 * 計算拖曳結束後的新收藏排序。
 *
 * 排序合約（與 getAllCurrenciesSorted 一致）：
 * - TWD 固定置頂，不可拖曳
 * - 只有收藏幣可排序；非收藏幣不可拖曳，也不得被隱式加入收藏
 * - 收藏幣被拖出收藏段時，落點夾回收藏段尾端
 *
 * @param favorites - 目前收藏列表（不含 TWD）
 * @param draggedCode - 被拖曳的幣別
 * @param destinationIndex - 拖曳落點在 allCurrencies 中的索引（index 0 = TWD）
 * @returns 新收藏排序；不符合排序合約時回傳 null（呼叫端不做任何變更）
 */
export function reorderFavoritesOnDragEnd(
  favorites: CurrencyCode[],
  draggedCode: CurrencyCode,
  destinationIndex: number,
): CurrencyCode[] | null {
  if (draggedCode === 'TWD') return null;
  if (!favorites.includes(draggedCode)) return null;

  // allCurrencies 中 index 0 = TWD，favorites 索引 = allCurrencies 索引 - 1
  const destFavIndex = Math.max(0, destinationIndex - 1);

  const newFavorites = favorites.filter((code) => code !== draggedCode);
  newFavorites.splice(Math.min(destFavIndex, newFavorites.length), 0, draggedCode);
  return newFavorites;
}
