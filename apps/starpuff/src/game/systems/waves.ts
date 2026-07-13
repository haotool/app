import type Phaser from 'phaser';
import type { EnemySystem } from './enemies';

export interface WaveRunner {
  start(): void;
  update(deltaMs: number): void;
  destroy(): void;
}

// TODO(US-004)：依 logic/waveModel 腳本推進（教學 → Wave1 ×3 → Wave2 ×4 → 魔王），
// 每次切換發 wave:changed；Boss 戰期間維持 1–2 隻小怪供彈藥。
export function createWaveRunner(_scene: Phaser.Scene, _enemies: EnemySystem): WaveRunner {
  return {
    start() {
      // TODO(US-004)
    },
    update(_deltaMs: number) {
      // TODO(US-004)
    },
    destroy() {
      // TODO(US-004)
    },
  };
}
