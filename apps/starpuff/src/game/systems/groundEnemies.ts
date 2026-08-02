import Phaser from 'phaser';
import {
  BUBBLA_FSM,
  SHELLY_FSM,
  SPLATTA_FSM,
  SPORA_FSM,
  bubblaLeapOffsetY,
  tickBoomy,
  tickBubbla,
  tickDrilly,
  tickShelly,
  tickSplatta,
  tickSpora,
  type BoomyState,
  type BubblaState,
  type DrillyState,
  type ShellyState,
  type SplattaState,
} from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import { setFacingBySign, setFacingFromVelocityX, setFacingTowardX } from './enemyFacing';
import { clearWindupRing, updateWindupRing, type WindupRingSpec } from './enemyWindupRing';
import { spawnTelegraph } from './fx';
import type { EnemyUpdateContext } from './enemyUpdates';

// 地面走動／定點據點系小怪 per-kind 逐幀 AI（GAME_DESIGN §16/§30/§47/§52/§73）：
// 自 enemyUpdates.ts 機械式搬移（W3 前置 1200 行閘分檔），行為零改變；時序由
// logic/enemyFsm 決策，此處只負責呈現層；生成/傷害/回收經 ctx 回呼銜接（enemies.ts 持有池）。

// chompy：進 120px 前搖 0.4s → 咬合 0.3s → 冷卻 1.2s（§16）；
// BITE 時長同為咬合 hitbox 存活時間（enemies.spawnBite 引用）。
const CHOMPY_TRIGGER_PX = 120;
const CHOMPY_WINDUP_MS = 400;
export const CHOMPY_BITE_MS = 300;
const CHOMPY_COOL_MS = 1200;
// shelly：巡邏走動；首發受擊 → 縮殼旋轉衝刺 0.9s（無敵、碰牆反彈）→ 暈眩 2.2s 可吸可殺。
// 速度與三態時序皆由 logic/enemyFsm.ts 決策；此處只保留相容性別名與呈現層參數。
export const SHELLY_WALK_SPEED = SHELLY_FSM.walkSpeedPxPerSec;
export const SHELLY_SPIN_SPEED = SHELLY_FSM.spinSpeedPxPerSec;
const SHELLY_SPIN_OMEGA = 0.02;
export const SHELLY_SHELL_SCALE = 0.82;
const SHELLY_WADDLE_OMEGA = 0.008;
const SHELLY_WADDLE_RAD = 0.08;
// #811 暈眩視覺：頭頂眩星公轉軌道與殼體閃白節拍（形狀＋明滅雙訊號，色弱不依賴 tint）。
const SHELLY_STUN_STAR_OFFSET_Y = 34;
const SHELLY_STUN_STAR_ORBIT_X = 14;
const SHELLY_STUN_STAR_ORBIT_Y = 5;
const SHELLY_STUN_STAR_OMEGA = 0.008;
const SHELLY_STUN_FLASH_MS = 130;

// drilly（§47）：潛地追擊 90px/s、僅露鰭（壓扁貼地）；破土躍出 -360。
const DRILLY_BURROW_SPEED = 90;
const DRILLY_EMERGE_VY = -360;
const DRILLY_FIN_SCALE_X = 0.55;
const DRILLY_FIN_SCALE_Y = 0.3;
// 前搖落點預警的腳底偏移：本體 40px × 0.32。
const DRILLY_TELEGRAPH_OFFSET_Y = 12.8;
// boomy（§52）：巡邏走速與殼刃投擲高度偏移。
const BOOMY_WALK_SPEED = 55;
const BOOMY_THROW_OFFSET_Y = -6;
// bubbla（§73）：潛伏露頂壓扁比例（沿 drilly 半入地慣例）與漣漪前搖抖動。
const BUBBLA_SUNK_SCALE_X = 0.7;
const BUBBLA_SUNK_SCALE_Y = 0.35;
// splatta（§73）：舉勺瞄準著色。
const SPLATTA_AIM_TINT = 0xf0c890;

type ChompyState = 'idle' | 'windup' | 'bite' | 'cool';

const SPORA_RING: WindupRingSpec = {
  radius: SPORA_FSM.cloudRadiusPx,
  fill: 0xbce8a0,
  fillAlpha: 0.1,
  stroke: 0xa8d8a0,
  strokeAlpha: 0.85,
};

// 三態時序由 enemyFsm 決策；本函式只負責呈現層（速度、旋轉、著色、縮放復原）。
export function updateShelly(
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
    // #811 暈眩視覺：頭頂眩星（掛 warnRing 槽——池回收/擊殺/吞下路徑既有清理）。
    const star = ctx.scene.add
      .image(sprite.x, sprite.y - SHELLY_STUN_STAR_OFFSET_Y, 'fx-star')
      .setDisplaySize(16, 16)
      .setDepth(59);
    sprite.setData('warnRing', star);
    return;
  }
  if (tick.entered === 'walk') {
    // 暈眩期滿：復原外觀回巡邏（眩星回收、tint 模式復位）。
    clearWindupRing(sprite);
    sprite.setTintMode(Phaser.TintModes.MULTIPLY);
    sprite.clearTint();
    sprite.setRotation(0);
    const bsx = sprite.getData('baseSX') as number;
    const bsy = sprite.getData('baseSY') as number;
    // 縮殼復原（§77 解耦）：造型回種基準走物理基準。
    ctx.vscale.setBase(sprite, bsx, bsy);
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
      // 殼化小怪的物理反彈會改變 velocity；每幀同步視覺朝向，避免只在停住時才轉向。
      setFacingFromVelocityX(sprite, body.velocity.x);
      sprite.setRotation(Math.sin(tick.stateMs * SHELLY_WADDLE_OMEGA) * SHELLY_WADDLE_RAD);
      break;
    }
    case 'spin': {
      if (body.velocity.x === 0) body.setVelocityX(SHELLY_SPIN_SPEED);
      setFacingFromVelocityX(sprite, body.velocity.x);
      sprite.rotation += Math.sign(body.velocity.x) * SHELLY_SPIN_OMEGA * deltaMs;
      break;
    }
    case 'stun': {
      // 暈眩 2.2s（可吸/可擊殺）：昏沉搖擺＋閃白脈動＋眩星繞頭公轉。
      sprite.setRotation(Math.sin(tick.stateMs * 0.02) * 0.25);
      const bright = Math.floor(tick.stateMs / SHELLY_STUN_FLASH_MS) % 2 === 0;
      sprite.setTintMode(bright ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY);
      sprite.setTint(bright ? 0xffffff : 0xcfcfcf);
      const star = sprite.getData('warnRing') as Phaser.GameObjects.Image | undefined;
      star?.setPosition(
        sprite.x + Math.cos(tick.stateMs * SHELLY_STUN_STAR_OMEGA) * SHELLY_STUN_STAR_ORBIT_X,
        sprite.y -
          SHELLY_STUN_STAR_OFFSET_Y +
          Math.sin(tick.stateMs * SHELLY_STUN_STAR_OMEGA) * SHELLY_STUN_STAR_ORBIT_Y,
      );
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
export function updateDrilly(
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
    ctx.vscale.setBase(sprite, bsx, bsy);
    sprite.setAlpha(1);
    body.setVelocity(0, DRILLY_EMERGE_VY);
    // 破土躍出瞬間面向攻擊對象；躍出後僵直期維持此朝向。
    if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
  } else if (tick.entered === 'burrow') {
    body.setVelocityX(0);
  }
  switch (tick.state) {
    case 'burrow': {
      // 僅露鰭：壓扁貼地半透明（狀態性造型走物理基準——碰撞體同步壓扁貼地），
      // 朝玩家 x 潛行。
      ctx.vscale.setBase(sprite, bsx * DRILLY_FIN_SCALE_X, bsy * DRILLY_FIN_SCALE_Y);
      sprite.setAlpha(0.85);
      if (body.blocked.down) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(DRILLY_BURROW_SPEED * direction);
      }
      setFacingFromVelocityX(sprite, body.velocity.x);
      break;
    }
    case 'windup': {
      // 前搖：定點鰭抖動，面向破土攻擊對象。
      if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
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

// 孢子菇（§52）：定點紮根；週期時序由 enemyFsm 決策——windup 預警圈擴張、
// 週期滿向上噴孢子雲（滯留區域拒止走 hazards 管線）。
export function updateSpora(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  // 紮根＝每幀清速（#841 審查收斂）：非 immovable 後外力（下砸 AoE 推移、
  // 吸力彈開殘速）會殘餘滑行——定點語意由此單點維持，全相位一致。
  (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
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
  // idle 呼吸：定點輕微擠壓律動（mod 逐幀直寫，物理箱不動；不掛 wobble tween）。
  const breath = Math.sin(ctx.elapsedMs * 0.003);
  const breathMod = ctx.vscale.mod(sprite);
  breathMod.sx = 1 + breath * 0.04;
  breathMod.sy = 1 - breath * 0.03;
}

// 迴力殼（§52）：四態時序由 enemyFsm 決策；walk 緩速巡邏、windup 定身舉殼預警、
// throw 投擲迴旋殼刃（去而復返雙判定）、cool 冷卻。
export function updateBoomy(
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
    // 投擲瞬間面向與迴旋殼刃射向一致；cool 冷卻期凍結維持此朝向。
    setFacingBySign(sprite, direction);
    ctx.spawnBoomerang(sprite.x + direction * 20, sprite.y + BOOMY_THROW_OFFSET_Y, direction);
    return;
  }
  switch (tick.state) {
    case 'walk': {
      if (body.velocity.x === 0) {
        const direction = ctx.target && ctx.target.x < sprite.x ? -1 : 1;
        body.setVelocityX(BOOMY_WALK_SPEED * mul * direction);
      }
      setFacingFromVelocityX(sprite, body.velocity.x);
      sprite.setRotation(Math.sin(tick.stateMs * 0.008) * 0.06);
      break;
    }
    case 'windup': {
      // 前搖：定身舉殼抖動，面向投擲目標（throw 的射向即朝目標側）。
      if (ctx.target) setFacingTowardX(sprite, ctx.target.x);
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

// 焦糖泡（§73）：四態時序由 enemyFsm 決策——submerged 壓扁露頂潛伏（免傷不可吸）、
// ripple 漣漪抖動 telegraph、leap 拋物躍出（可吸可傷窗，位移由 bubblaLeapOffsetY 導出
// 逐幀速度逼近，禁絕對座標直寫）、dive 壓回。定點怪：x 不動、重力關閉。
export function updateBubbla(
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
    ctx.vscale.setBase(sprite, bsx, bsy);
    sprite.setAlpha(1);
  } else if (tick.entered === 'submerged') {
    body.setVelocity(0, 0);
  }
  switch (tick.state) {
    case 'submerged': {
      // 半潛壓扁為狀態性造型：走物理基準（§77 解耦）。
      ctx.vscale.setBase(sprite, bsx * BUBBLA_SUNK_SCALE_X, bsy * BUBBLA_SUNK_SCALE_Y);
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
export function updateSplatta(
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

export function updateChompy(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  deltaMs: number,
): void {
  const state = sprite.getData('state') as ChompyState;
  const stateMs = (sprite.getData('stateMs') as number) + deltaMs;
  sprite.setData('stateMs', stateMs);
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
        // 張嘴 squash 蓄力（fx 代理，物理箱不動）。
        ctx.vscale.resetFx(sprite);
        ctx.scene.tweens.add({
          targets: ctx.vscale.fx(sprite),
          sx: 1.2,
          sy: 0.78,
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
      // 咬合回彈（fx 代理）：先復位再彈（物理箱不動）。
      ctx.vscale.resetFx(sprite);
      ctx.scene.tweens.add({
        targets: ctx.vscale.fx(sprite),
        sx: 0.9,
        sy: 1.22,
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
