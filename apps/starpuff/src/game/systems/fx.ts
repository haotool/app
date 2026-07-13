import type Phaser from 'phaser';

export interface FxSystem {
  hitStop(durationMs: number): void;
  shake(intensityPx: number): void;
  flashWhite(target: Phaser.GameObjects.GameObject): void;
  damageNumber(x: number, y: number, amount: number): void;
  starBurst(x: number, y: number): void;
  destroy(): void;
}

// TODO(US-006)：GAME_DESIGN §8 Juice 清單全數（hit-stop 60ms、震屏 4px、白閃、
// squash & stretch、粒子、拖尾、傷害數字、星爆、HP 跳動、按鈕回饋、tween）。
export function createFx(_scene: Phaser.Scene): FxSystem {
  return {
    hitStop(_durationMs: number) {
      // TODO(US-006)
    },
    shake(_intensityPx: number) {
      // TODO(US-006)
    },
    flashWhite(_target: Phaser.GameObjects.GameObject) {
      // TODO(US-006)
    },
    damageNumber(_x: number, _y: number, _amount: number) {
      // TODO(US-006)
    },
    starBurst(_x: number, _y: number) {
      // TODO(US-006)
    },
    destroy() {
      // TODO(US-006)
    },
  };
}
