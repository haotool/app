import type Phaser from 'phaser';

export interface BossHandle {
  spawn(): void;
  applyDamage(amount: number): void;
  update(deltaMs: number): void;
  destroy(): void;
}

// TODO(US-005)：以 logic/bossFsm 驅動雙階段三招式；入場發 boss:spawned、受擊發
// boss:damaged、階段切換發 boss:phase、死亡發 boss:defeated。
export function createBoss(_scene: Phaser.Scene): BossHandle {
  return {
    spawn() {
      // TODO(US-005)
    },
    applyDamage(_amount: number) {
      // TODO(US-005)
    },
    update(_deltaMs: number) {
      // TODO(US-005)
    },
    destroy() {
      // TODO(US-005)
    },
  };
}
