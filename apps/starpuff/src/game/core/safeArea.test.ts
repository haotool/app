import { describe, expect, it } from 'vitest';
import { KEYS_LAYER_FLOOR, extraInset, parsePx, toLogicalPx } from './safeArea';

describe('safeArea（§96 殼局部 safe-area 換算）', () => {
  it('parsePx：合法值解析、非法值歸零', () => {
    expect(parsePx('47px')).toBe(47);
    expect(parsePx('12.5px')).toBe(12.5);
    expect(parsePx('auto')).toBe(0);
    expect(parsePx('')).toBe(0);
  });

  it('extraInset：只取超出地板的净 inset，無瀏海裝置歸零', () => {
    // 無瀏海：computed = 地板值 → 净 0。
    expect(extraInset(KEYS_LAYER_FLOOR.top, KEYS_LAYER_FLOOR.top)).toBe(0);
    expect(extraInset(12, 12)).toBe(0);
    // 瀏海 47px 直持（ccw 換軸到殼右）：computed 47 → 净 35。
    expect(extraInset(47, 12)).toBe(35);
    // computed 低於地板（理論不發生）不得為負。
    expect(extraInset(8, 12)).toBe(0);
  });

  it('toLogicalPx：CSS px 依邏輯寬/canvas 寬比例換算；canvas 未量測歸零', () => {
    // 直持 iPhone 13：邏輯寬 1039、canvas CSS 寬 844 → 35px inset ≈ 43.1 邏輯 px。
    expect(toLogicalPx(35, 1039, 844)).toBeCloseTo(43.09, 1);
    // 橫持同寬：1:1。
    expect(toLogicalPx(35, 854, 854)).toBe(35);
    expect(toLogicalPx(35, 1039, 0)).toBe(0);
  });
});
