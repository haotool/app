import Phaser from 'phaser';
import type { EnemyKind } from '../core/types';
import {
  GLOWY_FSM,
  tickDrilly,
  tickGlowy,
  tickShelly,
  tickZappy,
  type DrillyState,
  type ShellyState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import { spawnTelegraph } from './fx';
import type { EnemyTarget } from './enemies';

// 小怪 per-kind 逐幀 AI（GAME_DESIGN §16/§30/§47/§48）：自 enemies.ts 機械式搬移，
// 行為零改變；生成/傷害/回收與 hazards 池仍由 enemies.ts 持有，經 ctx 回呼銜接。

const JELLY_HOP_INTERVAL_MS = 1300;
const JELLY_HOP_VX = 130;
const JELLY_HOP_VY = -380;
const FLOATY_SPEED = 100;
const FLOATY_OMEGA = 0.0015;
export const SPIKY_SPEED = 170;
const SPIKY_ROLL = 0.0003;
// puffy：高空恆速下飄 + 微幅左右擺（§16）。
export const PUFFY_FALL_SPEED = 55;
const PUFFY_SWAY_SPEED = 30;
const PUFFY_SWAY_OMEGA = 0.002;
// chompy：進 120px 前搖 0.4s → 咬合 0.3s → 冷卻 1.2s（§16）；
// BITE 時長同為咬合 hitbox 存活時間（enemies.spawnBite 引用）。
const CHOMPY_TRIGGER_PX = 120;
const CHOMPY_WINDUP_MS = 400;
export const CHOMPY_BITE_MS = 300;
const CHOMPY_COOL_MS = 1200;
// shelly：巡邏走動；首發受擊 → 縮殼旋轉衝刺 1.5s（無敵、碰牆反彈）→ 暈眩 1s 可吸可殺（§30）。
// 三態時序由 logic/enemyFsm.ts 決策；此處僅保留呈現層速度/縮放/擺動參數。
export const SHELLY_WALK_SPEED = 60;
export const SHELLY_SPIN_SPEED = 320;
const SHELLY_SPIN_OMEGA = 0.02;
export const SHELLY_SHELL_SCALE = 0.82;
const SHELLY_WADDLE_OMEGA = 0.008;
const SHELLY_WADDLE_RAD = 0.08;
// zappy：緩慢懸浮追蹤；每 3s 放電環（半徑 70、前搖 0.5s 閃爍預警）（§30）。
const ZAPPY_SPEED = 40;
const ZAPPY_BOB_SPEED = 14;
const ZAPPY_BOB_OMEGA = 0.003;
const ZAPPY_RING_RADIUS = 70;
// drilly（§47）：潛地追擊 90px/s、僅露鰭（壓扁貼地）；破土躍出 -360。
const DRILLY_BURROW_SPEED = 90;
const DRILLY_EMERGE_VY = -360;
const DRILLY_FIN_SCALE_X = 0.55;
const DRILLY_FIN_SCALE_Y = 0.3;
// 前搖落點預警的腳底偏移：本體 40px × 0.32。
const DRILLY_TELEGRAPH_OFFSET_Y = 12.8;
// glowy（§47）：緩慢漂近 26px/s + 正弦浮動；脈衝半徑 80 走 hazards 管線。
const GLOWY_SPEED = 26;
const GLOWY_BOB_SPEED = 12;
const GLOWY_BOB_OMEGA = 0.0022;

type ChompyState = 'idle' | 'windup' | 'bite' | 'cool';

// AI 對外依賴最小面：target/elapsedMs 為即時值（getter），其餘為 enemies.ts 內部管線回呼。
export interface EnemyUpdateContext {
  scene: Phaser.Scene;
  readonly target: EnemyTarget | null;
  readonly elapsedMs: number;
  viewCenterX(): number;
  pulseRing(x: number, y: number, radius: number, strokeTint: number): void;
  spawnBite(chompy: Phaser.Physics.Arcade.Sprite): void;
  popPuffy(sprite: Phaser.Physics.Arcade.Sprite): void;
}

// 三態時序由 enemyFsm 決策；本函式只負責呈現層（速度、旋轉、著色、縮放復原）。
function updateShelly(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickShelly(
    sprite.getData('state') as ShellyState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.entered === 'stun') {
    // 旋轉期滿：停速著灰進暈眩（可吸/可擊殺窗）。
    body.setVelocityX(0);
    sprite.setTint(0xcfcfcf);
    return;
  }
  if (tick.entered === 'walk') {
    // 暈眩期滿：復原外觀回巡邏。
    sprite.clearTint();
    sprite.setRotation(0);
    const bsx = sprite.getData('baseSX') as number;
    const bsy = sprite.getData('baseSY') as number;
    sprite.setScale(bsx, bsy);
    return;
  }
  switch (tick.state) {
    case 'walk': {
      // 巡邏：恆速走動、bounce 折返；被外力夾停時恢復；精英倍率強化走速（§48）。
      if (body.velocity.x === 0) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        const mul = (sprite.getData('eliteMul') as number) ?? 1;
        body.setVelocityX(SHELLY_WALK_SPEED * mul * direction);
      }
      sprite.setRotation(Math.sin(tick.stateMs * SHELLY_WADDLE_OMEGA) * SHELLY_WADDLE_RAD);
      break;
    }
    case 'spin': {
      if (body.velocity.x === 0) body.setVelocityX(SHELLY_SPIN_SPEED);
      sprite.rotation += Math.sign(body.velocity.x) * SHELLY_SPIN_OMEGA * deltaMs;
      break;
    }
    case 'stun': {
      // 暈眩 1s（可吸/可擊殺）：昏沉搖擺。
      sprite.setRotation(Math.sin(tick.stateMs * 0.02) * 0.25);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 鑽地者（§47）：三態時序由 enemyFsm 決策；潛地壓扁貼地僅露鰭、前搖抖動＋落點預警、
// 破土復原躍出。免傷/可吸窗由 resolveDrillyHit 與 isInhalable 把關。
function updateDrilly(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickDrilly(
    sprite.getData('state') as DrillyState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const bsx = sprite.getData('baseSX') as number;
  const bsy = sprite.getData('baseSY') as number;
  if (tick.entered === 'windup') {
    body.setVelocityX(0);
    spawnTelegraph(ctx.scene, sprite.x, sprite.y + DRILLY_TELEGRAPH_OFFSET_Y, 500);
  } else if (tick.entered === 'surfaced') {
    playSfx('pop');
    sprite.setScale(bsx, bsy);
    sprite.setAlpha(1);
    body.setVelocity(0, DRILLY_EMERGE_VY);
  } else if (tick.entered === 'burrow') {
    body.setVelocityX(0);
  }
  switch (tick.state) {
    case 'burrow': {
      // 僅露鰭：壓扁貼地半透明，朝玩家 x 潛行。
      sprite.setScale(bsx * DRILLY_FIN_SCALE_X, bsy * DRILLY_FIN_SCALE_Y);
      sprite.setAlpha(0.85);
      if (body.blocked.down) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(DRILLY_BURROW_SPEED * direction);
      }
      break;
    }
    case 'windup': {
      // 前搖：定點鰭抖動。
      sprite.setRotation(Math.sin(tick.stateMs * 0.06) * 0.12);
      break;
    }
    case 'surfaced': {
      sprite.setRotation(0);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 提燈者（§47）：漂近 + 正弦浮動；windup 預警圈擴張（progress 驅動）、週期滿釋放脈衝。
function updateGlowy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickGlowy(sprite.getData('zapMs') as number, deltaMs);
  sprite.setData('zapMs', tick.glowMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const warn = sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined;
  if (tick.phase === 'pulse') {
    warn?.destroy();
    sprite.setData('warnRing', undefined);
    sprite.clearTint();
    ctx.pulseRing(sprite.x, sprite.y, GLOWY_FSM.pulseRadiusPx, 0xffe9a8);
    return;
  }
  if (tick.phase === 'windup') {
    // 預警圈先行：由小到滿半徑擴張，脈衝前明確可讀。
    body.setVelocity(0, 0);
    let ring = warn;
    if (!ring) {
      ring = ctx.scene.add
        .circle(sprite.x, sprite.y, GLOWY_FSM.pulseRadiusPx, 0xfff7d6, 0.08)
        .setStrokeStyle(3, 0xffe9a8, 0.8)
        .setDepth(59);
      sprite.setData('warnRing', ring);
    }
    ring.setPosition(sprite.x, sprite.y);
    ring.setScale(0.2 + tick.progress * 0.8);
    sprite.setTint(Math.floor(tick.glowMs / 90) % 2 === 0 ? 0xffffff : 0xffe9a8);
    return;
  }
  warn?.destroy();
  sprite.setData('warnRing', undefined);
  sprite.clearTint();
  const phase = sprite.getData('phase') as number;
  const bob = Math.sin(ctx.elapsedMs * GLOWY_BOB_OMEGA + phase) * GLOWY_BOB_SPEED;
  if (ctx.target) {
    const angle = Math.atan2(ctx.target.y - sprite.y, ctx.target.x - sprite.x);
    body.setVelocity(Math.cos(angle) * GLOWY_SPEED, Math.sin(angle) * GLOWY_SPEED + bob);
  } else {
    body.setVelocity(0, bob);
  }
}

function updateChompy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const state = sprite.getData('state') as ChompyState;
  const stateMs = (sprite.getData('stateMs') as number) + deltaMs;
  sprite.setData('stateMs', stateMs);
  const bsx = sprite.getData('baseSX') as number;
  const bsy = sprite.getData('baseSY') as number;
  // 精英倍率（§48）：前搖/冷卻縮時提升攻速。
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  switch (state) {
    case 'idle': {
      if (
        ctx.target &&
        Phaser.Math.Distance.Between(sprite.x, sprite.y, ctx.target.x, ctx.target.y) <=
          CHOMPY_TRIGGER_PX
      ) {
        sprite.setData('state', 'windup');
        sprite.setData('stateMs', 0);
        ctx.scene.tweens.killTweensOf(sprite);
        // 張嘴 squash 蓄力。
        ctx.scene.tweens.add({
          targets: sprite,
          scaleX: bsx * 1.2,
          scaleY: bsy * 0.78,
          duration: CHOMPY_WINDUP_MS / mul,
          ease: 'Quad.easeIn',
        });
      }
      break;
    }
    case 'windup': {
      if (stateMs < CHOMPY_WINDUP_MS / mul) break;
      sprite.setData('state', 'bite');
      sprite.setData('stateMs', 0);
      playSfx('chomp');
      ctx.scene.tweens.killTweensOf(sprite);
      sprite.setScale(bsx, bsy);
      ctx.scene.tweens.add({
        targets: sprite,
        scaleX: bsx * 0.9,
        scaleY: bsy * 1.22,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut',
      });
      ctx.spawnBite(sprite);
      break;
    }
    case 'bite': {
      if (stateMs >= CHOMPY_BITE_MS) {
        sprite.setData('state', 'cool');
        sprite.setData('stateMs', 0);
      }
      break;
    }
    case 'cool': {
      if (stateMs >= CHOMPY_COOL_MS / mul) {
        sprite.setData('state', 'idle');
        sprite.setData('stateMs', 0);
      }
      break;
    }
    default: {
      const exhaustive: never = state;
      void exhaustive;
    }
  }
}

// per-kind 分派：enemies.ts update 迴圈於 dmgCd/凍結處理後呼叫。
export function updateEnemyKind(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  kind: EnemyKind,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  switch (kind) {
    case 'jelly': {
      if (!body.blocked.down) break;
      body.setVelocityX(0);
      // 精英倍率（§48）：跳頻與水平衝量隨 eliteMul 強化。
      const mul = (sprite.getData('eliteMul') as number) ?? 1;
      const hopMs = (sprite.getData('hopMs') as number) + deltaMs;
      if (hopMs < JELLY_HOP_INTERVAL_MS / mul) {
        sprite.setData('hopMs', hopMs);
        break;
      }
      sprite.setData('hopMs', 0);
      const targetX = ctx.target?.x ?? ctx.viewCenterX();
      const direction = targetX >= sprite.x ? 1 : -1;
      body.setVelocity(direction * JELLY_HOP_VX * mul, JELLY_HOP_VY);
      break;
    }
    case 'floaty': {
      const phase = sprite.getData('phase') as number;
      body.setVelocityX(Math.cos(ctx.elapsedMs * FLOATY_OMEGA + phase) * FLOATY_SPEED);
      break;
    }
    case 'spiky': {
      // 被外力夾停時恢復滾動。
      if (body.velocity.x === 0) body.setVelocityX(SPIKY_SPEED);
      sprite.rotation += body.velocity.x * deltaMs * SPIKY_ROLL;
      break;
    }
    case 'puffy': {
      // 落地即「啵」爆（不計擊殺配額）；被吸入由吞下流程回收不爆。
      if (body.blocked.down) {
        ctx.popPuffy(sprite);
        break;
      }
      const phase = sprite.getData('phase') as number;
      body.setVelocity(
        Math.sin(ctx.elapsedMs * PUFFY_SWAY_OMEGA + phase) * PUFFY_SWAY_SPEED,
        PUFFY_FALL_SPEED,
      );
      break;
    }
    case 'chompy': {
      body.setVelocityX(0);
      updateChompy(ctx, sprite, deltaMs);
      break;
    }
    case 'shelly': {
      updateShelly(ctx, sprite, deltaMs);
      break;
    }
    case 'drilly': {
      updateDrilly(ctx, sprite, deltaMs);
      break;
    }
    case 'glowy': {
      updateGlowy(ctx, sprite, deltaMs);
      break;
    }
    case 'zappy': {
      // 放電週期時序由 enemyFsm 決策；此處僅結算呈現與物理。
      const tick = tickZappy(sprite.getData('zapMs') as number, deltaMs);
      sprite.setData('zapMs', tick.zapMs);
      if (tick.phase === 'discharge') {
        sprite.clearTint();
        ctx.pulseRing(sprite.x, sprite.y, ZAPPY_RING_RADIUS, 0xffe28a);
      } else if (tick.phase === 'windup') {
        // 前搖 0.5s：定身 + 明暗交替閃爍預警。
        body.setVelocity(0, 0);
        sprite.setTint(tick.flickerBright ? 0xffffff : 0xffe28a);
      } else {
        // 緩慢懸浮追蹤玩家 + 正弦上下漂浮。
        const phase = sprite.getData('phase') as number;
        const bob = Math.sin(ctx.elapsedMs * ZAPPY_BOB_OMEGA + phase) * ZAPPY_BOB_SPEED;
        if (ctx.target) {
          const angle = Math.atan2(ctx.target.y - sprite.y, ctx.target.x - sprite.x);
          body.setVelocity(Math.cos(angle) * ZAPPY_SPEED, Math.sin(angle) * ZAPPY_SPEED + bob);
        } else {
          body.setVelocity(0, bob);
        }
      }
      break;
    }
    default: {
      const exhaustive: never = kind;
      void exhaustive;
    }
  }
}
