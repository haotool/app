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
import {
  SHELLY_NEAR_PX,
  inhaleFlavor,
  inhaleZoneSpanPx,
  knockbackVelocity,
  resolveHit,
  tickTimer,
} from '../logic/combat';
import { tickBoomerangBody } from '../logic/enemyFsm';
import { approachVelocity, detectMoveFx, type MoveFxEvent } from '../logic/movement';
import {
  SHELL_SHIELD,
  STAR_CULL_MARGIN_PX,
  STAR_POOL_MAX,
  advanceShield,
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
  swallowIntoMagazine,
} from '../logic/skills';
import {
  beginDetonation,
  chargeStarburst,
  createStarburstState,
  resolveSpMode,
  resolveSpPress,
  shouldCrystallize,
  tickDetonation,
  type SpMode,
  type StarburstState,
} from '../logic/starburst';
import {
  GALE_BLADE,
  GALE_FLIGHT,
  GALE_GLIDE,
  SHELL_CHARGE,
  SHELL_TUCK,
  TRANSFORM_FORMS,
  VOLT_BEAM,
  absorbHalvedDamage,
  consumeDischarge,
  consumeTuck,
  createTransformState,
  eligibleForm,
  endTransform,
  glideFallVy,
  startTransform,
  tickTransform,
  transformProgress,
  type TransformState,
} from '../logic/transform';
import {
  advanceCrouch,
  advanceStride,
  airTilt,
  idleBreath,
  strideBob,
  strideTilt,
} from '../logic/walkFeel';
import { playSfx } from '../audio/sfx';
import { createChargedStar } from './chargedStar';
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
  // 蹲姿觀測點（§77 e2e）：0..1 蹲姿比例。
  getCrouch(): number;
  getMagazine(): readonly MagazineSlot[];
  grantFullMagazine(): void;
  grantGoldStar(): void;
  grantStar(flavor: StarFlavor): void;
  // 星光虹吸被抽（§113 Voidra）：彈匣頂槽被抽走 1 發；空匣回 false。
  stealTopStar(): boolean;
  isShieldRaised(): boolean;
  // v9 星化（§57）：形態觀測（e2e/世界結算）與下砸態（魔王頭頂 hit window 判定）。
  getTransformState(): TransformState;
  // 滾殼衝撞（§110）：衝撞期觀測——overlaps 據此改判接觸傷向小怪結算。
  isShellCharging(): boolean;
  // 星暴 2.0（§109）：蓄能相位觀測、跨關授星、死亡/EX 清除與 SP 鍵呈現模式。
  getStarburst(): StarburstState;
  grantStarburstCharge(): void;
  clearStarburst(): void;
  getSpMode(): SpMode;
  isSlamming(): boolean;
  // 魔王頭頂命中（§58）：GameScene 結算後回彈玩家並結束本次下砸（進 CD）。
  onSlamBounce(): void;
  // 短期增益（§69 疾風靴）：移速/加減速倍率單點注入；GameScene 依 buff 狀態逐幀同步。
  setBuffMoveMods(speedMul: number, rateMul: number): void;
  // 卡點重生護體（§67）：顯式重授無敵窗（取現值較大者），不依賴致死當下殘餘 i-frame。
  grantInvulnerability(durationMs: number): void;
  getFacing(): 1 | -1;
  getInhaleZone(): Phaser.GameObjects.Zone;
  getStars(): Phaser.Physics.Arcade.Group;
  onStarHit(star: Phaser.GameObjects.GameObject, mode: StarHitMode): void;
  destroy(): void;
}

type Pose =
  | 'hero-idle'
  | 'hero-inhale'
  | 'hero-inhale-big-1'
  | 'hero-inhale-big-2'
  | 'hero-puffed'
  | 'hero-hurt';

const PLAYER_SIZE = 48;
const STAR_SIZE = 24;
// 星彈池上限與視野裁切邊界（#820/#831）SSOT 收斂於 logic/skills.ts（滿匣散射＋風刃併發）。
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
// 落地擠壓最低著地速度（§77）：微速重新接觸（擠壓迴圈回落 15-30）不再觸發擠壓，
// 切斷「落地擠壓 → 身體縮小 → 離台 → 再落地」的自持迴圈。
const LANDING_SQUASH_MIN_VY = 120;
// 蹲姿視覺（§77）：橫向外擴＋縱向壓扁＋輕微下沉；走 POST_UPDATE 視覺通道，
// PRE_UPDATE 還原——物理永不見蹲縮，杜絕擠壓迴圈同型問題。
const CROUCH_SQUASH_X = 0.14;
const CROUCH_SQUASH_Y = 0.22;
const CROUCH_SINK_PX = 3;
// 大嘴吸入影格（§77.4）：吸入中兩影格交替營造吸力節奏；素材未載回退 hero-inhale。
const INHALE_FRAME_MS = 160;
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

  // 吸入判定區：面向錐形的廣域矩形（#811 依最大判定半徑取邊）＋反向側貼身帶（#844
  // 候選區鋪到背後 SHELLY_NEAR_PX，對齊邏輯層殼殼貼身豁免——否則反向豁免永不可達）；
  // 精確錐形與豁免仍由 combat.isInInhalePullRange 逐幀收斂，非殼殼有效半徑不變。
  const zoneSpan = inhaleZoneSpanPx(INHALE.rangePx);
  const zone = scene.add.zone(x, y, zoneSpan + SHELLY_NEAR_PX, zoneSpan);
  scene.physics.add.existing(zone);
  const zoneBody = zone.body as Phaser.Physics.Arcade.Body;
  zoneBody.setAllowGravity(false);
  zoneBody.enable = false;

  const stars = scene.physics.add.group({
    defaultKey: tex('fx-star'),
    maxSize: STAR_POOL_MAX,
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
  // 短期增益（§69）：疾風靴移速/加減速倍率；GameScene 依 buff 狀態同步。
  let buffSpeedMul = 1;
  let buffRateMul = 1;
  let actionHoldMs = 0;
  let coyoteMs = 0;
  let jumpBufferMs = 0;
  let inhaling = false;
  let inhaleAnimMs = 0;
  let wasOnGround = false;
  // 走動手感（§45）：速度驅動步頻相位；bob/傾斜/落腳拍點皆由 walkFeel 純函式導出。
  let stridePhase = 0;
  let lastVy = 0;
  let pose: Pose = 'hero-idle';
  // 技能狀態（§23/§109）：殼盾延遲發射旗標、蓄能結晶狀態機、下衝擊 CD。
  let deferredFire = false;
  let starburst = createStarburstState();
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
  // 星化（§57）：形態狀態、形態技 CD 與殼化減傷池；觸發改 SP 鍵（§109）。
  let transform = createTransformState();
  let voltCdMs = 0;
  let bladeCdMs = 0;
  let halfDamagePool = 0;
  // 滾殼衝撞（§110）：衝撞剩餘時長與 CD。
  let chargeMs = 0;
  let chargeCdMs = 0;

  // 走路 bob 視覺 y 偏移（US-022 / recon 硬規則 10）：不動 displayOrigin、不污染物理。
  // POST_UPDATE（物理回寫後）套用偏移供渲染，下一幀 PRE_UPDATE（物理讀取前）復原。
  // 蹲姿（§77）同走此通道：乘算擠壓疊加當幀既有 scale（落地擠壓/呼吸不衝突），
  // 還原以套用當下的比例快照為準，物理 updateBounds 永遠讀到未蹲縮的 scale。
  let bobOffset = 0;
  let crouch = 0;
  const crouchApplied = { sx: 1, sy: 1, sink: 0 };
  const applyBob = () => {
    sprite.y -= bobOffset;
    crouchApplied.sx = 1 + CROUCH_SQUASH_X * crouch;
    crouchApplied.sy = 1 - CROUCH_SQUASH_Y * crouch;
    crouchApplied.sink = CROUCH_SINK_PX * crouch;
    if (crouch > 0) {
      sprite.setScale(sprite.scaleX * crouchApplied.sx, sprite.scaleY * crouchApplied.sy);
      sprite.y += crouchApplied.sink;
    }
  };
  const revertBob = () => {
    sprite.y += bobOffset;
    if (crouchApplied.sink > 0 || crouchApplied.sx !== 1) {
      sprite.setScale(sprite.scaleX / crouchApplied.sx, sprite.scaleY / crouchApplied.sy);
      sprite.y -= crouchApplied.sink;
    }
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

  // 蓄能大星（§109）：結晶後頭頂軌道漂浮，蓄爆期斂縮增亮；呈現委派 chargedStar。
  const chargedStar = createChargedStar(scene);

  // 蓄能相位變更事件（§109）：HUD/教學/e2e 觀測共用契約。
  const emitStarburst = () => {
    emitGameEvent(scene.events, GameEvents.STARBURST_CHANGED, { phase: starburst.phase });
  };

  // 滿匣自動結晶（§109）：彈匣滿 5 槽瞬間清空並生成蓄能星；蓄能星存在時不疊加。
  // 結晶後立即可繼續吸怪（anti-softlock：吸怪循環即時可用）。
  const maybeCrystallize = () => {
    if (!shouldCrystallize(magazine.length, starburst.phase)) return;
    magazine = [];
    starburst = chargeStarburst();
    playSfx('charge');
    burstSmall(scene, sprite.x, sprite.y - 46, CHARGED_STAR.tint);
    emitStarburst();
  };

  // SP 引爆（§109）：0.3s 蓄爆不可取消，期滿於 update 內結算星暴。
  const startDetonation = () => {
    starburst = beginDetonation(starburst);
    playSfx('charge', 1.3);
    emitStarburst();
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

  // 變身環（§57/§109）：形態倒數（10s）逐幀重繪；長按充能進度隨 SP 即時變身退場。
  const transformRing = scene.add.graphics().setDepth(95);
  const drawTransformRing = () => {
    transformRing.clear();
    if (!transform.form) return;
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
  };

  // 變身進入（§57）：消耗全部彈匣、爆發特效、啟用形態 aura。
  const beginTransform = (form: 'volt' | 'gale' | 'shell') => {
    transform = startTransform(form);
    magazine = [];
    deferredFire = false;
    halfDamagePool = 0;
    voltCdMs = 0;
    bladeCdMs = 0;
    chargeMs = 0;
    chargeCdMs = 0;
    emitAmmo();
    playSfx('starstorm');
    burstSmall(scene, sprite.x, sprite.y, TRANSFORM_FORMS[form].tint);
    squashStretch(1.35, 0.7);
    auraEmitters[form].start();
  };

  // 解除（到期或再長按提前）：不返彈；aura 停用、外觀復原、衝撞態一併結束。
  const finishTransform = () => {
    const form = transform.form;
    transform = endTransform();
    chargeMs = 0;
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
      chargeMs = tickTimer(chargeMs, deltaMs);
      chargeCdMs = tickTimer(chargeCdMs, deltaMs);

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
        // §77：僅真實落地（下砸或帶速著地）擠壓；微速重新接觸不觸發，防自持迴圈。
        if (slamming || lastVy > LANDING_SQUASH_MIN_VY) squashStretch(1.25, 0.75);
        // 風化落地滾翻（§110）：落地瞬間自動免傷窗，與受擊 i-frame 取較大值。
        if (formSpec && formSpec.landingRollMs > 0) {
          invulnerableMs = Math.max(invulnerableMs, formSpec.landingRollMs);
        }
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
        // 星化移速（§57）：雷化 +15%、殼化 -20%；短期增益（§69）疾風靴倍率疊乘。
        // 風化滑翔（§110）：空中按住跳鍵且下落中＝緩降＋水平漂移 ×1.6。
        const gliding =
          formSpec?.glide === true && !onGround && controls.jumpHeld && body.velocity.y > 0;
        const moveSpeed =
          PLAYER.moveSpeed *
          (formSpec?.moveSpeedMul ?? 1) *
          buffSpeedMul *
          (gliding ? GALE_GLIDE.driftMul : 1);
        // 蹲下靜止（§85）：地面下向意圖成立即鉗水平——斜下滑的 dx 分量不再把玩家
        // 帶出平台邊緣；空中不鉗，保留下砸前的橫向微調。
        const crouching = onGround && controls.down;
        const moveTarget = crouching
          ? 0
          : controls.left
            ? -moveSpeed
            : controls.right
              ? moveSpeed
              : 0;
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
        // 滾殼衝撞（§110）：衝撞期水平速度鎖定面向向前，覆蓋一般移動曲線。
        if (chargeMs > 0) sprite.setVelocityX(facing * SHELL_CHARGE.speed);
        if (gliding) sprite.setVelocityY(glideFallVy(body.velocity.y));

        // 跳躍鍵矩陣（§44）：空中「下＋跳」＝下衝擊（吞含狀態不影響；CD 中回落
        // 跳躍鏈不吞輸入）；地面照走 coyote/buffer 跳躍鏈，單向平台下穿由 stage
        // 層 shouldDropThrough 裁決並覆蓋跳躍脈衝（§29 既有優先序）。
        // §77：coyote 窗內視同在地（接觸旗標抖動免疫），下砸僅真空中觸發。
        // 衝撞躍（§110）：衝撞中按跳＝低弧跳、保持衝撞態，不進一般跳躍鏈。
        const chargeHop = chargeMs > 0 && controls.jumpPressed && (onGround || coyoteMs > 0);
        const jumpCommand =
          controls.jumpPressed && !slamming && !chargeHop
            ? resolveJumpPress({
                airborne: !onGround,
                down: controls.down,
                slamCooldownMs: slamCdMs,
                recentlyGroundedMs: coyoteMs,
              })
            : 'jump';
        if (chargeHop) {
          coyoteMs = 0;
          sprite.setVelocityY(SHELL_CHARGE.hopVy);
        } else if (jumpCommand === 'slam') {
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

        // B 鍵決策（§109 三語意收斂）：變身期間 B 改役形態技（吸入/發射停用）；
        // 其餘僅頂槽殼盾星走延遲（點按發射 vs 長按舉盾），有彈藥即按即射。
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
          } else if (transform.form === 'shell') {
            // 滾殼衝撞（§110）：B 點按起手；接觸傷由 overlaps 依衝撞態改判向小怪。
            if (chargeCdMs <= 0 && chargeMs <= 0) {
              chargeMs = SHELL_CHARGE.durationMs;
              chargeCdMs = SHELL_CHARGE.cooldownMs;
              playSfx('shell-spin');
              squashStretch(1.2, 0.85);
            }
          } else if (!transform.form) {
            const command = resolveActionPress({
              ammo: magazine.length,
              topIsShelly: isTopShelly(magazine),
            });
            if (command === 'fire') fireStar();
            else if (command === 'defer') deferredFire = true;
          }
        }

        // SP 情境鍵（§109）：點按依天然互斥語意分派——變身中解除／蓄能星引爆／
        // 資格成立（同系 ≥3、地面）立即變身；無技能可用時為 none。
        if (controls.spPressed) {
          const spEligible = eligibleForm(magazine);
          const command = resolveSpPress({
            phase: starburst.phase,
            transformActive: transform.form !== null,
            eligible: spEligible !== null,
            airborne: !onGround,
          });
          if (command === 'detonate') startDetonation();
          else if (command === 'transform' && spEligible) beginTransform(spEligible);
          else if (command === 'dismiss') finishTransform();
        }
      }

      // 殼盾情境點按（<150ms）於放開時發射；長按則交給舉盾或吸入。
      if (!controls.actionHeld) {
        if (deferredFire && hurtLockMs <= 0 && shouldFireOnRelease(actionHoldMs)) fireStar();
        deferredFire = false;
      }

      // 蓄爆推進（§109）：0.3s 不可取消，期滿結算星暴——清場委派 GameScene/starCombat，
      // 無敵窗沿 §64 取 max 不疊加。
      const detonation = tickDetonation(starburst, deltaMs);
      starburst = detonation.state;
      if (detonation.detonated) {
        stormInvulnMs = STARSTORM.invulnMs;
        playSfx('starstorm');
        emitGameEvent(scene.events, GameEvents.SKILL_STARSTORM, { x: sprite.x, y: sprite.y });
        emitStarburst();
      }
      chargedStar.update(sprite.x, sprite.y, deltaMs, starburst.phase);

      actionHoldMs = controls.actionHeld ? actionHoldMs + deltaMs : 0;
      // 殼盾（§109 收斂 §40 輸入矩陣）：頂槽殼盾星即為殼盾情境——長按語意固定為
      // 舉盾，舉盾中與盾 CD 中皆抑制吸入，不回落；變身中 B 已改役不進殼盾。
      const inShieldContext = shieldEligible(magazine) && !transform.form;
      shield = advanceShield(shield, {
        deltaMs,
        held: controls.actionHeld && actionHoldMs >= INHALE.holdThresholdMs && hurtLockMs <= 0,
        eligible: inShieldContext && hurtLockMs <= 0,
      });
      if (shield.raised && !wasShieldRaised) playSfx('shell-spin');
      wasShieldRaised = shield.raised;
      drawShield();
      // 吸入停用情境（§109）：變身中 B 已改役、殼盾情境長按舉盾，皆不進吸入。
      inhaling =
        actionHoldMs >= INHALE.holdThresholdMs &&
        !shield.raised &&
        !inShieldContext &&
        !transform.form;
      zoneBody.enable = inhaling;
      // 變身環（§57/§109）：變身中畫形態倒數；長按充能進度已隨 SP 即時變身退場。
      drawTransformRing();
      // 候選區前緣 zoneSpan、後緣 SHELLY_NEAR_PX（#844）：中心相應向面向側偏移。
      zone.setPosition(sprite.x + facing * ((zoneSpan - SHELLY_NEAR_PX) / 2), sprite.y);

      sprite.setFlipX(facing === -1);
      // 無敵閃爍沿用受擊回饋（§64）：受擊 i-frame 與星暴無敵窗共用同一節流視覺。
      const blinkMs = effectiveInvulnMs(invulnerableMs, stormInvulnMs);
      sprite.setAlpha(blinkMs > 0 && Math.floor(blinkMs / BLINK_INTERVAL_MS) % 2 === 0 ? 0.35 : 1);

      // 蹲姿（§77）：地面壓下即蹲——120ms 內壓扁＋下沉；離地或鬆開同速率還原。
      crouch = advanceCrouch(crouch, controls.down && onGround && !slamming, deltaMs);

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
      // 滾殼衝撞旋轉呈現（§110）：覆蓋走動傾角，沿殼刃自旋角速度。
      if (chargeMs > 0) sprite.rotation += facing * BOOM_SPIN_RAD * deltaMs;
      lastVy = body.velocity.y;

      // 大嘴吸入影格（§77.4）：吸入進行中兩影格交替；素材未載回退 hero-inhale。
      inhaleAnimMs = inhaling ? inhaleAnimMs + deltaMs : 0;
      const bigMouth: Pose =
        Math.floor(inhaleAnimMs / INHALE_FRAME_MS) % 2 === 0
          ? 'hero-inhale-big-1'
          : 'hero-inhale-big-2';
      const inhalePose: Pose =
        inhaling && scene.textures.exists(bigMouth) ? bigMouth : 'hero-inhale';

      // 形態貼圖（§57）：變身期間固定形態立繪；素材未載時退回一般姿勢（aura 保識別）。
      const formTexKey = transform.form ? `hero-${transform.form}` : null;
      if (formTexKey && scene.textures.exists(formTexKey)) {
        if (sprite.texture.key !== formTexKey) sprite.setTexture(formTexKey);
      } else if (invulnerableMs > 0) setPose('hero-hurt');
      else if (controls.actionHeld && magazine.length === 0 && !transform.form) setPose(inhalePose);
      else if (magazine.length > 0) setPose('hero-puffed');
      else setPose('hero-idle');

      // 卷軸世界以相機視野為界回收星彈；迴旋星另走壽命與回程驅動。
      const view = scene.cameras.main.worldView;
      for (const child of stars.getChildren()) {
        const star = child as Phaser.Physics.Arcade.Sprite;
        const margin = STAR_CULL_MARGIN_PX;
        if (star.active && (star.x < view.x - margin || star.x > view.right + margin)) {
          recycleStar(star);
        }
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
      // 受身入殼（§110）：殼化受擊自動入殼——本次傷害全免＋0.5s 免傷，每形態期 1 次；
      // 既有 i-frame 生效期間不消耗次數。
      if (
        transform.form === 'shell' &&
        effectiveInvulnMs(invulnerableMs, stormInvulnMs) <= 0 &&
        transform.tuckLeft > 0
      ) {
        transform = consumeTuck(transform).state;
        blockInvulnMs = Math.max(blockInvulnMs, SHELL_TUCK.invulnMs);
        squashStretch(0.8, 0.72);
        playSfx('metal');
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
      // 雷化受擊放電反擊（§110）：實扣傷害瞬間放電，世界結算交 GameScene（每形態期 2 次）。
      const discharge = consumeDischarge(transform);
      if (discharge.triggered) {
        transform = discharge.state;
        playSfx('zap');
        emitGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, {
          kind: 'volt-discharge',
          form: 'volt',
          x: sprite.x,
          y: sprite.y,
          facing,
        });
      }
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
      maybeCrystallize();
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
    getCrouch() {
      return crouch;
    },
    getMagazine() {
      return magazine;
    },
    grantFullMagazine() {
      magazine = fillMagazine(magazine);
      maybeCrystallize();
      emitAmmo();
    },
    grantGoldStar() {
      magazine = pushGoldStar(magazine);
      maybeCrystallize();
      emitAmmo();
    },
    // 星光虹吸被抽（§113）：頂槽出匣不發射；HUD ammo 事件同步。
    stealTopStar() {
      const popped = popTopSlot(magazine);
      if (!popped.slot) return false;
      magazine = popped.magazine;
      lastFlavor = popped.slot.flavor;
      emitAmmo();
      return true;
    },
    // e2e/QA 受控賦星：直接吞入指定屬性，走正式 swallow 管線維持連吞語意。
    grantStar(flavor: StarFlavor) {
      magazine = swallowIntoMagazine(magazine, flavor).magazine;
      lastFlavor = flavor;
      maybeCrystallize();
      emitAmmo();
    },
    isShieldRaised() {
      return shield.raised;
    },
    getTransformState() {
      return transform;
    },
    isShellCharging() {
      return chargeMs > 0;
    },
    getStarburst() {
      return starburst;
    },
    // 跨關授星（§109）：director 於 create 依 session 持有旗標呼叫；蓄爆中不覆蓋。
    grantStarburstCharge() {
      if (starburst.phase !== 'none') return;
      starburst = chargeStarburst();
      emitStarburst();
    },
    // 死亡/EX 進場清除（§109）：蓄能星與蓄爆一併取消，視覺隨相位隱藏。
    clearStarburst() {
      if (starburst.phase === 'none') return;
      starburst = createStarburstState();
      emitStarburst();
    },
    // SP 鍵呈現模式（§109）：GameScene 逐幀同步至 controls；地面判定就地取樣。
    getSpMode() {
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      return resolveSpMode({
        phase: starburst.phase,
        transformForm: transform.form,
        eligibleForm: eligibleForm(magazine),
        airborne: !(body.blocked.down || body.touching.down),
      });
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
    grantInvulnerability(durationMs: number) {
      invulnerableMs = Math.max(invulnerableMs, durationMs);
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
      chargedStar.destroy();
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
