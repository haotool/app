import Phaser from 'phaser';
import './style.css';
import { GAME_CONFIG } from './game/core/config';
import { SceneKeys } from './game/core/types';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { GameScene } from './game/scenes/GameScene';
import { ResultScene } from './game/scenes/ResultScene';

const game = new Phaser.Game({
  ...GAME_CONFIG,
  scene: [BootScene, TitleScene, GameScene, ResultScene],
});

// e2e 測試鉤子：查詢場景/關卡狀態、強制勝敗、補滿配額與直達魔王關。
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
    };
  }
}
window.__sp = {
  scene: () => game.scene.getScenes(true)[0]?.scene.key ?? '',
  stage: () => gameScene().currentLevelId,
  bossHp: () => gameScene().bossHp,
  playerHp: () => gameScene().playerHp,
  win: () => gameScene().forceWin(),
  lose: () => gameScene().forceLose(),
  fillQuota: () => gameScene().forceGate(),
  skipToBoss: () => gameScene().skipToBoss(),
};
