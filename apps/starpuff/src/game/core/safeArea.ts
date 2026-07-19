// 殼局部 safe-area 量測（GAME_DESIGN §93 預備）：canvas 內 HUD（暫停／靜音鍵）
// 需避開瀏海與 home indicator，但 Phaser 邏輯座標無法直讀 env()——
// 以 #keys-layer 的 computed inset（CSS 已依 cw/ccw 換軸並含地板值）換算成邏輯座標偏移。
// 純換算函式供 vitest 驗證；DOM 讀取集中於 readShellSafeArea。

export interface ShellSafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const ZERO_SAFE_AREA: ShellSafeArea = { top: 0, right: 0, bottom: 0, left: 0 };

// keys-layer 的 inset 地板值（style.css SSOT 鏡像）：頂 20（含 iOS phantom 死區）、
// 其餘 12。HUD 換算時扣除地板、只取「超出地板的實際 inset」，避免無瀏海裝置整體內縮。
export const KEYS_LAYER_FLOOR = { top: 20, right: 12, bottom: 12, left: 12 } as const;

export function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// computed inset → 超出地板的净 inset（CSS px，殼局部空間）。
export function extraInset(computedPx: number, floorPx: number): number {
  return Math.max(0, computedPx - floorPx);
}

// 讀取殼局部 safe-area 净值（已換軸、已扣地板）：keys-layer 隱藏時 computed 值仍可讀
// （display:none 祖先不影響自身 computed style 解析）。
export function readShellSafeArea(): ShellSafeArea {
  const layer = document.getElementById('keys-layer');
  if (!layer) return ZERO_SAFE_AREA;
  const cs = getComputedStyle(layer);
  return {
    top: extraInset(parsePx(cs.top), KEYS_LAYER_FLOOR.top),
    right: extraInset(parsePx(cs.right), KEYS_LAYER_FLOOR.right),
    bottom: extraInset(parsePx(cs.bottom), KEYS_LAYER_FLOOR.bottom),
    left: extraInset(parsePx(cs.left), KEYS_LAYER_FLOOR.left),
  };
}

// CSS px → 遊戲邏輯 px：殼與 canvas 同框（FIT 填滿殼），比例＝邏輯寬／canvas CSS 寬。
export function toLogicalPx(cssPx: number, logicalWidth: number, canvasCssWidth: number): number {
  if (canvasCssWidth <= 0) return 0;
  return (cssPx * logicalWidth) / canvasCssWidth;
}
