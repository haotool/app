import Phaser from 'phaser';
import type { EnemyKind } from '../core/types';
import {
  BUBBLA_FSM,
  GLOWY_FSM,
  GUSTY_FSM,
  MAGNO_FSM,
  SPLATTA_FSM,
  SPORA_FSM,
  bubblaLeapOffsetY,
  tickBoomy,
  tickBubbla,
  tickDrilly,
  tickGlowy,
  tickGusty,
  tickMagno,
  tickMirri,
  tickShelly,
  tickSplatta,
  tickSpora,
  tickZappy,
  type BoomyState,
  type BubblaState,
  type DrillyState,
  type GustyState,
  type MirriState,
  type ShellyState,
  type SplattaState,
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
// gusty（§52）：漂移速度與呼吸浮動；俯衝速度由 GUSTY_FSM 持有。
const GUSTY_DRIFT_SPEED = 70;
const GUSTY_DRIFT_OMEGA = 0.0012;
const GUSTY_BOB_SPEED = 16;
const GUSTY_BOB_OMEGA = 0.0026;
// boomy（§52）：巡邏走速與殼刃投擲高度偏移。
const BOOMY_WALK_SPEED = 55;
const BOOMY_THROW_OFFSET_Y = -6;
// magno（§59）：緩行走速與磁場期著色（鋼藍磁殼）。
const MAGNO_WALK_SPEED = 34;
const MAGNO_FIELD_TINT = 0x8ab0e8;
// mirri（§59）：巡邏走速與鏡面態著色（亮銀鏡殼）。
const MIRRI_WALK_SPEED = 62;
const MIRRI_MIRROR_TINT = 0xf0f4ff;
const MIRRI_COOL_TINT = 0x9a9aa8;
// bubbla（§73）：潛伏露頂壓扁比例（沿 drilly 半入地慣例）與漣漪前搖抖動。
const BUBBLA_SUNK_SCALE_X = 0.7;
const BUBBLA_SUNK_SCALE_Y = 0.35;
// splatta（§73）：舉勺瞄準著色。
const SPLATTA_AIM_TINT = 0xf0c890;

type ChompyState = 'idle' | 'windup' | 'bite' | 'cool';

// windup 預警圈共用（§47 glowy／§52 spora）：首幀建立、逐幀依進度擴張至滿半徑；
// 期滿或離開前搖由 clearWindupRing 回收，ring 實例掛 sprite data 隨個體生命週期。
interface WindupRingSpec {
  radius: number;
  fill: number;
  fillAlpha: number;
  stroke: number;
  strokeAlpha: number;
}

const GLOWY_RING: WindupRingSpec = {
  radius: GLOWY_FSM.pulseRadiusPx,
  fill: 0xfff7d6,
  fillAlpha: 0.08,
  stroke: 0xffe9a8,
  strokeAlpha: 0.8,
};

const SPORA_RING: WindupRingSpec = {
  radius: SPORA_FSM.cloudRadiusPx,
  fill: 0xbce8a0,
  fillAlpha: 0.1,
  stroke: 0xa8d8a0,
  strokeAlpha: 0.85,
};

const MAGNO_RING: WindupRingSpec = {
  radius: MAGNO_FSM.fieldRadiusPx,
  fill: 0x8ab0e8,
  fillAlpha: 0.06,
  stroke: 0x8ab0e8,
  strokeAlpha: 0.8,
};

function updateWindupRing(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  x: number,
  y: number,
  spec: WindupRingSpec,
  progress: number,
): void {
  let ring = sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined;
  if (!ring) {
    ring = ctx.scene.add
      .circle(x, y, spec.radius, spec.fill, spec.fillAlpha)
      .setStrokeStyle(3, spec.stroke, spec.strokeAlpha)
      .setDepth(59);
    sprite.setData('warnRing', ring);
  }
  ring.setPosition(x, y);
  ring.setScale(0.2 + progress * 0.8);
}

function clearWindupRing(sprite: Phaser.Physics.Arcade.Sprite): void {
  (sprite.getData('warnRing') as Phaser.GameObjects.Arc | undefined)?.destroy();
  sprite.setData('warnRing', undefined);
}

// AI 對外依賴最小面：target/elapsedMs 為即時值（getter），其餘為 enemies.ts 內部管線回呼。
export interface EnemyUpdateContext {
  scene: Phaser.Scene;
  readonly target: EnemyTarget | null;
  readonly elapsedMs: number;
  viewCenterX(): number;
  pulseRing(x: number, y: number, radius: number, strokeTint: number): void;
  spawnBite(chompy: Phaser.Physics.Arcade.Sprite): void;
  popPuffy(sprite: Phaser.Physics.Arcade.Sprite): void;
  // v8（§52）：孢子雲區域拒止與迴旋殼刃，皆走 hazards 管線。
  spawnSporeCloud(x: number, y: number): void;
  spawnBoomerang(x: number, y: number, directionX: 1 | -1): void;
  // v11（§73）：splatta 拋物糖球（落地留灼燙糖斑），走 hazards 管線。
  spawnSugarBlob(x: number, y: number, directionX: 1 | -1): void;
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

// 孢子菇（§52）：定點紮根；週期時序由 enemyFsm 決策——windup 預警圈擴張、
// 週期滿向上噴孢子雲（滯留區域拒止走 hazards 管線）。
function updateSpora(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickSpora(sprite.getData('cycleMs') as number, deltaMs);
  sprite.setData('cycleMs', tick.sporaMs);
  if (tick.phase === 'burst') {
    clearWindupRing(sprite);
    sprite.clearTint();
    ctx.spawnSporeCloud(sprite.x, sprite.y + SPORA_FSM.cloudOffsetY);
    return;
  }
  if (tick.phase === 'windup') {
    // 預警圈於噴發位置先行擴張，脈衝前明確可讀（同 glowy 模式）。
    updateWindupRing(
      ctx,
      sprite,
      sprite.x,
      sprite.y + SPORA_FSM.cloudOffsetY,
      SPORA_RING,
      tick.progress,
    );
    sprite.setTint(Math.floor(tick.sporaMs / 100) % 2 === 0 ? 0xffffff : 0xbce8a0);
    return;
  }
  clearWindupRing(sprite);
  sprite.clearTint();
  // idle 呼吸：定點輕微擠壓律動（scale 由本狀態機持有，不掛 wobble tween）。
  const bsx = sprite.getData('baseSX') as number;
  const bsy = sprite.getData('baseSY') as number;
  const breath = Math.sin(ctx.elapsedMs * 0.003);
  sprite.setScale(bsx * (1 + breath * 0.04), bsy * (1 - breath * 0.03));
}

// 風飄鳥（§52）：四態時序由 enemyFsm 決策；drift 水平漂移＋正弦浮動、windup 懸停
// 抖動預警、dive 朝鎖定點高速撲擊、recover 回升原航高。側風推移由
// enemies.applyEnvironmentalForces 結算（GameScene 逐幀委派）。
function updateGusty(
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
  const tick = tickGusty(state, sprite.getData('stateMs') as number, deltaMs, shouldDive);
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
      break;
    }
    case 'windup': {
      // 前搖：懸停抖動預警。
      sprite.setRotation(Math.sin(tick.stateMs * 0.06) * 0.14);
      break;
    }
    case 'dive': {
      sprite.setRotation(Math.sign(body.velocity.x) * 0.22);
      break;
    }
    case 'recover': {
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

// 迴力殼（§52）：四態時序由 enemyFsm 決策；walk 緩速巡邏、windup 定身舉殼預警、
// throw 投擲迴旋殼刃（去而復返雙判定）、cool 冷卻。
function updateBoomy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const tick = tickBoomy(
    sprite.getData('state') as BoomyState,
    sprite.getData('stateMs') as number,
    deltaMs,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  if (tick.entered === 'windup') {
    body.setVelocityX(0);
  } else if (tick.entered === 'cool' || tick.entered === 'walk') {
    sprite.setRotation(0);
  }
  if (tick.state === 'throw') {
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    ctx.spawnBoomerang(sprite.x + direction * 20, sprite.y + BOOMY_THROW_OFFSET_Y, direction);
    return;
  }
  switch (tick.state) {
    case 'walk': {
      if (body.velocity.x === 0) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(BOOMY_WALK_SPEED * mul * direction);
      }
      sprite.setRotation(Math.sin(tick.stateMs * 0.008) * 0.06);
      break;
    }
    case 'windup': {
      // 前搖：定身舉殼抖動。
      sprite.setRotation(Math.sin(tick.stateMs * 0.05) * 0.16);
      break;
    }
    case 'cool': {
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 磁極獸（§59）：週期時序由 enemyFsm 決策——idle 緩行、windup 預警圈擴張、field 定身
// 磁場（環形視覺脈動＋星彈吸偏由 GameScene 逐幀結算；星彈免傷窗由 resolveMagnoStarHit 把關）。
function updateMagno(
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
function updateMirri(
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
      // 鏡面預告（telegraph）：roam 末段亮銀閃爍。
      if (tick.flickerBright) sprite.setTint(MIRRI_MIRROR_TINT);
      else sprite.clearTint();
      sprite.setRotation(Math.sin(tick.stateMs * 0.01) * 0.08);
      break;
    }
    case 'mirror': {
      // 鏡面態：定身亮銀＋高頻微顫（明確視覺）。
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

// 焦糖泡（§73）：四態時序由 enemyFsm 決策——submerged 壓扁露頂潛伏（免傷不可吸）、
// ripple 漣漪抖動 telegraph、leap 拋物躍出（可吸可傷窗，位移由 bubblaLeapOffsetY 導出
// 逐幀速度逼近，禁絕對座標直寫）、dive 壓回。定點怪：x 不動、重力關閉。
function updateBubbla(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  // 精英倍率（§48）：潛伏縮時提高躍出頻率（焦糖泡霸 ×1.5）。
  const tick = tickBubbla(
    sprite.getData('state') as BubblaState,
    sprite.getData('stateMs') as number,
    deltaMs,
    (sprite.getData('eliteMul') as number) ?? 1,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const bsx = sprite.getData('baseSX') as number;
  const bsy = sprite.getData('baseSY') as number;
  const baseY = sprite.getData('baseY') as number;
  if (tick.entered === 'leap') {
    playSfx('pop', 0.85);
    sprite.setScale(bsx, bsy);
    sprite.setAlpha(1);
  } else if (tick.entered === 'submerged') {
    body.setVelocity(0, 0);
  }
  switch (tick.state) {
    case 'submerged': {
      sprite.setScale(bsx * BUBBLA_SUNK_SCALE_X, bsy * BUBBLA_SUNK_SCALE_Y);
      sprite.setAlpha(0.85);
      body.setVelocity(0, 0);
      break;
    }
    case 'ripple': {
      // 漣漪 telegraph：抖動＋週期泡泡圈。
      sprite.setRotation(Math.sin(tick.stateMs * 0.06) * 0.1);
      if (tick.entered === 'ripple') {
        spawnTelegraph(ctx.scene, sprite.x, baseY + 10, BUBBLA_FSM.rippleMs);
      }
      break;
    }
    case 'leap': {
      // 拋物躍出：目標高度由純函式導出，速度逼近（單幀貼合，物理掃掠正常）。
      sprite.setRotation(0);
      const targetY = baseY + bubblaLeapOffsetY(tick.stateMs);
      body.setVelocity(0, ((targetY - sprite.y) * 1000) / Math.max(1, deltaMs));
      break;
    }
    case 'dive': {
      const targetY = baseY;
      body.setVelocity(0, ((targetY - sprite.y) * 1000) / Math.max(1, deltaMs));
      sprite.setAlpha(0.92);
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
  }
}

// 熔糖投手（§73）：四態時序由 enemyFsm 決策——patrol 緩走、aim 舉勺定身瞄準（著色
// telegraph）、lob 投擲拋物糖球（單幀事件態）、cool 冷卻。
function updateSplatta(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const mul = (sprite.getData('eliteMul') as number) ?? 1;
  // 精英倍率（§48）：巡邏/冷卻縮時提高拋射頻率（糖漿投擲隊長 ×1.5）。
  const tick = tickSplatta(
    sprite.getData('state') as SplattaState,
    sprite.getData('stateMs') as number,
    deltaMs,
    mul,
  );
  sprite.setData('state', tick.state);
  sprite.setData('stateMs', tick.stateMs);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (tick.entered === 'aim') {
    body.setVelocityX(0);
    sprite.setTint(SPLATTA_AIM_TINT);
  } else if (tick.entered === 'cool') {
    sprite.clearTint();
    const eliteTint = sprite.getData('eliteTint') as number | undefined;
    if (eliteTint !== undefined && sprite.getData('elite') === true) sprite.setTint(eliteTint);
    sprite.setRotation(0);
  }
  if (tick.state === 'lob') {
    const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
    ctx.spawnSugarBlob(sprite.x + direction * 18, sprite.y - 14, direction);
    return;
  }
  switch (tick.state) {
    case 'patrol': {
      if (body.velocity.x === 0 && body.blocked.down) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(SPLATTA_FSM.walkSpeed * mul * direction);
      }
      sprite.setRotation(Math.sin(tick.stateMs * 0.008) * 0.06);
      break;
    }
    case 'aim': {
      // 舉勺瞄準：定身後仰抖動。
      sprite.setRotation(Math.sin(tick.stateMs * 0.05) * 0.14 - 0.1);
      break;
    }
    case 'cool': {
      break;
    }
    default: {
      const exhaustive: never = tick.state;
      void exhaustive;
    }
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
    case 'spora': {
      updateSpora(ctx, sprite, deltaMs);
      break;
    }
    case 'gusty': {
      updateGusty(ctx, sprite, deltaMs);
      break;
    }
    case 'boomy': {
      updateBoomy(ctx, sprite, deltaMs);
      break;
    }
    case 'magno': {
      updateMagno(ctx, sprite, deltaMs);
      break;
    }
    case 'mirri': {
      updateMirri(ctx, sprite, deltaMs);
      break;
    }
    case 'bubbla': {
      updateBubbla(ctx, sprite, deltaMs);
      break;
    }
    case 'splatta': {
      updateSplatta(ctx, sprite, deltaMs);
      break;
    }
    case 'zappy': {
      // 放電週期時序由 enemyFsm 決策；此處僅結算呈現與物理。
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
      break;
    }
    default: {
      const exhaustive: never = kind;
      void exhaustive;
    }
  }
}
