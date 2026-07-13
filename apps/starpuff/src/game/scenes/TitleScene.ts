import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { SceneKeys } from '../core/types';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const centerX = CANVAS.width / 2;

    this.add
      .text(centerX, CANVAS.height * 0.32, '星噗噗\nStarPuff', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '56px',
        color: '#3a3a4a',
        align: 'center',
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(centerX, CANVAS.height * 0.58, '開始遊戲', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 32, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerdown', () => {
      this.scene.start(SceneKeys.Game);
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start(SceneKeys.Game);
    });
  }
}
