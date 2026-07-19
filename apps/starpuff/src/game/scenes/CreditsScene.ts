import Phaser from 'phaser';
import { playSfx } from '../audio/sfx';
import { SceneKeys, type GameResultData } from '../core/types';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton } from '../systems/hud';

// 星光復甦謝幕（GAME_DESIGN §84）：擊破蝕星魔核（L20）後的輕量 credits——
// 星核淨化演出＋製作名單逐段浮現，隨時可點擊跳過；播畢/跳過皆接 Result 結算。
// KISS：純 tween 序列零新資產（星核以 fx-star 疊金光表現）。

const LINE_STEP_MS = 2200;
const LINE_FADE_MS = 700;
// 全序列自動收尾（未跳過時）：末行浮現後短拍接續。
const CREDIT_LINES: readonly { text: string; size: number }[] = [
  { text: '蝕星魔核 淨化', size: 26 },
  { text: '被奪走的星光 一點一點回到果凍星球', size: 20 },
  { text: '星噗噗', size: 40 },
  { text: '二十關世界・全區收復', size: 20 },
  { text: '企劃／設計／程式／美術　星噗噗製作組', size: 18 },
  { text: '謝謝你把星光帶回來', size: 22 },
] as const;

export class CreditsScene extends Phaser.Scene {
  private result: GameResultData = { result: 'won', timeMs: 0, deaths: 0, levelId: 20 };
  private backdrop: BackgroundHandle | null = null;
  private finished = false;

  constructor() {
    super(SceneKeys.Credits);
  }

  init(data: Partial<GameResultData>): void {
    this.result = {
      result: data.result ?? 'won',
      timeMs: data.timeMs ?? 0,
      deaths: data.deaths ?? 0,
      levelId: data.levelId ?? 20,
      // EX 變體（§86）：Credits 轉接 Result 時保留旗標，契約不折損。
      ex: data.ex === true,
    };
    this.finished = false;
  }

  create(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-astral',
      autoScrollPxPerSec: 6,
      clouds: false,
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());

    // 星核復甦：暗幕漸亮＋金星核脈動＋星光上升粒子。
    const veil = this.add.rectangle(centerX, height / 2, width, height, 0x100c22, 0.72).setDepth(2);
    this.tweens.add({ targets: veil, alpha: 0.15, duration: 4200, ease: 'Sine.easeOut' });
    const core = this.add
      .image(centerX, height * 0.3, 'fx-star')
      .setDisplaySize(90, 90)
      .setTint(0xffd966)
      .setAlpha(0.4)
      .setDepth(3);
    this.tweens.add({
      targets: core,
      alpha: 1,
      displayWidth: 130,
      displayHeight: 130,
      duration: 2600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    const rising = this.add
      .particles(0, 0, 'fx-star', {
        x: { min: 0, max: width },
        y: height + 20,
        speedY: { min: -60, max: -26 },
        scale: { start: 0.12, end: 0.02 },
        alpha: { start: 0.9, end: 0 },
        lifespan: { min: 3200, max: 5200 },
        frequency: 150,
        quantity: 1,
        tint: [0xffd966, 0xe8dcff, 0xc8b8f0],
        maxAliveParticles: 40,
      })
      .setDepth(3);
    this.events.once('shutdown', () => rising.destroy());
    playSfx('win');

    // 製作名單逐段浮現（§84）：單行淡入停留淡出，末行後自動收尾。
    CREDIT_LINES.forEach((line, index) => {
      this.time.delayedCall(900 + index * LINE_STEP_MS, () => {
        if (this.finished) return;
        const label = this.add
          .text(centerX, height * 0.62, line.text, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: `${line.size}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4a3a78',
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(4)
          .setAlpha(0);
        this.tweens.chain({
          targets: label,
          tweens: [
            { alpha: 1, y: height * 0.6, duration: LINE_FADE_MS, ease: 'Quad.easeOut' },
            {
              alpha: 0,
              duration: LINE_FADE_MS,
              delay: LINE_STEP_MS - LINE_FADE_MS * 2,
              ease: 'Quad.easeIn',
            },
          ],
          onComplete: () => label.destroy(),
        });
        if (index === 2) playSfx('jingle');
      });
    });
    this.time.delayedCall(900 + CREDIT_LINES.length * LINE_STEP_MS + 600, () => this.finish());

    // 跳過提示＋全屏 DOM 鈕（旋轉殼 hit-test 正確）：任意點擊直接收尾。
    const hint = this.add
      .text(centerX, height - 30, '點擊跳過', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#3a3a4a',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setAlpha(0.7);
    this.tweens.add({
      targets: hint,
      alpha: 0.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    addDomButton(
      this,
      '跳過謝幕',
      { x: centerX, y: height / 2, w: width, h: height },
      () => this.finish(),
      'credits-skip',
    );
    this.input.keyboard?.once('keydown-ENTER', () => this.finish());
  }

  // 收尾冪等：跳過與自動播畢共用，接 Result 結算（延續戰績資料）。
  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    playSfx('pop');
    this.cameras.main.fadeOut(360, 16, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKeys.Result, this.result);
    });
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
