import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { SceneKeys, type GameResultData } from '../core/types';
import { createFx } from '../systems/fx';

export class ResultScene extends Phaser.Scene {
  private result: GameResultData = { result: 'won', timeMs: 0, deaths: 0, levelId: 1, carryMs: 0 };

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

    if (this.textures.exists('bg-arena')) {
      const bg = this.add.image(centerX, CANVAS.height / 2, 'bg-arena');
      bg.setScale(Math.max(CANVAS.width / bg.width, CANVAS.height / bg.height));
      // 敗北灰階：背景降飽和營造挫敗感。
      if (!won) bg.setTint(0x9a9aa8);
    }

    const heroKey = won ? 'hero-puffed' : 'hero-hurt';
    if (this.textures.exists(heroKey)) {
      const hero = this.add.image(centerX, CANVAS.height * 0.48, heroKey);
      hero.setDisplaySize(180, 180);
      if (!won) hero.setTint(0xbcbcc8);
      this.tweens.add({
        targets: hero,
        y: '-=12',
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(centerX, CANVAS.height * 0.24, won ? '勝利！' : '失敗…', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: won ? '#e8a33d' : '#6e6e80',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    // 勝利加列本輪總死亡次數（PM 裁決）；零死亡給嘉獎文案。
    const stats = won
      ? `用時 ${seconds} 秒｜${this.result.deaths === 0 ? '無傷通關！' : `死亡 ${this.result.deaths} 次`}`
      : `用時 ${seconds} 秒`;
    this.add
      .text(centerX, CANVAS.height * 0.32, stats, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: won ? '#5a4a2a' : '#5a5a6e',
      })
      .setOrigin(0.5);

    if (won) createFx(this).confetti();

    const retryButton = this.add
      .text(centerX, CANVAS.height * 0.68, won ? '再玩一次' : '再戰魔王', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 36, y: 18 },
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
  }
}
