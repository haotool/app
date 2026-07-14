import Phaser from 'phaser';
import { ASSETS } from '../core/assets';
import { CANVAS } from '../core/config';
import { SceneKeys } from '../core/types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  preload(): void {
    const barWidth = CANVAS.width * 0.6;
    const barHeight = 14;
    const x = (CANVAS.width - barWidth) / 2;
    const y = CANVAS.height / 2;

    this.add
      .rectangle(CANVAS.width / 2, y, barWidth + 8, barHeight + 8)
      .setStrokeStyle(2, 0x8ad9be);
    const fill = this.add.rectangle(x, y, 1, barHeight, 0xbff3e0).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      fill.width = Math.max(1, barWidth * value);
    });

    for (const { key, url } of ASSETS) {
      this.load.image(key, url);
    }
  }

  create(): void {
    this.scene.start(SceneKeys.Title);
  }
}
