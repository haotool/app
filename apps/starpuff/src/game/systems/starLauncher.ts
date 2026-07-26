import type Phaser from 'phaser';
import { BOOMERANG, CHARGED_STAR, type MagazineSlot } from '../core/config';
import { acquirePooled } from '../core/poolFlags';
import { tickBoomerangBody } from '../logic/enemyFsm';
import { STAR_CULL_MARGIN_PX } from '../logic/skills';
import { slotSpec, starDamage } from '../logic/skills';
import { attachTrail, type TrailHandle } from './fx';

// 星彈發射／回收管線（自 player.ts 抽離，PR #886 R8——player 已達 1200 行閘）：
// 單發彈體生成、池回收、迴旋星逐幀驅動與出視野回收。彈匣狀態與發射節奏（fireStar）
// 留在 player；本模組只負責彈體生命週期，stars 群組所有權在 player（formSkills 共用池）。

const STAR_SIZE = 24;
// 拖尾壽命與自旋角速度（player 的形態彈拖尾、衝撞自旋沿用同值，故匯出共用）。
export const TRAIL_LIFESPAN_MS = 260;
export const WIND_TRAIL_LIFESPAN_MS = TRAIL_LIFESPAN_MS * 1.6;
export const BOOM_SPIN_RAD = 0.02;

export interface StarLauncherDeps {
  // 易變狀態以存取器注入：facing/砲口座標由 player 逐次提供。
  facing(): 1 | -1;
  muzzle(): { x: number; y: number };
  tex(key: string): string;
}

export interface StarLauncher {
  launch(slot: MagazineSlot, vy: number): void;
  recycle(star: Phaser.Physics.Arcade.Sprite): void;
  steerBoomerangs(deltaMs: number): void;
  cullOffscreen(view: { x: number; right: number }): void;
}

export function createStarLauncher(
  scene: Phaser.Scene,
  stars: Phaser.Physics.Arcade.Group,
  deps: StarLauncherDeps,
): StarLauncher {
  const recycle = (star: Phaser.Physics.Arcade.Sprite): void => {
    (star.getData('fxTrail') as TrailHandle | undefined)?.stop();
    star.setData('fxTrail', undefined);
    star.setActive(false).setVisible(false);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  };

  // 單發彈體生成（§23/§46）：尺寸/著色/拖尾/彈道資料單一出口；vy 供散射扇形。
  const launch = (slot: MagazineSlot, vy: number): void => {
    const spec = slotSpec(slot);
    const facing = deps.facing();
    const { x, y } = deps.muzzle();
    const star = acquirePooled(stars, x, y, deps.tex('fx-star'));
    if (!star) return;
    const boosted = slot.charged || slot.gold;
    const size = boosted ? STAR_SIZE * CHARGED_STAR.sizeMultiplier : STAR_SIZE;
    star.setActive(true).setVisible(true);
    star.setDisplaySize(size, size);
    // 標準星保留原金黃星彈藝術；其餘依屬性/配方上色；強化/金星套金邊 tint。
    if (boosted) star.setTint(CHARGED_STAR.tint);
    else if (slot.flavor === 'jelly' && slot.mix === undefined) star.clearTint();
    else star.setTint(spec.tint);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    star.setData('damage', starDamage(slot));
    star.setData('pierce', spec.pierceCount);
    star.setData('flavor', slot.flavor);
    star.setData('mix', slot.mix ?? null);
    // 迴旋星（§53）：標記迴旋彈道由 steerBoomerangs 逐幀驅動；非迴旋彈清殘留。
    star.setData('boomMs', spec.boomerang ? 0 : null);
    star.setData('boomDir', facing);
    star.setData('boomSpeed', spec.speed);
    star.setRotation(0);
    star.setData(
      'fxTrail',
      attachTrail(scene, star, {
        tint: boosted ? CHARGED_STAR.tint : spec.tint,
        lifespan: slot.flavor === 'floaty' ? WIND_TRAIL_LIFESPAN_MS : TRAIL_LIFESPAN_MS,
      }),
    );
    star.setVelocity(facing * spec.speed, vy);
  };

  // 迴旋星（§53）：去而復返速度曲線逐幀驅動＋自旋；逾時回收（anti-softlock 壽命上限）。
  const steerBoomerangs = (deltaMs: number): void => {
    for (const child of stars.getChildren()) {
      const star = child as Phaser.Physics.Arcade.Sprite;
      if (!star.active) continue;
      const boomMs = star.getData('boomMs') as number | null | undefined;
      if (boomMs === null || boomMs === undefined) continue;
      if (boomMs + deltaMs >= BOOMERANG.lifetimeMs) {
        recycle(star);
        continue;
      }
      const direction = star.getData('boomDir') as 1 | -1;
      const next = tickBoomerangBody(
        star.body as Phaser.Physics.Arcade.Body,
        boomMs,
        direction,
        star.getData('boomSpeed') as number,
        BOOMERANG.turnMs,
        deltaMs,
      );
      star.setData('boomMs', next);
      star.rotation += direction * BOOM_SPIN_RAD * deltaMs;
    }
  };

  // 卷軸世界以相機視野為界回收星彈；迴旋星另走壽命與回程驅動。
  const cullOffscreen = (view: { x: number; right: number }): void => {
    for (const child of stars.getChildren()) {
      const star = child as Phaser.Physics.Arcade.Sprite;
      const margin = STAR_CULL_MARGIN_PX;
      if (star.active && (star.x < view.x - margin || star.x > view.right + margin)) {
        recycle(star);
      }
    }
  };

  return { launch, recycle, steerBoomerangs, cullOffscreen };
}
