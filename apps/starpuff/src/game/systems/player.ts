import Phaser from 'phaser';
import {
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
import {
  BOOM_SPIN_RAD,
  TRAIL_LIFESPAN_MS,
  WIND_TRAIL_LIFESPAN_MS,
  createStarLauncher,
} from './starLauncher';
import { GameEvents, emitGameEvent } from '../core/events';
import type { EnemyKind } from '../core/types';
import {
  INHALE_NEAR_PX,
  inhaleFlavor,
  inhaleZoneSpanPx,
  knockbackVelocity,
  resolveHit,
  tickTimer,
} from '../logic/combat';
import { approachVelocity, detectMoveFx, type MoveFxEvent } from '../logic/movement';
import {
  SHELL_SHIELD,
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
  starPitch,
  swallowIntoMagazine,
} from '../logic/skills';
import {
  beginDetonation,
  chargeStarburst,
  createStarburstState,
  resolveSpMode,
  resolveSpPress,
  resolveTransformMode,
  resolveTransformPress,
  shouldCrystallize,
  tickDetonation,
  type SpMode,
  type StarburstState,
  type TransformKeyMode,
} from '../logic/starburst';
import {
  GALE_FLIGHT,
  GALE_SHOT,
  GALE_GLIDE,
  GRAVITY_WELL,
  RAINBOW_BEAM,
  SHELL_CHARGE,
  SHELL_TUCK,
  TIDE_PULL,
  TRANSFORM_FORMS,
  VOLT_BEAM,
  absorbHalvedDamage,
  consumeDischarge,
  consumeTuck,
  createTransformState,
  consumeForTransform,
  eligibleForm,
  endTransform,
  glideFallVy,
  startTransform,
  tickTransform,
  type FormShotSpec,
  type TransformForm,
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
import { advanceHold, createHoldState } from '../logic/holdArbiter';
import { playSfx } from '../audio/sfx';
import { morphFrameKeys } from '../core/assetPlan';
import { createChargedStar } from './chargedStar';
import type { ControlsState } from './controls';
import { FX_TEXTURES, burstSmall, ensureFxTextures, heroLandingRing } from './fx';
import { burstLayers, flashSprite, flashStarImpact } from './fxLayers';
import { createFormSkills, resolveFormSkill } from './formSkills';
import { getVisualScale } from './visualScale';

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
  // 變身資格觀測（§119 解鎖閘一致性）：HUD/e2e 與 SP 鍵同一裁決，鎖定形態不成立。
  getEligibleForm(): TransformForm | null;
  // 滾殼衝撞（§110）：衝撞期觀測——overlaps 據此改判接觸傷向小怪結算。
  isShellCharging(): boolean;
  // 星暴 2.0（§109）：蓄能相位觀測、跨關授星、死亡/EX 清除與 SP 鍵呈現模式。
  getStarburst(): StarburstState;
  grantStarburstCharge(): void;
  clearStarburst(): void;
  getSpMode(): SpMode;
  getTransformKeyMode(): TransformKeyMode;
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
// 迴旋星自旋角速度（§53，與殼刃同值）。
// 殼化護體窗（§57）：減傷池實扣 0 時的短無敵，防同一接觸逐幀重複結算。
const SHELL_GUARD_MS = 400;
// 蹲姿視覺（§77）：橫向外擴＋縱向壓扁＋輕微下沉；scale 走 visualScale 視覺通道，
// 物理永不見蹲縮。
const CROUCH_SQUASH_X = 0.14;
const CROUCH_SQUASH_Y = 0.22;
const CROUCH_SINK_PX = 3;
// 大嘴吸入影格（§77.4）：吸入中兩影格交替營造吸力節奏；素材未載回退 hero-inhale。
const INHALE_FRAME_MS = 160;
// 變身分鏡幀長（§124 W5a）：五幀約 450ms，僅顯示層演出（操作不鎖）。
const MORPH_FRAME_MS = 90;
// SP 長按門檻（#948）：沿 prism 的 B 長按語彙量級，短於形態技以免誤觸。
// 形態技長按門檻（#948）：與 SP 同量級；變身期有彈藥時 B 點按射星、長按出技。
const FORM_SKILL_HOLD_MS = 220;
// 魔王頭頂命中回彈初速（§58）。
const SLAM_BOUNCE_VY = -380;

// unlockedForms（§119）：GameScene 依進度派生的形態解鎖集——資格裁決單點注入。
export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  unlockedForms: ReadonlySet<TransformForm>,
): PlayerHandle {
  // art stream 紋理未載入時退回內建白色矩形，避免本地驗證噴 missing texture。
  const tex = (key: string) => (scene.textures.exists(key) ? key : '__WHITE');
  // 主角輪廓對比（§45）：深紫剪影背襯作描邊，淡色底提升至 ≥3:1。先建 image 繪於
  // 本體之後；不用 Glow filter——低階 GPU 下每幀模糊採樣致幀率崩跌。
  const silhouette = scene.add.image(x, y, tex('hero-idle'));
  silhouette.setDisplaySize(PLAYER_SIZE * HERO_OUTLINE_SCALE, PLAYER_SIZE * HERO_OUTLINE_SCALE);
  silhouette.setTint(HERO_OUTLINE_COLOR);
  silhouette.setTintMode(Phaser.TintModes.FILL);
  const sprite = scene.physics.add.sprite(x, y, tex('hero-idle'));
  sprite.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
  sprite.setCollideWorldBounds(true);
  // 物理/視覺縮放解耦（§77）：擠壓/呼吸/蹲縮全走視覺通道，物理箱恆為基準尺寸。
  const vscale = getVisualScale(scene);
  vscale.register(sprite);
  const fxScale = vscale.fx(sprite);
  const modScale = vscale.mod(sprite);

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

  // 寬容度 hurtbox（§15.1）：視覺 75%W×80%H 貼齊腳底。R8 改換裝時現算——凍結
  // 生成時的 512 源尺寸會使換到 768/1254 貼圖後碰撞箱縮水 33%~59% 而視覺不動。
  const fitHurtbox = () => {
    const frameW = sprite.frame.realWidth;
    const frameH = sprite.frame.realHeight;
    const hurtW = frameW * FORGIVENESS.hurtboxWidthRatio;
    const hurtH = frameH * FORGIVENESS.hurtboxHeightRatio;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(hurtW, hurtH, false);
    body.setOffset((frameW - hurtW) / 2, frameH - hurtH);
    // 首幀同步（#896）：setSize 以上次快取的 _sx 換算世界尺寸，換裝當幀 scale 已變
    // 而快取未更——立即 updateBounds 消除暫態誤差（否則下一物理步才自動修正）。
    body.updateBounds();
  };
  fitHurtbox();

  // 吸入判定區：面向錐形的廣域矩形（#811 依最大判定半徑取邊）＋反向側貼身帶（#844
  // 候選區鋪到背後 INHALE_NEAR_PX，對齊邏輯層貼身豁免——否則反向豁免永不可達）；
  // 精確錐形與豁免仍由 combat.isInInhalePullRange 逐幀收斂（#841 豁免泛化全可吸品種）。
  const zoneSpan = inhaleZoneSpanPx(INHALE.rangePx);
  const zone = scene.add.zone(x, y, zoneSpan + INHALE_NEAR_PX, zoneSpan);
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
  // SP 長按分流狀態（#948）。
  // 點按／長按仲裁（#948，共用 logic/holdArbiter）。
  let formHoldState = createHoldState();
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
  // formCdMs（§119）：風刃/焰彈/稜片/水引/引力井/光束共用形態技 CD（形態互斥）。
  // prismArm（§119）：稜化 B 語意延遲——放開時依按住時長分派碎片（點按）或光束（長按）。
  let transform = createTransformState();
  let voltCdMs = 0;
  let formCdMs = 0;
  let prismArm = false;
  let halfDamagePool = 0;
  // 滾殼衝撞（§110）：衝撞剩餘時長與 CD。
  let chargeMs = 0;
  let chargeCdMs = 0;
  // 變身分鏡（§124 W5a）：五幀依序穿戴後落形態立繪；全五幀在場才播（部分缺圖
  // 直接落立繪），全程走 wearTexture 唯一入口維持 hurtbox 恆定。
  let morphFrames: readonly string[] | null = null;
  let morphMs = 0;

  // 走路 bob 視覺 y 偏移（US-022 / recon 硬規則 10）：不動 displayOrigin、不污染物理。
  // POST_UPDATE（物理回寫後）套用偏移供渲染，下一幀 PRE_UPDATE（物理讀取前）復原。
  // 蹲姿 scale 已遷入 visualScale mod 乘子（§77 解耦）；此處僅餘 y 偏移（bob＋下沉）。
  let bobOffset = 0;
  let crouch = 0;
  let appliedSink = 0;
  const applyBob = () => {
    sprite.y -= bobOffset;
    appliedSink = CROUCH_SINK_PX * crouch;
    sprite.y += appliedSink;
  };
  const revertBob = () => {
    sprite.y += bobOffset;
    sprite.y -= appliedSink;
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, applyBob);
  scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, revertBob);
  // 剪影同步掛在 applyBob 之後（同事件註冊序）：取到含 bob 的最終視覺座標。
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, syncSilhouette);

  // 換裝統一入口（PR #886 R7）：素材源尺寸不一（512/768/1254），換圖必重算
  // displaySize 並回寫 vscale 基準——否則變身瞬間視覺暴增且與生成時錨定的
  // 物理箱脫鉤（vscale 每幀以註冊基準覆寫 scale，單改 displaySize 會被沖掉）。
  const wearTexture = (key: string) => {
    sprite.setTexture(key);
    sprite.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
    vscale.rebase(sprite);
    // hurtbox 同步現算（R8）：視覺與判定箱一起與源解析度解耦。
    fitHurtbox();
  };

  const setPose = (next: Pose) => {
    if (pose === next) return;
    pose = next;
    wearTexture(tex(next));
  };

  // squash/stretch（§77 解耦）：fx 代理瞬間變形再 tween 回 1；物理箱恆為基準不動。
  const squashStretch = (sx: number, sy: number) => {
    vscale.resetFx(sprite);
    fxScale.sx = sx;
    fxScale.sy = sy;
    scene.tweens.add({ targets: fxScale, sx: 1, sy: 1, duration: 160, ease: 'Back.easeOut' });
  };

  // 落地塵埃圈：腳邊白描邊橢圓擴散淡出（graphics 組合，不依賴 fx.ts）。
  // intensity > 1 為下衝擊加強版：更大擴散 + 更粗描邊。
  const spawnDustRing = (intensity = 1) =>
    heroLandingRing(scene, sprite.x, sprite.y, PLAYER_SIZE / 2, intensity);

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

  // 形態呈現與攻擊彈（§57/§119）：aura／變身環／護體視覺／偽星彈發射委派 formSkills。
  const formSkills = createFormSkills(scene, sprite, stars, tex);

  // 形態攻擊彈發射（§57 風刃／§119 焰彈·稜片）：面向嘴前出彈，風刃保留扁身長尾。
  const fireFormShot = (shot: FormShotSpec, flat: boolean) => {
    const spec = transform.form ? TRANSFORM_FORMS[transform.form] : null;
    formSkills.launchShot({
      x: sprite.x + facing * (PLAYER_SIZE / 2 + 8),
      y: sprite.y,
      facing,
      spec: shot,
      tint: spec?.tint ?? CHARGED_STAR.tint,
      pitch: 1.4,
      flat,
      trailLifespanMs: flat ? WIND_TRAIL_LIFESPAN_MS : TRAIL_LIFESPAN_MS,
      // 稜片視覺味（§124 W5a）：彈體與命中閃走 fx-star-prism 專屬素材。
      fxFlavor: transform.form === 'prism' ? 'prism' : undefined,
    });
  };

  // 形態技世界結算事件單一出口（§119）：tide-pull／gravity-well／rainbow-beam。
  const emitFormStrike = (
    kind: 'tide-pull' | 'gravity-well' | 'rainbow-beam' | 'volt-beam',
    form: TransformForm,
  ) => {
    emitGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, {
      kind,
      form,
      x: sprite.x + facing * (PLAYER_SIZE / 2 + 6),
      y: sprite.y,
      facing,
    });
  };

  // 變身進入（§57）：消耗全部彈匣、爆發特效、啟用形態 aura。
  const beginTransform = (form: TransformForm) => {
    transform = startTransform(form);
    // #948：只扣達標所需星單位，餘槽保留供變身期間射擊。
    magazine = consumeForTransform(magazine, form);
    deferredFire = false;
    prismArm = false;
    halfDamagePool = 0;
    voltCdMs = 0;
    formCdMs = 0;
    chargeMs = 0;
    chargeCdMs = 0;
    // 變身分鏡（§124 W5a）：全五幀在場才播，缺任一幀直接落形態立繪。
    const frames = morphFrameKeys(form);
    morphFrames = frames.every((key) => scene.textures.exists(key)) ? frames : null;
    morphMs = 0;
    emitAmmo();
    playSfx('starstorm');
    burstSmall(scene, sprite.x, sprite.y, TRANSFORM_FORMS[form].tint);
    squashStretch(1.35, 0.7);
    formSkills.begin(form);
  };

  // 解除（到期或再長按提前）：不返彈；aura 停用、外觀復原、衝撞態一併結束。
  const finishTransform = () => {
    const form = transform.form;
    transform = endTransform();
    chargeMs = 0;
    prismArm = false;
    morphFrames = null;
    if (!form) return;
    formSkills.end(form);
    playSfx('pop');
    burstSmall(scene, sprite.x, sprite.y, TRANSFORM_FORMS[form].tint);
    // 立即回復非變身貼圖（setPose 快取不變時不重設，故直接走換裝入口覆寫）。
    wearTexture(tex(pose));
  };

  // 星彈發射／回收管線抽離（PR #886 R8）：彈體生命週期歸 starLauncher，
  // 彈匣狀態與發射節奏留本檔；stars 群組所有權仍在此（formSkills 共用池）。
  const starLauncher = createStarLauncher(scene, stars, {
    facing: () => facing,
    muzzle: () => ({ x: sprite.x + facing * (PLAYER_SIZE / 2 + 8), y: sprite.y }),
    tex,
  });

  const emitAmmo = () => {
    emitGameEvent(scene.events, GameEvents.AMMO_CHANGED, {
      ammo: magazine.length,
      maxAmmo: STAR.maxAmmo,
      flavor: magazine[magazine.length - 1]?.flavor ?? lastFlavor,
      magazine,
    });
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
        starLauncher.launch(slot, (i - (scatter - 1) / 2) * SCATTER_FAN_VY);
      }
    } else {
      starLauncher.launch(slot, 0);
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

  return {
    sprite,
    update(controls: ControlsState, deltaMs: number) {
      invulnerableMs = tickTimer(invulnerableMs, deltaMs);
      stormInvulnMs = tickTimer(stormInvulnMs, deltaMs);
      hurtLockMs = tickTimer(hurtLockMs, deltaMs);
      slamCdMs = tickTimer(slamCdMs, deltaMs);
      blockInvulnMs = tickTimer(blockInvulnMs, deltaMs);
      voltCdMs = tickTimer(voltCdMs, deltaMs);
      formCdMs = tickTimer(formCdMs, deltaMs);
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
        // 落地擠壓（§77 已由 visualScale 解耦根治）：擠壓不再縮物理箱，任何著地
        // 皆可安全觸發；最低著地速度門檻補丁退場。
        squashStretch(1.25, 0.75);
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
          // 落地衝擊（§57 風化／§119 焰化熔岩爆）：資料驅動 landingImpact，世界結算交 GameScene。
          if (formSpec?.landingImpact && transform.form) {
            emitGameEvent(scene.events, GameEvents.SKILL_TRANSFORM_STRIKE, {
              kind: transform.form === 'ember' ? 'magma-pop' : 'gale-landing',
              form: transform.form,
              x: sprite.x,
              y: sprite.y,
              facing,
            });
          }
        }
      }
      wasOnGround = onGround;

      if (hurtLockMs <= 0) {
        // 加減速曲線（§41）逐幀逼近；星化移速（§57）與疾風靴（§69）倍率疊乘；
        // 風化滑翔（§110）：空中持跳且下落＝緩降＋水平漂移 ×1.6。
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

        // 跳躍鍵矩陣（§44/§29/§77/§110）：空中「下＋跳」＝下衝擊（僅真空中，
        // coyote 窗視同在地）；地面走 coyote/buffer 跳躍鏈，下穿由 stage 裁決；
        // 衝撞中按跳＝低弧跳保持衝撞態。
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
              formSpec &&
              flapsUsed < PLAYER.maxFlaps &&
              formSkills.airMove(formSpec, facing)
            ) {
              // 焰衝刺／鏡步（§119）：形態機動佔用空中跳槽位，消耗拍翅次數。
              flapsUsed += 1;
            } else if (
              controls.jumpPressed &&
              (formSpec?.freeFlight || flapsUsed < PLAYER.maxFlaps)
            ) {
              // 風化近自由飛行（§57）：拍翅無上限＋升力增強。
              if (!formSpec?.freeFlight) flapsUsed += 1;
              sprite.setVelocityY(formSpec?.freeFlight ? GALE_FLIGHT.floatLift : PLAYER.floatLift);
              squashStretch(0.9, 1.12);
              // 浮空分層特效（§124 W5a）：拍翅腳下氣旋，缺載時僅擠壓回饋。
              burstLayers(scene, sprite.x, sprite.y + PLAYER_SIZE / 2, 'fx-common-float', {
                sizePx: 42,
                depth: 12,
                debrisCount: 4,
              });
            } else if (controls.jumpPressed) {
              jumpBufferMs = FORGIVENESS.jumpBufferMs;
            }
          }
        }

        // B 鍵決策（§109／#948）：變身期有彈藥時點按射星、長按出形態技；空匣時
        // 點按即形態技。修前 B 全被形態技接管＋變身清匣＝變身期零星彈輸出。
        const formSkillOnTap = transform.form !== null && magazine.length === 0;
        if (transform.form !== null && !formSkillOnTap && controls.actionPressed) {
          // 有彈藥：點按射星（形態技改由下方長按分派）。
          if (hurtLockMs <= 0) fireStar();
        }
        const formStep = advanceHold(formHoldState, {
          pressed: controls.actionPressed,
          held: controls.actionHeld,
          deltaMs,
          thresholdMs: FORM_SKILL_HOLD_MS,
          ambiguous: !formSkillOnTap,
        });
        formHoldState = formStep.state;
        // 空匣點按即出技（無星可射不該要求長按）；有彈藥則長按才出技。
        const formSkillFire =
          formStep.outcome === 'hold' || (formSkillOnTap && formStep.outcome === 'tap');
        if (transform.form !== null && formSkillFire) {
          const effect = resolveFormSkill({
            form: transform.form,
            spec: formSpec,
            voltCdMs,
            formCdMs,
            chargeMs,
            chargeCdMs,
            galeShot: GALE_SHOT,
            tidePullCooldownMs: TIDE_PULL.cooldownMs,
            gravityWellCooldownMs: GRAVITY_WELL.cooldownMs,
          });
          if (effect.kind === 'volt-beam') {
            voltCdMs = VOLT_BEAM.cooldownMs;
            emitFormStrike('volt-beam', 'volt');
          } else if (effect.kind === 'form-shot') {
            formCdMs = effect.cooldownMs;
            fireFormShot(effect.spec, effect.flat);
          } else if (effect.kind === 'prism-arm') {
            prismArm = true;
          } else if (effect.kind === 'tap-strike') {
            formCdMs = effect.cooldownMs;
            playSfx(effect.strike === 'tide-pull' ? 'pop' : 'charge', 0.9);
            emitFormStrike(effect.strike, transform.form);
          } else if (effect.kind === 'shell-charge') {
            chargeMs = SHELL_CHARGE.durationMs;
            chargeCdMs = SHELL_CHARGE.cooldownMs;
            playSfx('shell-spin');
            squashStretch(1.2, 0.85);
          }
        }
        // 未變身：沿既有 B 語意（殼盾星延遲／即按即射）。
        if (transform.form === null && controls.actionPressed) {
          const command = resolveActionPress({
            ammo: magazine.length,
            topIsShelly: isTopShelly(magazine),
          });
          if (command === 'fire') fireStar();
          else if (command === 'defer') deferredFire = true;
        }

        // SP／TF 兩鍵（#952 拆鍵）：各自單義，按下緣即時結算——長按分流隨兩義消失
        // 一併移除（holdArbiter 仍由稜化 B 鍵消費）。
        const spEligible = eligibleForm(magazine, unlockedForms);
        if (controls.spPressed && resolveSpPress({ phase: starburst.phase }) === 'detonate') {
          startDetonation();
        }
        if (controls.transformPressed) {
          const command = resolveTransformPress({
            transformActive: transform.form !== null,
            eligible: spEligible !== null,
          });
          if (command === 'transform' && spEligible) beginTransform(spEligible);
          else if (command === 'dismiss') finishTransform();
        }
      }

      // 殼盾情境點按（<150ms）於放開時發射；長按則交給舉盾或吸入。
      if (!controls.actionHeld) {
        if (deferredFire && hurtLockMs <= 0 && shouldFireOnRelease(actionHoldMs)) fireStar();
        deferredFire = false;
        // 稜化 B 放開分派（§119）：長按 ≥ 門檻＝彩虹光束、否則三向稜光碎片。
        if (prismArm && transform.form === 'prism' && hurtLockMs <= 0 && formCdMs <= 0) {
          const spec = TRANSFORM_FORMS.prism;
          if (actionHoldMs >= RAINBOW_BEAM.holdMs) {
            formCdMs = RAINBOW_BEAM.cooldownMs;
            playSfx('charge', 1.2);
            emitFormStrike('rainbow-beam', 'prism');
          } else if (spec.shot) {
            formCdMs = spec.shot.cooldownMs;
            fireFormShot(spec.shot, false);
          }
        }
        prismArm = false;
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
      // 變身環＋護體視覺（§57/§109/§119）：形態倒數與泡泡盾/星體護衛逐幀重繪。
      formSkills.draw(transform, sprite.x, sprite.y, scene.time.now);
      // 候選區前緣 zoneSpan、後緣 INHALE_NEAR_PX（#844）：中心相應向面向側偏移。
      zone.setPosition(sprite.x + facing * ((zoneSpan - INHALE_NEAR_PX) / 2), sprite.y);

      sprite.setFlipX(facing === -1);
      // 無敵閃爍沿用受擊回饋（§64）：受擊 i-frame 與星暴無敵窗共用同一節流視覺。
      const blinkMs = effectiveInvulnMs(invulnerableMs, stormInvulnMs);
      sprite.setAlpha(blinkMs > 0 && Math.floor(blinkMs / BLINK_INTERVAL_MS) % 2 === 0 ? 0.35 : 1);

      // 蹲姿（§77）：地面壓下即蹲——120ms 內壓扁＋下沉；離地或鬆開同速率還原。
      crouch = advanceCrouch(crouch, controls.down && onGround && !slamming, deltaMs);

      // 走動手感（§45）：速度驅動步頻導出 bob 與前傾搖擺；空中依 vy 傾姿；
      // 靜止走 idle 呼吸（visualScale mod，squash tween 進行中讓位）。
      let breathY = 0;
      if (onGround && body.velocity.x !== 0) {
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
        stridePhase = 0;
        bobOffset = 0;
        sprite.setRotation(facing * airTilt(body.velocity.y));
      } else {
        if (stridePhase !== 0 || sprite.rotation !== 0) {
          stridePhase = 0;
          sprite.setRotation(0);
          bobOffset = 0;
        }
        if (!vscale.isFxTweening(sprite)) breathY = idleBreath(scene.time.now);
      }
      // 蹲縮＋呼吸逐幀寫入 mod 視覺乘子（§77 解耦）：物理箱不受影響。
      modScale.sx = 1 + CROUCH_SQUASH_X * crouch;
      modScale.sy = (1 - CROUCH_SQUASH_Y * crouch) * (1 + breathY);
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

      // 變身分鏡推進（§124 W5a）：五幀播畢清序列落形態立繪。
      if (transform.form && morphFrames) {
        morphMs += deltaMs;
        if (Math.floor(morphMs / MORPH_FRAME_MS) >= morphFrames.length) morphFrames = null;
      }
      // 形態貼圖（§57/§124）：分鏡播放中逐幀穿戴、播畢固定形態立繪；素材未載時
      // 退回一般姿勢（aura 保識別）。
      const morphKey = transform.form
        ? morphFrames?.[Math.floor(morphMs / MORPH_FRAME_MS)]
        : undefined;
      const formTexKey = transform.form ? (morphKey ?? `hero-${transform.form}`) : null;
      if (formTexKey && scene.textures.exists(formTexKey)) {
        if (sprite.texture.key !== formTexKey) wearTexture(formTexKey);
      } else if (invulnerableMs > 0) setPose('hero-hurt');
      else if (controls.actionHeld && magazine.length === 0 && !transform.form) setPose(inhalePose);
      else if (magazine.length > 0) setPose('hero-puffed');
      else setPose('hero-idle');

      // 出視野回收與迴旋星驅動歸 starLauncher（R8 抽離）。
      starLauncher.cullOffscreen(scene.cameras.main.worldView);
      starLauncher.steerBoomerangs(deltaMs);
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
      // 護體（§110 受身入殼→§119 泛化）：殼化入殼／潮化泡泡盾／引力化星體護衛——
      // 本次傷害全免＋0.5s 免傷，次數由 spec.tuckCharges 種入；i-frame 期不消耗。
      if (
        transform.form !== null &&
        effectiveInvulnMs(invulnerableMs, stormInvulnMs) <= 0 &&
        transform.tuckLeft > 0
      ) {
        const tuckForm = transform.form;
        transform = consumeTuck(transform).state;
        blockInvulnMs = Math.max(blockInvulnMs, SHELL_TUCK.invulnMs);
        squashStretch(0.8, 0.72);
        playSfx('metal');
        // 護體消耗爆閃（§124 W5a）：潮化泡泡盾／引力化星體護衛以形態蓄能素材回饋。
        if (tuckForm === 'tide' || tuckForm === 'gravity') {
          flashSprite(scene, `fx-star-${tuckForm}-charge`, sprite.x, sprite.y, 64, {
            durationMs: 260,
            depth: 90,
            fromScale: 1.5,
          });
        }
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
      // 受擊擠壓（§18 回饋）：自 fx 系統遷入受擊結算單點（§77 解耦，走 fx 代理）。
      squashStretch(1.28, 0.72);
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
      // 可視性優先（回退 §124 W5a 吞入衝擊圈）：吞噬確認緊接下一次吸入，嘴前殘留
      // 220~260ms 的 shock/trail 會蓋住下一個待吸目標——確認回饋沿既有音效與彈匣 HUD。
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
    getEligibleForm() {
      return eligibleForm(magazine, unlockedForms);
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
      return resolveSpMode({ phase: starburst.phase });
    },
    // TF 鍵呈現模式（#952）：地面判定就地取樣，與 resolveTransformPress 同一裁決。
    getTransformKeyMode() {
      return resolveTransformMode({
        transformForm: transform.form,
        eligibleForm: eligibleForm(magazine, unlockedForms),
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
      // 星味命中演出（§124 W5a）：hit 閃／explosion 環單一出口在 fxLayers。
      flashStarImpact(scene, s, mode === 'absorb');
      if (mode === 'absorb') {
        starLauncher.recycle(s);
        return;
      }
      const pierceLeft = (s.getData('pierce') as number) ?? 0;
      if (pierceLeft > 0) s.setData('pierce', pierceLeft - 1);
      else starLauncher.recycle(s);
    },
    destroy() {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, applyBob);
      scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, revertBob);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, syncSilhouette);
      scene.tweens.killTweensOf(sprite);
      vscale.unregister(sprite);
      footDust.destroy();
      chargedStar.destroy();
      shieldGfx.destroy();
      formSkills.destroy();
      silhouette.destroy();
      sprite.destroy();
      zone.destroy();
      stars.destroy(true);
    },
  };
}
