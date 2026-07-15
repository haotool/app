import Phaser from 'phaser';
import { PLAYER } from '../core/config';
import type { LevelSpec } from '../logic/levels';
import {
  BRICK_SIZE,
  DROP_THROUGH_MS,
  SPRING_COOLDOWN_MS,
  SPRING_VELOCITY_Y,
  canSpringLaunch,
  shouldDropThrough,
} from '../logic/stageModel';
import { playSfx } from '../audio/sfx';
import { burstSmall, ensureFxTextures } from './fx';
import type { PlayerHandle } from './player';

// v4 平台玩法元素 + 主題道具佈景（GAME_DESIGN §29/§31/§32，recon-v4 C 節配方）。
// 全部讀 levels.ts elements/decor 表驅動；碰撞註冊由 GameScene 接線段完成。

// stage 只讀最小輸入子集：控制系統由 GameScene 傳入狀態，避免直接耦合 DOM controls。
export interface StageInput {
  down: boolean;
  jumpPressed: boolean;
}

export interface StageHooks {
  player(): PlayerHandle;
  // 彈藥獎勵走正式管線：磚內藏可吸小怪，吞下即 +1 彈藥（配額與彩蛋語意不失真）。
  spawnAmmoMinion(x: number, y: number): void;
}

export interface StageHandle {
  update(input: StageInput): void;
  getOneWay(): Phaser.GameObjects.Rectangle[];
  getMoving(): Phaser.GameObjects.Rectangle[];
  getSprings(): Phaser.GameObjects.Rectangle[];
  getBreakables(): Phaser.GameObjects.Rectangle[];
  canLandOneWay: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;
  onSpringOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;
  breakBrick(target: Phaser.GameObjects.GameObject): boolean;
  damageBricksInRadius(x: number, y: number, radiusPx: number): void;
  destroy(): void;
}

const PLATFORM_H = 16;
const ONEWAY_TINT = 0xa8e6f0;
const MOVING_TINT = 0xffd166;
const SPRING_W = 44;
const SPRING_H = 18;
const SPRING_TINT = 0xff8a80;
const BRICK_TINT = 0xd9c7f0;
const BRICK_EDGE = 0x9a86c8;
// 主地面頂 y=400（480-80）；道具貼地微沉 4px 增加著地感。
const DECOR_BASE_Y = 404;
const DECOR_BASE_PX = 112;

const asRect = (obj: unknown): Phaser.GameObjects.Rectangle => obj as Phaser.GameObjects.Rectangle;

const hasFlag = (obj: unknown, flag: string): boolean =>
  (obj as Phaser.GameObjects.GameObject).getData?.(flag) === true;

export function createStage(scene: Phaser.Scene, level: LevelSpec, hooks: StageHooks): StageHandle {
  ensureFxTextures(scene);
  const oneWay: Phaser.GameObjects.Rectangle[] = [];
  const moving: Phaser.GameObjects.Rectangle[] = [];
  const springs: Phaser.GameObjects.Rectangle[] = [];
  const breakables: Phaser.GameObjects.Rectangle[] = [];
  let dropUntilMs = 0;

  // 佈景先建、元素後建：同深度下維持 平台 < 佈景 < 元素 < 玩家 的繪製序（§32）。
  // boss 關 decor x 以資料 worldWidth 為基準等比換算至當前視寬（§28 禁硬編）。
  const xScale = level.boss ? scene.scale.width / level.worldWidth : 1;
  for (const spec of level.decor) {
    if (!scene.textures.exists(spec.key)) continue;
    const size = DECOR_BASE_PX * Phaser.Math.FloatBetween(0.9, 1.1);
    scene.add
      .image(spec.x * xScale, DECOR_BASE_Y + Phaser.Math.Between(-6, 2), spec.key)
      .setOrigin(0.5, 1)
      .setDisplaySize(size, size)
      .setAlpha(0.95);
  }

  for (const spec of level.elements) {
    switch (spec.kind) {
      case 'oneway': {
        const rect = scene.add.rectangle(spec.x, spec.y, spec.w, PLATFORM_H, ONEWAY_TINT, 0.9);
        scene.physics.add.existing(rect, true);
        const body = rect.body as Phaser.Physics.Arcade.StaticBody;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        rect.setData('oneway', true);
        oneWay.push(rect);
        break;
      }
      case 'moving': {
        const rect = scene.add.rectangle(spec.x, spec.y, spec.w, PLATFORM_H, MOVING_TINT, 0.95);
        scene.physics.add.existing(rect);
        const body = rect.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        rect.setData('prevX', spec.x);
        rect.setData('prevY', spec.y);
        scene.tweens.add({
          targets: rect,
          x: spec.axis === 'x' ? spec.x + spec.range : spec.x,
          y: spec.axis === 'y' ? spec.y + spec.range : spec.y,
          duration: spec.durationMs,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        moving.push(rect);
        break;
      }
      case 'spring': {
        const rect = scene.add
          .rectangle(spec.x, spec.y, SPRING_W, SPRING_H, SPRING_TINT, 1)
          .setStrokeStyle(3, 0xffffff);
        scene.physics.add.existing(rect, true);
        rect.setData('spring', true);
        springs.push(rect);
        break;
      }
      case 'breakable': {
        const rect = scene.add
          .rectangle(spec.x, spec.y, BRICK_SIZE, BRICK_SIZE, BRICK_TINT, 1)
          .setStrokeStyle(3, BRICK_EDGE);
        scene.physics.add.existing(rect, true);
        rect.setData('loot', spec.loot);
        breakables.push(rect);
        break;
      }
      default: {
        const exhaustive: never = spec;
        void exhaustive;
      }
    }
  }

  // 站立判定沿用 GameScene 平台慣例：腳底貼齊頂緣 ±4 且水平投影重疊。
  function standingOnOneWay(body: Phaser.Physics.Arcade.Body): boolean {
    if (!body.blocked.down && !body.touching.down) return false;
    return oneWay.some((rect) => {
      const rb = rect.body as Phaser.Physics.Arcade.StaticBody;
      return Math.abs(body.bottom - rb.top) <= 4 && body.right > rb.left && body.left < rb.right;
    });
  }

  function breakBrick(target: Phaser.GameObjects.GameObject): boolean {
    const brick = asRect(target);
    if (!brick.active) return false;
    const { x, y } = brick;
    const loot = brick.getData('loot') as 'ammo' | 'hp';
    brick.destroy();
    playSfx('break');
    burstSmall(scene, x, y, BRICK_TINT);
    if (loot === 'hp') hooks.player().heal(1, PLAYER.maxHp);
    else hooks.spawnAmmoMinion(x, y - 46);
    return true;
  }

  // 深度 QA / e2e 觀測點：僅開發與測試環境掛載（main.ts __sp 由結構線持有，避免跨線衝突）。
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    (
      window as unknown as {
        __spStage?: { playerY(): number; bricksAlive(): number; movers(): number[][] };
      }
    ).__spStage = {
      playerY: () => hooks.player().sprite.y,
      bricksAlive: () => breakables.filter((brick) => brick.active).length,
      movers: () => moving.map((plat) => [Math.round(plat.x), Math.round(plat.y)]),
    };
  }

  return {
    update(input: StageInput) {
      const player = hooks.player();
      const body = player.sprite.body as Phaser.Physics.Arcade.Body;

      // 移動平台 delta 搬運（recon C.2）：tween 先於物理步進，逐幀將位移轉嫁站立玩家。
      for (const plat of moving) {
        const dx = plat.x - (plat.getData('prevX') as number);
        const dy = plat.y - (plat.getData('prevY') as number);
        plat.setData('prevX', plat.x);
        plat.setData('prevY', plat.y);
        if (dx === 0 && dy === 0) continue;
        const platBody = plat.body as Phaser.Physics.Arcade.Body;
        if (body.touching.down && platBody.touching.up) {
          player.sprite.x += dx;
          player.sprite.y += dy;
        }
      }

      // 下落穿透（§29）：player.update 已先行，同幀起跳脈衝以下墜覆蓋，成為乾淨下穿。
      if (shouldDropThrough(input.down, input.jumpPressed, standingOnOneWay(body))) {
        dropUntilMs = scene.time.now + DROP_THROUGH_MS;
        if (body.velocity.y < 0) body.setVelocityY(30);
      }
    },

    getOneWay: () => oneWay,
    getMoving: () => moving,
    getSprings: () => springs,
    getBreakables: () => breakables,

    // 單向著地（recon C.1）：僅下落且腳底不低於頂緣 +6 才碰撞；下穿窗內一律放行。
    canLandOneWay: (a, b) => {
      if (scene.time.now < dropUntilMs) return false;
      const aIsPlatform = hasFlag(a, 'oneway');
      const rect = asRect(aIsPlatform ? a : b);
      const other = (aIsPlatform ? b : a) as { body: Phaser.Physics.Arcade.Body };
      const rb = rect.body as Phaser.Physics.Arcade.StaticBody;
      return other.body.velocity.y >= 0 && other.body.bottom <= rb.top + 6;
    },

    // 彈簧（recon C.3）：-640 超級跳 + 冷卻 300ms + squash + 專屬音；上升中不觸發。
    onSpringOverlap: (a, b) => {
      const spring = asRect(hasFlag(a, 'spring') ? a : b);
      const body = hooks.player().sprite.body as Phaser.Physics.Arcade.Body;
      const lockedUntil = (spring.getData('lockedUntil') as number | undefined) ?? 0;
      if (!canSpringLaunch(scene.time.now, lockedUntil, body.velocity.y)) return;
      spring.setData('lockedUntil', scene.time.now + SPRING_COOLDOWN_MS);
      body.setVelocityY(SPRING_VELOCITY_Y);
      playSfx('spring');
      scene.tweens.add({
        targets: spring,
        scaleY: 0.55,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    },

    breakBrick,

    // 下衝擊等範圍技的破磚接口：中心距 ≤ 半徑 + 磚半寬即破壞。
    damageBricksInRadius(x: number, y: number, radiusPx: number) {
      for (const brick of [...breakables]) {
        if (!brick.active) continue;
        if (Phaser.Math.Distance.Between(x, y, brick.x, brick.y) <= radiusPx + BRICK_SIZE / 2) {
          breakBrick(brick);
        }
      }
    },

    destroy() {
      // 顯示物件與物理 body 交 Phaser scene shutdown 統一銷毀；此處只清引用與觀測點。
      oneWay.length = 0;
      moving.length = 0;
      springs.length = 0;
      breakables.length = 0;
      if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
        (window as unknown as { __spStage?: unknown }).__spStage = undefined;
      }
    },
  };
}
