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

// ---------------------------------------------------------------------------
// 目標方位楔形（annular sector）
// ---------------------------------------------------------------------------

/** 目標方位楔形半角（度）：車位方向 ±15° 高亮帶。 */
export const TARGET_WEDGE_HALF_ANGLE_DEG = 15;

/** 楔形內半徑（環帶內緣，避開中心 Hub）。 */
export const TARGET_WEDGE_INNER_R = 78;

/** 楔形外半徑（環帶外緣，落在刻度內側）。 */
export const TARGET_WEDGE_OUTER_R = 126;

/** 對準判定閾值（度）：相對誤差小於此值視為對準（brief：誤差 <10°）。 */
export const ALIGNED_THRESHOLD_DEG = 10;

/** 極座標（0°=正上方/北，順時針）轉 SVG 座標。 */
function polarPoint(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const θ = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(θ), y: cy - r * Math.cos(θ) };
}

/**
 * 產生指向正北（正上方）的環帶扇形 SVG path。
 * 使用時置於旋轉群組內，由 transform rotate 對準目標方位。
 *
 * @param halfAngleDeg 半角（扇形展開 ±halfAngleDeg）
 * @param innerR       環帶內半徑
 * @param outerR       環帶外半徑
 */
export function targetWedgePath(
  halfAngleDeg: number = TARGET_WEDGE_HALF_ANGLE_DEG,
  innerR: number = TARGET_WEDGE_INNER_R,
  outerR: number = TARGET_WEDGE_OUTER_R,
): string {
  const cx = COMPASS_CX;
  const cy = COMPASS_CY;
  const startOuter = polarPoint(cx, cy, outerR, -halfAngleDeg);
  const endOuter = polarPoint(cx, cy, outerR, halfAngleDeg);
  const startInner = polarPoint(cx, cy, innerR, halfAngleDeg);
  const endInner = polarPoint(cx, cy, innerR, -halfAngleDeg);
  const fmt = (n: number) => Number(n.toFixed(3));
  return [
    `M ${fmt(startOuter.x)} ${fmt(startOuter.y)}`,
    `A ${outerR} ${outerR} 0 0 1 ${fmt(endOuter.x)} ${fmt(endOuter.y)}`,
    `L ${fmt(startInner.x)} ${fmt(startInner.y)}`,
    `A ${innerR} ${innerR} 0 0 0 ${fmt(endInner.x)} ${fmt(endInner.y)}`,
    'Z',
  ].join(' ');
}

/**
 * 依相對旋轉角（目標方位 − 手機朝向，0–360°）判定是否對準。
 * 對準 = 誤差落在 ±threshold 內（含 wrap）。
 */
export function isAligned(
  relativeRotation: number,
  thresholdDeg: number = ALIGNED_THRESHOLD_DEG,
): boolean {
  const r = ((relativeRotation % 360) + 360) % 360;
  return r <= thresholdDeg || r >= 360 - thresholdDeg;
}
