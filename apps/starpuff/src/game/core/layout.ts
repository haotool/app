// 虛擬鍵布局 SSOT（GAME_DESIGN §34/§89/§95）：座標為 keys-layer 安全區內的中心點比例
// （0–1）；v2 增全域縮放 scale。純資料模組供 vitest node 環境驗證。
// v16 D1：自訂布局直橫持共用不變，「預設」改依殼旋轉態分流（見 defaultLayoutFor）。
import { getShellRotation, type ShellRotation } from './rotation';

export interface KeyPosition {
  cx: number;
  cy: number;
}

export interface ControlLayout {
  version: number;
  a: KeyPosition;
  b: KeyPosition;
  scale: number;
}

export const LAYOUT_STORAGE_KEY = 'sp-key-layout';
export const LAYOUT_SCHEMA_VERSION = 2;

// 縮放範圍（§89）：0.8–1.3；最小鍵 B 72px×0.8=57.6px 仍高於 44px 觸控下限（守門單測）。
export const KEY_SCALE = {
  min: 0.8,
  max: 1.3,
  step: 0.05,
  default: 1,
} as const;

// 基準鍵尺寸（CSS SSOT 鏡像）：A 76、B 72；縮放經 keys-layer CSS 變數套用。
export const KEY_BASE_PX = { a: 76, b: 72 } as const;

export function clampKeyScale(scale: number): number {
  if (!Number.isFinite(scale)) return KEY_SCALE.default;
  return Math.min(KEY_SCALE.max, Math.max(KEY_SCALE.min, scale));
}

// 儲存值粗夾限：持久化資料反序列化時的邊界保護（不知實際層尺寸，取保守比例）。
export const KEY_CLAMP = {
  minX: 0.05,
  maxX: 0.95,
  minY: 0.1,
  maxY: 0.9,
} as const;

// 動態夾限邊距：按鍵中心離安全區邊緣至少 半徑 + pad，短 keys-layer 也不溢出。
export const KEY_EDGE_PAD_PX = 4;

// 人體工學預設（§34 調研定案，橫持）：A 跳躍居右下拇指熱區；B 吸/射移右側偏上供
// 食指按壓，兩鍵垂直遠離杜絕誤觸。
export const DEFAULT_LAYOUT: ControlLayout = {
  version: LAYOUT_SCHEMA_VERSION,
  a: { cx: 0.92, cy: 0.78 },
  b: { cx: 0.92, cy: 0.34 },
  scale: KEY_SCALE.default,
};

// 直持預設鍵位錨點 SSOT（§95 D1）：以「裝置螢幕比例」定義右下拇指帶目標——
// 直持雙手握持時右拇指熱區在螢幕右下（fy 0.68–0.86），B 沿拇指弧在 A 上方。
// v14 沿用橫持層比例的預設在旋轉殼下會映射到螢幕頂端（a 裝置 y≈78px，不可及）。
export const PORTRAIT_THUMB_ANCHORS = {
  a: { fx: 0.82, fy: 0.86 },
  b: { fx: 0.8, fy: 0.68 },
} as const;

// 裝置比例 → 層比例反算（§87 軸向映射的逆向）：ccw 殼局部 (x,y)→裝置 (y, H−x)，
// 故 cx=1−fy、cy=fx；cw 殼局部 (x,y)→裝置 (W−y, x)，故 cx=fy、cy=1−fx。
// 忽略 keys-layer 邊緣 inset（12–20px 級）：錨點為帶狀目標，偏差 ≤2% 可接受。
function portraitDefaultLayout(rotation: 'cw' | 'ccw'): ControlLayout {
  const map = ({ fx, fy }: { fx: number; fy: number }): KeyPosition =>
    rotation === 'ccw' ? { cx: 1 - fy, cy: fx } : { cx: fy, cy: 1 - fx };
  return {
    version: LAYOUT_SCHEMA_VERSION,
    a: map(PORTRAIT_THUMB_ANCHORS.a),
    b: map(PORTRAIT_THUMB_ANCHORS.b),
    scale: KEY_SCALE.default,
  };
}

// 預設布局單一出口（§95 D1）：橫持沿用 v14 定案、直持依旋轉方向給右下拇指帶錨點；
// 一律回傳新物件，呼叫端可安全變更。
export function defaultLayoutFor(rotation: ShellRotation): ControlLayout {
  return rotation === 'none' ? structuredClone(DEFAULT_LAYOUT) : portraitDefaultLayout(rotation);
}

export function clampKeyPosition(cx: number, cy: number): KeyPosition {
  return {
    cx: Math.min(KEY_CLAMP.maxX, Math.max(KEY_CLAMP.minX, cx)),
    cy: Math.min(KEY_CLAMP.maxY, Math.max(KEY_CLAMP.minY, cy)),
  };
}

// 依實際層尺寸與按鍵尺寸動態夾限（審查修復：固定比例未計鍵半徑，短層會溢出）；
// 邊距超過半層的退化情境（極小層）收斂至置中。
export function clampKeyPositionForLayer(
  cx: number,
  cy: number,
  layerW: number,
  layerH: number,
  btnPx: number,
): KeyPosition {
  const marginX = Math.min(0.5, (btnPx / 2 + KEY_EDGE_PAD_PX) / layerW);
  const marginY = Math.min(0.5, (btnPx / 2 + KEY_EDGE_PAD_PX) / layerH);
  return {
    cx: Math.min(1 - marginX, Math.max(marginX, cx)),
    cy: Math.min(1 - marginY, Math.max(marginY, cy)),
  };
}

function isValidPosition(value: unknown): value is KeyPosition {
  if (typeof value !== 'object' || value === null) return false;
  const pos = value as Record<string, unknown>;
  return (
    typeof pos['cx'] === 'number' &&
    Number.isFinite(pos['cx']) &&
    typeof pos['cy'] === 'number' &&
    Number.isFinite(pos['cy'])
  );
}

// 解析持久化 JSON（§89 versioned migration）：v1（無 scale）就地升級為 v2 保留既有
// 鍵位、scale 補預設；未知版本或形狀損毀一律回退預設（依旋轉態分流），座標與縮放
// 重新夾限。合法自訂資料不受旋轉影響（§95 D1：自訂布局不得被覆蓋）。
export function parseLayout(raw: string | null, rotation: ShellRotation = 'none'): ControlLayout {
  if (!raw) return defaultLayoutFor(rotation);
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const version = data['version'];
    if (version !== 1 && version !== LAYOUT_SCHEMA_VERSION) return defaultLayoutFor(rotation);
    if (!isValidPosition(data['a']) || !isValidPosition(data['b'])) {
      return defaultLayoutFor(rotation);
    }
    return {
      version: LAYOUT_SCHEMA_VERSION,
      a: clampKeyPosition(data['a'].cx, data['a'].cy),
      b: clampKeyPosition(data['b'].cx, data['b'].cy),
      scale: version === 1 ? KEY_SCALE.default : clampKeyScale(Number(data['scale'])),
    };
  } catch {
    return defaultLayoutFor(rotation);
  }
}

// 隱私模式下 localStorage 可能拋錯：讀寫皆容錯，布局退預設、儲存靜默略過。
// 旋轉態於呼叫當下解析（§95 D1）：無自訂資料時直/橫持各得人體工學正確的預設。
export function loadLayout(): ControlLayout {
  let rotation: ShellRotation = 'none';
  try {
    rotation = getShellRotation();
  } catch {
    /* 非瀏覽器環境（單測）退橫持預設。 */
  }
  try {
    return parseLayout(localStorage.getItem(LAYOUT_STORAGE_KEY), rotation);
  } catch {
    return defaultLayoutFor(rotation);
  }
}

// 是否存在使用者自訂布局（§95 D1）：配置頁據此決定儲存語意（預設態不落盤，
// 讓直橫持各自動態解析預設）。
export function hasStoredLayout(): boolean {
  try {
    return localStorage.getItem(LAYOUT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveLayout(layout: ControlLayout): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* noop */
  }
}

export function getDefaultLayout(): ControlLayout {
  return structuredClone(DEFAULT_LAYOUT);
}

// 回傳值為橫持基準預設；直持配置頁實際走 defaultLayoutFor(rotation) 旋轉分流，
// 此處僅負責清除自訂落盤（§95）。
export function resetLayout(): ControlLayout {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {
    /* noop */
  }
  return getDefaultLayout();
}

// 座標序列化為百分比字串：toFixed(2) 避免浮點尾數（0.92*100 = 92.00000000000001）。
export function toPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

// 套用布局至 DOM：keys-layer 內以中心點百分比定位（translate(-50%,-50%) 由 CSS 負責），
// 縮放經 CSS 變數 --sp-key-scale 驅動鍵尺寸（§89），先設變數再量測使夾限吃到新尺寸。
// 層可量測（顯示中）時以實際尺寸＋鍵尺寸動態夾限，避免舊儲存值在短層溢出；
// 隱藏狀態（Title 啟動套用）量測為 0 則原樣寫入，待 controls 進場重套時矯正。
export function applyLayoutToDom(root: ParentNode, layout: ControlLayout): void {
  for (const name of ['a', 'b'] as const) {
    const el = root.querySelector<HTMLElement>(`[data-btn="${name}"]`);
    if (!el) continue;
    el.style.setProperty('--sp-key-scale', String(layout.scale));
    const layer = el.parentElement;
    const measurable =
      layer !== null && layer.clientWidth > 0 && layer.clientHeight > 0 && el.offsetWidth > 0;
    const pos = measurable
      ? clampKeyPositionForLayer(
          layout[name].cx,
          layout[name].cy,
          layer.clientWidth,
          layer.clientHeight,
          el.offsetWidth,
        )
      : layout[name];
    el.style.left = toPercent(pos.cx);
    el.style.top = toPercent(pos.cy);
  }
}
