import Phaser from 'phaser';
import './style.css';
import { GAME_CONFIG } from './game/core/config';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { GameScene } from './game/scenes/GameScene';
import { ResultScene } from './game/scenes/ResultScene';

new Phaser.Game({
  ...GAME_CONFIG,
  scene: [BootScene, TitleScene, GameScene, ResultScene],
});
