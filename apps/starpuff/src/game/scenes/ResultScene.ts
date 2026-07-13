import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { SceneKeys, type GameResultData } from '../core/types';

export class ResultScene extends Phaser.Scene {
  private result: GameResultData = { result: 'won', timeMs: 0 };

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: Partial<GameResultData>): void {
    this.result = {
      result: data.result ?? 'won',
      timeMs: data.timeMs ?? 0,
    };
  }

  create(): void {
    const centerX = CANVAS.width / 2;
    const seconds = (this.result.timeMs / 1000).toFixed(1);
    const won = this.result.result === 'won';

    this.add
      .text(centerX, CANVAS.height * 0.34, won ? '勝利！' : '失敗…', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '56px',
        color: won ? '#3a3a4a' : '#a04a4a',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, CANVAS.height * 0.44, `用時 ${seconds} 秒`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#3a3a4a',
      })
      .setOrigin(0.5);

    const retryButton = this.add
      .text(centerX, CANVAS.height * 0.6, '再玩一次', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 32, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retryButton.on('pointerdown', () => {
      this.scene.start(SceneKeys.Title);
    });
  }
}
