import type Phaser from 'phaser';
import { EGG_HP_CAP, PLAYER } from '../core/config';
import { playSfx } from '../audio/sfx';
import type { PlayerHandle } from './player';

// 回復愛心拾取（§48 精英掉落／§62 慈悲補血共用單一實作）：心形拾取物＋觸碰回復；
// 空中緩降型以 tween 緩慢飄落（含降落中可接住），未拾取逾時自動淡逝。

const HEAL_DRIFT_PX_PER_SEC = 26;
const HEAL_EXPIRE_MS = 15_000;

export interface HealPickupHooks {
  player(): PlayerHandle;
  playerHp(): number;
}

export interface HealPickupOptions {
  healHp: number;
  // 空中緩降型：自生成點緩降至 driftToY 後定點浮動；未設為地面定點型。
  driftToY?: number;
}

export function spawnHealPickup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  hooks: HealPickupHooks,
  opts: HealPickupOptions,
): void {
  const food = scene.add.image(x, y, 'hud-heart').setDisplaySize(30, 30).setDepth(72);
  const zone = scene.add.zone(x, y, 44, 60);
  scene.physics.add.existing(zone, true);
  const zoneBody = zone.body as Phaser.Physics.Arcade.StaticBody;
  const cleanup = (): void => {
    scene.tweens.killTweensOf(food);
    scene.tweens.killTweensOf(zone);
    food.destroy();
    zone.destroy();
  };
  const bob = (): void => {
    scene.tweens.add({
      targets: food,
      y: food.y - 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  };
  if (opts.driftToY !== undefined && opts.driftToY > y) {
    // 緩降（§62）：等速飄落、降落中同步 zone 判定帶（可空中接住）。
    const durationMs = ((opts.driftToY - y) / HEAL_DRIFT_PX_PER_SEC) * 1000;
    scene.tweens.add({
      targets: [food, zone],
      y: opts.driftToY,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: () => zoneBody.updateFromGameObject(),
      onComplete: bob,
    });
  } else {
    bob();
  }
  scene.physics.add.overlap(hooks.player().sprite, zone, () => {
    if (!food.active) return;
    hooks.player().heal(opts.healHp, hooks.playerHp() > PLAYER.maxHp ? EGG_HP_CAP : PLAYER.maxHp);
    playSfx('swallow');
    cleanup();
  });
  scene.time.delayedCall(HEAL_EXPIRE_MS, () => {
    if (food.active) cleanup();
  });
}
