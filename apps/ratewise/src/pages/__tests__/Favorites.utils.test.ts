/**
 * Favorites page 工具函式單元測試
 *
 * 測試 getAllCurrenciesSorted 行為：
 * - TWD 永遠在第一位（固定基準幣，不可移除）
 * - 其餘收藏幣按用戶偏好順序排列（緊跟 TWD 之後）
 * - 非收藏幣按字母順序排在收藏幣之後
 * - TWD 不重複出現（即使 favorites 含 TWD 也只出現一次在最前）
 */

import { describe, it, expect } from 'vitest';
import { getAllCurrenciesSorted } from '../favorites-utils';
import type { CurrencyCode } from '../../features/ratewise/types';

describe('getAllCurrenciesSorted', () => {
  it('TWD is always first regardless of favorites', () => {
    const result = getAllCurrenciesSorted([]);
    expect(result[0]).toBe('TWD');
  });

  it('TWD is first even when favorites contain popular currencies', () => {
    const result = getAllCurrenciesSorted(['JPY', 'USD', 'EUR'] as CurrencyCode[]);
    expect(result[0]).toBe('TWD');
  });

  it('favorites appear in their saved order immediately after TWD', () => {
    const favorites: CurrencyCode[] = ['JPY', 'KRW', 'USD'];
    const result = getAllCurrenciesSorted(favorites);
    expect(result[0]).toBe('TWD');
    expect(result[1]).toBe('JPY');
    expect(result[2]).toBe('KRW');
    expect(result[3]).toBe('USD');
  });

  it('non-favorites appear alphabetically after all favorites', () => {
    const favorites: CurrencyCode[] = ['JPY', 'USD'];
    const result = getAllCurrenciesSorted(favorites);
    const twdIndex = result.indexOf('TWD');
    const jpyIndex = result.indexOf('JPY');
    const usdIndex = result.indexOf('USD');
    const eurIndex = result.indexOf('EUR');
    const krwIndex = result.indexOf('KRW');
    // TWD first, then favorites, then non-favorites
    expect(twdIndex).toBe(0);
    expect(jpyIndex).toBeLessThan(eurIndex);
    expect(usdIndex).toBeLessThan(eurIndex);
    expect(usdIndex).toBeLessThan(krwIndex);
  });

  it('TWD is not duplicated even if somehow in favorites array', () => {
    const favorites: CurrencyCode[] = ['TWD', 'JPY', 'USD'];
    const result = getAllCurrenciesSorted(favorites);
    const twdOccurrences = result.filter((c) => c === 'TWD');
    expect(twdOccurrences).toHaveLength(1);
    expect(result[0]).toBe('TWD');
  });

  it('TWD is included even when favorites is empty', () => {
    const result = getAllCurrenciesSorted([]);
    expect(result).toContain('TWD');
  });

  it('non-favorites section is sorted alphabetically', () => {
    const favorites: CurrencyCode[] = ['JPY'];
    const result = getAllCurrenciesSorted(favorites);
    // Everything after TWD (index 0) and JPY (index 1) should be sorted
    const nonFavoritesStart = 2;
    const nonFavorites = result.slice(nonFavoritesStart);
    const sorted = [...nonFavorites].sort();
    expect(nonFavorites).toEqual(sorted);
  });
});
