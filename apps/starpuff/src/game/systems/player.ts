import type Phaser from 'phaser';
import type { ControlsState } from './controls';

export interface PlayerHandle {
  body: Phaser.GameObjects.GameObject | null;
  update(controls: ControlsState, deltaMs: number): void;
  applyDamage(amount: number): void;
  destroy(): void;
}

// TODO(US-002)：移動/跳躍/漂浮（PLAYER 常數），受擊發 player:damaged、死亡發 player:died。
// TODO(US-003)：吸入/吞下/發射（INHALE、STAR 常數），發 ammo:changed、star:fired、enemy:inhaled。
export function createPlayer(_scene: Phaser.Scene, _x: number, _y: number): PlayerHandle {
  return {
    body: null,
    update(_controls: ControlsState, _deltaMs: number) {
      // TODO(US-002)
    },
    applyDamage(_amount: number) {
      // TODO(US-002)
    },
    destroy() {
      // TODO(US-002)
    },
  };
}
