// 場景 DOM 鈕命中幾何 SSOT（GAME_DESIGN §98 D2）：邏輯座標 → canvas CSS px。
// 純函式模組供 vitest 量測守門：直持殼縮放（如 1039→844，×0.812）會把 44–56
// 邏輯高的選單鈕壓到 36–45 CSS px（低於觸控下限）；短邊以 48px 保底、對稱
// 擴張命中盒（視覺不變；旋轉殼下 CSS 邊即裝置觸控邊）。

export const MIN_MENU_HIT_CSS_PX = 48;

export interface LogicalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CssRect {
  left: number;
  top: number;
  w: number;
  h: number;
}

// left/top 相對 canvas 原點（呼叫端自加 canvas offset）。
export function menuHitCssRect(rect: LogicalRect, sx: number, sy: number): CssRect {
  const w = Math.max(rect.w * sx, MIN_MENU_HIT_CSS_PX);
  const h = Math.max(rect.h * sy, MIN_MENU_HIT_CSS_PX);
  return {
    left: rect.x * sx - w / 2,
    top: rect.y * sy - h / 2,
    w,
    h,
  };
}
