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
      const hero = this.add.image(centerX, CANVAS.height * 0.45, 'hero-idle');
      hero.setDisplaySize(150, 150);
      this.tweens.add({
        targets: hero,
        y: '-=14',
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(centerX, CANVAS.height * 0.15, '星噗噗', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '58px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#7a5fb8',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, CANVAS.height * 0.27, 'StarPuff', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#7a5fb8',
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(centerX, CANVAS.height * 0.66, '開始遊戲', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 32, y: 14 },
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
      .text(centerX, CANVAS.height * 0.85, '左搖桿 移動｜綠鍵 跳躍｜粉鍵 長按吸入・點按發射', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
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
