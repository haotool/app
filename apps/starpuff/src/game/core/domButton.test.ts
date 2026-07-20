import { describe, expect, it } from 'vitest';
import { MIN_MENU_HIT_CSS_PX, menuHitCssRect } from './domButton';

// 直持 390×844 實測縮放（§98 D2 量測基準）：canvas CSS 844×390、邏輯 1039×480。
const SX = 844 / 1039;
const SY = 390 / 480;

// 選單 DOM 鈕邏輯尺寸盤點（Title 主/次選、返回、重置、圖鑑頁籤、區頁籤、EX、節點）。
const MENU_RECTS = [
  { x: 519, y: 316, w: 220, h: 72 },
  { x: 200, y: 408, w: 168, h: 56 },
  { x: 56, y: 34, w: 132, h: 56 },
  { x: 84, y: 448, w: 150, h: 52 },
  { x: 350, y: 84, w: 140, h: 52 },
  { x: 220, y: 78, w: 144, h: 46 },
  { x: 300, y: 174, w: 108, h: 44 },
  { x: 120, y: 300, w: 68, h: 68 },
];

describe('menuHitCssRect（§98 D2 命中短邊保底）', () => {
  it('直持縮放下全部選單鈕命中邊 ≥48 CSS px', () => {
    for (const rect of MENU_RECTS) {
      const css = menuHitCssRect(rect, SX, SY);
      expect(css.w).toBeGreaterThanOrEqual(MIN_MENU_HIT_CSS_PX);
      expect(css.h).toBeGreaterThanOrEqual(MIN_MENU_HIT_CSS_PX);
    }
  });

  it('原始換算已達下限的邊不放大（大鈕視覺＝命中不變）', () => {
    const css = menuHitCssRect({ x: 519, y: 316, w: 220, h: 72 }, SX, SY);
    expect(css.w).toBeCloseTo(220 * SX, 6);
    expect(css.h).toBeCloseTo(72 * SY, 6);
  });

  it('擴張對稱於中心：中心點不因保底而漂移', () => {
    const rect = { x: 300, y: 174, w: 108, h: 44 };
    const css = menuHitCssRect(rect, SX, SY);
    expect(css.left + css.w / 2).toBeCloseTo(rect.x * SX, 6);
    expect(css.top + css.h / 2).toBeCloseTo(rect.y * SY, 6);
  });

  it('倍率 1（未縮放殼）時小鈕同樣吃到 48 下限', () => {
    const css = menuHitCssRect({ x: 100, y: 100, w: 40, h: 40 }, 1, 1);
    expect(css.w).toBe(MIN_MENU_HIT_CSS_PX);
    expect(css.h).toBe(MIN_MENU_HIT_CSS_PX);
  });
});
