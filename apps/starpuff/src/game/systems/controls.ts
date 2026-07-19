import type Phaser from 'phaser';
import { applyLayoutToDom, loadLayout } from '../core/layout';
import { getShellRotation, pointerToLocal } from '../core/rotation';

// 每幀輸入狀態：pressed 為當幀觸發、held 為持續按住；down 為搖桿下向（§23 下衝擊預留）；
// downBuffered（§85）＝即時 down 或釋放後緩衝窗內，供「先滑後按跳」下穿語意。
export interface ControlsState {
  left: boolean;
  right: boolean;
  down: boolean;
  downBuffered: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  actionPressed: boolean;
  actionHeld: boolean;
}

export interface ControlsSystem {
  state: ControlsState;
  update(deltaMs: number): void;
  // 下跳指示（§77）：可穿落狀態跳鍵變色＋箭頭翻轉朝下；僅狀態轉變時碰 DOM。
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
// 下向判定（§85 熱修）：真實拇指定錨常貼屏幕底緣，下滑行程僅剩 15-25px，舊閾值
// 30px（半徑一半）物理上達不到——降至 18px 並以 ±60 度扇區容納自然斜下滑。
export const JOY_DOWN_THRESHOLD = 18;
const JOY_DOWN_SECTOR_TAN = Math.tan(Math.PI / 3);

export function isJoyDown(dx: number, dy: number): boolean {
  return dy >= JOY_DOWN_THRESHOLD && Math.abs(dx) <= dy * JOY_DOWN_SECTOR_TAN;
}

// drop-intent 緩衝窗（§85）：flick 手勢（滑完即抬指）與跳鍵按下相隔數十至數百 ms，
// down 釋放後保留 300ms 意圖窗——實測人為停頓 150ms 經觸控事件與幀對齊後間隔達
// ~270ms，250ms 窗臨界抖動；窗內按跳仍判下跳，下砸（空中）不吃此窗防誤觸。
export const DOWN_BUFFER_MS = 300;

export function advanceDownBuffer(bufferMs: number, down: boolean, deltaMs: number): number {
  return down ? DOWN_BUFFER_MS : Math.max(0, bufferMs - deltaMs);
}

// 螢幕→局部座標換算與直持判定 SSOT 移至 core/rotation.ts（§90）：支援 cw/ccw 雙向殼。
function toLocal(el: HTMLElement, event: PointerEvent): { x: number; y: number } {
  return pointerToLocal(
    el.getBoundingClientRect(),
    el.clientWidth,
    el.clientHeight,
    getShellRotation(),
    event.clientX,
    event.clientY,
  );
}

export function createControls(scene: Phaser.Scene): ControlsSystem {
  const state: ControlsState = {
    left: false,
    right: false,
    down: false,
    downBuffered: false,
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
  let downBufferMs = 0;

  // 下跳指示（§77）：跳鍵（A）變色＋箭頭翻轉；邊緣偵測防逐幀 class 抖動。
  const jumpBtn = document.querySelector<HTMLElement>('[data-btn="a"]');
  let dropReady = false;
  cleanups.push(() => {
    dropReady = false;
    jumpBtn?.classList.remove(DROP_READY_CLASS);
  });

  return {
    state,
    update(deltaMs: number) {
      state.left = joy.dx < -JOY_DEADZONE || keys?.LEFT.isDown === true;
      state.right = joy.dx > JOY_DEADZONE || keys?.RIGHT.isDown === true;
      state.down = isJoyDown(joy.dx, joy.dy) || keys?.DOWN.isDown === true;
      downBufferMs = advanceDownBuffer(downBufferMs, state.down, deltaMs);
      state.downBuffered = downBufferMs > 0;

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
