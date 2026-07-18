import { describe, it, expect } from 'vitest';
import {
  isCardinalIndex,
  isMajorIndex,
  tickLength,
  tickStrokeWidth,
  tickOpacity,
  cardinalLabelPosition,
  cardinalLabelUprightTransform,
  targetWedgePath,
  isAligned,
  computeDeckGeometry,
  COMPASS_CX,
  COMPASS_CY,
  COMPASS_OUTER_R,
  COMPASS_NORTH_INDEX,
  COMPASS_TICK_START_Y,
  CARDINAL_LABEL_RADIUS,
  TICK_STEP_DEG,
  TICK_COUNT,
  TARGET_WEDGE_INNER_R,
  TARGET_WEDGE_OUTER_R,
  ALIGNED_THRESHOLD_DEG,
  HUB_DIAMETER,
  CAPSULE_HEIGHT,
  DECK_MIN_ARC_R,
  DECK_MAX_R,
  DECK_TOP_PAD,
  DECK_BOTTOM_PAD,
  DECK_RING_OVERHANG,
  WEDGE_HUB_GAP,
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
  it('COMPASS_OUTER_R は 140', () => expect(COMPASS_OUTER_R).toBe(140));
  it('COMPASS_NORTH_INDEX は 0（北方向インデックス SSOT）', () =>
    expect(COMPASS_NORTH_INDEX).toBe(0));
  it('COMPASS_TICK_START_Y は 10（刻度起始 y 座標 SSOT）', () =>
    expect(COMPASS_TICK_START_Y).toBe(10));
  it('COMPASS_NORTH_INDEX は isCardinalIndex で true', () =>
    expect(isCardinalIndex(COMPASS_NORTH_INDEX)).toBe(true));
  it('刻度尾端（COMPASS_TICK_START_Y + cardinal tick 長）は外圈內側', () => {
    const cardinalTickEnd = COMPASS_TICK_START_Y + 22; // tickLength(cardinal) = 22
    expect(cardinalTickEnd).toBeLessThan(COMPASS_OUTER_R + COMPASS_CY - 150 + 150); // sanity
    expect(cardinalTickEnd).toBe(32); // 10 + 22
  });
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

// ---------------------------------------------------------------------------
// targetWedgePath / isAligned（issue #716 目標方位楔形）
// ---------------------------------------------------------------------------
describe('targetWedgePath', () => {
  const parseNumbers = (path: string): number[] =>
    (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

  it('預設參數產生封閉環帶扇形（M/A/L/A/Z 結構）', () => {
    const path = targetWedgePath();
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path.match(/A /g)).toHaveLength(2);
    expect(path.match(/L /g)).toHaveLength(1);
  });

  it('楔形以正北為軸對稱：左右端點 x 對 CX 鏡射、y 相等', () => {
    const path = targetWedgePath(15, TARGET_WEDGE_INNER_R, TARGET_WEDGE_OUTER_R);
    const nums = parseNumbers(path);
    // M x0 y0 A r r 0 0 1 x1 y1 L x2 y2 A r r 0 0 0 x3 y3 Z
    const x0 = nums[0]!;
    const y0 = nums[1]!;
    const x1 = nums[7]!;
    const y1 = nums[8]!;
    expect(x0 + x1).toBeCloseTo(2 * COMPASS_CX, 2);
    expect(y0).toBeCloseTo(y1, 3);
  });

  it('外弧端點落在 outerR 圓上、內弧端點落在 innerR 圓上', () => {
    const inner = 80;
    const outer = 120;
    const nums = parseNumbers(targetWedgePath(15, inner, outer));
    const distFromCenter = (x: number, y: number) => Math.hypot(x - COMPASS_CX, y - COMPASS_CY);
    expect(distFromCenter(nums[0]!, nums[1]!)).toBeCloseTo(outer, 1);
    const xInner = nums[9]!;
    const yInner = nums[10]!;
    expect(distFromCenter(xInner, yInner)).toBeCloseTo(inner, 1);
  });

  it('半角 15° 時外弧端點位於 ±15° 極角', () => {
    const nums = parseNumbers(targetWedgePath(15, 78, 126));
    const x0 = nums[0]!;
    const y0 = nums[1]!;
    // -15°：x = CX + 126*sin(-15°), y = CY - 126*cos(-15°)
    expect(x0).toBeCloseTo(COMPASS_CX + 126 * Math.sin((-15 * Math.PI) / 180), 1);
    expect(y0).toBeCloseTo(COMPASS_CY - 126 * Math.cos((-15 * Math.PI) / 180), 1);
  });
});

describe('isAligned', () => {
  it('0°（正對目標）對準', () => {
    expect(isAligned(0)).toBe(true);
  });

  it('±閾值內對準（含 wrap 到 350°+）', () => {
    expect(isAligned(ALIGNED_THRESHOLD_DEG)).toBe(true);
    expect(isAligned(360 - ALIGNED_THRESHOLD_DEG)).toBe(true);
    expect(isAligned(355)).toBe(true);
  });

  it('超出閾值不對準', () => {
    expect(isAligned(ALIGNED_THRESHOLD_DEG + 1)).toBe(false);
    expect(isAligned(180)).toBe(false);
    expect(isAligned(349)).toBe(false);
  });

  it('負角與 >360 正規化', () => {
    expect(isAligned(-5)).toBe(true);
    expect(isAligned(365)).toBe(true);
    expect(isAligned(-180)).toBe(false);
  });

  it('自訂閾值生效', () => {
    expect(isAligned(20, 25)).toBe(true);
    expect(isAligned(20, 15)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeDeckGeometry（issue #752 單一尺寸源契約）
// ---------------------------------------------------------------------------
describe('computeDeckGeometry', () => {
  it('SSOT 常數符合設計定稿：hub 144、膠囊 56', () => {
    expect(HUB_DIAMETER).toBe(144);
    expect(CAPSULE_HEIGHT).toBe(56);
  });

  it('375×667 直向（stage 375×232）：arc 模式、半徑受高度約束', () => {
    const g = computeDeckGeometry(375, 232);
    expect(g.mode).toBe('arc');
    // byHeight = 232 - 72 - 20 - 6 = 134 < byWidth 177.5
    expect(g.outerR).toBe(134);
    expect(g.cx).toBe(187.5);
    expect(g.cy).toBe(DECK_TOP_PAD + 134);
  });

  it('390×844 直向（stage 390×310）：arc 模式、半徑受寬度約束', () => {
    const g = computeDeckGeometry(390, 310);
    expect(g.mode).toBe('arc');
    // byWidth = (390-28)/2 = 181 < byHeight 212
    expect(g.outerR).toBe(181);
  });

  it('弧緣錨點（r=11）在楔形指向正東/正西時不觸 stage 左右緣', () => {
    for (const [w, h] of [
      [375, 232],
      [390, 310],
      [430, 340],
      [800, 600],
    ] as [number, number][]) {
      const g = computeDeckGeometry(w, h);
      expect(g.mode).toBe('arc');
      expect(g.cx - g.outerR - 11).toBeGreaterThanOrEqual(3);
      expect(g.cx + g.outerR + 11).toBeLessThanOrEqual(w - 3);
    }
  });

  it('有效視高 553（stage ≈375×184）：降級 capsule', () => {
    const g = computeDeckGeometry(375, 184);
    expect(g.mode).toBe('capsule');
    expect(g.outerR).toBe(0);
    expect(g.hubD).toBe(HUB_DIAMETER);
  });

  it('橫向 844×390（stage ≈844×120）：降級 capsule（根治 100% 吞沒）', () => {
    expect(computeDeckGeometry(844, 120).mode).toBe('capsule');
  });

  it('大平板 stage：半徑封頂 DECK_MAX_R', () => {
    const g = computeDeckGeometry(800, 600);
    expect(g.mode).toBe('arc');
    expect(g.outerR).toBe(DECK_MAX_R);
  });

  it('量測未就緒（0×0 / NaN）：安全回退 capsule', () => {
    expect(computeDeckGeometry(0, 0).mode).toBe('capsule');
    expect(computeDeckGeometry(Number.NaN, Number.NaN).mode).toBe('capsule');
  });

  it('arc 邊界恰在 DECK_MIN_ARC_R：126 → arc、125.9 → capsule', () => {
    const h = (r: number) => r + HUB_DIAMETER / 2 + DECK_TOP_PAD + DECK_BOTTOM_PAD;
    expect(computeDeckGeometry(600, h(DECK_MIN_ARC_R)).mode).toBe('arc');
    expect(computeDeckGeometry(600, h(DECK_MIN_ARC_R - 0.1)).mode).toBe('capsule');
  });

  it('零遮蔽不變式：任何 arc 幾何下楔形內緣 ≥ hub 外緣＋間隙、方位字不沉入 hub、弧不溢出 stage', () => {
    const cases: [number, number][] = [
      [375, 232],
      [390, 310],
      [430, 340],
      [600, 224],
      [800, 600],
    ];
    for (const [w, h] of cases) {
      const g = computeDeckGeometry(w, h);
      expect(g.mode).toBe('arc');
      const hubR = g.hubD / 2;
      // 楔形帶完全在 hub 外（forensics 根因 1 的結構性否定）
      expect(g.wedgeInnerR).toBe(hubR + WEDGE_HUB_GAP);
      expect(g.wedgeOuterR).toBeGreaterThan(g.wedgeInnerR);
      // 方位字（fontSize 20，半高 ~10px）內緣不觸 hub、外緣不出弧
      expect(g.labelR - 10).toBeGreaterThanOrEqual(hubR);
      expect(g.labelR + 10).toBeLessThanOrEqual(g.outerR);
      // 弧幾何不溢出 stage：頂部留錨點空間、底部 hub 收在 stage 內
      expect(g.cy - g.outerR).toBeGreaterThanOrEqual(0);
      expect(g.cy + hubR).toBeLessThanOrEqual(h);
      expect(g.cx + g.outerR).toBeLessThanOrEqual(w);
      // 旋轉包裝盒半尺寸涵蓋錨點外擴
      expect(g.half).toBe(g.outerR + DECK_RING_OVERHANG);
    }
  });
});

describe('cardinalLabelUprightTransform', () => {
  it('以標籤自身錨點為旋轉中心（與 cardinalLabelPosition 同座標）', () => {
    for (const i of [0, 9, 18, 27]) {
      const { x, y } = cardinalLabelPosition(i);
      expect(cardinalLabelUprightTransform(i, 45)).toBe(`rotate(45 ${x} ${y})`);
    }
  });

  it('回轉角等於容器旋轉的相反數：容器 -heading、文字 +heading 抵銷後直立', () => {
    expect(cardinalLabelUprightTransform(0, 270)).toBe(
      `rotate(270 ${COMPASS_CX} ${COMPASS_CY - CARDINAL_LABEL_RADIUS})`,
    );
  });

  it('heading 0 時為零旋轉（初始態不位移不變形）', () => {
    const { x, y } = cardinalLabelPosition(9);
    expect(cardinalLabelUprightTransform(9, 0)).toBe(`rotate(0 ${x} ${y})`);
  });

  it('自訂半徑時旋轉中心跟隨對應座標', () => {
    const { x, y } = cardinalLabelPosition(18, 80);
    expect(cardinalLabelUprightTransform(18, 30, 80)).toBe(`rotate(30 ${x} ${y})`);
  });
});
