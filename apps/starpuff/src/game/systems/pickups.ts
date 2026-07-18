import Phaser from 'phaser';
import { EGG_HP_CAP, PLAYER } from '../core/config';
import { playSfx } from '../audio/sfx';
import type { PlayerHandle } from './player';

// 回復愛心拾取（§48 精英掉落／§62 慈悲補血共用單一實作）：心形拾取物＋觸碰回復；
// 空中緩降型以 tween 緩慢飄落（降落中可接住），未拾取逾時自動淡逝。
// 判定不走 physics overlap：Phaser 4 direct pair 間歇漏檢（§43 歸因），改逐幀
// AABB＋水平掃掠幾何判定（鏡像星星門/彈簧背擋模式），高速走過必中。

const HEAL_DRIFT_PX_PER_SEC = 26;
const HEAL_EXPIRE_MS = 15_000;
const PICKUP_HALF_W = 26;
const PICKUP_HALF_H = 30;

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
  let prevPlayerX: number | null = null;
  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    scene.tweens.killTweensOf(food);
    food.destroy();
  };
  const collect = (): void => {
    hooks.player().heal(opts.healHp, hooks.playerHp() > PLAYER.maxHp ? EGG_HP_CAP : PLAYER.maxHp);
    playSfx('swallow');
    cleanup();
  };
  // 逐幀幾何判定：AABB 交疊或前後幀水平掃掠跨越拾取帶（垂直帶內），單次觸發即回收。
  const onUpdate = (): void => {
    if (!food.active) return;
    const body = hooks.player().sprite.body as Phaser.Physics.Arcade.Body;
    const left = food.x - PICKUP_HALF_W;
    const right = food.x + PICKUP_HALF_W;
    const top = food.y - PICKUP_HALF_H;
    const bottom = food.y + PICKUP_HALF_H;
    const vertical = body.bottom > top && body.top < bottom;
    const currX = body.center.x;
    const prevX = prevPlayerX ?? currX;
    prevPlayerX = currX;
    if (!vertical) return;
    const aabb = body.right > left && body.left < right;
    const swept = Math.min(prevX, currX) <= right && Math.max(prevX, currX) >= left;
    if (aabb || swept) collect();
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
    // 緩降（§62）：等速飄落，判定帶隨 food.y 逐幀更新（降落中可空中接住）。
    const durationMs = ((opts.driftToY - y) / HEAL_DRIFT_PX_PER_SEC) * 1000;
    scene.tweens.add({
      targets: food,
      y: opts.driftToY,
      duration: durationMs,
      ease: 'Linear',
      onComplete: bob,
    });
  } else {
    bob();
  }
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  // 場景重啟時 emitter 監聽不隨顯示物件銷毀，必須顯式解除（防跨局累積）。
  scene.events.once('shutdown', cleanup);
  scene.time.delayedCall(HEAL_EXPIRE_MS, () => {
    if (food.active) cleanup();
  });
}
