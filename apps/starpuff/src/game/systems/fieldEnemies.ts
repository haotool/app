import type Phaser from 'phaser';
import {
  BEARLET_FSM,
  BEARMARKET_FSM,
  BULLRUN_FSM,
  GRAVITYBUB_FSM,
  MAGNO_FSM,
  ORBITON_FSM,
  PRISMBEE_FSM,
  RIFTLING_FSM,
  copypuffMirrorDx,
  riftlingBlinkX,
  tickBearlet,
  tickBearmarket,
  tickBullrun,
  tickCopypuff,
  tickGravitybub,
  tickMagno,
  tickMirri,
  tickOrbiton,
  tickPrismbee,
  tickRiftling,
  type BearletState,
  type BearmarketState,
  type BullrunState,
  type CopypuffState,
  type MirriState,
  type OrbitonState,
  type PrismbeeState,
  type RiftlingState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import { setFacingBySign, setFacingFromVelocityX, setFacingTowardX } from './enemyFacing';
import { clearWindupRing, updateWindupRing, type WindupRingSpec } from './enemyWindupRing';
import type { EnemyUpdateContext } from './enemyUpdates';

// 場域機制系小怪 per-kind 逐幀 AI（GAME_DESIGN §59：磁場／鏡面）：自 enemyUpdates.ts
// 機械式搬移（W3 前置 1200 行閘分檔），行為零改變；W3 鏡界（L26）／引力（L28）
// 家族小怪 update 邏輯的預定落點。時序由 logic/enemyFsm 決策，此處只負責呈現層。

// magno（§59）：緩行走速與磁場期著色（鋼藍磁殼）。
const MAGNO_WALK_SPEED = 34;
const MAGNO_FIELD_TINT = 0x8ab0e8;
// mirri（§59）：巡邏走速與鏡面態著色（亮銀鏡殼）。
const MIRRI_WALK_SPEED = 62;
const MIRRI_MIRROR_TINT = 0xf0f4ff;
const MIRRI_COOL_TINT = 0x9a9aa8;

const MAGNO_RING: WindupRingSpec = {
  radius: MAGNO_FSM.fieldRadiusPx,
  fill: 0x8ab0e8,
  fillAlpha: 0.06,
  stroke: 0x8ab0e8,
  strokeAlpha: 0.8,
};

// 磁極獸（§59）：週期時序由 enemyFsm 決策——idle 緩行、windup 預警圈擴張、field 定身
// 磁場（環形視覺脈動＋星彈吸偏由 GameScene 逐幀結算；星彈免傷窗由 resolveMagnoStarHit 把關）。
export function updateMagno(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickMagno(sprite.getData('cycleMs') as number, deltaMs);
  sprite.setData('cycleMs', tick.magnoMs);
  sprite.setData('magnoPhase', tick.phase);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.phase === 'field') {
    body.setVelocityX(0);
    sprite.setTint(MAGNO_FIELD_TINT);
    // 磁場視覺：預警圈滿張後留場脈動，隨磁場期結束回收。
    let ring = sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined;
    if (!ring) {
      ring = ctx.scene.add
        .circle(sprite.x, sprite.y, MAGNO_RING.radius, MAGNO_RING.fill, MAGNO_RING.fillAlpha)
        .setStrokeStyle(3, MAGNO_RING.stroke, MAGNO_RING.strokeAlpha)
        .setDepth(59);
      sprite.setData('warnRing', ring);
    }
    ring.setPosition(sprite.x, sprite.y);
    ring.setScale(1);
    ring.setAlpha(0.75 + Math.sin(ctx.elapsedMs * 0.012) * 0.25);
    return;
  }
  if (tick.phase === 'windup') {
    body.setVelocityX(0);
    updateWindupRing(ctx, sprite, sprite.x, sprite.y, MAGNO_RING, tick.progress);
    sprite.setTint(Math.floor(tick.magnoMs / 100) % 2 === 0 ? 0xffffff : MAGNO_FIELD_TINT);
    return;
  }
  clearWindupRing(sprite);
  sprite.clearTint();
  // idle 緩行朝玩家；被外力夾停時恢復。
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (body.blocked.down) {
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    body.setVelocityX(MAGNO_WALK_SPEED * mul * direction);
  }
  sprite.setRotation(Math.sin(tick.magnoMs * 0.006) * 0.06);
}

// 鏡面蟲（§59）：三態時序由 enemyFsm 決策——roam 巡邏（末段亮銀預告閃爍）、mirror 定身
// 鏡面（反射玩家星彈，明確亮銀＋高光）、cool 黯淡冷卻（明確可打窗）。
export function updateMirri(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickMirri(
    sprite.getData('state') as MirriState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.entered === 'mirror') {
    playSfx('metal', 1.3);
    body.setVelocityX(0);
  } else if (tick.entered === 'cool') {
    sprite.setRotation(0);
  } else if (tick.entered === 'roam') {
    sprite.clearTint();
  }
  switch (tick.state) {
    case 'roam': {
      if (body.velocity.x === 0) {
        const mul = (sprite.getData('eliteMul') as number) ?? 1;
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(MIRRI_WALK_SPEED * mul * direction);
      }
      setFacingFromVelocityX(sprite, body.velocity.x);
      // 鏡面預告（telegraph）：roam 末段亮銀閃爍。
      if (tick.flickerBright) sprite.setTint(MIRRI_MIRROR_TINT);
      else sprite.clearTint();
      sprite.setRotation(Math.sin(tick.stateMs * 0.01) * 0.08);
      break;
    }
    case 'mirror': {
      // 鏡面態：定身亮銀＋高頻微顫（明確視覺）。面向凍結——定身語彙，
      // 且反射方向由星彈入射向量決定（enemies.reflectStar），與面向無關。
      body.setVelocityX(0);
      sprite.setTint(MIRRI_MIRROR_TINT);
      sprite.setRotation(Math.sin(tick.stateMs * 0.05) * 0.05);
      break;
    }
    case 'cool': {
      sprite.setTint(MIRRI_COOL_TINT);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// ===== §123 星海終局篇 W3：鏡界（L25）／引力（L27）家族 =====

// 呈現層常數：著色與閃爍節拍（telegraph 時長一律取 enemyFsm SSOT）。
const FLICKER_MS = 110;
const COPYPUFF_BROKEN_TINT = 0xc8b8e0;
const PRISMBEE_AIM_TINT = 0xf0c8f8;
const GRAVITYBUB_FIELD_TINT = 0xb09ae8;
const RIFTLING_RIFT_TINT = 0xd0b8ff;
const RIFTLING_COOL_TINT = 0x9a90b8;
const BEARLET_WINDUP_TINT = 0xffb8a8;
const ORBITON_WINDUP_TINT = 0xe8d8ff;
// §125 牛熊怪：蓄力金橘閃爍／拍地紫紅閃爍／冬眠深紫定身。
const BULLRUN_CHARGE_TINT = 0xffd88a;
const BEARMARKET_WIND_TINT = 0xc8a8e8;
const BEARMARKET_HIBERNATE_TINT = 0x584878;

const GRAVITYBUB_RING: WindupRingSpec = {
  radius: GRAVITYBUB_FSM.fieldRadiusPx,
  fill: 0xb09ae8,
  fillAlpha: 0.07,
  stroke: 0xb09ae8,
  strokeAlpha: 0.8,
};

// 裂縫預告圈：目的地位置的紫紋裂縫（讀裂縫即預判）。
const RIFTLING_RING: WindupRingSpec = {
  radius: 34,
  fill: 0xd0b8ff,
  fillAlpha: 0.12,
  stroke: 0xd0b8ff,
  strokeAlpha: 0.9,
};

const flickerBright = (stateMs: number): boolean => Math.floor(stateMs / FLICKER_MS) % 2 === 0;

// datamote 聚攏常數：聚滿停駐距離與漂移速度。
const DATAMOTE_HOLD_PX = 40;
const DATAMOTE_DRIFT_SPEED = 26;

// 複製噗（§123）：鏡像模仿玩家水平動作（玩家逐幀位移取反向 positional 套用，照鏡子）；
// 不可吸；稜化攻擊命中入 broken 破鏡像窗（停走可打，行為解除非免傷）。
export function updateCopypuff(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickCopypuff(
    sprite.getData('state') as CopypuffState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setVelocityX(0);
  if (tick.entered === 'mimic') sprite.clearTint();
  if (tick.state === 'broken') {
    // 破鏡像窗：停走黯淡＋微顫（明確可打讀感）；鏡像追蹤中斷。
    sprite.setTint(COPYPUFF_BROKEN_TINT);
    sprite.setRotation(Math.sin(tick.stateMs * 0.04) * 0.1);
    sprite.setData('lastTargetX', ctx.target?.x);
    return;
  }
  const target = ctx.target;
  if (!target) return;
  const lastX = sprite.getData('lastTargetX') as number | undefined;
  sprite.setData('lastTargetX', target.x);
  if (lastX === undefined) return;
  // 鏡像位移（positional，沿 gusty 側風慣例不與速度控制器對抗）；單幀夾限防瞬移。
  const mirrored = copypuffMirrorDx(target.x - lastX);
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  sprite.x += mirrored * mul;
  setFacingBySign(sprite, mirrored);
  sprite.setRotation(Math.sin(ctx.elapsedMs * 0.008) * 0.06);
}

// 稜蜂（§123）：懸浮巡飛保持中距 → 鎖定閃爍 telegraph → 直線衝刺 → 冷卻。
// 正面反射星彈（isReflective 分流）、側背面脆弱；死亡三彩碎片由擊殺路徑結算。
export function updatePrismbee(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickPrismbee(
    sprite.getData('state') as PrismbeeState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'dart') {
    // 鎖定前搖結束當下玩家位置突進，之後不修正（可預判閃避，沿 gusty 慣例）。
    playSfx('flap', 1.1);
    const aimX = ctx.target?.x ?? sprite.x;
    const aimY = ctx.target?.y ?? sprite.y;
    const angle = Math.atan2(aimY - sprite.y, aimX - sprite.x);
    body.setVelocity(
      Math.cos(angle) * PRISMBEE_FSM.dartSpeed * mul,
      Math.sin(angle) * PRISMBEE_FSM.dartSpeed * mul,
    );
    setFacingBySign(sprite, aimX - sprite.x);
  }
  if (tick.state === 'dart') {
    sprite.setRotation(Math.sin(tick.stateMs * 0.05) * 0.1);
    return;
  }
  if (tick.state === 'aim') {
    body.setVelocity(0, 0);
    if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
    sprite.setTint(flickerBright(tick.stateMs) ? 0xffffff : PRISMBEE_AIM_TINT);
    return;
  }
  if (tick.entered === 'cool' || tick.entered === 'hover') sprite.clearTint();
  // hover/cool：正弦巡飛＋垂直微浮，朝玩家側低速逼近。
  const phase = sprite.getData('phase') as number;
  const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
  body.setVelocity(
    direction *
      PRISMBEE_FSM.hoverSpeed *
      mul *
      (0.6 + Math.sin(ctx.elapsedMs * 0.002 + phase) * 0.4),
    Math.sin(ctx.elapsedMs * 0.0024 + phase) * 18,
  );
  setFacingFromVelocityX(sprite, body.velocity.x);
  sprite.setRotation(Math.sin(ctx.elapsedMs * 0.003 + phase) * 0.06);
}

// 資料塵（§123）：緩慢向最近同類聚攏、貼近即停駐——聚集成障礙（可吸＝彈藥牆）；
// 無同類時定點微浮。
export function updateDatamote(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  void deltaMs;
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const phase = sprite.getData('phase') as number;
  const near = ctx.nearestKind('datamote', sprite.x, sprite.y);
  const bob = Math.sin(ctx.elapsedMs * 0.003 + phase) * 10;
  if (!near) {
    body.setVelocity(0, bob);
    sprite.setRotation(Math.sin(ctx.elapsedMs * 0.002 + phase) * 0.08);
    return;
  }
  const dx = near.x - sprite.x;
  const dy = near.y - sprite.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= DATAMOTE_HOLD_PX) {
    // 聚滿停駐（障礙態）：微脈動讀感。
    body.setVelocity(0, bob * 0.4);
    sprite.setRotation(Math.sin(ctx.elapsedMs * 0.006 + phase) * 0.12);
    return;
  }
  body.setVelocity((dx / dist) * DATAMOTE_DRIFT_SPEED, (dy / dist) * DATAMOTE_DRIFT_SPEED + bob);
}

// 重力泡（§123）：週期時序由 enemyFsm 決策——idle 漂浮、windup 預警圈擴張、field
// 重力場（玩家水平漂移由 enemies.applyEnvironmentalForces 逐幀結算；引力化免疫）。
export function updateGravitybub(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickGravitybub(sprite.getData('cycleMs') as number, deltaMs);
  sprite.setData('cycleMs', tick.bubMs);
  sprite.setData('bubPhase', tick.phase);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const phase = sprite.getData('phase') as number;
  if (tick.phase === 'field') {
    body.setVelocity(0, 0);
    sprite.setTint(GRAVITYBUB_FIELD_TINT);
    // 重力場視覺：預警圈滿張後留場脈動（沿 magno 慣例），隨場期結束回收。
    let ring = sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined;
    if (!ring) {
      ring = ctx.scene.add
        .circle(
          sprite.x,
          sprite.y,
          GRAVITYBUB_RING.radius,
          GRAVITYBUB_RING.fill,
          GRAVITYBUB_RING.fillAlpha,
        )
        .setStrokeStyle(3, GRAVITYBUB_RING.stroke, GRAVITYBUB_RING.strokeAlpha)
        .setDepth(59);
      sprite.setData('warnRing', ring);
    }
    ring.setPosition(sprite.x, sprite.y);
    ring.setScale(1);
    ring.setAlpha(0.7 + Math.sin(ctx.elapsedMs * 0.01) * 0.3);
    return;
  }
  if (tick.phase === 'windup') {
    body.setVelocity(0, 0);
    updateWindupRing(ctx, sprite, sprite.x, sprite.y, GRAVITYBUB_RING, tick.progress);
    sprite.setTint(flickerBright(tick.bubMs) ? 0xffffff : GRAVITYBUB_FIELD_TINT);
    return;
  }
  clearWindupRing(sprite);
  sprite.clearTint();
  body.setVelocity(
    Math.cos(ctx.elapsedMs * 0.0012 + phase) * 22,
    Math.sin(ctx.elapsedMs * 0.0026 + phase) * 14,
  );
  sprite.setRotation(Math.sin(tick.bubMs * 0.004) * 0.08);
}

// 軌道怪（§123）：逼近 → 繞玩家三圈（速度伺服貼軌）→ 定格閃爍 telegraph → 鎖定突進
//（之後不修正）→ 回復。
export function updateOrbiton(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const target = ctx.target;
  const dist = target ? Math.hypot(target.x - sprite.x, target.y - sprite.y) : Infinity;
  const nearOrbit = dist <= ORBITON_FSM.orbitRadiusPx + 40;
  const tick = tickOrbiton(
    sprite.getData('state') as OrbitonState,
    sprite.getData('stateMs') as number,
    deltaMs,
    nearOrbit,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'orbit') {
    // 入軌鎖存起始角：自當前相對方位接續，貼軌零跳變。
    const angle = target ? Math.atan2(sprite.y - target.y, sprite.x - target.x) : 0;
    sprite.setData('orbitAngle', angle);
    sprite.clearTint();
  }
  if (tick.entered === 'dash') {
    playSfx('flap', 0.9);
    const aimX = target?.x ?? sprite.x;
    const aimY = target?.y ?? sprite.y;
    const angle = Math.atan2(aimY - sprite.y, aimX - sprite.x);
    body.setVelocity(
      Math.cos(angle) * ORBITON_FSM.dashSpeed * mul,
      Math.sin(angle) * ORBITON_FSM.dashSpeed * mul,
    );
  }
  switch (tick.state) {
    case 'approach': {
      if (!target) {
        body.setVelocity(0, 0);
        break;
      }
      const angle = Math.atan2(target.y - sprite.y, target.x - sprite.x);
      body.setVelocity(
        Math.cos(angle) * ORBITON_FSM.approachSpeed * mul,
        Math.sin(angle) * ORBITON_FSM.approachSpeed * mul,
      );
      sprite.setRotation(Math.sin(ctx.elapsedMs * 0.004) * 0.1);
      break;
    }
    case 'orbit': {
      if (!target) {
        body.setVelocity(0, 0);
        break;
      }
      // 貼軌速度伺服（沿 ticketa 軌帶伺服慣例）：朝軌道點的位置差 × 增益。
      const angle =
        ((sprite.getData('orbitAngle') as number) ?? 0) +
        deltaMs * ORBITON_FSM.orbitAngularPerMs * mul;
      sprite.setData('orbitAngle', angle);
      const goalX = target.x + Math.cos(angle) * ORBITON_FSM.orbitRadiusPx;
      const goalY = target.y + Math.sin(angle) * ORBITON_FSM.orbitRadiusPx;
      body.setVelocity((goalX - sprite.x) * 5, (goalY - sprite.y) * 5);
      sprite.setRotation(angle + Math.PI / 2);
      break;
    }
    case 'windup': {
      body.setVelocity(0, 0);
      if (target) setFacingTowardX(sprite, target.x);
      sprite.setTint(flickerBright(tick.stateMs) ? 0xffffff : ORBITON_WINDUP_TINT);
      break;
    }
    case 'dash': {
      // 鎖定突進：不修正。
      break;
    }
    case 'recover': {
      sprite.clearTint();
      sprite.setRotation(0);
      body.setVelocity(body.velocity.x * 0.9, body.velocity.y * 0.9);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 裂隙怪（§123）：緩飄 → 目的地裂縫預告（讀裂縫即預判）→ 瞬移 → 冷卻。
export function updateRiftling(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickRiftling(
    sprite.getData('state') as RiftlingState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.entered === 'rift') {
    // 鎖存瞬移目的地（朝玩家、步長夾限）；裂縫預告釘在目的地。
    body.setVelocity(0, 0);
    sprite.setData('blinkX', riftlingBlinkX(sprite.x, ctx.target?.x ?? sprite.x));
  }
  if (tick.entered === 'blink') {
    const blinkX = (sprite.getData('blinkX') as number) ?? sprite.x;
    clearWindupRing(sprite);
    playSfx('pop', 1.4);
    sprite.setPosition(blinkX, sprite.y);
    body.reset(blinkX, sprite.y);
    setFacingBySign(sprite, (ctx.target?.x ?? sprite.x) - sprite.x);
  }
  switch (tick.state) {
    case 'idle': {
      if (tick.entered === 'idle') sprite.clearTint();
      const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
      const phase = sprite.getData('phase') as number;
      body.setVelocity(
        direction * RIFTLING_FSM.driftSpeed,
        Math.sin(ctx.elapsedMs * 0.0024 + phase) * 12,
      );
      setFacingFromVelocityX(sprite, body.velocity.x);
      break;
    }
    case 'rift': {
      body.setVelocity(0, 0);
      const blinkX = (sprite.getData('blinkX') as number) ?? sprite.x;
      updateWindupRing(
        ctx,
        sprite,
        blinkX,
        sprite.y,
        RIFTLING_RING,
        tick.stateMs / RIFTLING_FSM.riftMs,
      );
      sprite.setTint(flickerBright(tick.stateMs) ? 0xffffff : RIFTLING_RIFT_TINT);
      break;
    }
    case 'blink': {
      break;
    }
    case 'cool': {
      sprite.setTint(RIFTLING_COOL_TINT);
      body.setVelocity(0, 0);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 小熊市（§123）：緩走 → 舉箭閃爍 telegraph → 拋下跌箭頭（L30 熊市怪前置教學）→ 冷卻。
export function updateBearlet(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickBearlet(
    sprite.getData('state') as BearletState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.state === 'toss') {
    playSfx('pop', 0.7);
    sprite.clearTint();
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    ctx.spawnCrashArrow(sprite.x + direction * 14, sprite.y - 18, direction);
    return;
  }
  if (tick.state === 'windup') {
    body.setVelocityX(0);
    if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
    sprite.setTint(flickerBright(tick.stateMs) ? 0xffffff : BEARLET_WINDUP_TINT);
    sprite.setRotation(Math.sin(tick.stateMs * 0.03) * 0.1);
    return;
  }
  if (tick.entered === 'waddle' || tick.entered === 'cool') {
    sprite.clearTint();
    sprite.setRotation(0);
  }
  if (tick.state === 'cool') {
    body.setVelocityX(0);
    return;
  }
  // waddle 緩走朝玩家；被外力夾停時恢復。
  if (body.blocked.down) {
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    body.setVelocityX(BEARLET_FSM.walkSpeed * mul * direction);
  }
  setFacingFromVelocityX(sprite, body.velocity.x);
  sprite.setRotation(Math.sin(tick.stateMs * 0.008) * 0.05);
}

// ===== §125 星海終局篇 W4：牛熊怪（L30 劉董召喚體，PRD §6.6）=====

// 牛市怪（§125）：緩走 → 蓄力閃爍 telegraph → 鎖定衝刺（不修正）→ 撞牆反彈
// 二次加速 → 回復。蓄力期受星彈命中即中斷（enemies.damage 結算端）。
export function updateBullrun(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const hitWall = body.blocked.left || body.blocked.right;
  const tick = tickBullrun(
    sprite.getData('state') as BullrunState,
    sprite.getData('stateMs') as number,
    deltaMs,
    hitWall,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'dash') {
    playSfx('shell-spin', 0.8);
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    body.setVelocityX(BULLRUN_FSM.dashSpeed * mul * direction);
    setFacingBySign(sprite, direction);
  }
  if (tick.entered === 'redash') {
    // 撞牆反彈二次加速：bounce=1 已翻向，僅補增速（方向沿反彈後速度）。
    playSfx('metal', 0.7);
    const direction = body.velocity.x < 0 ? -1 : 1;
    body.setVelocityX(BULLRUN_FSM.dashSpeed * BULLRUN_FSM.redashSpeedMul * mul * direction);
    setFacingBySign(sprite, direction);
    ctx.scene.cameras.main.shake(90, 0.003);
  }
  switch (tick.state) {
    case 'charge': {
      body.setVelocityX(0);
      if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
      sprite.setTint(flickerBright(tick.stateMs) ? 0xffffff : BULLRUN_CHARGE_TINT);
      sprite.setRotation(Math.sin(tick.stateMs * 0.04) * 0.08);
      return;
    }
    case 'dash':
    case 'redash': {
      // 鎖定衝刺：不修正；傾角表達爆發感。
      sprite.setRotation(Math.sin(tick.stateMs * 0.03) * 0.06);
      return;
    }
    case 'recover': {
      if (tick.entered === 'recover') {
        sprite.clearTint();
        sprite.setRotation(0);
      }
      body.setVelocityX(body.velocity.x * 0.85);
      return;
    }
    case 'prowl': {
      if (tick.entered === 'prowl') sprite.clearTint();
      if (body.blocked.down) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(BULLRUN_FSM.walkSpeed * mul * direction);
      }
      setFacingFromVelocityX(sprite, body.velocity.x);
      sprite.setRotation(Math.sin(tick.stateMs * 0.007) * 0.05);
      return;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 熊市怪（§125）：緩走 → 拍地前搖閃爍 → 拍地（雙側地面波＋召下跌小箭頭）→ 冷卻；
// 低血一次性冬眠（深紫定身大 telegraph）→ 全場震波 → 甦醒。
export function updateBearmarket(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const hp = (sprite.getData('hp') as number) ?? 0;
  const maxHp = (sprite.getData('maxHp') as number) ?? hp;
  const lowHpPending =
    sprite.getData('hibernated') !== true &&
    maxHp > 0 &&
    hp / maxHp <= BEARMARKET_FSM.hibernateHpRatio;
  const tick = tickBearmarket(
    sprite.getData('state') as BearmarketState,
    sprite.getData('stateMs') as number,
    deltaMs,
    lowHpPending,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'hibernate') {
    // 一次性冬眠鎖存＋定身讀感。
    sprite.setData('hibernated', true);
    playSfx('boss-roar', 0.5);
    body.setVelocityX(0);
  }
  if (tick.state === 'slam') {
    playSfx('boss-slam', 0.6);
    ctx.scene.cameras.main.shake(110, 0.004);
    for (const direction of [-1, 1] as const) {
      ctx.spawnMarketWave(sprite.x + direction * 22, sprite.y + 10, direction, false);
    }
    const arrowDir = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    ctx.spawnCrashArrow(sprite.x + arrowDir * 16, sprite.y - 20, arrowDir);
    return;
  }
  if (tick.state === 'quake') {
    playSfx('boss-slam', 1.1);
    ctx.scene.cameras.main.shake(220, 0.007);
    for (const direction of [-1, 1] as const) {
      ctx.spawnMarketWave(sprite.x + direction * 22, sprite.y + 10, direction, true);
    }
    return;
  }
  switch (tick.state) {
    case 'slamwind': {
      body.setVelocityX(0);
      if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
      sprite.setTint(flickerBright(tick.stateMs) ? 0xffffff : BEARMARKET_WIND_TINT);
      sprite.setRotation(Math.sin(tick.stateMs * 0.03) * 0.1);
      return;
    }
    case 'hibernate': {
      body.setVelocityX(0);
      sprite.setTint(BEARMARKET_HIBERNATE_TINT);
      // 冬眠鼓脹：甦醒震波的體積前搖（fx 代理，物理箱不動）。
      const swell = 1 + (tick.stateMs / BEARMARKET_FSM.hibernateMs) * 0.18;
      const mod = ctx.vscale.mod(sprite);
      mod.sx = swell;
      mod.sy = swell;
      return;
    }
    case 'wake': {
      if (tick.entered === 'wake') {
        sprite.clearTint();
        const mod = ctx.vscale.mod(sprite);
        mod.sx = 1;
        mod.sy = 1;
      }
      body.setVelocityX(0);
      return;
    }
    case 'cool': {
      if (tick.entered === 'cool') {
        sprite.clearTint();
        sprite.setRotation(0);
      }
      body.setVelocityX(0);
      return;
    }
    case 'prowl': {
      if (tick.entered === 'prowl') sprite.clearTint();
      if (body.blocked.down) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(BEARMARKET_FSM.walkSpeed * mul * direction);
      }
      setFacingFromVelocityX(sprite, body.velocity.x);
      sprite.setRotation(Math.sin(tick.stateMs * 0.006) * 0.05);
      return;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}
