import type Phaser from 'phaser';
import type { EnemyUpdateContext } from './enemyUpdates';

// windup 預警圈共用元件：自 enemyUpdates.ts 機械式搬移（W3 前置 1200 行閘分檔），
// 行為零改變；ring spec 常數（GLOWY／SPORA／MAGNO_RING）隨各家族消費模組持有。

// windup 預警圈共用（§47 glowy／§52 spora）：首幀建立、逐幀依進度擴張至滿半徑；
// 期滿或離開前搖由 clearWindupRing 回收，ring 實例掛 sprite data 隨個體生命週期。
export interface WindupRingSpec {
  radius: number;
  fill: number;
  fillAlpha: number;
  stroke: number;
  strokeAlpha: number;
}

export function updateWindupRing(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  x: number,
  y: number,
  spec: WindupRingSpec,
  progress: number,
): void {
  let ring = sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined;
  if (!ring) {
    ring = ctx.scene.add
      .circle(x, y, spec.radius, spec.fill, spec.fillAlpha)
      .setStrokeStyle(3, spec.stroke, spec.strokeAlpha)
      .setDepth(59);
    sprite.setData('warnRing', ring);
  }
  ring.setPosition(x, y);
  ring.setScale(0.2 + progress * 0.8);
}

export function clearWindupRing(sprite: Phaser.Physics.Arcade.Sprite): void {
  (sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined)?.destroy();
  sprite.setData('warnRing', undefined);
}
