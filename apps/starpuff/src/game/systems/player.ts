import Phaser from 'phaser';
import {
  CHARGED_STAR,
  FORGIVENESS,
  INHALE,
  PLAYER,
  SLAM,
  STAR,
  STAR_FLAVORS,
  type MagazineSlot,
  type StarFlavor,
} from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { canInhale, knockbackVelocity, resolveHit, tickTimer } from '../logic/combat';
import {
  advanceStarstormHold,
  fillMagazine,
  popTopSlot,
  pushGoldStar,
  resolveActionPress,
  shouldFireOnRelease,
  starDamage,
  starPitch,
  starstormProgress,
  starstormReady,
  swallowIntoMagazine,
} from '../logic/skills';
import { playSfx } from '../audio/sfx';
import type { ControlsState } from './controls';
import { attachTrail, type TrailHandle } from './fx';

// 星彈命中結果：pierce 依剩餘穿透數決定續飛；absorb 一律回收（魔王或未死目標吃彈）。
export type StarHitMode = 'pierce' | 'absorb';

export interface PlayerHandle {
  sprite: Phaser.Physics.Arcade.Sprite;
  update(controls: ControlsState, deltaMs: number): void;
  takeDamage(damage: number, sourceX: number): void;
  heal(amount: number, hpCap: number): void;
  swallow(kind: EnemyKind): boolean;
  isInhaling(): boolean;
  getAmmoState(): { ammo: number; flavor: StarFlavor };
  getMagazine(): readonly MagazineSlot[];
  grantFullMagazine(): void;
  grantGoldStar(): void;
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
// §18 走路 bob：地面移動時輕微傾斜 + 縱向微彈（純視覺，不影響 hurtbox）。
const WALK_BOB_OMEGA = 0.02;
const WALK_TILT_RAD = 0.05;
const WALK_BOB_PX = 3;
// §18 落地塵埃圈：著地速度 >300 觸發。
const DUST_FALL_SPEED = 300;
// §20 星彈拖尾：疾風星拖尾加長 ×1.6，其餘維持基準長度；tint 依屬性表上色。
const TRAIL_LIFESPAN_MS = 260;
const WIND_TRAIL_LIFESPAN_MS = TRAIL_LIFESPAN_MS * 1.6;

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
  // 槽位彈匣（§23）：後進先出；lastFlavor 供空匣時顯示前值（§20 語意保留）。
  let magazine: readonly MagazineSlot[] = [];
  let lastFlavor: StarFlavor = 'jelly';
  let facing: 1 | -1 = 1;
  let flapsUsed = 0;
  let invulnerableMs = 0;
  let hurtLockMs = 0;
  let actionHoldMs = 0;
  let coyoteMs = 0;
  let jumpBufferMs = 0;
  let inhaling = false;
  let wasOnGround = false;
  let walkMs = 0;
  let lastVy = 0;
  let pose: Pose = 'hero-idle';
  // 技能狀態（§23）：滿匣延遲發射旗標、星暴充能、下衝擊 CD。
  let deferredFire = false;
  let stormHoldMs = 0;
  let slamming = false;
  let slamCdMs = 0;

  // 走路 bob 視覺 y 偏移（US-022 / recon 硬規則 10）：不動 displayOrigin、不污染物理。
  // POST_UPDATE（物理回寫後）套用偏移供渲染，下一幀 PRE_UPDATE（物理讀取前）復原。
  let bobOffset = 0;
  const applyBob = () => {
    sprite.y -= bobOffset;
  };
  const revertBob = () => {
    sprite.y += bobOffset;
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, applyBob);
  scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, revertBob);

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

  // 落地塵埃圈：腳邊白描邊橢圓擴散淡出（graphics 組合，不依賴 fx.ts）。
  // intensity > 1 為下衝擊加強版：更大擴散 + 更粗描邊。
  const spawnDustRing = (intensity = 1) => {
    const ring = scene.add
      .ellipse(sprite.x, sprite.y + PLAYER_SIZE / 2 - 4, 26, 10)
      .setStrokeStyle(3 * intensity, 0xffffff, 0.7);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.4 * intensity,
      scaleY: 1.8 * intensity,
      alpha: 0,
      duration: 320 * intensity,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  };

  // 星暴進度環（§23）：玩家頭頂充能弧線，逐幀重繪。
  const stormRing = scene.add.graphics().setDepth(95);
  const drawStormRing = () => {
    stormRing.clear();
    const progress = starstormProgress(stormHoldMs);
    if (progress <= 0) return;
    stormRing.lineStyle(4, 0xffd966, 0.9);
    stormRing.beginPath();
    stormRing.arc(sprite.x, sprite.y - 44, 16, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    stormRing.strokePath();
  };

  const recycleStar = (star: Phaser.Physics.Arcade.Sprite) => {
    (star.getData('fxTrail') as TrailHandle | undefined)?.stop();
    star.setData('fxTrail', undefined);
    star.setActive(false).setVisible(false);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  };

  const emitAmmo = () => {
    emitGameEvent(scene.events, GameEvents.AMMO_CHANGED, {
      ammo: magazine.length,
      maxAmmo: STAR.maxAmmo,
      flavor: magazine[magazine.length - 1]?.flavor ?? lastFlavor,
      magazine,
    });
  };

  // 後進先出發射（§23）：頂槽決定屬性；強化/金星放大尺寸並套金邊 tint。
  const fireStar = () => {
    const popped = popTopSlot(magazine);
    const slot = popped.slot;
    if (!slot) return;
    const spec = STAR_FLAVORS[slot.flavor];
    const fx = sprite.x + facing * (PLAYER_SIZE / 2 + 8);
    const star = stars.get(fx, sprite.y, tex('fx-star')) as Phaser.Physics.Arcade.Sprite | null;
    if (!star) return;
    magazine = popped.magazine;
    lastFlavor = slot.flavor;
    const boosted = slot.charged || slot.gold;
    const size = boosted ? STAR_SIZE * CHARGED_STAR.sizeMultiplier : STAR_SIZE;
    star.setActive(true).setVisible(true);
    star.setDisplaySize(size, size);
    // 標準星保留原金黃星彈藝術；疾風/爆裂依屬性上色；強化/金星套金邊 tint。
    if (boosted) star.setTint(CHARGED_STAR.tint);
    else if (slot.flavor === 'jelly') star.clearTint();
    else star.setTint(spec.tint);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(fx, sprite.y);
    star.setData('damage', starDamage(slot));
    star.setData('pierce', spec.pierceCount);
    star.setData('flavor', slot.flavor);
    star.setData(
      'fxTrail',
      attachTrail(scene, star, {
        tint: boosted ? CHARGED_STAR.tint : spec.tint,
        lifespan: slot.flavor === 'floaty' ? WIND_TRAIL_LIFESPAN_MS : TRAIL_LIFESPAN_MS,
      }),
    );
    star.setVelocityX(facing * spec.speed);
    emitAmmo();
    emitGameEvent(scene.events, GameEvents.STAR_FIRED, {
      x: fx,
      y: sprite.y,
      directionX: facing,
      flavor: slot.flavor,
      pitch: starPitch(slot),
    });
  };

  // 下衝擊（§23）：即刻快速下墜；落地結算於 update 的著地分支。
  const startSlam = () => {
    slamming = true;
    sprite.setVelocityY(SLAM.fallVelocityY);
    squashStretch(0.8, 1.3);
  };

  return {
    sprite,
    update(controls: ControlsState, deltaMs: number) {
      invulnerableMs = tickTimer(invulnerableMs, deltaMs);
      hurtLockMs = tickTimer(hurtLockMs, deltaMs);
      slamCdMs = tickTimer(slamCdMs, deltaMs);

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround) {
        flapsUsed = 0;
        coyoteMs = FORGIVENESS.coyoteMs;
      } else {
        coyoteMs = tickTimer(coyoteMs, deltaMs);
      }
      jumpBufferMs = tickTimer(jumpBufferMs, deltaMs);
      if (onGround && !wasOnGround) {
        squashStretch(1.25, 0.75);
        // 下衝擊著地（§23）：加強塵埃 + 專屬音 + 事件交 GameScene 結算衝擊波。
        if (slamming) {
          slamming = false;
          slamCdMs = SLAM.cooldownMs;
          spawnDustRing(1.8);
          playSfx('slam-down');
          emitGameEvent(scene.events, GameEvents.SKILL_SLAM_LANDED, {
            x: sprite.x,
            y: sprite.y,
          });
        } else if (lastVy > DUST_FALL_SPEED) spawnDustRing();
      }
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

        // B 鍵決策（§23）：空中 down+B 下衝擊；滿匣延遲至放開結算（點按發射 vs 長按星暴）。
        if (controls.actionPressed) {
          const command = resolveActionPress({
            airborne: !onGround,
            down: controls.down,
            slamCooldownMs: slamCdMs,
            ammo: magazine.length,
          });
          if (command === 'slam') startSlam();
          else if (command === 'fire') fireStar();
          else if (command === 'defer') deferredFire = true;
        }
      }

      // 滿匣點按（<150ms）於放開時發射；長按則交給吸入或星暴。
      if (!controls.actionHeld) {
        if (deferredFire && hurtLockMs <= 0 && shouldFireOnRelease(actionHoldMs)) fireStar();
        deferredFire = false;
      }

      // 星暴充能（§23）：滿匣長按 0.8s 觸發；清空彈匣，世界結算交 GameScene。
      stormHoldMs = advanceStarstormHold(
        stormHoldMs,
        deltaMs,
        controls.actionHeld,
        magazine.length >= STAR.maxAmmo,
      );
      if (starstormReady(stormHoldMs)) {
        stormHoldMs = 0;
        deferredFire = false;
        magazine = [];
        emitAmmo();
        playSfx('starstorm');
        emitGameEvent(scene.events, GameEvents.SKILL_STARSTORM, { x: sprite.x, y: sprite.y });
      }
      drawStormRing();

      actionHoldMs = controls.actionHeld ? actionHoldMs + deltaMs : 0;
      inhaling = actionHoldMs >= INHALE.holdThresholdMs;
      zoneBody.enable = inhaling;
      zone.setPosition(sprite.x + facing * (INHALE.rangePx / 2), sprite.y);

      sprite.setFlipX(facing === -1);
      sprite.setAlpha(
        invulnerableMs > 0 && Math.floor(invulnerableMs / BLINK_INTERVAL_MS) % 2 === 0 ? 0.35 : 1,
      );

      // 走路 bob：|sin| 造雙頻小彈跳，傾斜隨面向擺動；停走或離地即復位。
      // bob 僅寫入視覺 y 偏移（PRE/POST_UPDATE 掛鉤），與 squash 的 scale 通道互不干涉。
      if (onGround && body.velocity.x !== 0) {
        walkMs += deltaMs;
        const wave = Math.sin(walkMs * WALK_BOB_OMEGA);
        sprite.setRotation(facing * wave * WALK_TILT_RAD);
        bobOffset = Math.abs(wave) * WALK_BOB_PX;
      } else if (walkMs !== 0) {
        walkMs = 0;
        sprite.setRotation(0);
        bobOffset = 0;
      }
      lastVy = body.velocity.y;

      if (invulnerableMs > 0) setPose('hero-hurt');
      else if (controls.actionHeld && magazine.length === 0) setPose('hero-inhale');
      else if (magazine.length > 0) setPose('hero-puffed');
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
    heal(amount: number, hpCap: number) {
      const next = Math.min(hpCap, hp + amount);
      if (next === hp) return;
      hp = next;
      emitGameEvent(scene.events, GameEvents.PLAYER_HEALED, { hp, maxHp: hpCap });
    },
    swallow(kind: EnemyKind) {
      if (!canInhale(kind)) return false;
      const result = swallowIntoMagazine(magazine, kind);
      magazine = result.magazine;
      lastFlavor = kind;
      // 連吞升級（§23）：強化音效；金邊視覺由 HUD 與發射端依槽位狀態呈現。
      if (result.charged) playSfx('charge');
      emitGameEvent(scene.events, GameEvents.ENEMY_INHALED, { kind });
      emitAmmo();
      return true;
    },
    isInhaling() {
      return inhaling;
    },
    getAmmoState() {
      return {
        ammo: magazine.length,
        flavor: magazine[magazine.length - 1]?.flavor ?? lastFlavor,
      };
    },
    getMagazine() {
      return magazine;
    },
    grantFullMagazine() {
      magazine = fillMagazine(magazine);
      emitAmmo();
    },
    grantGoldStar() {
      magazine = pushGoldStar(magazine);
      emitAmmo();
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
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, applyBob);
      scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, revertBob);
      scene.tweens.killTweensOf(sprite);
      stormRing.destroy();
      sprite.destroy();
      zone.destroy();
      stars.destroy(true);
    },
  };
}
