import type Phaser from 'phaser';
import {
  CARGO_FSM,
  FOAMY_FSM,
  FROSTY_FSM,
  MANTA_FSM,
  TICKETA_FSM,
  cargoPatrolDirection,
  tickFoamy,
  tickManta,
  tickScanna,
  tickTicketa,
  type FoamyState,
  type MantaState,
  type ScannaState,
  type TicketaState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import type { EnemyUpdateContext } from './enemyUpdates';

// §112 星海終局篇新怪 per-kind 逐幀 AI：時序由 enemyFsm 決策，此處只負責呈現層
//（速度/旋轉/著色）；hazards 生成經 ctx 回呼銜接（enemies.ts 持有池）。
// 獨立模組而非續寫 enemyUpdates.ts：既有檔 1132 行貼近 1200 行閘。

// 呈現層常數：ticketa 換軌閃爍節拍；scanna 鎖定著色；foamy 鼓脹抖動；manta 俯仰。
const TICKETA_FLICKER_MS = 100;
const TICKETA_SHIFT_TINT = 0xfff1c4;
const SCANNA_AIM_TINT = 0xff9ec4;
const SCANNA_FLICKER_MS = 110;
const FOAMY_WINDUP_TINT = 0xcfeef5;
const MANTA_AIM_TINT = 0xbfe8ff;

// 貨櫃丁（§112）：緩推巡邏——週期折返＋碰牆 bounce；被外力夾停時恢復。
export function updateCargo(
  _ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const cycleMs = (sprite.getData('cycleMs') as number) + deltaMs;
  sprite.setData('cycleMs', cycleMs);
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  const direction = cargoPatrolDirection(cycleMs);
  if (body.blocked.down && (body.velocity.x === 0 || direction !== Math.sign(body.velocity.x))) {
    body.setVelocityX(CARGO_FSM.walkSpeed * mul * direction);
  }
  sprite.setRotation(Math.sin(cycleMs * 0.006) * 0.05);
}

// 票券蝠（§112）：雙軌飛行——fly 沿軌帶水平漂移、垂直逼近軌帶高；shift 前搖閃爍
// telegraph 後高速換軌（穿越玩家空域即攻擊語彙）。
export function updateTicketa(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickTicketa(
    sprite.getData('state') as TicketaState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.entered === 'fly') {
    // 換軌完成：翻轉軌帶錨。
    const band = sprite.getData('band') === 'high' ? 'low' : 'high';
    sprite.setData('band', band);
    sprite.clearTint();
  }
  const bandY = sprite.getData('band') === 'high' ? TICKETA_FSM.bandHighY : TICKETA_FSM.bandLowY;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.state === 'shift') {
    // 前搖閃爍（telegraph ≥600ms）＋朝目標軌帶俯掠。
    sprite.setTint(
      Math.floor(tick.stateMs / TICKETA_FLICKER_MS) % 2 === 0 ? 0xffffff : TICKETA_SHIFT_TINT,
    );
    const targetY =
      sprite.getData('band') === 'high' ? TICKETA_FSM.bandLowY : TICKETA_FSM.bandHighY;
    body.setVelocity(body.velocity.x, Math.sign(targetY - sprite.y) * TICKETA_FSM.shiftSpeed * mul);
    return;
  }
  const phase = sprite.getData('phase') as number;
  body.setVelocity(
    Math.cos(ctx.elapsedMs * 0.0014 + phase) * TICKETA_FSM.flySpeed * mul,
    (bandY - sprite.y) * 2,
  );
  sprite.setFlipX(body.velocity.x < 0);
}

// 掃描眼（§112）：定點懸浮；aim 期鎖定線漸亮（鎖定後不修正），fire 生成直線光束。
export function updateScanna(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickScanna(
    sprite.getData('state') as ScannaState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const phase = sprite.getData('phase') as number;
  body.setVelocity(0, Math.sin(ctx.elapsedMs * 0.0022 + phase) * 10);
  if (tick.entered === 'aim') {
    // 鎖定當下面向（朝玩家側），之後不再修正——可預判走位。
    sprite.setData('beamDir', ctx.target && ctx.target.x < sprite.x ? -1 : 1);
  }
  if (tick.state === 'fire') {
    sprite.clearTint();
    const direction = (sprite.getData('beamDir') as 1 | -1) ?? 1;
    ctx.spawnScanBeam(sprite.x, sprite.y, direction);
    return;
  }
  if (tick.state === 'aim') {
    sprite.setTint(
      Math.floor(tick.stateMs / SCANNA_FLICKER_MS) % 2 === 0 ? 0xffffff : SCANNA_AIM_TINT,
    );
    sprite.setFlipX((sprite.getData('beamDir') as number) === -1);
    return;
  }
  sprite.clearTint();
}

// 泡泡機（§112）：定點吐泡——windup 鼓脹抖動 telegraph，spit 生成漂浮泡泡。
export function updateFoamy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
  const tick = tickFoamy(
    sprite.getData('state') as FoamyState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  if (tick.state === 'spit') {
    playSfx('pop', 1.1);
    sprite.clearTint();
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    ctx.spawnBubble(sprite.x + direction * 16, sprite.y - 12, direction);
    return;
  }
  if (tick.state === 'windup') {
    sprite.setTint(FOAMY_WINDUP_TINT);
    sprite.setRotation(Math.sin(tick.stateMs * 0.05) * 0.12);
    const mod = ctx.vscale.mod(sprite);
    mod.sx = 1 + (tick.stateMs / FOAMY_FSM.windupMs) * 0.12;
    mod.sy = 1 + (tick.stateMs / FOAMY_FSM.windupMs) * 0.12;
    return;
  }
  sprite.clearTint();
  sprite.setRotation(0);
  const mod = ctx.vscale.mod(sprite);
  mod.sx = 1;
  mod.sy = 1;
}

// 冰史萊姆（§112）：冰面恆速滑行＋碰牆反彈；分裂在 enemies.damage 擊殺路徑結算。
export function updateFrosty(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (body.velocity.x === 0 && body.blocked.down) {
    const mul = (sprite.getData('eliteMul') as number) ?? 1;
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    body.setVelocityX(FROSTY_FSM.slideSpeed * mul * direction);
  }
  // 滑行傾角：冰面滑順讀感（低頻小幅搖擺）。
  const stateMs = ((sprite.getData('stateMs') as number) ?? 0) + deltaMs;
  sprite.setData('stateMs', stateMs);
  sprite.setRotation(Math.sin(stateMs * 0.01) * 0.08);
  sprite.setFlipX(body.velocity.x < 0);
}

// 潮汐魟（§112）：低空巡游；aim 鎖定 telegraph 後扇形三水刃（順流方向＝面向側）。
export function updateManta(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickManta(
    sprite.getData('state') as MantaState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.state === 'volley') {
    playSfx('flap', 0.8);
    sprite.clearTint();
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    for (const vy of [-MANTA_FSM.bladeFanVy, 0, MANTA_FSM.bladeFanVy]) {
      ctx.spawnWaterBlade(
        sprite.x + direction * 20,
        sprite.y,
        direction * MANTA_FSM.bladeSpeed,
        vy,
      );
    }
    return;
  }
  if (tick.state === 'aim') {
    body.setVelocity(0, 0);
    sprite.setTint(
      Math.floor(tick.stateMs / SCANNA_FLICKER_MS) % 2 === 0 ? 0xffffff : MANTA_AIM_TINT,
    );
    return;
  }
  if (tick.entered === 'cruise' || tick.entered === 'cool') sprite.clearTint();
  const phase = sprite.getData('phase') as number;
  body.setVelocity(
    Math.cos(ctx.elapsedMs * 0.0012 + phase) * MANTA_FSM.cruiseSpeed * mul,
    Math.sin(ctx.elapsedMs * 0.0024 + phase) * 14,
  );
  sprite.setFlipX(body.velocity.x < 0);
  sprite.setRotation(Math.sin(ctx.elapsedMs * 0.0024 + phase) * 0.08);
}
