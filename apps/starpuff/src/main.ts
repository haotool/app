import Phaser from 'phaser';
import './style.css';
import { CANVAS, GRAVITY_Y } from './game/core/config';
import { SceneKeys, type EnemyKind } from './game/core/types';
import type { EnemySystem } from './game/systems/enemies';
import type { PlayerHandle } from './game/systems/player';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { GameScene } from './game/scenes/GameScene';
import { ResultScene } from './game/scenes/ResultScene';
import { restoreMutePreference } from './game/systems/hud';

restoreMutePreference();

// Phaser 接線集中於此；數值 SSOT 由 config.ts（純資料）供給。
const game = new Phaser.Game({
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
  scene: [BootScene, TitleScene, GameScene, ResultScene],
});

// e2e 測試鉤子：查詢場景/關卡狀態、強制勝敗、補滿配額與直達魔王關。
// 僅開發與測試環境掛載（修復包 B）：production bundle 不暴露除錯入口。
const gameScene = () => game.scene.getScene<GameScene>(SceneKeys.Game);
declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      bossHp: () => number;
      playerHp: () => number;
      win: () => void;
      lose: () => void;
      fillQuota: () => void;
      skipToBoss: () => void;
      spawn: (kind: EnemyKind, x?: number, y?: number) => void;
      ammo: () => { ammo: number; flavor: string };
    };
  }
}
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  // 受控 spawn 與彈匣查詢（US-018）：以型別斷言讀場景私有系統，production 不暴露。
  const internals = () => gameScene() as unknown as { enemies: EnemySystem; player: PlayerHandle };
  window.__sp = {
    scene: () => game.scene.getScenes(true)[0]?.scene.key ?? '',
    stage: () => gameScene().currentLevelId,
    bossHp: () => gameScene().bossHp,
    playerHp: () => gameScene().playerHp,
    win: () => gameScene().forceWin(),
    lose: () => gameScene().forceLose(),
    fillQuota: () => gameScene().forceGate(),
    skipToBoss: () => gameScene().skipToBoss(),
    spawn: (kind, x = 240, y = 300) => internals().enemies.spawn(kind, x, y),
    ammo: () => internals().player.getAmmoState(),
  };
}
