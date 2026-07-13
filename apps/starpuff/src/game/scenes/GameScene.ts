import Phaser from 'phaser';
import { CANVAS } from '../core/config';
import { SceneKeys, type GameResultData } from '../core/types';

// 佔位 arena：色塊背景、地面 static body、玩家佔位方塊（僅出現，不含操控）。
// 操控／敵人／魔王等由 systems stream 依事件契約補齊（US-002+）。
export class GameScene extends Phaser.Scene {
  private startedAt = 0;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.startedAt = this.time.now;

    this.add.rectangle(CANVAS.width / 2, CANVAS.height / 2, CANVAS.width, CANVAS.height, 0xd6ecff);

    const groundHeight = 80;
    const ground = this.add.rectangle(
      CANVAS.width / 2,
      CANVAS.height - groundHeight / 2,
      CANVAS.width,
      groundHeight,
      0xbff3e0,
    );
    this.physics.add.existing(ground, true);

    const player = this.add.rectangle(CANVAS.width / 2, CANVAS.height * 0.4, 48, 48, 0xffb7a0);
    this.physics.add.existing(player);
    this.physics.add.collider(player, ground);

    this.add
      .text(CANVAS.width / 2, CANVAS.height * 0.16, '佔位 arena\n按 R 或點畫面 → 結算', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#3a3a4a',
        align: 'center',
      })
      .setOrigin(0.5);

    // 暫時流轉：正式勝敗條件由 boss/waves stream 接手。
    const finish = () => {
      const data: GameResultData = { result: 'won', timeMs: this.time.now - this.startedAt };
      this.scene.start(SceneKeys.Result, data);
    };
    this.input.once('pointerdown', finish);
    this.input.keyboard?.once('keydown-R', finish);
  }
}
