import Phaser from 'phaser';
import { currentChallenge, loadSave } from '../core/save';
import { SceneKeys, type CodexTab } from '../core/types';
import { startBgm } from '../audio/bgm';
import { playSfx, unlockAudio } from '../audio/sfx';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton, addMuteButton, bindMenuRelayout } from '../systems/hud';
import { openKeyConfig } from '../systems/keyConfig';

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
      const heroY = height * 0.44;
      const glow = this.add.image(centerX, heroY, TITLE_GLOW_TEX).setDisplaySize(220, 220);
      const hero = this.add.image(centerX, heroY, 'hero-idle');
      hero.setDisplaySize(150, 150);
      // 開場入場（§36）：主角自天而降 Bounce 落定，光暈淡入。
      hero.setY(heroY - 90).setAlpha(0);
      glow.setAlpha(0);
      this.tweens.add({
        targets: hero,
        y: heroY,
        alpha: 1,
        duration: 650,
        ease: 'Bounce.easeOut',
      });
      this.tweens.add({ targets: glow, alpha: 0.55, duration: 500, delay: 350 });
      this.tweens.add({
        targets: [hero, glow],
        y: '-=14',
        duration: 1400,
        delay: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.55, to: 1 },
        scale: glow.scale * 1.12,
        duration: 1100,
        delay: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // logo 動畫入場（§36）：主標縮放彈出 + 副標延遲淡入。
    const logo = this.add
      .text(centerX, height * 0.15, '星噗噗', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '58px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#7a5fb8',
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setScale(0);
    this.tweens.add({ targets: logo, scale: 1, duration: 520, ease: 'Back.easeOut' });

    const subtitle = this.add
      .text(centerX, height * 0.27, 'StarPuff', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#7a5fb8',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 400, delay: 300 });

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

    // 首次手勢：解鎖 iOS AudioContext 後啟動 BGM；接續當前可挑戰關（§39），
    // 全通關後改開世界地圖供重玩選關。
    const start = () => {
      unlockAudio();
      startBgm();
      const challenge = currentChallenge(loadSave());
      if (challenge === null) this.scene.start(SceneKeys.Map, {});
      else this.scene.start(SceneKeys.Game, { levelId: challenge, carryMs: 0, deaths: 0 });
    };
    this.input.keyboard?.once('keydown-ENTER', start);
    // 開始鈕唯一指標命中路徑（recon-v4 A.3）：覆蓋 canvas 視覺鈕的透明 DOM 鈕，
    // 兩種持向 hit-test 皆正確；canvas 同熱區不再掛 interactive，杜絕雙命中。
    addDomButton(this, '開始遊戲', { x: centerX, y: startButton.y, w: 220, h: 72 }, start, 'start');

    // 次選單列（§36/§39）：世界地圖／圖鑑／技能介紹／按鈕配置，觸控目標 56px 高。
    const secondaryY = height * 0.85;
    const secondarySpacing = 180;
    const entries: { label: string; menuId: string; onPress: () => void }[] = [
      {
        label: '世界地圖',
        menuId: 'map',
        onPress: () => {
          unlockAudio();
          playSfx('pop');
          this.scene.start(SceneKeys.Map, {});
        },
      },
      { label: '圖鑑', menuId: 'codex', onPress: () => this.openCodex('monsters') },
      { label: '技能介紹', menuId: 'skills', onPress: () => this.openCodex('skills') },
      {
        label: '按鈕配置',
        menuId: 'config',
        onPress: () => {
          unlockAudio();
          playSfx('pop');
          openKeyConfig();
        },
      },
    ];
    entries.forEach((entry, i) => {
      const x = centerX + (i - (entries.length - 1) / 2) * secondarySpacing;
      const visual = this.add
        .text(x, secondaryY, entry.label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '19px',
          fontStyle: 'bold',
          color: '#3a3a4a',
          backgroundColor: '#ffffff',
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setAlpha(0);
      this.tweens.add({ targets: visual, alpha: 0.92, duration: 350, delay: 420 + i * 90 });
      addDomButton(
        this,
        entry.label,
        { x, y: secondaryY, w: 168, h: 56 },
        entry.onPress,
        entry.menuId,
      );
    });

    // 版本頁腳（§42）：package.json version + git SHA，經 Vite define 嵌入。
    this.add
      .text(centerX, height - 6, __APP_VERSION__, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#7a5fb8',
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.75);
  }

  private openCodex(tab: CodexTab): void {
    unlockAudio();
    playSfx('pop');
    this.scene.start(SceneKeys.Codex, { tab });
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
