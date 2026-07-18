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
// Deck 幾何（issue #752）：單一尺寸源契約。
// 所有半徑/圓心由量測到的 stage px 推導，SVG viewBox 與 CSS px 1:1，
// 根治「固定 px Hub × vh 縮放刻度環」的遮蔽根因。
// ---------------------------------------------------------------------------

/** 中心 Hub 直徑（px；設計 SSOT 定稿 144）。 */
export const HUB_DIAMETER = 144;

/** 降級方向膠囊高度（px；設計 SSOT 定稿 56）。 */
export const CAPSULE_HEIGHT = 56;

/** 弧面左右安全邊距（px；≥ 錨點半徑 11＋3px 呼吸，楔形指向東西時錨點不被裁）。 */
export const DECK_SIDE_PAD = 14;

/** 弧頂至 stage 上緣邊距（px；容納車位錨點與對準光暈）。 */
export const DECK_TOP_PAD = 20;

/** Hub 下緣至 stage 下緣邊距（px）。 */
export const DECK_BOTTOM_PAD = 6;

/** 弧半徑上限（px；避免平板上盤面過大）。 */
export const DECK_MAX_R = 220;

/**
 * 弧模式最小半徑（px）。低於此值方位字帶無法同時避開 Hub 與刻度，
 * 一律降級為方向膠囊（矮視高 / 橫向吞沒情境的幾何判定式）。
 */
export const DECK_MIN_ARC_R = 126;

/** 旋轉方形包裝盒外擴量（px；容納錨點凸出與光暈）。 */
export const DECK_RING_OVERHANG = 16;

/** Hub 外緣至楔形內緣間隙（px；楔形恆不被 Hub 吞沒的結構保證）。 */
export const WEDGE_HUB_GAP = 8;

/** 楔形外緣自弧內縮量（px）。 */
export const WEDGE_OUTER_INSET = 12;

/** 方位字半徑自弧內縮量（px）。 */
export const CARDINAL_LABEL_INSET = 40;

/** 方位字最小半徑（px）：hubR 72 ＋ 字高半幅 10 ＋ 間隙 4。 */
export const CARDINAL_LABEL_MIN_R = 86;

export type DeckMode = 'arc' | 'capsule';

export interface DeckGeometry {
  mode: DeckMode;
  /** 弧半徑（px；capsule 模式為 0）。 */
  outerR: number;
  /** 圓心在 stage 座標系的位置（px）。 */
  cx: number;
  cy: number;
  /** 旋轉方形包裝盒半尺寸（= outerR + DECK_RING_OVERHANG）。 */
  half: number;
  hubD: number;
  wedgeInnerR: number;
  wedgeOuterR: number;
  labelR: number;
}

/**
 * 由量測到的 deck stage 尺寸推導全部盤面幾何（單一尺寸源 SSOT）。
 * 半徑同時受寬、高與上限約束；不足以承載弧模式時回傳 capsule。
 */
export function computeDeckGeometry(width: number, height: number): DeckGeometry {
  const hubR = HUB_DIAMETER / 2;
  const byWidth = (width - DECK_SIDE_PAD * 2) / 2;
  const byHeight = height - hubR - DECK_TOP_PAD - DECK_BOTTOM_PAD;
  const outerR = Math.min(byWidth, byHeight, DECK_MAX_R);
  // NaN／非正值一律走 capsule（量測未就緒或極端視口）。
  if (!(outerR >= DECK_MIN_ARC_R)) {
    return {
      mode: 'capsule',
      outerR: 0,
      cx: width / 2,
      cy: height / 2,
      half: 0,
      hubD: HUB_DIAMETER,
      wedgeInnerR: 0,
      wedgeOuterR: 0,
      labelR: 0,
    };
  }
  return {
    mode: 'arc',
    outerR,
    cx: width / 2,
    cy: DECK_TOP_PAD + outerR,
    half: outerR + DECK_RING_OVERHANG,
    hubD: HUB_DIAMETER,
    wedgeInnerR: hubR + WEDGE_HUB_GAP,
    wedgeOuterR: outerR - WEDGE_OUTER_INSET,
    labelR: Math.max(outerR - CARDINAL_LABEL_INSET, CARDINAL_LABEL_MIN_R),
  };
}

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
  cx: number = COMPASS_CX,
  cy: number = COMPASS_CY,
): { x: number; y: number } {
  const θ = (i * TICK_STEP_DEG * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(θ),
    y: cy - radius * Math.cos(θ),
  };
}

/**
 * 方位角ラベル直立抵銷 transform（issue #733）：
 * 刻度環容器旋轉 -heading 時，文字以自身錨點回轉 +heading，
 * 位置不變、字形保持直立（對齊 Apple 指南針／Google Maps 羅盤慣例）。
 * 旋轉中心必須用 cardinalLabelPosition 的同一座標，避免 rotate 中心錯誤造成定位偏移。
 */
export function cardinalLabelUprightTransform(
  i: number,
  headingDeg: number,
  radius: number = CARDINAL_LABEL_RADIUS,
  cx: number = COMPASS_CX,
  cy: number = COMPASS_CY,
): string {
  const { x, y } = cardinalLabelPosition(i, radius, cx, cy);
  return `rotate(${headingDeg} ${x} ${y})`;
}

// ---------------------------------------------------------------------------
// 目標方位楔形（annular sector）
// ---------------------------------------------------------------------------

/** 目標方位楔形半角（度）：車位方向 ±15° 高亮帶。 */
export const TARGET_WEDGE_HALF_ANGLE_DEG = 15;

/** 楔形內半徑預設值：與 deck 契約同源（hub 半徑＋間隙），杜絕舊 78px 腳槍。 */
export const TARGET_WEDGE_INNER_R = HUB_DIAMETER / 2 + WEDGE_HUB_GAP;

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
  cx: number = COMPASS_CX,
  cy: number = COMPASS_CY,
): string {
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
