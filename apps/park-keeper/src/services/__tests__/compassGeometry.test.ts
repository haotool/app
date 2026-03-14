import { describe, it, expect } from 'vitest';
import {
  isCardinalIndex,
  isMajorIndex,
  tickLength,
  tickStrokeWidth,
  tickOpacity,
  cardinalLabelPosition,
  COMPASS_CX,
  COMPASS_CY,
  CARDINAL_LABEL_RADIUS,
  TICK_STEP_DEG,
  TICK_COUNT,
} from '../compassGeometry';

// ---------------------------------------------------------------------------
// isCardinalIndex
// ---------------------------------------------------------------------------
describe('isCardinalIndex', () => {
  it('N(0), E(9), S(18), W(27) はすべて true', () => {
    expect(isCardinalIndex(0)).toBe(true);
    expect(isCardinalIndex(9)).toBe(true);
    expect(isCardinalIndex(18)).toBe(true);
    expect(isCardinalIndex(27)).toBe(true);
  });

  it('非方位角インデックスは false', () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 35].forEach((i) => expect(isCardinalIndex(i)).toBe(false));
  });
});

// ---------------------------------------------------------------------------
// isMajorIndex
// ---------------------------------------------------------------------------
describe('isMajorIndex', () => {
  it('3 の倍数だが 9 の倍数でないインデックスは true', () => {
    [3, 6, 12, 15, 21, 24, 30, 33].forEach((i) => expect(isMajorIndex(i)).toBe(true));
  });

  it('方位角と単純な minor tick は false', () => {
    expect(isMajorIndex(0)).toBe(false); // cardinal
    expect(isMajorIndex(9)).toBe(false); // cardinal
    expect(isMajorIndex(1)).toBe(false); // minor
    expect(isMajorIndex(2)).toBe(false); // minor
  });
});

// ---------------------------------------------------------------------------
// tickLength
// ---------------------------------------------------------------------------
describe('tickLength', () => {
  it('方位角 tick は 22px', () => {
    expect(tickLength(0)).toBe(22);
    expect(tickLength(9)).toBe(22);
    expect(tickLength(18)).toBe(22);
    expect(tickLength(27)).toBe(22);
  });

  it('major tick は 13px', () => {
    expect(tickLength(3)).toBe(13);
    expect(tickLength(6)).toBe(13);
    expect(tickLength(12)).toBe(13);
  });

  it('minor tick は 7px', () => {
    expect(tickLength(1)).toBe(7);
    expect(tickLength(2)).toBe(7);
    expect(tickLength(4)).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// tickStrokeWidth
// ---------------------------------------------------------------------------
describe('tickStrokeWidth', () => {
  it('方位角 → 3', () => expect(tickStrokeWidth(0)).toBe(3));
  it('major → 1.5', () => expect(tickStrokeWidth(3)).toBe(1.5));
  it('minor → 0.8', () => expect(tickStrokeWidth(1)).toBe(0.8));
});

// ---------------------------------------------------------------------------
// tickOpacity
// ---------------------------------------------------------------------------
describe('tickOpacity', () => {
  it('方位角 → 1', () => expect(tickOpacity(0)).toBe(1));
  it('major → 0.45', () => expect(tickOpacity(3)).toBe(0.45));
  it('minor → 0.18', () => expect(tickOpacity(1)).toBe(0.18));
});

// ---------------------------------------------------------------------------
// TICK_COUNT / TICK_STEP_DEG
// ---------------------------------------------------------------------------
describe('定数', () => {
  it('TICK_COUNT は 36', () => expect(TICK_COUNT).toBe(36));
  it('TICK_STEP_DEG は 10', () => expect(TICK_STEP_DEG).toBe(10));
});

// ---------------------------------------------------------------------------
// cardinalLabelPosition — 核心幾何正確性
//
// SVG 座標系（y 軸向下）での方位角ラベル配置公式:
//   x = CX + r * sin(θ)
//   y = CY - r * cos(θ)   ← y 軸反転のため minus
//
// 正確な位置が取れることをここでテストし、
// Home.tsx で <g rotate> の内側でなく SVG 直下に配置することで
// counter-rotation の誤った中心点バグ (rotate(-angle 150 68)) を排除する。
// ---------------------------------------------------------------------------
describe('cardinalLabelPosition', () => {
  const R = 100;

  it('北 (index=0): x=CX, y=CY−r — 最上部中央', () => {
    const { x, y } = cardinalLabelPosition(0, R);
    expect(x).toBeCloseTo(COMPASS_CX, 5);
    expect(y).toBeCloseTo(COMPASS_CY - R, 5); // 150-100=50
  });

  it('東 (index=9): x=CX+r, y=CY — 右端中央', () => {
    const { x, y } = cardinalLabelPosition(9, R);
    expect(x).toBeCloseTo(COMPASS_CX + R, 5); // 250
    expect(y).toBeCloseTo(COMPASS_CY, 5); // 150
  });

  it('南 (index=18): x=CX, y=CY+r — 最下部中央', () => {
    const { x, y } = cardinalLabelPosition(18, R);
    expect(x).toBeCloseTo(COMPASS_CX, 5);
    expect(y).toBeCloseTo(COMPASS_CY + R, 5); // 250
  });

  it('西 (index=27): x=CX−r, y=CY — 左端中央', () => {
    const { x, y } = cardinalLabelPosition(27, R);
    expect(x).toBeCloseTo(COMPASS_CX - R, 5); // 50
    expect(y).toBeCloseTo(COMPASS_CY, 5);
  });

  it('radius 省略時は CARDINAL_LABEL_RADIUS を使用', () => {
    const { x, y } = cardinalLabelPosition(0);
    expect(x).toBeCloseTo(COMPASS_CX, 5);
    expect(y).toBeCloseTo(COMPASS_CY - CARDINAL_LABEL_RADIUS, 5);
  });

  it('NE 対角 (index=4.5, 45°): x と y が中心から等距離', () => {
    const sin45 = Math.SQRT2 / 2;
    const { x, y } = cardinalLabelPosition(4.5, R);
    expect(x).toBeCloseTo(COMPASS_CX + R * sin45, 4);
    expect(y).toBeCloseTo(COMPASS_CY - R * sin45, 4);
  });

  it('360° (index=36) は 0° (北) と同一位置', () => {
    const pos0 = cardinalLabelPosition(0, R);
    const pos36 = cardinalLabelPosition(36, R);
    expect(pos36.x).toBeCloseTo(pos0.x, 5);
    expect(pos36.y).toBeCloseTo(pos0.y, 5);
  });
});
