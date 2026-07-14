import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { SceneKeys } from '../core/types';
import { startBgm } from '../audio/bgm';
import { unlockAudio } from '../audio/sfx';
import { addMuteButton } from '../systems/hud';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const centerX = CANVAS.width / 2;
    addMuteButton(this);

    if (this.textures.exists('bg-arena')) {
      const bg = this.add.image(centerX, CANVAS.height / 2, 'bg-arena');
      bg.setScale(Math.max(CANVAS.width / bg.width, CANVAS.height / bg.height));
    }

    if (this.textures.exists('hero-idle')) {
      const hero = this.add.image(centerX, CANVAS.height * 0.46, 'hero-idle');
      hero.setDisplaySize(220, 220);
      this.tweens.add({
        targets: hero,
        y: '-=16',
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(centerX, CANVAS.height * 0.2, '星噗噗', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#7a5fb8',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, CANVAS.height * 0.27, 'StarPuff', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: '#7a5fb8',
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(centerX, CANVAS.height * 0.66, '開始遊戲', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 36, y: 18 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: startButton,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(centerX, CANVAS.height * 0.74, '◀▶ 移動｜Ⓐ 跳躍｜Ⓑ 長按吸入・點按發射', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#5a5a6e',
      })
      .setOrigin(0.5);

    // 首次手勢：解鎖 iOS AudioContext 後啟動 BGM，再進入遊戲。
    const start = () => {
      unlockAudio();
      startBgm();
      this.scene.start(SceneKeys.Game);
    };
    startButton.on('pointerdown', start);
    this.input.keyboard?.once('keydown-ENTER', start);
  }
}
