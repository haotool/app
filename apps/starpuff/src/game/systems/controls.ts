import type Phaser from 'phaser';

// 每幀輸入狀態：pressed 為當幀觸發、held 為持續按住。
export interface ControlsState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  actionPressed: boolean;
  actionHeld: boolean;
}

export interface ControlsSystem {
  state: ControlsState;
  update(): void;
  destroy(): void;
}

type ButtonName = 'left' | 'right' | 'a' | 'b';

type KeyMap = Record<'LEFT' | 'RIGHT' | 'Z' | 'X', Phaser.Input.Keyboard.Key>;

// 按壓視覺回饋 class；樣式規則由整合層在 style.css 補上。
const PRESSED_CLASS = 'is-pressed';

export function createControls(scene: Phaser.Scene): ControlsSystem {
  const state: ControlsState = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
    actionPressed: false,
    actionHeld: false,
  };

  // DOM 虛擬按鍵：pointer 事件各自獨立，天然支援方向 + 跳/吸多點同按。
  const held: Record<ButtonName, boolean> = { left: false, right: false, a: false, b: false };
  const cleanups: (() => void)[] = [];

  // 虛擬按鍵僅遊戲場景顯示（修復包 B）：controls 系統生命週期即 GameScene 生命週期。
  const controlsRoot = document.getElementById('controls');
  controlsRoot?.classList.add('is-active');
  cleanups.push(() => controlsRoot?.classList.remove('is-active'));

  document.querySelectorAll<HTMLElement>('[data-btn]').forEach((el) => {
    const name = el.dataset['btn'] as ButtonName | undefined;
    if (!name || !(name in held)) return;
    const set = (down: boolean) => (event: PointerEvent) => {
      event.preventDefault();
      held[name] = down;
      el.classList.toggle(PRESSED_CLASS, down);
    };
    const press = set(true);
    const release = set(false);
    el.addEventListener('pointerdown', press, { passive: false });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
    cleanups.push(() => {
      el.removeEventListener('pointerdown', press);
      el.removeEventListener('pointerup', release);
      el.removeEventListener('pointercancel', release);
      el.removeEventListener('pointerleave', release);
      el.classList.remove(PRESSED_CLASS);
    });
  });

  const keys = scene.input.keyboard?.addKeys('LEFT,RIGHT,Z,X') as KeyMap | undefined;

  let prevJumpHeld = false;
  let prevActionHeld = false;

  return {
    state,
    update() {
      state.left = held.left || keys?.LEFT.isDown === true;
      state.right = held.right || keys?.RIGHT.isDown === true;

      const jumpHeld = held.a || keys?.Z.isDown === true;
      state.jumpPressed = jumpHeld && !prevJumpHeld;
      state.jumpHeld = jumpHeld;
      prevJumpHeld = jumpHeld;

      const actionHeld = held.b || keys?.X.isDown === true;
      state.actionPressed = actionHeld && !prevActionHeld;
      state.actionHeld = actionHeld;
      prevActionHeld = actionHeld;
    },
    destroy() {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
}
