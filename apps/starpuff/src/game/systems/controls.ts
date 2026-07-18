import type Phaser from 'phaser';
import { applyLayoutToDom, loadLayout } from '../core/layout';

// 每幀輸入狀態：pressed 為當幀觸發、held 為持續按住；down 為搖桿下向（§23 下衝擊預留）。
export interface ControlsState {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  actionPressed: boolean;
  actionHeld: boolean;
}

export interface ControlsSystem {
  state: ControlsState;
  update(): void;
  // 下跳指示（§71）：可穿落狀態跳鍵變色＋箭頭翻轉朝下；僅狀態轉變時碰 DOM。
  setDropReady(ready: boolean): void;
  destroy(): void;
}

type ButtonName = 'a' | 'b';

type KeyMap = Record<'LEFT' | 'RIGHT' | 'DOWN' | 'Z' | 'X', Phaser.Input.Keyboard.Key>;

// 按壓視覺回饋 class；樣式規則由整合層在 style.css 補上。
const PRESSED_CLASS = 'is-pressed';
const ENGAGED_CLASS = 'is-engaged';
const DROP_READY_CLASS = 'is-drop-ready';
// 浮動搖桿（§21）：pointerdown 落點即中心、半徑 60、死區 12。
const JOY_RADIUS = 60;
const JOY_DEADZONE = 12;
// 下向判定閾值：需明確下壓過半徑一半，避免斜向移動誤觸下衝擊（§23）。
export const JOY_DOWN_THRESHOLD = JOY_RADIUS * 0.5;

export function isJoyDown(dy: number): boolean {
  return dy > JOY_DOWN_THRESHOLD;
}

// 螢幕座標 → 元素局部座標（recon-v4 A.3）：clientX/Y 不反映祖先 CSS rotate，portrait 殼內
// 需做 90 度 CW 逆變換（localDx = screenDy、localDy = -screenDx）；以 AABB 中心為樞軸，
// 局部尺寸取 layout 值（clientWidth/Height）。純函式供 vitest 驗證。
export function pointerToLocal(
  rect: { left: number; top: number; width: number; height: number },
  localW: number,
  localH: number,
  rotated: boolean,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  const dx = screenX - (rect.left + rect.width / 2);
  const dy = screenY - (rect.top + rect.height / 2);
  if (!rotated) return { x: localW / 2 + dx, y: localH / 2 + dy };
  return { x: localW / 2 + dy, y: localH / 2 - dx };
}

// 直持判定單一出口：controls／keyConfig／shellLayout 共用，避免定義漂移。
export const isPortrait = (): boolean => window.matchMedia('(orientation: portrait)').matches;

function toLocal(el: HTMLElement, event: PointerEvent): { x: number; y: number } {
  return pointerToLocal(
    el.getBoundingClientRect(),
    el.clientWidth,
    el.clientHeight,
    isPortrait(),
    event.clientX,
    event.clientY,
  );
}

export function createControls(scene: Phaser.Scene): ControlsSystem {
  const state: ControlsState = {
    left: false,
    right: false,
    down: false,
    jumpPressed: false,
    jumpHeld: false,
    actionPressed: false,
    actionHeld: false,
  };

  const held: Record<ButtonName, boolean> = { a: false, b: false };
  const joy = { id: null as number | null, dx: 0, dy: 0 };
  const cleanups: (() => void)[] = [];

  // 虛擬手柄僅遊戲場景顯示：controls 系統生命週期即 GameScene 生命週期。
  const controlsRoot = document.getElementById('controls');
  controlsRoot?.classList.add('is-active');
  cleanups.push(() => controlsRoot?.classList.remove('is-active'));
  // 進場套用使用者自訂布局（§34）：配置模式儲存後下一局即生效。
  if (controlsRoot) applyLayoutToDom(controlsRoot, loadLayout());

  const on = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ): void => {
    el.addEventListener(type, handler as EventListener, { passive: false });
    cleanups.push(() => el.removeEventListener(type, handler as EventListener));
  };

  // 合成事件（e2e/QA）無 active pointer，setPointerCapture 會擲 NotFoundError；捕捉失敗不影響輸入。
  const capture = (el: HTMLElement, pointerId: number) => {
    try {
      el.setPointerCapture(pointerId);
    } catch {
      /* noop */
    }
  };

  // 左半屏浮動搖桿：底環定錨落點、浮球隨指，抬指淡出；pointerId 分路支援與 A/B 同按。
  // 座標一律先轉 zone 局部空間（recon-v4 A.3）：portrait 旋轉殼下 clientX/Y 軸向互換，
  // 定錨與位移全在局部空間計算，兩種持向共用同一套邏輯。
  const zone = document.getElementById('joy-zone');
  const ring = zone?.querySelector<HTMLElement>('.joy-ring') ?? null;
  const thumb = zone?.querySelector<HTMLElement>('.joy-thumb') ?? null;
  if (zone && ring && thumb) {
    const center = { x: 0, y: 0 };
    const place = (el: HTMLElement, x: number, y: number) => {
      el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px)`;
    };
    const reset = () => {
      joy.id = null;
      joy.dx = 0;
      joy.dy = 0;
      zone.classList.remove(ENGAGED_CLASS);
    };
    on(zone, 'pointerdown', (event) => {
      event.preventDefault();
      if (joy.id !== null) return;
      joy.id = event.pointerId;
      const local = toLocal(zone, event);
      center.x = local.x;
      center.y = local.y;
      place(ring, center.x, center.y);
      place(thumb, center.x, center.y);
      zone.classList.add(ENGAGED_CLASS);
      capture(zone, event.pointerId);
    });
    on(zone, 'pointermove', (event) => {
      if (event.pointerId !== joy.id) return;
      event.preventDefault();
      const local = toLocal(zone, event);
      const dx = local.x - center.x;
      const dy = local.y - center.y;
      const len = Math.hypot(dx, dy);
      const clamp = len > JOY_RADIUS ? JOY_RADIUS / len : 1;
      joy.dx = dx * clamp;
      joy.dy = dy * clamp;
      place(thumb, center.x + joy.dx, center.y + joy.dy);
    });
    const release = (event: PointerEvent) => {
      if (event.pointerId === joy.id) reset();
    };
    on(zone, 'pointerup', release);
    on(zone, 'pointercancel', release);
    cleanups.push(reset);
  }

  // 右側 A/B 圖形圓鍵：釋放以 pointerup/pointercancel 為準（setPointerCapture 保證收到），防卡鍵。
  document.querySelectorAll<HTMLElement>('[data-btn]').forEach((el) => {
    const name = el.dataset['btn'] as ButtonName | undefined;
    if (!name || !(name in held)) return;
    let activeId: number | null = null;
    on(el, 'pointerdown', (event) => {
      event.preventDefault();
      activeId = event.pointerId;
      held[name] = true;
      el.classList.add(PRESSED_CLASS);
      capture(el, event.pointerId);
    });
    const release = (event: PointerEvent) => {
      if (event.pointerId !== activeId) return;
      activeId = null;
      held[name] = false;
      el.classList.remove(PRESSED_CLASS);
    };
    on(el, 'pointerup', release);
    on(el, 'pointercancel', release);
    cleanups.push(() => {
      held[name] = false;
      el.classList.remove(PRESSED_CLASS);
    });
  });

  const keys = scene.input.keyboard?.addKeys('LEFT,RIGHT,DOWN,Z,X') as KeyMap | undefined;

  let prevJumpHeld = false;
  let prevActionHeld = false;

  // 下跳指示（§71）：跳鍵（A）變色＋箭頭翻轉；邊緣偵測防逐幀 class 抖動。
  const jumpBtn = document.querySelector<HTMLElement>('[data-btn="a"]');
  let dropReady = false;
  cleanups.push(() => {
    dropReady = false;
    jumpBtn?.classList.remove(DROP_READY_CLASS);
  });

  return {
    state,
    update() {
      state.left = joy.dx < -JOY_DEADZONE || keys?.LEFT.isDown === true;
      state.right = joy.dx > JOY_DEADZONE || keys?.RIGHT.isDown === true;
      state.down = isJoyDown(joy.dy) || keys?.DOWN.isDown === true;

      const jumpHeld = held.a || keys?.Z.isDown === true;
      state.jumpPressed = jumpHeld && !prevJumpHeld;
      state.jumpHeld = jumpHeld;
      prevJumpHeld = jumpHeld;

      const actionHeld = held.b || keys?.X.isDown === true;
      state.actionPressed = actionHeld && !prevActionHeld;
      state.actionHeld = actionHeld;
      prevActionHeld = actionHeld;
    },
    setDropReady(ready: boolean) {
      if (ready === dropReady) return;
      dropReady = ready;
      jumpBtn?.classList.toggle(DROP_READY_CLASS, ready);
    },
    destroy() {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
}
