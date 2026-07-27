import type Phaser from 'phaser';
import { MAGNO_FSM, tickMagno, tickMirri, type MirriState } from '../logic/enemyFsm';
import { playSfx } from '../audio/sfx';
import { setFacingFromVelocityX } from './enemyFacing';
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
