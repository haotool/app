import type Phaser from 'phaser';
import { acquirePooled } from '../core/poolFlags';
import type { StarFlavor } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { TransformForm } from '../core/types';
import {
  EMBER_DASH,
  TRANSFORM_FORMS,
  transformProgress,
  type FormShotSpec,
  type TransformFormSpec,
  type TransformState,
} from '../logic/transform';
import { playSfx } from '../audio/sfx';
import { FX_TEXTURES, attachTrail, burstSmall } from './fx';

// 形態呈現與攻擊彈發射（§57/§119）：自 player.ts 抽出（1200 行閘）——
// aura 粒子、變身環、護體視覺（泡泡盾/星體護衛）與偽星彈單一出口集中於此；
// 形態狀態機與輸入裁決仍由 player 持有。

const STAR_SIZE = 24;
// 護體視覺（§119）：潮化泡泡盾半徑；引力化星體護衛公轉軌道與角速度。
const BUBBLE_RADIUS_PX = 34;
const ORBIT_RADIUS_PX = 36;
const ORBIT_OMEGA = 0.004;
const ORBIT_STAR_PX = 14;

export interface FormShotLaunch {
  x: number;
  y: number;
  facing: 1 | -1;
  spec: FormShotSpec;
  tint: number;
  pitch: number;
  // 風刃扁身形（§57 沿用）：非扁身彈維持方形星體。
  flat?: boolean;
  trailLifespanMs: number;
  // 資料覆寫口（§57 風刃）：傷害/穿透/味別走呼叫端常數而非 spec（gale 零回歸）。
  damage?: number;
  pierceCount?: number;
  flavor?: StarFlavor;
}

export interface FormSkills {
  begin(form: TransformForm): void;
  end(form: TransformForm): void;
  // 逐幀呈現（§57/§119）：變身環倒數＋護體視覺（依 tuckLeft 畫泡泡盾或星體護衛）。
  draw(transform: TransformState, x: number, y: number, timeMs: number): void;
  launchShot(launch: FormShotLaunch): void;
  // 空中跳槽位機動（§119）：焰衝刺／鏡步瞬移——無對應語彙回 false（回落拍翅）。
  airMove(spec: TransformFormSpec, facing: 1 | -1): boolean;
  destroy(): void;
}

export function createFormSkills(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  stars: Phaser.Physics.Arcade.Group,
  tex: (key: string) => string,
): FormSkills {
  // 形態 aura（§57，池化）：七形態各一常駐 emitter（emitting=false），變身時僅啟用當前形態。
  const auraEmitters = {} as Record<TransformForm, Phaser.GameObjects.Particles.ParticleEmitter>;
  for (const form of Object.keys(TRANSFORM_FORMS) as TransformForm[]) {
    auraEmitters[form] = scene.add
      .particles(0, 0, FX_TEXTURES.star, {
        follow: sprite,
        speed: { min: 10, max: 40 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.75, end: 0 },
        lifespan: { min: 260, max: 420 },
        frequency: 70,
        blendMode: 'ADD',
        tint: TRANSFORM_FORMS[form].tint,
        emitting: false,
        maxAliveParticles: 14,
      })
      .setDepth(11);
  }

  // 變身環＋護體視覺（§57/§109/§119）：逐幀重繪。
  const gfx = scene.add.graphics().setDepth(95);

  function draw(transform: TransformState, x: number, y: number, timeMs: number): void {
    gfx.clear();
    if (!transform.form) return;
    const spec = TRANSFORM_FORMS[transform.form];
    gfx.lineStyle(4, spec.tint, 0.9);
    gfx.beginPath();
    gfx.arc(x, y - 44, 20, -Math.PI / 2, -Math.PI / 2 + transformProgress(transform) * Math.PI * 2);
    gfx.strokePath();
    if (transform.tuckLeft <= 0) return;
    if (transform.form === 'gravity') {
      // 星體護衛（§119）：剩餘次數＝繞身星體數，等分角公轉。
      gfx.fillStyle(spec.tint, 0.9);
      for (let i = 0; i < transform.tuckLeft; i += 1) {
        const angle = timeMs * ORBIT_OMEGA + (i * Math.PI * 2) / transform.tuckLeft;
        gfx.fillCircle(
          x + Math.cos(angle) * ORBIT_RADIUS_PX,
          y + Math.sin(angle) * ORBIT_RADIUS_PX,
          ORBIT_STAR_PX / 2,
        );
      }
      return;
    }
    if (transform.form === 'tide') {
      // 泡泡護盾（§119）：全身淡藍泡殼，受擊消耗即消失（consumeTuck 扣次）。
      gfx.lineStyle(3, spec.tint, 0.8);
      gfx.strokeCircle(x, y, BUBBLE_RADIUS_PX + Math.sin(timeMs * 0.006) * 2);
    }
  }

  // 形態攻擊彈單一出口（§57 風刃／§119 焰彈·稜片）：走 stars 池偽星彈，
  // 沿既有命中管線；burn 標記由命中端讀取（冰史萊姆熔解）。
  function launchShot(launch: FormShotLaunch): void {
    const { spec } = launch;
    for (let i = 0; i < spec.count; i += 1) {
      const star = acquirePooled(stars, launch.x, launch.y, tex('fx-star'));
      if (!star) return;
      star.setActive(true).setVisible(true);
      star.setDisplaySize(STAR_SIZE, launch.flat ? STAR_SIZE * 0.7 : STAR_SIZE);
      star.setTint(launch.tint);
      const body = star.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(launch.x, launch.y);
      star.setData('damage', launch.damage ?? spec.damage);
      star.setData('pierce', launch.pierceCount ?? spec.pierceCount);
      star.setData('flavor', launch.flavor ?? spec.flavor);
      star.setData('mix', null);
      star.setData('boomMs', null);
      star.setData('burn', spec.burn);
      star.setRotation(0);
      star.setData(
        'fxTrail',
        attachTrail(scene, star, { tint: launch.tint, lifespan: launch.trailLifespanMs }),
      );
      star.setVelocity(launch.facing * spec.speed, (i - (spec.count - 1) / 2) * spec.spreadVy);
    }
    emitGameEvent(scene.events, GameEvents.STAR_FIRED, {
      x: launch.x,
      y: launch.y,
      directionX: launch.facing,
      flavor: launch.flavor ?? spec.flavor,
      pitch: launch.pitch,
    });
  }

  // 空中機動（§119）：焰衝刺＝水平衝速＋微抬升；鏡步＝面向側短距瞬移（保留速度、
  // 夾限世界內）；兩者皆爆形態色星屑演出。
  function airMove(spec: TransformFormSpec, facing: 1 | -1): boolean {
    if (!spec.airDash && spec.blinkPx <= 0) return false;
    burstSmall(scene, sprite.x, sprite.y, spec.tint);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (spec.airDash) {
      body.setVelocity(facing * EMBER_DASH.speedX, EMBER_DASH.liftVy);
      playSfx('flap', 1.3);
      return true;
    }
    const bounds = scene.physics.world.bounds;
    const nextX = Math.min(
      bounds.right - 20,
      Math.max(bounds.x + 20, sprite.x + facing * spec.blinkPx),
    );
    const { x: vx, y: vy } = body.velocity;
    body.reset(nextX, sprite.y);
    body.setVelocity(vx, vy);
    playSfx('reveal', 1.2);
    return true;
  }

  return {
    begin(form) {
      auraEmitters[form].start();
    },
    end(form) {
      auraEmitters[form].stop();
    },
    draw,
    launchShot,
    airMove,
    destroy() {
      gfx.destroy();
      for (const emitter of Object.values(auraEmitters)) emitter.destroy();
    },
  };
}
