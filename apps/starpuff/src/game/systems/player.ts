import type Phaser from 'phaser';
import { INHALE, PLAYER, STAR } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale, clampAmmo, knockbackVelocity, resolveHit, tickTimer } from '../logic/combat';
import type { ControlsState } from './controls';

export type StarTarget = 'minion' | 'boss';

export interface PlayerHandle {
  sprite: Phaser.Physics.Arcade.Sprite;
  update(controls: ControlsState, deltaMs: number): void;
  takeDamage(damage: number, sourceX: number): void;
  swallow(kind: EnemyKind): boolean;
  isInhaling(): boolean;
  getFacing(): 1 | -1;
  getInhaleZone(): Phaser.GameObjects.Zone;
  getStars(): Phaser.Physics.Arcade.Group;
  onStarHit(star: Phaser.GameObjects.GameObject, target: StarTarget): void;
  destroy(): void;
}

type Pose = 'hero-idle' | 'hero-inhale' | 'hero-puffed' | 'hero-hurt';

const PLAYER_SIZE = 48;
const STAR_SIZE = 24;
const KNOCKBACK_SPEED = 234;
const KNOCKBACK_LIFT = -286;
const HURT_LOCK_MS = 250;
const BLINK_INTERVAL_MS = 100;

export function createPlayer(scene: Phaser.Scene, x: number, y: number): PlayerHandle {
  // art stream 紋理未載入時退回內建白色矩形，避免本地驗證噴 missing texture。
  const tex = (key: string) => (scene.textures.exists(key) ? key : '__WHITE');
  const sprite = scene.physics.add.sprite(x, y, tex('hero-idle'));
  sprite.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
  sprite.setCollideWorldBounds(true);
  const baseScaleX = sprite.scaleX;
  const baseScaleY = sprite.scaleY;

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
      if (onGround) flapsUsed = 0;
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

        if (controls.jumpPressed) {
          if (onGround) {
            sprite.setVelocityY(PLAYER.jumpVelocity);
            squashStretch(0.8, 1.25);
          } else if (flapsUsed < PLAYER.maxFlaps) {
            flapsUsed += 1;
            sprite.setVelocityY(PLAYER.floatLift);
            squashStretch(0.9, 1.12);
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
      hurtLockMs = HURT_LOCK_MS;
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
    onStarHit(star: Phaser.GameObjects.GameObject, target: StarTarget) {
      const s = star as Phaser.Physics.Arcade.Sprite;
      if (target === 'boss') {
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
