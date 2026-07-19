// 旋轉殼方向 SSOT（GAME_DESIGN §87）：直持殼的旋轉方向與螢幕→局部座標換算集中於此，
// controls／keyConfig／shellLayout 一律經本模組取向與換算，禁止各自複製公式。
// 純函式＋localStorage 容錯模組（同 core/layout.ts 模式），vitest node 環境可直測。

// 殼旋轉態：none＝橫持不旋轉；cw＝CSS rotate(90deg)；ccw＝CSS rotate(-90deg)。
export type ShellRotation = 'none' | 'cw' | 'ccw';

// 直持旋轉偏好：ccw（新預設，手機順時針轉、瀏海在右）／cw（v4–v13 舊方向，手機逆時針轉）。
export type PortraitRotationPref = 'cw' | 'ccw';

export const ROTATION_STORAGE_KEY = 'sp-rotation';
export const DEFAULT_PORTRAIT_ROTATION: PortraitRotationPref = 'ccw';

// 舊方向以 html class 啟用（CSS 預設即新方向，JS 載入前的 fallback 天然是新預設）。
const LEGACY_ROTATION_CLASS = 'sp-rot-cw';

export function parseRotationPref(raw: string | null): PortraitRotationPref {
  return raw === 'cw' ? 'cw' : DEFAULT_PORTRAIT_ROTATION;
}

// 偏好記憶體快取（審查修復）：getShellRotation 位於 pointer 熱路徑，
// 避免每次事件都同步讀 localStorage；寫入時同步更新。
let cachedPref: PortraitRotationPref | null = null;

// 隱私模式下 localStorage 可能拋錯：讀退預設、寫靜默略過。
export function loadRotationPref(): PortraitRotationPref {
  if (cachedPref !== null) return cachedPref;
  try {
    cachedPref = parseRotationPref(localStorage.getItem(ROTATION_STORAGE_KEY));
  } catch {
    cachedPref = DEFAULT_PORTRAIT_ROTATION;
  }
  return cachedPref;
}

export function saveRotationPref(pref: PortraitRotationPref): void {
  cachedPref = pref;
  try {
    localStorage.setItem(ROTATION_STORAGE_KEY, pref);
  } catch {
    /* noop */
  }
}

// 套用旋轉方向至 html class：CSS 依 sp-rot-cw 切換殼 transform 與 safe-area 換軸表。
export function applyRotationClass(pref: PortraitRotationPref): void {
  document.documentElement.classList.toggle(LEGACY_ROTATION_CLASS, pref === 'cw');
}

// 直持判定單一出口：controls／keyConfig／shellLayout 共用，避免定義漂移。
export const isPortrait = (): boolean => window.matchMedia('(orientation: portrait)').matches;

// 當前殼旋轉態：橫持恆 none；直持依使用者偏好取向。
export function getShellRotation(): ShellRotation {
  return isPortrait() ? loadRotationPref() : 'none';
}

// 螢幕座標 → 元素局部座標（recon-v4 A.3 / §87）：clientX/Y 不反映祖先 CSS rotate，
// 旋轉殼內需做逆變換；以 AABB 中心為樞軸，局部尺寸取 layout 值（clientWidth/Height）。
// cw 殼（rotate 90deg）：localDx = screenDy、localDy = -screenDx；
// ccw 殼（rotate -90deg）：localDx = -screenDy、localDy = screenDx。
export function pointerToLocal(
  rect: { left: number; top: number; width: number; height: number },
  localW: number,
  localH: number,
  rotation: ShellRotation,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  const dx = screenX - (rect.left + rect.width / 2);
  const dy = screenY - (rect.top + rect.height / 2);
  switch (rotation) {
    case 'none':
      return { x: localW / 2 + dx, y: localH / 2 + dy };
    case 'cw':
      return { x: localW / 2 + dy, y: localH / 2 - dx };
    case 'ccw': {
      return { x: localW / 2 - dy, y: localH / 2 + dx };
    }
    default: {
      const exhausted: never = rotation;
      throw new Error(`未定義的殼旋轉態：${String(exhausted)}`);
    }
  }
}
