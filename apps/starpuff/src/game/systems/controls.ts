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

// TODO(US-002): 綁定 DOM 虛擬按鍵（index.html [data-btn]）與鍵盤備援（←→ / Z 跳 / X 吸射）。
export function createControls(_scene: Phaser.Scene): ControlsSystem {
  const state: ControlsState = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
    actionPressed: false,
    actionHeld: false,
  };
  return {
    state,
    update() {
      // TODO(US-002)
    },
    destroy() {
      // TODO(US-002)
    },
  };
}
