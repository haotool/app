import Phaser from 'phaser';
import {
  BOOMERANG,
  CHARGED_STAR,
  FORGIVENESS,
  INHALE,
  PLAYER,
  SCATTER_FAN_VY,
  SLAM,
  STAR,
  STARSTORM,
  getMix,
  type MagazineSlot,
  type StarFlavor,
} from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import { inhaleFlavor, knockbackVelocity, resolveHit, tickTimer } from '../logic/combat';
import { tickBoomerangBody } from '../logic/enemyFsm';
import { approachVelocity, detectMoveFx, type MoveFxEvent } from '../logic/movement';
import {
  SHELL_SHIELD,
  advanceShield,
  advanceStarstormHold,
  createShieldState,
  effectiveInvulnMs,
  fillMagazine,
  isFrontalHit,
  isTopShelly,
  popTopSlot,
  pushGoldStar,
  resolveActionPress,
  resolveJumpPress,
  resolveShieldBlock,
  shieldEligible,
  shouldFireOnRelease,
  slotSpec,
  starDamage,
  starPitch,
  starstormProgress,
  starstormReady,
  swallowIntoMagazine,
} from '../logic/skills';
import {
  GALE_BLADE,
  GALE_FLIGHT,
  TRANSFORM,
  TRANSFORM_FORMS,
  VOLT_BEAM,
  absorbHalvedDamage,
  createTransformState,
  eligibleForm,
  endTransform,
  resolveTransformHold,
  startTransform,
  tickTransform,
  transformProgress,
  type TransformState,
} from '../logic/transform';
import { advanceStride, airTilt, idleBreath, strideBob, strideTilt } from '../logic/walkFeel';
import { playSfx } from '../audio/sfx';
import type { ControlsState } from './controls';
import { FX_TEXTURES, attachTrail, burstSmall, ensureFxTextures, type TrailHandle } from './fx';

// 星彈命中結果：pierce 依剩餘穿透數決定續飛；absorb 一律回收（魔王或未死目標吃彈）。
export type StarHitMode = 'pierce' | 'absorb';

export interface PlayerHandle {
  sprite: Phaser.Physics.Arcade.Sprite;
  update(controls: ControlsState, deltaMs: number): void;
  takeDamage(damage: number, sourceX: number): void;
  heal(amount: number, hpCap: number): void;
  swallow(kind: EnemyKind): boolean;
  isInhaling(): boolean;
  getAmmoState(): { ammo: number; flavor: StarFlavor; mix: string | null };
  // 走動手感觀測點（§45 e2e）：當幀傾角與 bob 偏移。
  getWalkVisual(): { rotation: number; bob: number; vy: number };
  getMagazine(): readonly MagazineSlot[];
  grantFullMagazine(): void;
  grantGoldStar(): void;
  grantStar(flavor: StarFlavor): void;
  isShieldRaised(): boolean;
  // v9 星化（§57）：形態觀測（e2e/世界結算）與下砸態（魔王頭頂 hit window 判定）。
  getTransformState(): TransformState;
  isSlamming(): boolean;
  // 魔王頭頂命中（§58）：GameScene 結算後回彈玩家並結束本次下砸（進 CD）。
  onSlamBounce(): void;
  // 短期增益（§68 疾風靴）：移速/加減速倍率單點注入；GameScene 依 buff 狀態逐幀同步。
  setBuffMoveMods(speedMul: number, rateMul: number): void;
  getFacing(): 1 | -1;
  getInhaleZone(): Phaser.GameObjects.Zone;
  getStars(): Phaser.Physics.Arcade.Group;
  onStarHit(star: Phaser.GameObjects.GameObject, mode: StarHitMode): void;
  destroy(): void;
}

type Pose = 'hero-idle' | 'hero-inhale' | 'hero-puffed' | 'hero-hurt';

const PLAYER_SIZE = 48;
const STAR_SIZE = 24;
// 主角描邊（§45）：深紫近黑剪影色與放大比（48px 本體外露約 2.4px 輪廓環）。
const HERO_OUTLINE_COLOR = 0x2f2a3d;
const HERO_OUTLINE_SCALE = 1.1;
const KNOCKBACK_SPEED = 234;
const KNOCKBACK_LIFT = -286;
const BLINK_INTERVAL_MS = 100;
// §18 落地塵埃圈：著地速度 >300 觸發。
const DUST_FALL_SPEED = 300;
// §20 星彈拖尾：疾風星拖尾加長 ×1.6，其餘維持基準長度；tint 依屬性表上色。
const TRAIL_LIFESPAN_MS = 260;
const WIND_TRAIL_LIFESPAN_MS = TRAIL_LIFESPAN_MS * 1.6;
// 迴旋星自旋角速度（§53，與殼刃同值）。
const BOOM_SPIN_RAD = 0.02;
// 殼化護體窗（§57）：減傷池實扣 0 時的短無敵，防同一接觸逐幀重複結算。
const SHELL_GUARD_MS = 400;
// 魔王頭頂命中回彈初速（§58）。
const SLAM_BOUNCE_VY = -380;

export function createPlayer(scene: Phaser.Scene, x: number, y: number): PlayerHandle {
  // art stream 紋理未載入時退回內建白色矩形，避免本地驗證噴 missing texture。
  const tex = (key: string) => (scene.textures.exists(key) ? key : '__WHITE');
  // 主角輪廓對比（§45 審查修復）：深紫剪影背襯作描邊，淡色底（草原 1.81:1）提升至 ≥3:1。
  // 先建 image 使其繪於本體之後（免 depth 調度）；FILL tint 整面上色為剪影；
  // 不用 Phaser 4 Glow filter——實測 SwiftShader/低階 GPU 下每幀模糊採樣致幀率崩跌。
  const silhouette = scene.add.image(x, y, tex('hero-idle'));
  silhouette.setDisplaySize(PLAYER_SIZE * HERO_OUTLINE_SCALE, PLAYER_SIZE * HERO_OUTLINE_SCALE);
  silhouette.setTint(HERO_OUTLINE_COLOR);
  silhouette.setTintMode(Phaser.TintModes.FILL);
  const sprite = scene.physics.add.sprite(x, y, tex('hero-idle'));
  sprite.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
  sprite.setCollideWorldBounds(true);
  const baseScaleX = sprite.scaleX;
  const baseScaleY = sprite.scaleY;

  // 剪影逐幀鏡像本體（POST_UPDATE，含 bob 偏移後座標）：貼圖/位置/翻面/縮放/透明全同步。
  const syncSilhouette = () => {
    if (silhouette.texture.key !== sprite.texture.key) silhouette.setTexture(sprite.texture.key);
    silhouette.setPosition(sprite.x, sprite.y);
    silhouette.setRotation(sprite.rotation);
    silhouette.setFlipX(sprite.flipX);
    silhouette.setScale(sprite.scaleX * HERO_OUTLINE_SCALE, sprite.scaleY * HERO_OUTLINE_SCALE);
    silhouette.setAlpha(sprite.alpha);
    silhouette.setVisible(sprite.visible);
  };

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
  // 短期增益（§68）：疾風靴移速/加減速倍率；GameScene 依 buff 狀態同步。
  let buffSpeedMul = 1;
  let buffRateMul = 1;
  let actionHoldMs = 0;
  let coyoteMs = 0;
  let jumpBufferMs = 0;
  let inhaling = false;
  let wasOnGround = false;
  // 走動手感（§45）：速度驅動步頻相位；bob/傾斜/落腳拍點皆由 walkFeel 純函式導出。
  let stridePhase = 0;
  let lastVy = 0;
  let pose: Pose = 'hero-idle';
  // 技能狀態（§23）：滿匣延遲發射旗標、星暴充能、下衝擊 CD。
  let deferredFire = false;
  let stormHoldMs = 0;
  // 星暴無敵窗（§64）：與受擊 i-frame 獨立計時，結算取較大值（effectiveInvulnMs）。
  let stormInvulnMs = 0;
  let slamming = false;
  let slamCdMs = 0;
  // 手感（§41）：上一幀水平目標速度供邊緣偵測（起跑/急停/轉身塵埃一次性觸發）。
  let prevMoveTarget = 0;
  // 殼盾（§40）：舉盾 FSM 與格擋後短無敵，與受擊 i-frame 分離避免誤入受傷表現。
  let shield = createShieldState();
  let blockInvulnMs = 0;
  let wasShieldRaised = false;
  // 星化（§57）：形態狀態、長按一次性旗標、形態技 CD 與殼化減傷池。
  let transform = createTransformState();
  let transformHoldDone = false;
  let voltCdMs = 0;
  let bladeCdMs = 0;
  let halfDamagePool = 0;

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
  // 剪影同步掛在 applyBob 之後（同事件註冊序）：取到含 bob 的最終視覺座標。
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, syncSilhouette);

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

  // 移動塵埃（§41）：起跑/急停/轉身腳邊小塵點，向行進反方向踢出後淡逝（預算 ≤4 顆/次）。
  const spawnMoveDust = (event: MoveFxEvent) => {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const kickDir = event === 'hard-stop' ? Math.sign(body.velocity.x) || facing : -facing;
    const count = event === 'turn' ? 4 : 3;
    for (let i = 0; i < count; i += 1) {
      const puff = scene.add
        .circle(
          sprite.x - kickDir * (4 + Math.random() * 10),
          sprite.y + PLAYER_SIZE / 2 - 6 + Math.random() * 4,
          2.5 + Math.random() * 2,
          0xffffff,
          0.65,
        )
        .setDepth(sprite.depth - 1);
      scene.tweens.add({
        targets: puff,
        x: puff.x + kickDir * (14 + Math.random() * 22),
        y: puff.y - (4 + Math.random() * 10),
        alpha: 0,
        scale: 0.4,
        duration: 260 + Math.random() * 90,
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    // 轉身（§41）：小幅擠壓遮蓋翻面瞬間，翻面讀感平滑。
    if (event === 'turn') squashStretch(0.86, 1.1);
  };

  // 腳塵（§45）：單一池化 emitter，落腳拍點 explode 2 顆；行進反向輕踢後淡逝。
  ensureFxTextures(scene);
  const footDust = scene.add
    .particles(0, 0, FX_TEXTURES.dot, {
      speed: { min: 18, max: 55 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.65, end: 0 },
      alpha: { start: 0.55, end: 0 },
      lifespan: { min: 150, max: 260 },
      emitting: false,
      maxAliveParticles: 12,
    })
    .setDepth(9);

  // 殼盾面前弧盾（§40）：面向側青綠弧線 + 淡填充，逐幀重繪。
  const shieldGfx = scene.add.graphics().setDepth(94);
  const drawShield = () => {
    shieldGfx.clear();
    if (!shield.raised) return;
    const cx = sprite.x + facing * 14;
    const base = facing === 1 ? 0 : Math.PI;
    shieldGfx.fillStyle(0x7fd8c8, 0.18);
    shieldGfx.slice(cx, sprite.y, 36, base - 1.05, base + 1.05, false);
    shieldGfx.fillPath();
    shieldGfx.lineStyle(4, 0x7fd8c8, 0.95);
    shieldGfx.beginPath();
    shieldGfx.arc(cx, sprite.y, 36, base - 1.05, base + 1.05, false);
    shieldGfx.strokePath();
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

  // 形態 aura（§57，池化）：三形態各一常駐 emitter（emitting=false），變身時僅啟用當前形態。
  const auraEmitters = {} as Record<
    'volt' | 'gale' | 'shell',
    Phaser.GameObjects.Particles.ParticleEmitter
  >;
  for (const form of ['volt', 'gale', 'shell'] as const) {
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

  // 變身環（§57）：充能進度（長按 0.6s）與形態倒數（10s）共用一支 graphics，逐幀重繪。
  const transformRing = scene.add.graphics().setDepth(95);
  const drawTransformRing = (chargeProgress: number) => {
    transformRing.clear();
    if (transform.form) {
      const spec = TRANSFORM_FORMS[transform.form];
      transformRing.lineStyle(4, spec.tint, 0.9);
      transformRing.beginPath();
      transformRing.arc(
        sprite.x,
        sprite.y - 44,
        20,
        -Math.PI / 2,
        -Math.PI / 2 + transformProgress(transform) * Math.PI * 2,
      );
      transformRing.strokePath();
      return;
    }
    if (chargeProgress <= 0) return;
    transformRing.lineStyle(4, 0xffffff, 0.85);
    transformRing.beginPath();
    transformRing.arc(
      sprite.x,
      sprite.y - 44,
      20,
      -Math.PI / 2,
      -Math.PI / 2 + Math.min(1, chargeProgress) * Math.PI * 2,
    );
    transformRing.strokePath();
  };

  // 變身進入（§57）：消耗全部彈匣、爆發特效、啟用形態 aura。
  const beginTransform = (form: 'volt' | 'gale' | 'shell') => {
    transform = startTransform(form);
    magazine = [];
    deferredFire = false;
    stormHoldMs = 0;
    halfDamagePool = 0;
    voltCdMs = 0;
    bladeCdMs = 0;
    emitAmmo();
    playSfx('starstorm');
    burstSmall(scene, sprite.x, sprite.y, TRANSFORM_FORMS[form].tint);
    squashStretch(1.35, 0.7);
    auraEmitters[form].start();
  };

  // 解除（到期或再長按提前）：不返彈；aura 停用、外觀復原。
  const finishTransform = () => {
    const form = transform.form;
    transform = endTransform();
    if (!form) return;
    auraEmitters[form].stop();
    playSfx('pop');
    burstSmall(scene, sprite.x, sprite.y, TRANSFORM_FORMS[form].tint);
    // 立即回復非變身貼圖（setPose 快取不變時不重設，故直接覆寫）。
    sprite.setTexture(tex(pose));
  };

  // 風化穿透風刃（§57）：走 stars 池的偽星彈——傷害/穿透自帶，沿用既有命中管線。
  const launchWindBlade = () => {
    const fx = sprite.x + facing * (PLAYER_SIZE / 2 + 8);
    const star = stars.get(fx, sprite.y, tex('fx-star')) as Phaser.Physics.Arcade.Sprite | null;
    if (!star) return;
    star.setActive(true).setVisible(true);
    star.setDisplaySize(STAR_SIZE, STAR_SIZE * 0.7);
    star.setTint(TRANSFORM_FORMS.gale.tint);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(fx, sprite.y);
    star.setData('damage', GALE_BLADE.damage);
    star.setData('pierce', GALE_BLADE.pierceCount);
    star.setData('flavor', 'floaty');
    star.setData('mix', null);
    star.setData('boomMs', null);
    star.setRotation(0);
    star.setData(
      'fxTrail',
      attachTrail(scene, star, {
        tint: TRANSFORM_FORMS.gale.tint,
        lifespan: WIND_TRAIL_LIFESPAN_MS,
      }),
    );
    star.setVelocity(facing * GALE_BLADE.speed, 0);
    emitGameEvent(scene.events, GameEvents.STAR_FIRED, {
      x: fx,
      y: sprite.y,
      directionX: facing,
      flavor: 'floaty',
      pitch: 1.4,
    });
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

  // 單發彈體生成（§23/§46）：尺寸/著色/拖尾/彈道資料單一出口；vy 供散射扇形。
  const launchStar = (slot: MagazineSlot, vy: number) => {
    const spec = slotSpec(slot);
    const fx = sprite.x + facing * (PLAYER_SIZE / 2 + 8);
    const star = stars.get(fx, sprite.y, tex('fx-star')) as Phaser.Physics.Arcade.Sprite | null;
    if (!star) return;
    const boosted = slot.charged || slot.gold;
    const size = boosted ? STAR_SIZE * CHARGED_STAR.sizeMultiplier : STAR_SIZE;
    star.setActive(true).setVisible(true);
    star.setDisplaySize(size, size);
    // 標準星保留原金黃星彈藝術；其餘依屬性/配方上色；強化/金星套金邊 tint。
    if (boosted) star.setTint(CHARGED_STAR.tint);
    else if (slot.flavor === 'jelly' && slot.mix === undefined) star.clearTint();
    else star.setTint(spec.tint);
    const body = star.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(fx, sprite.y);
    star.setData('damage', starDamage(slot));
    star.setData('pierce', spec.pierceCount);
    star.setData('flavor', slot.flavor);
    star.setData('mix', slot.mix ?? null);
    // 迴旋星（§53）：標記迴旋彈道由本系統 steerBoomerangStars 逐幀驅動；非迴旋彈清殘留。
    star.setData('boomMs', spec.boomerang ? 0 : null);
    star.setData('boomDir', facing);
    star.setData('boomSpeed', spec.speed);
    star.setRotation(0);
    star.setData(
      'fxTrail',
      attachTrail(scene, star, {
        tint: boosted ? CHARGED_STAR.tint : spec.tint,
        lifespan: slot.flavor === 'floaty' ? WIND_TRAIL_LIFESPAN_MS : TRAIL_LIFESPAN_MS,
      }),
    );
    star.setVelocity(facing * spec.speed, vy);
  };

  // 後進先出發射（§23/§46）：頂槽決定屬性；混合星散射時分裂為小幅上下扇形。
  const fireStar = () => {
    const popped = popTopSlot(magazine);
    const slot = popped.slot;
    if (!slot) return;
    magazine = popped.magazine;
    lastFlavor = slot.flavor;
    const scatter = slot.mix !== undefined ? getMix(slot.mix).scatterCount : 0;
    if (scatter > 1) {
      for (let i = 0; i < scatter; i += 1) {
        launchStar(slot, (i - (scatter - 1) / 2) * SCATTER_FAN_VY);
      }
    } else {
      launchStar(slot, 0);
    }
    emitAmmo();
    emitGameEvent(scene.events, GameEvents.STAR_FIRED, {
      x: sprite.x + facing * (PLAYER_SIZE / 2 + 8),
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

  // 迴旋星（§53）：去而復返速度曲線逐幀驅動＋自旋；逾時回收（anti-softlock 壽命上限）。
  const steerBoomerangStars = (deltaMs: number): void => {
    for (const child of stars.getChildren()) {
      const star = child as Phaser.Physics.Arcade.Sprite;
      if (!star.active) continue;
      const boomMs = star.getData('boomMs') as number | null | undefined;
      if (boomMs === null || boomMs === undefined) continue;
      if (boomMs + deltaMs >= BOOMERANG.lifetimeMs) {
        recycleStar(star);
        continue;
      }
      const direction = star.getData('boomDir') as 1 | -1;
      const next = tickBoomerangBody(
        star.body as Phaser.Physics.Arcade.Body,
        boomMs,
        direction,
        star.getData('boomSpeed') as number,
        BOOMERANG.turnMs,
        deltaMs,
      );
      star.setData('boomMs', next);
      star.rotation += direction * BOOM_SPIN_RAD * deltaMs;
    }
  };

  return {
    sprite,
    update(controls: ControlsState, deltaMs: number) {
      invulnerableMs = tickTimer(invulnerableMs, deltaMs);
      stormInvulnMs = tickTimer(stormInvulnMs, deltaMs);
      hurtLockMs = tickTimer(hurtLockMs, deltaMs);
      slamCdMs = tickTimer(slamCdMs, deltaMs);
      blockInvulnMs = tickTimer(blockInvulnMs, deltaMs);
      voltCdMs = tickTimer(voltCdMs, deltaMs);
      bladeCdMs = tickTimer(bladeCdMs, deltaMs);

      // 星化計時（§57）：到期自動解除（演出與 aura 停用集中 finishTransform）。
      if (transform.form) {
        const ticked = tickTransform(transform, deltaMs);
        if (ticked.expired) finishTransform();
        else transform = ticked.state;
      }
      const formSpec = transform.form ? TRANSFORM_FORMS[transform.form] : null;

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
        } else if (lastVy > DUST_FALL_SPEED) {
          spawnDustRing();
          // 風化落地衝擊（§57）：一般落地即帶小範圍衝擊，世界結算交 GameScene。
          if (transform.form === 'gale') {
            emitGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, {
              kind: 'gale-landing',
              form: 'gale',
              x: sprite.x,
              y: sprite.y,
              facing,
            });
          }
        }
      }
      wasOnGround = onGround;

      if (hurtLockMs <= 0) {
        // 加減速曲線（§41）：以目標速度逐幀逼近取代瞬時 setVelocity；
        // 邊緣事件（起跑/急停/轉身）於目標轉變當幀觸發一次性塵埃。
        // 星化移速（§57）：雷化 +15%、殼化 -20%；短期增益（§68）疾風靴倍率疊乘。
        const moveSpeed = PLAYER.moveSpeed * (formSpec?.moveSpeedMul ?? 1) * buffSpeedMul;
        const moveTarget = controls.left ? -moveSpeed : controls.right ? moveSpeed : 0;
        if (moveTarget !== 0) facing = moveTarget > 0 ? 1 : -1;
        const moveFx = detectMoveFx({
          onGround,
          prevTarget: prevMoveTarget,
          target: moveTarget,
          velocityX: body.velocity.x,
        });
        if (moveFx) spawnMoveDust(moveFx);
        prevMoveTarget = moveTarget;
        sprite.setVelocityX(approachVelocity(body.velocity.x, moveTarget, deltaMs, buffRateMul));

        // 跳躍鍵矩陣（§44）：空中「下＋跳」＝下衝擊（吞含狀態不影響；CD 中回落
        // 跳躍鏈不吞輸入）；地面照走 coyote/buffer 跳躍鏈，單向平台下穿由 stage
        // 層 shouldDropThrough 裁決並覆蓋跳躍脈衝（§29 既有優先序）。
        const jumpCommand =
          controls.jumpPressed && !slamming
            ? resolveJumpPress({
                airborne: !onGround,
                down: controls.down,
                slamCooldownMs: slamCdMs,
              })
            : 'jump';
        if (jumpCommand === 'slam') {
          startSlam();
        } else {
          // 寬容度（§15.1）：coyote 期內離台仍可起跳；提前按跳以 buffer 落地即跳。
          const wantsJump = controls.jumpPressed || (onGround && jumpBufferMs > 0);
          if (wantsJump) {
            if (onGround || coyoteMs > 0) {
              coyoteMs = 0;
              jumpBufferMs = 0;
              sprite.setVelocityY(PLAYER.jumpVelocity);
              squashStretch(0.8, 1.25);
            } else if (
              controls.jumpPressed &&
              (formSpec?.freeFlight || flapsUsed < PLAYER.maxFlaps)
            ) {
              // 風化近自由飛行（§57）：拍翅無上限＋升力增強。
              if (!formSpec?.freeFlight) flapsUsed += 1;
              sprite.setVelocityY(formSpec?.freeFlight ? GALE_FLIGHT.floatLift : PLAYER.floatLift);
              squashStretch(0.9, 1.12);
            } else if (controls.jumpPressed) {
              jumpBufferMs = FORGIVENESS.jumpBufferMs;
            }
          }
        }

        // B 鍵決策（§23/§40/§57）：變身期間 B 改役形態技（吸入/發射/星暴全停用）；
        // 其餘沿用滿匣與頂槽殼盾星延遲至放開結算（點按發射 vs 長按星暴/舉盾）。
        if (controls.actionPressed) {
          if (transform.form === 'volt') {
            if (voltCdMs <= 0) {
              voltCdMs = VOLT_BEAM.cooldownMs;
              emitGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, {
                kind: 'volt-beam',
                form: 'volt',
                x: sprite.x + facing * (PLAYER_SIZE / 2 + 6),
                y: sprite.y,
                facing,
              });
            }
          } else if (transform.form === 'gale') {
            if (bladeCdMs <= 0) {
              bladeCdMs = GALE_BLADE.cooldownMs;
              launchWindBlade();
            }
          } else if (!transform.form) {
            // 變身資格成立時同走延遲（§57）：點按放開仍發射、長按 0.6s 交星化。
            const command = resolveActionPress({
              ammo: magazine.length,
              topIsShelly: isTopShelly(magazine),
              transformEligible: eligibleForm(magazine) !== null,
            });
            if (command === 'fire') fireStar();
            else if (command === 'defer') deferredFire = true;
          }
        }
      }

      // 滿匣點按（<150ms）於放開時發射；長按則交給吸入或星暴。
      if (!controls.actionHeld) {
        if (deferredFire && hurtLockMs <= 0 && shouldFireOnRelease(actionHoldMs)) fireStar();
        deferredFire = false;
        transformHoldDone = false;
      }

      // 星化長按裁決（§57）：同系滿匣長按 0.6s 變身（此情境優先於星暴）；變身中再長按
      // 提前解除；一次長按僅裁決一次（transformHoldDone），放開重置。
      const eligible = eligibleForm(magazine);
      const transformCharging = !transform.form && eligible !== null && controls.actionHeld;
      if (controls.actionHeld && !transformHoldDone && hurtLockMs <= 0) {
        const command = resolveTransformHold({
          holdMs: actionHoldMs + deltaMs,
          active: transform.form !== null,
          eligible: eligible !== null,
          airborne: !onGround,
        });
        if (command === 'start' && eligible) {
          transformHoldDone = true;
          beginTransform(eligible);
        } else if (command === 'dismiss') {
          transformHoldDone = true;
          finishTransform();
        }
      }

      // 星暴充能（§23/§57）：滿匣長按 0.8s 觸發；同系滿匣（變身情境）與變身中不充能。
      stormHoldMs = advanceStarstormHold(
        stormHoldMs,
        deltaMs,
        controls.actionHeld && !transformCharging && !transform.form,
        magazine.length >= STAR.maxAmmo,
      );
      if (starstormReady(stormHoldMs)) {
        stormHoldMs = 0;
        deferredFire = false;
        magazine = [];
        // 星暴無敵（§64）：發動即開 5s 窗；與受擊 i-frame 取 max，重複發動刷新不疊加。
        stormInvulnMs = STARSTORM.invulnMs;
        emitAmmo();
        playSfx('starstorm');
        emitGameEvent(scene.events, GameEvents.SKILL_STARSTORM, { x: sprite.x, y: sprite.y });
      }
      drawStormRing();

      actionHoldMs = controls.actionHeld ? actionHoldMs + deltaMs : 0;
      // 殼盾（§40/§57 輸入矩陣）：殼盾情境（頂槽殼盾星且未滿匣）長按語意固定為舉盾——
      // 舉盾中與盾 CD 中皆抑制吸入，不回落；滿匣長按維持星暴優先；殼盾星 ×3（變身
      // 充能情境）長按讓位星化。
      const inShieldContext = shieldEligible(magazine) && !transformCharging && !transform.form;
      shield = advanceShield(shield, {
        deltaMs,
        held: controls.actionHeld && actionHoldMs >= INHALE.holdThresholdMs && hurtLockMs <= 0,
        eligible: inShieldContext && hurtLockMs <= 0,
      });
      if (shield.raised && !wasShieldRaised) playSfx('shell-spin');
      wasShieldRaised = shield.raised;
      drawShield();
      // 吸入停用情境（§57）：變身中 B 已改役；同系滿匣長按為變身起手勢，皆不進吸入。
      inhaling =
        actionHoldMs >= INHALE.holdThresholdMs &&
        !shield.raised &&
        !inShieldContext &&
        !transform.form &&
        !transformCharging;
      zoneBody.enable = inhaling;
      // 變身環（§57）：起手/解除長按充能進度；變身中改畫形態倒數。
      const holdCharging =
        controls.actionHeld && !transformHoldDone && (transformCharging || transform.form !== null);
      drawTransformRing(holdCharging ? actionHoldMs / TRANSFORM.holdMs : 0);
      zone.setPosition(sprite.x + facing * (INHALE.rangePx / 2), sprite.y);

      sprite.setFlipX(facing === -1);
      // 無敵閃爍沿用受擊回饋（§64）：受擊 i-frame 與星暴無敵窗共用同一節流視覺。
      const blinkMs = effectiveInvulnMs(invulnerableMs, stormInvulnMs);
      sprite.setAlpha(blinkMs > 0 && Math.floor(blinkMs / BLINK_INTERVAL_MS) % 2 === 0 ? 0.35 : 1);

      // 走動手感（§45）：速度驅動步頻——相位導出 bob（視覺 y 偏移，PRE/POST_UPDATE
      // 掛鉤）與前傾＋搖擺角；落腳拍點觸發腳塵與步伐音。空中依 vy 前後傾姿態；
      // 地面靜止走 idle 呼吸（scale 通道，squash tween 進行中讓位）。
      // 呼吸殘留復位：離開 idle 後 scale 回基準（squash tween 進行中讓 tween 主導）。
      const normalizeBreath = (): void => {
        if (!scene.tweens.isTweening(sprite) && sprite.scaleY !== baseScaleY) {
          sprite.setScale(baseScaleX, baseScaleY);
        }
      };
      if (onGround && body.velocity.x !== 0) {
        normalizeBreath();
        const speedRatio = Math.abs(body.velocity.x) / PLAYER.moveSpeed;
        const tick = advanceStride(stridePhase, speedRatio, deltaMs);
        stridePhase = tick.phase;
        if (tick.footstep) {
          footDust.explode(2, sprite.x - facing * 10, sprite.y + PLAYER_SIZE / 2 - 5);
          playSfx('footstep');
        }
        sprite.setRotation(facing * strideTilt(stridePhase, speedRatio));
        bobOffset = strideBob(stridePhase, speedRatio);
      } else if (!onGround) {
        normalizeBreath();
        stridePhase = 0;
        bobOffset = 0;
        sprite.setRotation(facing * airTilt(body.velocity.y));
      } else {
        if (stridePhase !== 0 || sprite.rotation !== 0) {
          stridePhase = 0;
          sprite.setRotation(0);
          bobOffset = 0;
        }
        if (!scene.tweens.isTweening(sprite)) {
          sprite.setScale(baseScaleX, baseScaleY * (1 + idleBreath(scene.time.now)));
        }
      }
      lastVy = body.velocity.y;

      // 形態貼圖（§57）：變身期間固定形態立繪；素材未載時退回一般姿勢（aura 保識別）。
      const formTexKey = transform.form ? `hero-${transform.form}` : null;
      if (formTexKey && scene.textures.exists(formTexKey)) {
        if (sprite.texture.key !== formTexKey) sprite.setTexture(formTexKey);
      } else if (invulnerableMs > 0) setPose('hero-hurt');
      else if (controls.actionHeld && magazine.length === 0 && !transform.form)
        setPose('hero-inhale');
      else if (magazine.length > 0) setPose('hero-puffed');
      else setPose('hero-idle');

      // 卷軸世界以相機視野為界回收星彈；迴旋星另走壽命與回程驅動。
      const view = scene.cameras.main.worldView;
      for (const child of stars.getChildren()) {
        const star = child as Phaser.Physics.Arcade.Sprite;
        if (star.active && (star.x < view.x - 40 || star.x > view.right + 40)) recycleStar(star);
      }
      steerBoomerangStars(deltaMs);
    },
    takeDamage(damage: number, sourceX: number) {
      // 格擋後短無敵（§40）：防同一接觸連續結算。
      if (blockInvulnMs > 0) return;
      // 殼盾格擋（§40）：舉盾中的正面傷害——消耗頂槽、入 CD、發反擊事件，不掉血不擊退。
      if (shield.raised && isFrontalHit(facing, sprite.x, sourceX)) {
        const popped = popTopSlot(magazine);
        magazine = popped.magazine;
        if (popped.slot) lastFlavor = popped.slot.flavor;
        shield = resolveShieldBlock();
        blockInvulnMs = SHELL_SHIELD.blockInvulnMs;
        drawShield();
        squashStretch(1.15, 0.88);
        playSfx('metal');
        emitAmmo();
        emitGameEvent(scene.events, GameEvents.SKILL_SHIELD_BLOCK, {
          x: sprite.x,
          y: sprite.y,
          facing,
        });
        return;
      }
      // 殼化受傷減半（§57）：0.5 傷害池累積，實扣 0 時給短護體窗防逐幀重複結算。
      let incoming = damage;
      if (transform.form === 'shell') {
        const absorbed = absorbHalvedDamage(halfDamagePool, damage);
        halfDamagePool = absorbed.pool;
        incoming = absorbed.damage;
        if (incoming <= 0) {
          blockInvulnMs = SHELL_GUARD_MS;
          squashStretch(1.12, 0.9);
          playSfx('metal', 0.8);
          return;
        }
      }
      // 星暴無敵（§64）：與受擊 i-frame 取較大值判定，期間零傷害且不重啟計時。
      const result = resolveHit(
        hp,
        effectiveInvulnMs(invulnerableMs, stormInvulnMs),
        incoming,
        PLAYER.invulnerableMs,
      );
      if (!result.damaged) return;
      hp = result.hp;
      invulnerableMs = result.invulnerableMs;
      hurtLockMs = FORGIVENESS.hurtLockMs;
      const kb = knockbackVelocity(sprite.x, sourceX, KNOCKBACK_SPEED, KNOCKBACK_LIFT);
      sprite.setVelocity(kb.x, kb.y);
      emitGameEvent(scene.events, GameEvents.PLAYER_DAMAGED, {
        hp,
        maxHp: PLAYER.maxHp,
        damage: incoming,
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
      // 個體狀態（shelly 暈眩窗）由 GameScene 的 isInhalable 先行把關；此處只換算屬性。
      const flavor = inhaleFlavor(kind);
      if (!flavor) return false;
      const result = swallowIntoMagazine(magazine, flavor);
      magazine = result.magazine;
      lastFlavor = flavor;
      // 連吞升級（§23）強化音效；混合合成（§46）沿用 jingle 短奏提示。
      if (result.charged) playSfx('charge');
      else if (result.mixed) playSfx('jingle');
      emitGameEvent(scene.events, GameEvents.ENEMY_INHALED, { kind });
      emitAmmo();
      return true;
    },
    isInhaling() {
      return inhaling;
    },
    getAmmoState() {
      const top = magazine[magazine.length - 1];
      return {
        ammo: magazine.length,
        flavor: top?.flavor ?? lastFlavor,
        mix: top?.mix ?? null,
      };
    },
    getWalkVisual() {
      return {
        rotation: sprite.rotation,
        bob: bobOffset,
        vy: (sprite.body as Phaser.Physics.Arcade.Body).velocity.y,
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
    // e2e/QA 受控賦星：直接吞入指定屬性，走正式 swallow 管線維持連吞語意。
    grantStar(flavor: StarFlavor) {
      magazine = swallowIntoMagazine(magazine, flavor).magazine;
      lastFlavor = flavor;
      emitAmmo();
    },
    isShieldRaised() {
      return shield.raised;
    },
    getTransformState() {
      return transform;
    },
    isSlamming() {
      return slamming;
    },
    // 魔王頭頂命中（§58）：回彈並結束本次下砸、進 CD；觸碰傷害由 GameScene 略過。
    onSlamBounce() {
      slamming = false;
      slamCdMs = SLAM.cooldownMs;
      sprite.setVelocityY(SLAM_BOUNCE_VY);
      squashStretch(1.2, 0.8);
    },
    setBuffMoveMods(speedMul: number, rateMul: number) {
      buffSpeedMul = speedMul;
      buffRateMul = rateMul;
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
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, syncSilhouette);
      scene.tweens.killTweensOf(sprite);
      footDust.destroy();
      stormRing.destroy();
      shieldGfx.destroy();
      transformRing.destroy();
      for (const emitter of Object.values(auraEmitters)) emitter.destroy();
      silhouette.destroy();
      sprite.destroy();
      zone.destroy();
      stars.destroy(true);
    },
  };
}
