import Phaser from 'phaser';
import { SceneKeys } from '../core/types';
import { startBgm } from '../audio/bgm';
import { unlockAudio } from '../audio/sfx';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton, addMuteButton, bindMenuRelayout } from '../systems/hud';

const TITLE_GLOW_TEX = 'title-glow';

// 主角光暈：同心圓遞減 alpha 模擬柔光，供脈動 tween 使用。
function ensureGlowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TITLE_GLOW_TEX)) return;
  const g = scene.add.graphics();
  for (let i = 0; i < 6; i++) {
    g.fillStyle(0xfff3d6, 0.05 + i * 0.035);
    g.fillCircle(90, 90, 88 - i * 12);
  }
  g.generateTexture(TITLE_GLOW_TEX, 180, 180);
  g.destroy();
}

export class TitleScene extends Phaser.Scene {
  private backdrop: BackgroundHandle | null = null;

  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-meadow',
      autoScrollPxPerSec: 12,
      clouds: true,
      ambience: 'bg-meadow',
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());
    addMuteButton(this);
    bindMenuRelayout(this);

    if (this.textures.exists('hero-idle')) {
      ensureGlowTexture(this);
      const heroY = height * 0.45;
      const glow = this.add.image(centerX, heroY, TITLE_GLOW_TEX).setDisplaySize(220, 220);
      const hero = this.add.image(centerX, heroY, 'hero-idle');
      hero.setDisplaySize(150, 150);
      this.tweens.add({
        targets: [hero, glow],
        y: '-=14',
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.55, to: 1 },
        scale: glow.scale * 1.12,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(centerX, height * 0.15, '星噗噗', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '58px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#7a5fb8',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, height * 0.27, 'StarPuff', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#7a5fb8',
      })
      .setOrigin(0.5);

    // 純視覺鈕：命中一律由同熱區 DOM 鈕承接（單一命中，見下方 addDomButton）。
    const startButton = this.add
      .text(centerX, height * 0.66, '開始遊戲', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 32, y: 14 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startButton,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(centerX, height * 0.85, '左搖桿 移動｜綠鍵 跳躍｜粉鍵 長按吸入・點按發射', {
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
    this.input.keyboard?.once('keydown-ENTER', start);
    // 開始鈕唯一指標命中路徑（recon-v4 A.3）：覆蓋 canvas 視覺鈕的透明 DOM 鈕，
    // 兩種持向 hit-test 皆正確；canvas 同熱區不再掛 interactive，杜絕雙命中。
    addDomButton(this, '開始遊戲', { x: centerX, y: startButton.y, w: 220, h: 72 }, start);
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
