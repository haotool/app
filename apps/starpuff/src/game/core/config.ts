import Phaser from 'phaser';

// 遊戲數值 SSOT（GAME_DESIGN §5–§7，凍結）。
export const CANVAS = {
  width: 480,
  height: 854,
  dprCap: 2,
} as const;

export const GRAVITY_Y = 900;

export const PLAYER = {
  moveSpeed: 220,
  jumpVelocity: -420,
  floatLift: -260,
  maxHp: 5,
  invulnerableMs: 1200,
  maxFlaps: 3,
} as const;

export const INHALE = {
  holdThresholdMs: 150,
  rangePx: 140,
} as const;

export const STAR = {
  damage: 5,
  speed: 520,
  pierceCount: 1,
  maxAmmo: 3,
} as const;

export const ENEMY = {
  hp: 1,
  touchDamage: 1,
} as const;

// 魔王戰數值（§6）由 pure logic 的 bossFsm.ts 持有，避免 SSOT 重複。

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#FDEFF6',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS.width,
    height: CANVAS.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
    },
  },
  pixelArt: false,
  roundPixels: true,
};
