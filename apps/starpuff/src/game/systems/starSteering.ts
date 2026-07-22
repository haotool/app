import type Phaser from 'phaser';
import { magnetPull } from '../logic/enemyFsm';
import { TRANSFORM_FORMS } from '../logic/transform';
import {
  BOSS_AIM_ASSIST,
  HOMING_RANGE_PX,
  HOMING_TURN_RAD_PER_MS,
  nearestInRange,
  steerTowardTarget,
} from '../logic/homing';
import type { BossHandle } from './boss';
import type { EnemySystem } from './enemies';
import type { FxSystem, TrailHandle } from './fx';
import type { PlayerHandle } from './player';
import type { StarCombat } from './starCombat';

// 星彈飛行導向與拖尾（GAME_DESIGN §46/§54/§59）：鎖敵與轉向數學下沉 logic 層，
// 此處只管候選蒐集、過濾與 body velocity 套用；GameScene 只留逐幀委派。

const asSprite = (obj: unknown): Phaser.Physics.Arcade.Sprite =>
  obj as Phaser.Physics.Arcade.Sprite;

// 平面距離（與 Phaser.Math.Distance.Between 同語意）：不 value-import phaser 維持可測。
const distanceBetween = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

export interface StarSteeringHooks {
  player(): PlayerHandle;
  enemies(): EnemySystem;
  boss(): BossHandle;
  combat(): StarCombat;
  fx(): FxSystem;
  isBossLevel(): boolean;
  isBossDown(): boolean;
  // 多本體（§68）：最近存活本體歸屬由 GameScene 持有。
  nearestBossBody(x: number, y: number): Phaser.Physics.Arcade.Sprite;
}

export interface StarSteering {
  // 逐幀導向（gameplay 塊內）：追電星 → 魔王準星輔助 → 磁場吸偏，順序凍結。
  update(deltaMs: number): void;
  // 拖尾附掛（每幀尾端無條件）：active 星彈補掛、失效星彈停噴。
  syncTrails(): void;
}

export function createStarSteering(hooks: StarSteeringHooks): StarSteering {
  // 魔王房準星輔助（§54 難度根修）：一般星彈對活動中魔王微幅導向——地面水平彈
  // 自然上彎入盤旋帶，保底線不依賴拍翅精度；轉率遠低於追電星、大致對向才生效。
  // 多本體（§68）：導向星彈最近的存活本體。
  function steerBossAimAssist(deltaMs: number): void {
    if (!hooks.isBossLevel() || !hooks.boss().isActive() || hooks.isBossDown()) return;
    for (const child of hooks.player().getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      // 追電星有自己的導向；迴旋星彈道由回程驅動，皆不疊加輔助。
      if (hooks.combat().mixOf(star)?.homing || hooks.combat().specOf(star).boomerang) continue;
      const body = hooks.nearestBossBody(star.x, star.y);
      const starBody = star.body as Phaser.Physics.Arcade.Body;
      const towardBoss = Math.sign(body.x - star.x);
      if (towardBoss !== 0 && Math.sign(starBody.velocity.x) !== towardBoss) continue;
      if (distanceBetween(star.x, star.y, body.x, body.y) > BOSS_AIM_ASSIST.rangePx) {
        continue;
      }
      const steered = steerTowardTarget(
        starBody.velocity.x,
        starBody.velocity.y,
        star.x,
        star.y,
        body.x,
        body.y,
        hooks.combat().specOf(star).speed,
        BOSS_AIM_ASSIST.turnRadPerMs * deltaMs,
      );
      starBody.setVelocity(steered.vx, steered.vy);
    }
  }

  // 追電星導引（§46）：飛行中朝最近小怪限速轉向。
  function steerHomingStars(deltaMs: number): void {
    for (const child of hooks.player().getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      const mix = hooks.combat().mixOf(star);
      if (!mix?.homing) continue;
      const candidates: { x: number; y: number }[] = [];
      for (const candidate of hooks.enemies().getGroup().getChildren()) {
        if (!candidate.active) continue;
        const enemy = asSprite(candidate);
        candidates.push({ x: enemy.x, y: enemy.y });
      }
      const nearest = nearestInRange(star.x, star.y, candidates, HOMING_RANGE_PX);
      if (!nearest) continue;
      const body = star.body as Phaser.Physics.Arcade.Body;
      const steered = steerTowardTarget(
        body.velocity.x,
        body.velocity.y,
        star.x,
        star.y,
        nearest.x,
        nearest.y,
        mix.speed,
        HOMING_TURN_RAD_PER_MS * deltaMs,
      );
      body.setVelocity(steered.vx, steered.vy);
    }
  }

  // 磁場吸偏（§59 magno field）：域內玩家星彈逐幀被拉向磁極獸；數學下沉 logic/enemyFsm。
  // 雷化磁力域免疫（§110）：磁彎折不作用（L8/L11 優勢解）。
  function steerMagnetizedStars(deltaMs: number): void {
    const form = hooks.player().getTransformState().form;
    if (form && TRANSFORM_FORMS[form].magnetImmune) return;
    const magnos: { x: number; y: number }[] = [];
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active || hooks.enemies().kindOf(child) !== 'magno') continue;
      if (child.getData('magnoPhase') !== 'field') continue;
      const magno = asSprite(child);
      magnos.push({ x: magno.x, y: magno.y });
    }
    if (magnos.length === 0) return;
    for (const child of hooks.player().getStars().getChildren()) {
      const star = asSprite(child);
      if (!star.active) continue;
      const body = star.body as Phaser.Physics.Arcade.Body;
      for (const magno of magnos) {
        const pulled = magnetPull(
          star.x,
          star.y,
          body.velocity.x,
          body.velocity.y,
          magno.x,
          magno.y,
          deltaMs,
        );
        body.setVelocity(pulled.vx, pulled.vy);
      }
    }
  }

  return {
    update(deltaMs: number) {
      steerHomingStars(deltaMs);
      steerBossAimAssist(deltaMs);
      steerMagnetizedStars(deltaMs);
    },
    syncTrails() {
      for (const child of hooks.player().getStars().getChildren()) {
        const star = asSprite(child);
        const trail = star.getData('fxTrail') as TrailHandle | undefined;
        if (star.active && !trail) star.setData('fxTrail', hooks.fx().attachTrail(star));
        else if (!star.active && trail) {
          trail.stop();
          star.setData('fxTrail', undefined);
        }
      }
    },
  };
}
