// 虛擬鍵布局 SSOT（GAME_DESIGN §34）：座標為 keys-layer 安全區內的中心點比例（0–1），
// 與殼尺寸無關，直橫持共用；純資料模組供 vitest node 環境驗證。
export interface KeyPosition {
  cx: number;
  cy: number;
}

export interface ControlLayout {
  version: number;
  a: KeyPosition;
  b: KeyPosition;
}

export const LAYOUT_STORAGE_KEY = 'sp-key-layout';
export const LAYOUT_SCHEMA_VERSION = 1;

// 拖曳夾限：按鍵中心須離安全區邊緣一段比例，保證觸控目標完整落在畫面內。
export const KEY_CLAMP = {
  minX: 0.05,
  maxX: 0.95,
  minY: 0.1,
  maxY: 0.9,
} as const;

// 人體工學預設（§34 調研定案）：A 跳躍居右下拇指熱區；B 吸/射移右側偏上供食指按壓，
// 兩鍵垂直遠離杜絕誤觸。
export const DEFAULT_LAYOUT: ControlLayout = {
  version: LAYOUT_SCHEMA_VERSION,
  a: { cx: 0.92, cy: 0.78 },
  b: { cx: 0.92, cy: 0.34 },
};

export function clampKeyPosition(cx: number, cy: number): KeyPosition {
  return {
    cx: Math.min(KEY_CLAMP.maxX, Math.max(KEY_CLAMP.minX, cx)),
    cy: Math.min(KEY_CLAMP.maxY, Math.max(KEY_CLAMP.minY, cy)),
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

// 解析持久化 JSON：schema 版本不符或形狀損毀一律回退預設，座標重新夾限。
export function parseLayout(raw: string | null): ControlLayout {
  if (!raw) return DEFAULT_LAYOUT;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data['version'] !== LAYOUT_SCHEMA_VERSION) return DEFAULT_LAYOUT;
    if (!isValidPosition(data['a']) || !isValidPosition(data['b'])) return DEFAULT_LAYOUT;
    return {
      version: LAYOUT_SCHEMA_VERSION,
      a: clampKeyPosition(data['a'].cx, data['a'].cy),
      b: clampKeyPosition(data['b'].cx, data['b'].cy),
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

// 隱私模式下 localStorage 可能拋錯：讀寫皆容錯，布局退預設、儲存靜默略過。
export function loadLayout(): ControlLayout {
  try {
    return parseLayout(localStorage.getItem(LAYOUT_STORAGE_KEY));
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayout(layout: ControlLayout): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* noop */
  }
}

export function resetLayout(): ControlLayout {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {
    /* noop */
  }
  return DEFAULT_LAYOUT;
}

// 座標序列化為百分比字串：toFixed(2) 避免浮點尾數（0.92*100 = 92.00000000000001）。
export function toPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

// 套用布局至 DOM：keys-layer 內以中心點百分比定位（translate(-50%,-50%) 由 CSS 負責）。
export function applyLayoutToDom(root: ParentNode, layout: ControlLayout): void {
  for (const name of ['a', 'b'] as const) {
    const el = root.querySelector<HTMLElement>(`[data-btn="${name}"]`);
    if (!el) continue;
    el.style.left = toPercent(layout[name].cx);
    el.style.top = toPercent(layout[name].cy);
  }
}
