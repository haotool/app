import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { SceneKeys, type GameResultData } from '../core/types';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { createFx } from '../systems/fx';
import { addDomButton } from '../systems/hud';

export class ResultScene extends Phaser.Scene {
  private result: GameResultData = { result: 'won', timeMs: 0, deaths: 0, levelId: 1, carryMs: 0 };
  private backdrop: BackgroundHandle | null = null;

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: Partial<GameResultData>): void {
    this.result = {
      result: data.result ?? 'won',
      timeMs: data.timeMs ?? 0,
      deaths: data.deaths ?? 0,
      levelId: data.levelId ?? 1,
      carryMs: data.carryMs ?? 0,
    };
  }

  create(): void {
    const centerX = CANVAS.width / 2;
    const seconds = (this.result.timeMs / 1000).toFixed(1);
    const won = this.result.result === 'won';

    // 勝利：星空回廊緩捲 + 金塵緩落；敗北：靜止背景 + 降飽和覆層。
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-arena',
      autoScrollPxPerSec: won ? 8 : 0,
      clouds: won,
      ambience: won ? 'bg-throne' : undefined,
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());
    if (!won) {
      this.add
        .rectangle(centerX, CANVAS.height / 2, CANVAS.width, CANVAS.height, 0x9a9aa8, 0.4)
        .setDepth(-5);
    }

    const heroKey = won ? 'hero-puffed' : 'hero-hurt';
    if (this.textures.exists(heroKey)) {
      const hero = this.add.image(centerX, CANVAS.height * 0.5, heroKey);
      hero.setDisplaySize(130, 130);
      if (!won) hero.setTint(0xbcbcc8);
      this.tweens.add({
        targets: hero,
        y: '-=10',
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(centerX, CANVAS.height * 0.18, won ? '勝利！' : '失敗…', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '54px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: won ? '#e8a33d' : '#6e6e80',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    // 勝利加列本輪總死亡次數（PM 裁決）；零死亡給嘉獎文案。
    const stats = won
      ? `用時 ${seconds} 秒｜${this.result.deaths === 0 ? '無傷通關！' : `死亡 ${this.result.deaths} 次`}`
      : `用時 ${seconds} 秒`;
    this.add
      .text(centerX, CANVAS.height * 0.31, stats, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: won ? '#5a4a2a' : '#5a5a6e',
      })
      .setOrigin(0.5);

    if (won) createFx(this).confetti();

    const retryButton = this.add
      .text(centerX, CANVAS.height * 0.68, won ? '再玩一次' : '再戰魔王', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 32, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // 敗北重試直接回到戰敗關卡（魔王關），延續本輪用時與死亡計數；勝利重試開新一輪。
    const retry = () =>
      this.scene.start(
        SceneKeys.Game,
        won
          ? {}
          : {
              levelId: this.result.levelId,
              carryMs: this.result.carryMs,
              deaths: this.result.deaths,
            },
      );
    retryButton.on('pointerdown', retry);
    this.input.keyboard?.once('keydown-ENTER', retry);
    // 旋轉殼 DOM 備援（recon-v4 A.3）：覆蓋 canvas 重試鈕的透明 DOM 鈕，portrait 可靠命中。
    addDomButton(this, retryButton.text, { x: centerX, y: retryButton.y, w: 220, h: 72 }, retry);
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
