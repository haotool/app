import type Phaser from 'phaser';

export interface Hud {
  destroy(): void;
}

// TODO(US-008)：HP 心心、彈藥星星、Boss HP 條；訂閱 player:damaged、ammo:changed、
// boss:spawned、boss:damaged 事件更新（onGameEvent）。
export function createHud(_scene: Phaser.Scene): Hud {
  return {
    destroy() {
      // TODO(US-008)
    },
  };
}
