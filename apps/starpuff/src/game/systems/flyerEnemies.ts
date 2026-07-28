import Phaser from 'phaser';
import {
  COMETA_FSM,
  GLOWY_FSM,
  GUSTY_FSM,
  TWINKLA_FSM,
  tickCometa,
  tickGlowy,
  tickGusty,
  tickTwinkla,
  tickZappy,
  type CometaState,
  type GustyState,
  type TwinklaState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import { setFacingFromVelocityX, setFacingTowardX } from './enemyFacing';
import { clearWindupRing, updateWindupRing, type WindupRingSpec } from './enemyWindupRing';
import type { EnemyUpdateContext } from './enemyUpdates';

// 飛行漂浮系小怪 per-kind 逐幀 AI（GAME_DESIGN §30/§47/§52/§80）：自 enemyUpdates.ts
// 機械式搬移（W3 前置 1200 行閘分檔），行為零改變；時序由 logic/enemyFsm 決策，
// 此處只負責呈現層；hazards 生成經 ctx 回呼銜接（enemies.ts 持有池）。

// zappy：緩慢懸浮追蹤；每 3s 放電環（半徑 70、前搖 0.5s 閃爍預警）（§30）。
const ZAPPY_SPEED = 40;
const ZAPPY_BOB_SPEED = 14;
const ZAPPY_BOB_OMEGA = 0.003;
const ZAPPY_RING_RADIUS = 70;
// glowy（§47）：緩慢漂近 26px/s + 正弦浮動；脈衝半徑 80 走 hazards 管線。
const GLOWY_SPEED = 26;
const GLOWY_BOB_SPEED = 12;
const GLOWY_BOB_OMEGA = 0.0022;
// gusty（§52）：漂移速度與呼吸浮動；俯衝速度由 GUSTY_FSM 持有。
const GUSTY_DRIFT_SPEED = 70;
const GUSTY_DRIFT_OMEGA = 0.0012;
const GUSTY_BOB_SPEED = 16;
const GUSTY_BOB_OMEGA = 0.0026;
// twinkla（§80）：虛化半透明與實體窗漂速；shimmer 星光聚攏著色。
const TWINKLA_PHASED_ALPHA = 0.32;
const TWINKLA_SHIMMER_TINT = 0xfff4c8;
const TWINKLA_BOB_SPEED = 12;
const TWINKLA_BOB_OMEGA = 0.0024;
// cometa（§80）：巡游速度與鎖定閃爍節拍。
const COMETA_GLIDE_SPEED = 80;
const COMETA_GLIDE_OMEGA = 0.001;
const COMETA_BOB_SPEED = 12;
const COMETA_BOB_OMEGA = 0.0024;
const COMETA_LOCK_FLICKER_MS = 90;
const COMETA_LOCK_TINT = 0xe8f6ff;

const GLOWY_RING: WindupRingSpec = {
  radius: GLOWY_FSM.pulseRadiusPx,
  fill: 0xfff7d6,
  fillAlpha: 0.08,
  stroke: 0xffe9a8,
  strokeAlpha: 0.8,
};

// 提燈者（§47）：漂近 + 正弦浮動；windup 預警圈擴張（progress 驅動）、週期滿釋放脈衝。
export function updateGlowy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickGlowy(sprite.getData('cycleMs') as number, deltaMs);
  sprite.setData('cycleMs', tick.glowMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.phase === 'pulse') {
    clearWindupRing(sprite);
    sprite.clearTint();
    ctx.pulseRing(sprite.x, sprite.y, GLOWY_FSM.pulseRadiusPx, 0xffe9a8);
    return;
  }
  if (tick.phase === 'windup') {
    // 預警圈先行：由小到滿半徑擴張，脈衝前明確可讀。
    body.setVelocity(0, 0);
    updateWindupRing(ctx, sprite, sprite.x, sprite.y, GLOWY_RING, tick.progress);
    sprite.setTint(Math.floor(tick.glowMs / 90) % 2 === 0 ? 0xffffff : 0xffe9a8);
    return;
  }
  clearWindupRing(sprite);
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

// 風飄鳥（§52）：四態時序由 enemyFsm 決策；drift 水平漂移＋正弦浮動、windup 懸停
// 抖動預警、dive 朝鎖定點高速撲擊、recover 回升原航高。側風推移由
// enemies.applyEnvironmentalForces 結算（GameScene 逐幀委派）。
export function updateGusty(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const target = ctx.target;
  const state = sprite.getData('state') as GustyState;
  // 觸發俯衝：drift 期玩家位於斜下方觸發域內。
  const shouldDive =
    state === 'drift' &&
    target !== null &&
    target.y > sprite.y + 30 &&
    Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y) <=
      GUSTY_FSM.triggerRangePx;
  // #832：回升需回抵航高才可切 drift（比照 cometa #822），recover 分支持續 -120
  // 爬升直到夾回 baseY。
  const tick = tickGusty(
    state,
    sprite.getData('stateMs') as number,
    deltaMs,
    shouldDive,
    sprite.y <= (sprite.getData('baseY') as number),
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'windup') {
    body.setVelocity(0, 0);
  } else if (tick.entered === 'dive') {
    playSfx('flap');
    // 俯衝鎖定：前搖結束當下的玩家位置，之後不再修正（可預判閃避）。
    const aimX = target?.x ?? sprite.x;
    const aimY = target?.y ?? sprite.y + 120;
    const angle = Math.atan2(aimY - sprite.y, aimX - sprite.x);
    body.setVelocity(
      Math.cos(angle) * GUSTY_FSM.diveSpeed * mul,
      Math.sin(angle) * GUSTY_FSM.diveSpeed * mul,
    );
  } else if (tick.entered === 'recover') {
    body.setVelocity(0, -120);
  } else if (tick.entered === 'drift') {
    body.setVelocity(0, 0);
  }
  switch (tick.state) {
    case 'drift': {
      const phase = sprite.getData('phase') as number;
      const bob = Math.sin(ctx.elapsedMs * GUSTY_BOB_OMEGA + phase) * GUSTY_BOB_SPEED;
      body.setVelocity(
        Math.cos(ctx.elapsedMs * GUSTY_DRIFT_OMEGA + phase) * GUSTY_DRIFT_SPEED * mul,
        bob,
      );
      sprite.setRotation(0);
      setFacingFromVelocityX(sprite, body.velocity.x);
      break;
    }
    case 'windup': {
      // 前搖：懸停抖動預警，面向俯衝目標（dive 於前搖結束當下鎖定玩家位置）。
      if (target) setFacingTowardX(sprite, target.x);
      sprite.setRotation(Math.sin(tick.stateMs * 0.06) * 0.14);
      break;
    }
    case 'dive': {
      sprite.setRotation(Math.sign(body.velocity.x) * 0.22);
      setFacingFromVelocityX(sprite, body.velocity.x);
      break;
    }
    case 'recover': {
      // 垂直回升（vx=0）：面向凍結，維持俯衝末朝向。
      sprite.setRotation(0);
      // 回升至航高後懸停等待轉 drift。
      if (sprite.y <= (sprite.getData('baseY') as number)) body.setVelocityY(0);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 星屑幽靈（§80）：三態時序由 enemyFsm 決策——phased 半透明緩飄（穿身無害）、
// shimmer 星光聚攏 telegraph（定身閃爍）、solid 實體緩慢追飄（可吸可傷窗）。
export function updateTwinkla(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  // 精英倍率（§48）：星屑幽長 ×1.4 僅縮虛化期提高現身頻率。
  const tick = tickTwinkla(
    sprite.getData('state') as TwinklaState,
    sprite.getData('stateMs') as number,
    deltaMs,
    (sprite.getData('eliteMul') as number) ?? 1,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.entered === 'solid') {
    playSfx('reveal', 0.6);
    sprite.setAlpha(1);
    sprite.clearTint();
  } else if (tick.entered === 'phased') {
    body.setVelocity(0, 0);
  }
  const phase = sprite.getData('phase') as number;
  const bob = Math.sin(ctx.elapsedMs * TWINKLA_BOB_OMEGA + phase) * TWINKLA_BOB_SPEED;
  switch (tick.state) {
    case 'phased': {
      // 虛化：半透明緩飄向玩家（穿身無害，追蹤速度減半）。
      sprite.setAlpha(TWINKLA_PHASED_ALPHA);
      sprite.clearTint();
      if (ctx.target) {
        const angle = Math.atan2(ctx.target.y - sprite.y, ctx.target.x - sprite.x);
        body.setVelocity(
          Math.cos(angle) * TWINKLA_FSM.driftSpeed,
          Math.sin(angle) * TWINKLA_FSM.driftSpeed + bob,
        );
      } else {
        body.setVelocity(0, bob);
      }
      break;
    }
    case 'shimmer': {
      // 星光聚攏 telegraph：定身、透明度回升、亮金閃爍。
      body.setVelocity(0, 0);
      sprite.setAlpha(0.55 + (tick.stateMs / TWINKLA_FSM.shimmerMs) * 0.45);
      sprite.setTint(Math.floor(tick.stateMs / 90) % 2 === 0 ? 0xffffff : TWINKLA_SHIMMER_TINT);
      break;
    }
    case 'solid': {
      // 實體窗：緩慢追飄（可吸可傷）。
      if (ctx.target) {
        const angle = Math.atan2(ctx.target.y - sprite.y, ctx.target.x - sprite.x);
        body.setVelocity(
          Math.cos(angle) * TWINKLA_FSM.chaseSpeed,
          Math.sin(angle) * TWINKLA_FSM.chaseSpeed + bob,
        );
      } else {
        body.setVelocity(0, bob);
      }
      sprite.setRotation(Math.sin(tick.stateMs * 0.004) * 0.08);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 彗尾飛魚（§80）：四態時序由 enemyFsm 決策——glide 高處巡游、lock 鎖定閃爍
//（鎖定後不修正）、dash 斜向俯衝拖彗尾（hazards 管線）、recover 回升航高。
export function updateCometa(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const target = ctx.target;
  const state = sprite.getData('state') as CometaState;
  const baseY = sprite.getData('baseY') as number;
  // 觸發俯衝：glide 期玩家位於下方觸發域內。
  const shouldDash =
    state === 'glide' &&
    target !== null &&
    target.y > sprite.y + 40 &&
    Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y) <=
      COMETA_FSM.triggerRangePx;
  // #822：回升需回抵航高才可切 glide，recover 分支持續 -130 爬升直到夾回 baseY。
  const tick = tickCometa(
    state,
    sprite.getData('stateMs') as number,
    deltaMs,
    shouldDash,
    sprite.y <= baseY,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'lock') {
    body.setVelocity(0, 0);
    // 鎖定當下的玩家位置（§80）：之後不再修正，可預判閃避。
    sprite.setData('aimX', target?.x ?? sprite.x);
    sprite.setData('aimY', target?.y ?? sprite.y + 140);
  } else if (tick.entered === 'dash') {
    playSfx('flap', 1.1);
    const aimX = (sprite.getData('aimX') as number) ?? sprite.x;
    const aimY = (sprite.getData('aimY') as number) ?? sprite.y + 140;
    const angle = Math.atan2(aimY - sprite.y, aimX - sprite.x);
    body.setVelocity(
      Math.cos(angle) * COMETA_FSM.dashSpeed * mul,
      Math.sin(angle) * COMETA_FSM.dashSpeed * mul,
    );
    sprite.setData('tailMs', 0);
  } else if (tick.entered === 'recover') {
    sprite.clearTint();
    body.setVelocity(0, -130);
  } else if (tick.entered === 'glide') {
    body.setVelocity(0, 0);
  }
  switch (tick.state) {
    case 'glide': {
      const phase = sprite.getData('phase') as number;
      const bob = Math.sin(ctx.elapsedMs * COMETA_BOB_OMEGA + phase) * COMETA_BOB_SPEED;
      body.setVelocity(
        Math.cos(ctx.elapsedMs * COMETA_GLIDE_OMEGA + phase) * COMETA_GLIDE_SPEED * mul,
        bob,
      );
      sprite.setRotation(0);
      setFacingFromVelocityX(sprite, body.velocity.x);
      break;
    }
    case 'lock': {
      // 鎖定閃爍 telegraph：面向鎖定點（dash 即朝此點衝刺，telegraph 可預判）。
      setFacingTowardX(sprite, (sprite.getData('aimX') as number) ?? sprite.x);
      sprite.setTint(
        Math.floor(tick.stateMs / COMETA_LOCK_FLICKER_MS) % 2 === 0 ? 0xffffff : COMETA_LOCK_TINT,
      );
      sprite.setRotation(Math.sin(tick.stateMs * 0.05) * 0.1);
      break;
    }
    case 'dash': {
      sprite.clearTint();
      sprite.setRotation(Math.atan2(body.velocity.y, Math.abs(body.velocity.x)) * 0.5);
      setFacingFromVelocityX(sprite, body.velocity.x);
      // 彗尾段（§80）：沿路每 tailIntervalMs 滯留一段傷害彗尾。
      const tailMs = ((sprite.getData('tailMs') as number) ?? 0) + deltaMs;
      if (tailMs >= COMETA_FSM.tailIntervalMs) {
        sprite.setData('tailMs', tailMs - COMETA_FSM.tailIntervalMs);
        ctx.spawnCometTail(sprite.x, sprite.y);
      } else {
        sprite.setData('tailMs', tailMs);
      }
      break;
    }
    case 'recover': {
      sprite.setRotation(0);
      // 回升至航高後懸停等待轉 glide（沿 gusty 慣例）。
      if (sprite.y <= baseY) body.setVelocityY(0);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 雷雷 Zappy（§30）：自 updateEnemyKind 內聯 case 機械式抽出；放電週期時序由
// enemyFsm 決策；此處僅結算呈現與物理。
export function updateZappy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const tick = tickZappy(sprite.getData('cycleMs') as number, deltaMs);
  sprite.setData('cycleMs', tick.zapMs);
  if (tick.phase === 'discharge') {
    sprite.clearTint();
    ctx.pulseRing(sprite.x, sprite.y, ZAPPY_RING_RADIUS, 0xffe28a);
  } else if (tick.phase === 'windup') {
    // 前搖 0.5s：定身 + 明暗交替閃爍預警。
    body.setVelocity(0, 0);
    sprite.setTint(tick.flickerBright ? 0xffffff : 0xffe28a);
  } else {
    // 緩慢懸浮追蹤玩家 + 正弦上下漂浮；精英倍率（§48/§52）強化追速。
    const phase = sprite.getData('phase') as number;
    const mul = (sprite.getData('eliteMul') as number) ?? 1;
    const bob = Math.sin(ctx.elapsedMs * ZAPPY_BOB_OMEGA + phase) * ZAPPY_BOB_SPEED;
    if (ctx.target) {
      const angle = Math.atan2(ctx.target.y - sprite.y, ctx.target.x - sprite.x);
      body.setVelocity(
        Math.cos(angle) * ZAPPY_SPEED * mul,
        Math.sin(angle) * ZAPPY_SPEED * mul + bob,
      );
    } else {
      body.setVelocity(0, bob);
    }
  }
}
