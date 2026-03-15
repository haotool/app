/**
 * compassGeometry.ts — 羅盤 SVG 幾何常數與純函式。
 *
 * SVG 座標系（y 軸向下）的方位角ラベル配置公式：
 *   x = CX + r * sin(θ)
 *   y = CY - r * cos(θ)
 *
 * 將方位角ラベル渲染在旋轉群組外部，直接使用絕對座標，
 * 避免 rotate(-angle cx cy) 旋轉中心錯誤導致 E/S/W 定位跑掉。
 */

// ---------------------------------------------------------------------------
// 常數
// ---------------------------------------------------------------------------

export const COMPASS_CX = 150;
export const COMPASS_CY = 150;

/** 外圈半徑（圓環邊界）。 */
export const COMPASS_OUTER_R = 140;

/** 北方向刻度索引（SSOT：i===0 唯一定義處）。 */
export const COMPASS_NORTH_INDEX = 0;

/** 刻度起始 y 座標（從外圈頂端向內延伸）。 */
export const COMPASS_TICK_START_Y = 10;

/** 刻度總數（每 10° 一格）。 */
export const TICK_COUNT = 36;

/** 每格刻度角度。 */
export const TICK_STEP_DEG = 10;

/**
 * 方位角ラベル（N/E/S/W）預設半徑。
 * 置於刻度尾端（r=118）與中心轂（r≈75）的中間：(118+75)/2 ≈ 97。
 */
export const CARDINAL_LABEL_RADIUS = 97;

// ---------------------------------------------------------------------------
// 分類判斷
// ---------------------------------------------------------------------------

/** 是否為主方位角刻度（N/E/S/W，每 90° 一個）。 */
export function isCardinalIndex(i: number): boolean {
  return i % 9 === 0;
}

/**
 * 是否為次要主刻度（每 30° 一個，但排除主方位角）。
 * 即：i % 3 === 0 且非方位角。
 */
export function isMajorIndex(i: number): boolean {
  return i % 3 === 0 && !isCardinalIndex(i);
}

// ---------------------------------------------------------------------------
// 外觀屬性
// ---------------------------------------------------------------------------

/** 刻度長度（px）。 */
export function tickLength(i: number): number {
  if (isCardinalIndex(i)) return 22;
  if (isMajorIndex(i)) return 13;
  return 7;
}

/** 刻度筆畫寬度。 */
export function tickStrokeWidth(i: number): number {
  if (isCardinalIndex(i)) return 3;
  if (isMajorIndex(i)) return 1.5;
  return 0.8;
}

/** 刻度不透明度。 */
export function tickOpacity(i: number): number {
  if (isCardinalIndex(i)) return 1;
  if (isMajorIndex(i)) return 0.45;
  return 0.18;
}

// ---------------------------------------------------------------------------
// 幾何計算
// ---------------------------------------------------------------------------

/**
 * 計算方位角ラベル在 SVG 中的絕對座標。
 *
 * @param i     刻度索引（0=北, 9=東, 18=南, 27=西）
 * @param radius 半徑，預設 CARDINAL_LABEL_RADIUS
 */
export function cardinalLabelPosition(
  i: number,
  radius: number = CARDINAL_LABEL_RADIUS,
): { x: number; y: number } {
  const θ = (i * TICK_STEP_DEG * Math.PI) / 180;
  return {
    x: COMPASS_CX + radius * Math.sin(θ),
    y: COMPASS_CY - radius * Math.cos(θ),
  };
}
