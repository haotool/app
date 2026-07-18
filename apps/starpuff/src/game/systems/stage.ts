import Phaser from 'phaser';
import { PLAYER, VIEW } from '../core/config';
import type { LevelSpec } from '../logic/levels';
import {
  BRICK_SIZE,
  DROP_THROUGH_MS,
  SPRING_COOLDOWN_MS,
  SPRING_VELOCITY_Y,
  canSpringLaunch,
  shouldDropThrough,
  springSweepHit,
} from '../logic/stageModel';
import { isInUpdraft, updraftLift, type UpdraftZone } from '../logic/updraft';
import { tryWarp, type WarpGate } from '../logic/warp';
import { playSfx } from '../audio/sfx';
import { FX_TEXTURES, burstSmall, ensureFxTextures } from './fx';
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
  // 折躍瞬移通知（§66）：GameScene 據此重置前後幀掃掠基準（星星門背擋防偽跨越）。
  onWarp?(x: number): void;
}

export interface StageHandle {
  update(input: StageInput, deltaMs: number): void;
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
const GROUND_TOP = VIEW.height - 80;
const DECOR_BASE_Y = 404;
const DECOR_BASE_PX = 112;
// 上升氣流柱（§51）：柱體淡色與上飄粒子（池化，單柱同活 ≤10）。
const UPDRAFT_TINT = 0xdff2ff;
// 星門折躍（§66）：星環視覺按 pairId 輪流取色，白閃 0.2s 相機硬切。
const WARP_TINTS = [0x9fe8ff, 0xffb3e0, 0xc9f0a8] as const;
const WARP_FLASH_MS = 200;

const asRect = (obj: unknown): Phaser.GameObjects.Rectangle => obj as Phaser.GameObjects.Rectangle;

const hasFlag = (obj: unknown, flag: string): boolean =>
  (obj as Phaser.GameObjects.GameObject).getData?.(flag) === true;

export function createStage(scene: Phaser.Scene, level: LevelSpec, hooks: StageHooks): StageHandle {
  ensureFxTextures(scene);
  const oneWay: Phaser.GameObjects.Rectangle[] = [];
  const moving: Phaser.GameObjects.Rectangle[] = [];
  const springs: Phaser.GameObjects.Rectangle[] = [];
  const breakables: Phaser.GameObjects.Rectangle[] = [];
  const updrafts: UpdraftZone[] = [];
  const warpGates: WarpGate[] = [];
  const warpPairTints = new Map<string, number>();
  let warpLockedUntilMs = 0;
  let dropUntilMs = 0;

  // 佈景先建、元素後建：同深度下維持 平台 < 佈景 < 元素 < 玩家 的繪製序（§32）。
  // boss 關 decor x 以資料 worldWidth 為基準等比換算至當前視寬（§28 禁硬編）；
  // 前室魔王關（§69）：arena 佈景整體平移前室寬。
  const xScale = level.boss ? scene.scale.width / level.worldWidth : 1;
  const xOffset = level.boss ? (level.anteroomPx ?? 0) : 0;
  for (const spec of level.decor) {
    if (!scene.textures.exists(spec.key)) continue;
    const size = DECOR_BASE_PX * Phaser.Math.FloatBetween(0.9, 1.1);
    scene.add
      .image(xOffset + spec.x * xScale, DECOR_BASE_Y + Phaser.Math.Between(-6, 2), spec.key)
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
      case 'updraft': {
        // zone 型非碰撞（§51）：柱體淡色視覺＋上飄氣流粒子；升力於 update 逐幀結算。
        const height = GROUND_TOP - spec.topY;
        scene.add
          .rectangle(spec.x, spec.topY + height / 2, spec.w, height, UPDRAFT_TINT, 0.12)
          .setDepth(-4);
        // 氣流粒子池化（顯示物件交 scene shutdown 統一銷毀）。
        scene.add
          .particles(0, 0, FX_TEXTURES.dot, {
            x: { min: spec.x - spec.w / 2 + 8, max: spec.x + spec.w / 2 - 8 },
            y: GROUND_TOP - 6,
            speedY: { min: -220, max: -140 },
            speedX: { min: -8, max: 8 },
            scale: { start: 0.6, end: 0.15 },
            alpha: { start: 0.5, end: 0 },
            lifespan: { min: 900, max: 1400 },
            frequency: 130,
            quantity: 1,
            tint: [0xffffff, 0xdff2ff],
            maxAliveParticles: 10,
          })
          .setDepth(-3);
        updrafts.push({ x: spec.x, topY: spec.topY, w: spec.w });
        break;
      }
      case 'warp': {
        // 星環視覺（§66）：同 pairId 同色；脈動外環＋淡填內圈＋自旋星芯＋上飄星塵。
        if (!warpPairTints.has(spec.pairId)) {
          warpPairTints.set(
            spec.pairId,
            WARP_TINTS[warpPairTints.size % WARP_TINTS.length] ?? 0x9fe8ff,
          );
        }
        const tint = warpPairTints.get(spec.pairId) ?? 0x9fe8ff;
        const ring = scene.add
          .circle(spec.x, spec.y, 26)
          .setStrokeStyle(4, tint, 0.95)
          .setDepth(-2);
        scene.add.circle(spec.x, spec.y, 16, tint, 0.18).setDepth(-2);
        const core = scene.add
          .image(spec.x, spec.y, 'fx-star')
          .setDisplaySize(22, 22)
          .setTint(tint)
          .setAlpha(0.85)
          .setDepth(-2);
        scene.tweens.add({
          targets: ring,
          scale: 1.18,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        scene.tweens.add({ targets: core, angle: 360, duration: 5200, repeat: -1 });
        scene.add
          .particles(0, 0, FX_TEXTURES.dot, {
            x: { min: spec.x - 18, max: spec.x + 18 },
            y: spec.y + 20,
            speedY: { min: -46, max: -22 },
            scale: { start: 0.5, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            lifespan: { min: 700, max: 1100 },
            frequency: 260,
            quantity: 1,
            tint: [tint, 0xffffff],
            maxAliveParticles: 4,
          })
          .setDepth(-3);
        warpGates.push({ x: spec.x, y: spec.y, pairId: spec.pairId });
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

  // 彈簧發射單一出口：物理 overlap 與掃掠背擋（§43）共用，cooldown 閘去重。
  function tryLaunchSpring(spring: Phaser.GameObjects.Rectangle): void {
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
  }

  // 彈簧掃掠背擋（§43，鏡像星星門 syncGateSweep）：彈簧 overlap 為 direct pair，
  // Phaser 4 實測間歇漏檢——以前後幀掃掠 x 區間幾何補判（含高速穿越），不得移除；
  // 重複觸發由 canSpringLaunch 冷卻閘去重。
  let prevSweepX: number | null = null;
  function sweepSprings(body: Phaser.Physics.Arcade.Body): void {
    const currX = hooks.player().sprite.x;
    const prevX = prevSweepX ?? currX;
    prevSweepX = currX;
    const halfWidth = body.width / 2;
    for (const spring of springs) {
      const sb = spring.body as Phaser.Physics.Arcade.StaticBody;
      if (
        springSweepHit(prevX, currX, halfWidth, body.bottom, {
          left: sb.left,
          right: sb.right,
          top: sb.top,
          bottom: sb.bottom,
        })
      ) {
        tryLaunchSpring(spring);
      }
    }
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
        __spStage?: {
          playerY(): number;
          bricksAlive(): number;
          movers(): number[][];
          warps(): number[][];
        };
      }
    ).__spStage = {
      playerY: () => hooks.player().sprite.y,
      bricksAlive: () => breakables.filter((brick) => brick.active).length,
      movers: () => moving.map((plat) => [Math.round(plat.x), Math.round(plat.y)]),
      warps: () => warpGates.map((gate) => [gate.x, gate.y]),
    };
  }

  // 上升氣流升力（§51）：柱域內逐幀向上加速、升速夾限；卡頂交還重力（anti-softlock）。
  function applyUpdrafts(body: Phaser.Physics.Arcade.Body, deltaMs: number): void {
    if (updrafts.length === 0) return;
    const player = hooks.player().sprite;
    for (const zone of updrafts) {
      if (!isInUpdraft(player.x, player.y, zone, GROUND_TOP)) continue;
      body.setVelocityY(updraftLift(body.velocity.y, deltaMs, body.blocked.up));
      return;
    }
  }

  // 星門折躍結算（§66）：進門保留速度向量（body.reset 歸零後回寫）、相機硬切＋白閃；
  // 傳送後重置本地掃掠基準並通知 GameScene，防前後幀大位移誤觸彈簧/星星門背擋。
  function applyWarp(body: Phaser.Physics.Arcade.Body): void {
    if (warpGates.length === 0) return;
    const player = hooks.player().sprite;
    const result = tryWarp(warpGates, player.x, player.y, scene.time.now, warpLockedUntilMs);
    warpLockedUntilMs = result.lockedUntilMs;
    if (!result.exit) return;
    const { x: vx, y: vy } = body.velocity;
    burstSmall(scene, player.x, player.y, 0x9fe8ff);
    body.reset(result.exit.x, result.exit.y);
    body.setVelocity(vx, vy);
    prevSweepX = result.exit.x;
    scene.cameras.main.flash(WARP_FLASH_MS, 255, 255, 255);
    playSfx('reveal');
    burstSmall(scene, result.exit.x, result.exit.y, 0xffffff);
    hooks.onWarp?.(result.exit.x);
  }

  return {
    update(input: StageInput, deltaMs: number) {
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

      applyUpdrafts(body, deltaMs);
      sweepSprings(body);
      applyWarp(body);
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
      tryLaunchSpring(asRect(hasFlag(a, 'spring') ? a : b));
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
      updrafts.length = 0;
      warpGates.length = 0;
      if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
        (window as unknown as { __spStage?: unknown }).__spStage = undefined;
      }
    },
  };
}
