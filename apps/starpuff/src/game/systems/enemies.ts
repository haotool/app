import type Phaser from 'phaser';
import type { EnemyKind } from '../core/types';

export interface EnemySystem {
  spawn(kind: EnemyKind, x: number, y: number): void;
  aliveCount(): number;
  update(deltaMs: number): void;
  destroy(): void;
}

// TODO(US-004)：三種小怪行為（彈跳/正弦飄移/滾動衝刺），生成發 enemy:spawned、
// 死亡發 enemy:killed；spiky 不可吸（combat.canInhale）。
export function createEnemySystem(_scene: Phaser.Scene): EnemySystem {
  return {
    spawn(_kind: EnemyKind, _x: number, _y: number) {
      // TODO(US-004)
    },
    aliveCount() {
      return 0;
    },
    update(_deltaMs: number) {
      // TODO(US-004)
    },
    destroy() {
      // TODO(US-004)
    },
  };
}
