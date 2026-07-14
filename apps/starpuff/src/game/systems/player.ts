import type Phaser from 'phaser';
import { FORGIVENESS, INHALE, PLAYER, STAR } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale, clampAmmo, knockbackVelocity, resolveHit, tickTimer } from '../logic/combat';
import type { ControlsState } from './controls';

// 星彈命中結果：pierce 依剩餘穿透數決定續飛；absorb 一律回收（魔王或未死目標吃彈）。
export type StarHitMode = 'pierce' | 'absorb';

export interface PlayerHandle {
  sprite: Phaser.Physics.Arcade.Sprite;
  update(controls: ControlsState, deltaMs: number): void;
  takeDamage(damage: number, sourceX: number): void;
  swallow(kind: EnemyKind): boolean;
  isInhaling(): boolean;
  getFacing(): 1 | -1;
  getInhaleZone(): Phaser.GameObjects.Zone;
  getStars(): Phaser.Physics.Arcade.Group;
  onStarHit(star: Phaser.GameObjects.GameObject, mode: StarHitMode): void;
  destroy(): void;
}

type Pose = 'hero-idle' | 'hero-inhale' | 'hero-puffed' | 'hero-hurt';

const PLAYER_SIZE = 48;
const STAR_SIZE = 24;
const KNOCKBACK_SPEED = 234;
const KNOCKBACK_LIFT = -286;
const BLINK_INTERVAL_MS = 100;

export function createPlayer(scene: Phaser.Scene, x: number, y: number): PlayerHandle {
  // art stream 紋理未載入時退回內建白色矩形，避免本地驗證噴 missing texture。
  const tex = (key: string) => (scene.textures.exists(key) ? key : '__WHITE');
  const sprite = scene.physics.add.sprite(x, y, tex('hero-idle'));
  sprite.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
  sprite.setCollideWorldBounds(true);
  const baseScaleX = sprite.scaleX;
  const baseScaleY = sprite.scaleY;

  // 寬容度 hurtbox（§15.1）：視覺 75%W×80%H，貼齊腳底（setSize 以未縮放 frame 像素為單位）。
  {
    const frameW = sprite.frame.realWidth;
    const frameH = sprite.frame.realHeight;
    const hurtW = frameW * FORGIVENESS.hurtboxWidthRatio;
    const hurtH = frameH * FORGIVENESS.hurtboxHeightRatio;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(hurtW, hurtH, false);
    body.setOffset((frameW - hurtW) / 2, frameH - hurtH);
  }

  // 吸入判定區：面向錐形的廣域矩形，精確錐形由 combat.isInInhaleRange 收斂。
  const zone = scene.add.zone(x, y, INHALE.rangePx, INHALE.rangePx);
  scene.physics.add.existing(zone);
  const zoneBody = zone.body as Phaser.Physics.Arcade.Body;
  zoneBody.setAllowGravity(false);
  zoneBody.enable = false;

  const stars = scene.physics.add.group({
    defaultKey: tex('fx-star'),
    maxSize: 8,
    allowGravity: false,
  });

  let hp: number = PLAYER.maxHp;
  let ammo = 0;
  let facing: 1 | -1 = 1;
  let flapsUsed = 0;
  let invulnerableMs = 0;
  let hurtLockMs = 0;
  let actionHoldMs = 0;
  let coyoteMs = 0;
  let jumpBufferMs = 0;
  let inhaling = false;
  let wasOnGround = false;
  let pose: Pose = 'hero-idle';

  const setPose = (next: Pose) => {
    if (pose === next) return;
    pose = next;
    sprite.setTexture(tex(next));
  };

  // squash/stretch：先瞬間變形，再 tween 回基準比例。
  const squashStretch = (sx: number, sy: number) => {
    scene.tweens.killTweensOf(sprite);
    sprite.setScale(baseScaleX * sx, baseScaleY * sy);
    scene.tweens.add({
      targets: sprite,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      duration: 160,
      ease: 'Back.easeOut',
    });
  };

  const recycleStar = (star: Phaser.Physics.Arcade.Sprite) => {
    star.setActive(false).setVisible(false);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  };

  const fireStar = () => {
    const fx = sprite.x + facing * (PLAYER_SIZE / 2 + 8);
    const star = stars.get(fx, sprite.y, tex('fx-star')) as Phaser.Physics.Arcade.Sprite | null;
    if (!star) return;
    star.setActive(true).setVisible(true);
    star.setDisplaySize(STAR_SIZE, STAR_SIZE);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(fx, sprite.y);
    star.setData('pierce', STAR.pierceCount);
    star.setVelocityX(facing * STAR.speed);
    ammo = clampAmmo(ammo - 1, STAR.maxAmmo);
    emitGameEvent(scene.events, GameEvents.AMMO_CHANGED, { ammo, maxAmmo: STAR.maxAmmo });
    emitGameEvent(scene.events, GameEvents.STAR_FIRED, {
      x: fx,
      y: sprite.y,
      directionX: facing,
    });
  };

  return {
    sprite,
    update(controls: ControlsState, deltaMs: number) {
      invulnerableMs = tickTimer(invulnerableMs, deltaMs);
      hurtLockMs = tickTimer(hurtLockMs, deltaMs);

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround) {
        flapsUsed = 0;
        coyoteMs = FORGIVENESS.coyoteMs;
      } else {
        coyoteMs = tickTimer(coyoteMs, deltaMs);
      }
      jumpBufferMs = tickTimer(jumpBufferMs, deltaMs);
      if (onGround && !wasOnGround) squashStretch(1.25, 0.75);
      wasOnGround = onGround;

      if (hurtLockMs <= 0) {
        if (controls.left) {
          sprite.setVelocityX(-PLAYER.moveSpeed);
          facing = -1;
        } else if (controls.right) {
          sprite.setVelocityX(PLAYER.moveSpeed);
          facing = 1;
        } else {
          sprite.setVelocityX(0);
        }

        // 寬容度（§15.1）：coyote 期內離台仍可起跳；提前按跳以 buffer 落地即跳。
        const wantsJump = controls.jumpPressed || (onGround && jumpBufferMs > 0);
        if (wantsJump) {
          if (onGround || coyoteMs > 0) {
            coyoteMs = 0;
            jumpBufferMs = 0;
            sprite.setVelocityY(PLAYER.jumpVelocity);
            squashStretch(0.8, 1.25);
          } else if (controls.jumpPressed && flapsUsed < PLAYER.maxFlaps) {
            flapsUsed += 1;
            sprite.setVelocityY(PLAYER.floatLift);
            squashStretch(0.9, 1.12);
          } else if (controls.jumpPressed) {
            jumpBufferMs = FORGIVENESS.jumpBufferMs;
          }
        }

        if (controls.actionPressed && ammo > 0) fireStar();
      }

      actionHoldMs = controls.actionHeld ? actionHoldMs + deltaMs : 0;
      inhaling = actionHoldMs >= INHALE.holdThresholdMs;
      zoneBody.enable = inhaling;
      zone.setPosition(sprite.x + facing * (INHALE.rangePx / 2), sprite.y);

      sprite.setFlipX(facing === -1);
      sprite.setAlpha(
        invulnerableMs > 0 && Math.floor(invulnerableMs / BLINK_INTERVAL_MS) % 2 === 0 ? 0.35 : 1,
      );

      if (invulnerableMs > 0) setPose('hero-hurt');
      else if (controls.actionHeld && ammo === 0) setPose('hero-inhale');
      else if (ammo > 0) setPose('hero-puffed');
      else setPose('hero-idle');

      // 卷軸世界以相機視野為界回收星彈。
      const view = scene.cameras.main.worldView;
      for (const child of stars.getChildren()) {
        const star = child as Phaser.Physics.Arcade.Sprite;
        if (star.active && (star.x < view.x - 40 || star.x > view.right + 40)) recycleStar(star);
      }
    },
    takeDamage(damage: number, sourceX: number) {
      const result = resolveHit(hp, invulnerableMs, damage, PLAYER.invulnerableMs);
      if (!result.damaged) return;
      hp = result.hp;
      invulnerableMs = result.invulnerableMs;
      hurtLockMs = FORGIVENESS.hurtLockMs;
      const kb = knockbackVelocity(sprite.x, sourceX, KNOCKBACK_SPEED, KNOCKBACK_LIFT);
      sprite.setVelocity(kb.x, kb.y);
      emitGameEvent(scene.events, GameEvents.PLAYER_DAMAGED, {
        hp,
        maxHp: PLAYER.maxHp,
        damage,
      });
      if (hp <= 0) {
        emitGameEvent(scene.events, GameEvents.PLAYER_DIED, { x: sprite.x, y: sprite.y });
      }
    },
    swallow(kind: EnemyKind) {
      if (!canInhale(kind)) return false;
      ammo = clampAmmo(ammo + 1, STAR.maxAmmo);
      emitGameEvent(scene.events, GameEvents.ENEMY_INHALED, { kind });
      emitGameEvent(scene.events, GameEvents.AMMO_CHANGED, { ammo, maxAmmo: STAR.maxAmmo });
      return true;
    },
    isInhaling() {
      return inhaling;
    },
    getFacing() {
      return facing;
    },
    getInhaleZone() {
      return zone;
    },
    getStars() {
      return stars;
    },
    onStarHit(star: Phaser.GameObjects.GameObject, mode: StarHitMode) {
      const s = star as Phaser.Physics.Arcade.Sprite;
      if (mode === 'absorb') {
        recycleStar(s);
        return;
      }
      const pierceLeft = (s.getData('pierce') as number) ?? 0;
      if (pierceLeft > 0) s.setData('pierce', pierceLeft - 1);
      else recycleStar(s);
    },
    destroy() {
      scene.tweens.killTweensOf(sprite);
      sprite.destroy();
      zone.destroy();
      stars.destroy(true);
    },
  };
}
