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

// 按鈕觸發雙路徑綁定 SSOT（#823/#830，v19 審查收斂）：指標走 pointerdown 即發維持
// 觸控體感（殼層 touchstart preventDefault 會吞觸控合成 click，不能只綁 click）；
// 鍵盤/AT activation 無指標前程、只發 click（detail=0）恆放行；手勢級一次性旗標
// 吞指標合成 click，兩路徑互斥不雙觸發（WCAG 2.1.1 鍵盤可操作）。
// hud.addDomButton 與 settingsPage 全鈕共用，禁止各自重寫觸發邏輯。
export function bindButtonActivation(button: HTMLButtonElement, onPress: () => void): void {
  let swallowPointerClick = false;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    // preventDefault 連帶吞掉瀏覽器在指標按下時的預設聚焦（#870）：焦點留在 body，
    // 於是「點按鈕開啟模態」時模態記不到觸發元素、關閉後無從還原，Tab 也從頭開始。
    // 顯式補上即恢復原生語意；`:focus-visible` 讓指標路徑仍不顯示 focus ring，視覺無回歸。
    // 必須在 onPress 之前——onPress 可能開啟需要讀取 activeElement 的模態。
    button.focus();
    swallowPointerClick = true;
    onPress();
  });
  // 手勢中斷（捲動/系統手勢接管）不派發 click：清旗標防吞掉下一次合法 activation。
  button.addEventListener('pointercancel', () => {
    swallowPointerClick = false;
  });
  button.addEventListener('click', (event) => {
    // 鍵盤/AT activation（detail=0）無指標前程：恆放行，不受手勢旗標影響。
    if (swallowPointerClick && event.detail !== 0) {
      swallowPointerClick = false;
      return;
    }
    swallowPointerClick = false;
    onPress();
  });
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
