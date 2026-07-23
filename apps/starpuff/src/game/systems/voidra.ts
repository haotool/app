import Phaser from 'phaser';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { approachPoint, type FlightPoint } from '../logic/noctraFlight';
import type { MeteorSpec } from '../logic/meteor';
import { STAR_SIPHON, siphonStreamStrength } from '../logic/starSiphon';
import { EX_VOIDRA, VOIDRA, createVoidraFsm, type VoidraCommand } from '../logic/voidraFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { ensureFxTextures, spawnTelegraph } from './fx';

// 蝕星魔核 Voidra 呈現層（GAME_DESIGN §82）：與 boss/noctra/prismix/syrona 共用
// BossHandle。場控收束型：核心懸浮不落地，位置一律以 approachPoint 逼近錨點
//（§64 慣例，禁絕對座標直寫）；phase truth 由 logic/voidraFsm.ts 持有，
// 本模組僅結算演出/幾何/物理。arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。

const GROUND_TOP = VIEW.height - 80;
const BODY_SIZE = 140;
// 核心錨點：P1 中高懸浮、P2 升頂不可及、過熱窗/P3 下沉可打帶。
const ANCHOR_P1_Y = 175;
const ANCHOR_TOP_Y = 26;
const ANCHOR_OVERHEAT_Y = 205;
const ANCHOR_P3_Y = 190;
// 歸位逼近上限（§64 慣例）：有限速度、單 tick 位移 ≤ maxSpeed×dt。
const APPROACH_SPEED = 300;
const SWAY_FREQ = 0.0009;
const SWAY_AMP_RATIO = 0.16;
const BOB_FREQ = 0.0021;
const BOB_AMP_PX = 10;
// P1 重力牽引：水平位移推移（positional drift，恆低於玩家全速，交叉不變式 16）。
const PULL_P1_PX_PER_SEC = 110;
// 投射物參數。
const RING_SPEED = 175;
const CLAW_W = 130;
const CLAW_H = 72;
const CLAW_ACTIVE_MS = 420;
const PILLAR_W = 40;
const PILLAR_H = 150;
const PILLAR_FALL_SPEED = 520;
const PILLAR_TELEGRAPH_MS = 700;
const PILLAR_X_RATIOS = [0.24, 0.5, 0.76] as const;
const SPIRAL_STEP_MS = 130;
const SPIRAL_SPEED = 150;
const BARRAGE_RADIAL_SPEED = 190;
// P2 轟炸（重用 meteor 管線）：EX 密度 ÷1.25。
const BOMBARDMENT: MeteorSpec = { intervalMs: 3400, waveSize: 2 };
// P2 星屑空投：緩降速度與收集帶（沿 pickups 幾何判定慣例）。
const SHARD_DRIFT_PX_PER_SEC = 55;
const SHARD_HALF_W = 26;
const SHARD_HALF_H = 30;
// P2 段內固定慈悲愛心投放時刻（§6.3 保底路徑一環）。
const SURVIVAL_HEART_AT_MS = 16_000;
const CORE_TINT = 0x685aa8;
const CRACK_TINT = 0xffd966;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近星核 → 自星空降臨 → 咆哮 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [18, 14, 34] as const;

// 佔位材質：正式 sprite 缺件時以蝕星球體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('boss-voidra')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(CORE_TINT, 1);
    g.fillCircle(BODY_SIZE / 2, BODY_SIZE / 2, BODY_SIZE / 2);
    g.lineStyle(4, CRACK_TINT, 0.9);
    g.strokeCircle(BODY_SIZE / 2, BODY_SIZE / 2, BODY_SIZE / 2 - 3);
    g.lineStyle(3, CRACK_TINT, 0.8);
    g.lineBetween(BODY_SIZE * 0.3, BODY_SIZE * 0.35, BODY_SIZE * 0.55, BODY_SIZE * 0.62);
    g.lineBetween(BODY_SIZE * 0.55, BODY_SIZE * 0.62, BODY_SIZE * 0.72, BODY_SIZE * 0.4);
    g.generateTexture('boss-voidra', BODY_SIZE, BODY_SIZE);
    g.destroy();
  }
  if (!scene.textures.exists('voidra-shot')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xb8a0f0, 1);
    g.fillCircle(9, 9, 9);
    g.fillStyle(0xe8dcff, 1);
    g.fillCircle(9, 9, 4.5);
    g.generateTexture('voidra-shot', 18, 18);
    g.destroy();
  }
}

export interface VoidraHooks {
  // 星核共鳴（§83）：P2 星屑 5 枚全收——GameScene 餵彩蛋觸發器＋星雨謝幕變體。
  onShardEgg(): void;
  // 星光虹吸（§113）：抽走玩家彈匣頂槽 1 發；空匣回 false（僅演出不獲盾）。
  drainTopStar(): boolean;
  // P2 定點轟炸（§82 重用 meteor 管線）：GameScene 單一 meteor 系統開關與調參。
  setBombardment(spec: MeteorSpec | null): void;
  // P3 全場低重力（§81 gravityScale 0.55 注入；null＝回關卡預設）。
  setGravityScale(scale: number | null): void;
  // P2 段內固定慈悲愛心（§6.3 保底）：GameScene 走既有 heal pickup 管線。
  dropSurvivalHeart(): void;
}

export interface VoidraOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createVoidra(
  scene: Phaser.Scene,
  hooks: VoidraHooks,
  options: VoidraOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createVoidraFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  // 牽引狀態（P1 pull／P3 crush 共用）：迄點與強度。
  let pullUntilMs = 0;
  let pullStrength = 0;
  let heartDropped = false;
  const shards = new Set<Phaser.GameObjects.Image>();
  const shardUpdaters = new Map<Phaser.GameObjects.Image, () => void>();
  // 星光虹吸（§113）：吸流窗迄點（視覺用；窗真值＝FSM state）與護盾環。
  let siphonUntilMs = 0;
  let lastStreamAt = 0;
  const shieldOrbs: Phaser.GameObjects.Image[] = [];

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;

  const body = scene.physics.add.sprite(arenaCx(), -BODY_SIZE, 'boss-voidra');
  body.setDisplaySize(BODY_SIZE, BODY_SIZE);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.85, body.height * 0.85);

  const projectiles = scene.physics.add.group({ maxSize: 44, allowGravity: false });
  const shockwaves = scene.physics.add.group({ maxSize: 10, allowGravity: false });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  const flashWhite = () => {
    body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    delay(90, () => {
      body.setTintMode(Phaser.TintModes.MULTIPLY);
      body.clearTint();
    });
  };

  const spawnShot = (
    x: number,
    y: number,
    vx: number,
    vy: number,
  ): Phaser.Physics.Arcade.Sprite | null => {
    const shot = projectiles.get(x, y, 'voidra-shot') as Phaser.Physics.Arcade.Sprite | null;
    if (!shot) return null;
    shot.enableBody(true, x, y, true, true);
    (shot.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (shot.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
    return shot;
  };

  // 重力牽引（P1）／黑洞潮汐（P3）：空間漣漪 telegraph＋期間水平牽引。
  const doPull = (durationMs: number, strengthPxPerSec: number) => {
    pullUntilMs = elapsedMs + durationMs;
    pullStrength = strengthPxPerSec;
    playSfx('inhale', 0.5);
    // 漣漪視覺：由外向核心收斂的圓環 ×3。
    for (let i = 0; i < 3; i += 1) {
      delay(i * (durationMs / 3), () => {
        if (dying) return;
        const ripple = scene.add
          .circle(body.x, body.y, 170, 0x000000, 0)
          .setStrokeStyle(3, 0xb8a0f0, 0.7)
          .setDepth(57);
        scene.tweens.add({
          targets: ripple,
          scale: 0.15,
          alpha: 0,
          duration: durationMs / 2.4,
          ease: 'Quad.easeIn',
          onComplete: () => ripple.destroy(),
        });
      });
    }
  };

  // 星屑彈環（P1）：自核心放射 ×count。
  const doRing = (count: number) => {
    flashWhite();
    playSfx('pop', 0.9);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.PI / count;
      spawnShot(body.x, body.y, Math.cos(angle) * RING_SPEED, Math.sin(angle) * RING_SPEED);
    }
  };

  // 虛空爪擊（P1）：鎖定位置揮掃——落點紫紋 telegraph 0.6s 後爪影橫掃（鎖定後不修正）。
  const doClaw = () => {
    const lockX = Phaser.Math.Clamp(
      target?.x ?? arenaCx(),
      arenaLeft() + CLAW_W / 2,
      arenaLeft() + viewW() - CLAW_W / 2,
    );
    spawnTelegraph(scene, lockX, GROUND_TOP - 8, VOIDRA.clawTelegraphMs);
    delay(VOIDRA.clawTelegraphMs, () => {
      if (dying) return;
      playSfx('boss-slam', 0.7);
      const claw = shockwaves.get(
        lockX,
        GROUND_TOP - CLAW_H / 2,
        '__WHITE',
      ) as Phaser.Physics.Arcade.Sprite | null;
      if (!claw) return;
      claw.enableBody(true, lockX, GROUND_TOP - CLAW_H / 2, true, true);
      claw.setDisplaySize(CLAW_W, CLAW_H).setTint(0x4a3a78).setAlpha(0.85);
      claw.setScale(claw.scaleX, 0.25);
      scene.tweens.add({ targets: claw, scaleY: CLAW_H / claw.height, duration: 130 });
      delay(CLAW_ACTIVE_MS, () => claw.disableBody(true, true));
    });
  };

  // 晶柱崩落（P2 波次）：三點位預警後晶柱直墜（落地即碎）。
  const doPillar = () => {
    playSfx('zap', 0.5);
    for (const ratio of PILLAR_X_RATIOS) {
      const x = arenaX(ratio + (Math.random() - 0.5) * 0.06);
      spawnTelegraph(scene, x, GROUND_TOP - 8, PILLAR_TELEGRAPH_MS);
      delay(PILLAR_TELEGRAPH_MS, () => {
        if (dying) return;
        const pillar = shockwaves.get(
          x,
          -PILLAR_H / 2,
          '__WHITE',
        ) as Phaser.Physics.Arcade.Sprite | null;
        if (!pillar) return;
        pillar.enableBody(true, x, -PILLAR_H / 2, true, true);
        pillar.setDisplaySize(PILLAR_W, PILLAR_H).setTint(0x9080d8).setAlpha(0.92);
        (pillar.body as Phaser.Physics.Arcade.Body).setVelocityY(PILLAR_FALL_SPEED);
      });
    }
  };

  // 星屑空投（P2 彩蛋收集）：緩降星屑，收集判定沿 pickups 幾何模式（AABB＋水平掃掠）。
  const dropShard = () => {
    const x = arenaX(0.15 + Math.random() * 0.7);
    const shard = scene.add
      .image(x, 60, 'fx-star')
      .setDisplaySize(34, 34)
      .setTint(CRACK_TINT)
      .setDepth(72);
    shards.add(shard);
    playSfx('reveal', 0.7);
    let prevPlayerX: number | null = null;
    const collect = () => {
      removeShard(shard);
      playSfx('jingle', 0.8);
      const result = fsm.collectShard();
      scene.tweens.add({
        targets: scene.add
          .image(shard.x, shard.y, 'fx-star')
          .setDisplaySize(52, 52)
          .setTint(CRACK_TINT)
          .setAlpha(0.9)
          .setDepth(73),
        alpha: 0,
        scale: 2,
        duration: 380,
        onComplete: (tween) => (tween.targets[0] as Phaser.GameObjects.Image).destroy(),
      });
      if (result.complete) hooks.onShardEgg();
    };
    const onUpdate = () => {
      if (!shard.active || !target) return;
      const playerBody = (target as Phaser.Physics.Arcade.Sprite).body as
        | Phaser.Physics.Arcade.Body
        | undefined;
      if (!playerBody) return;
      const vertical =
        playerBody.bottom > shard.y - SHARD_HALF_H && playerBody.top < shard.y + SHARD_HALF_H;
      const currX = playerBody.center.x;
      const prevX = prevPlayerX ?? currX;
      prevPlayerX = currX;
      if (!vertical) return;
      const left = shard.x - SHARD_HALF_W;
      const right = shard.x + SHARD_HALF_W;
      const aabb = playerBody.right > left && playerBody.left < right;
      const swept = Math.min(prevX, currX) <= right && Math.max(prevX, currX) >= left;
      if (aabb || swept) collect();
    };
    shardUpdaters.set(shard, onUpdate);
    // 緩降至地面帶後定點浮動（漏接可落地補收）。
    const groundY = GROUND_TOP - 30;
    scene.tweens.add({
      targets: shard,
      y: groundY,
      duration: ((groundY - shard.y) / SHARD_DRIFT_PX_PER_SEC) * 1000,
      ease: 'Linear',
      onComplete: () => {
        scene.tweens.add({
          targets: shard,
          y: groundY - 10,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
  };

  const removeShard = (shard: Phaser.GameObjects.Image) => {
    shardUpdaters.delete(shard);
    shards.delete(shard);
    scene.tweens.killTweensOf(shard);
    shard.destroy();
  };

  const clearShards = () => {
    for (const shard of [...shards]) removeShard(shard);
  };

  // 護盾環（§113）：層數對齊 FSM shieldLayers 單一真值；環繞星體軌道由 update 驅動。
  const syncShieldOrbs = () => {
    while (shieldOrbs.length > fsm.shieldLayers) shieldOrbs.pop()?.destroy();
    while (shieldOrbs.length < fsm.shieldLayers) {
      shieldOrbs.push(
        scene.add
          .image(body.x, body.y, 'fx-star')
          .setDisplaySize(24, 24)
          .setTint(STAR_SIPHON.tint)
          .setDepth(58),
      );
    }
  };

  // 星光虹吸（§113）：紫色吸流窗——粒子沿玩家→核心路徑收斂，窗滿抽頂槽化盾。
  const doSiphon = (windowMs: number) => {
    siphonUntilMs = elapsedMs + windowMs;
    lastStreamAt = 0;
    playSfx('reveal', 0.6);
    body.setTint(STAR_SIPHON.tint);
    delay(windowMs, () => {
      if (!dying) body.clearTint();
    });
  };

  // 吸流窗滿未被反制：嘗試抽彈匣頂槽並回餵 FSM；被抽星體飛向核心演出。
  const resolveSiphonDrain = () => {
    siphonUntilMs = 0;
    if (!dying) body.clearTint();
    if (!hooks.drainTopStar()) return;
    const result = fsm.absorbSiphonStar();
    playSfx('swallow', 0.9);
    if (target) {
      const stolen = scene.add
        .image(target.x, target.y - 20, 'fx-star')
        .setDisplaySize(26, 26)
        .setTint(STAR_SIPHON.tint)
        .setDepth(73);
      scene.tweens.add({
        targets: stolen,
        x: body.x,
        y: body.y,
        duration: 360,
        ease: 'Quad.easeIn',
        onComplete: () => {
          stolen.destroy();
          syncShieldOrbs();
        },
      });
    } else {
      syncShieldOrbs();
    }
    void result;
  };

  // 炮擊過熱窗（P2 唯一輸出窗）：核心下沉、金光呼吸、可傷——窗迄點單一真值由
  // FSM overheatActive 持有（審查修復：移除呈現層鏡像時鐘防雙 SSOT 漂移）。
  const doOverheat = (windowMs: number) => {
    playSfx('boss-roar', 0.5);
    body.setTint(0xffd8a0);
    delay(windowMs, () => {
      if (!dying) body.clearTint();
    });
  };

  // 蝕星彈幕（P3）：放射齊發＋螺旋層（EX 三層）；蓄能轉金 telegraph。
  const doBarrage = (radial: number, spiralLayers: number) => {
    body.setTint(CRACK_TINT);
    delay(VOIDRA.barrageTelegraphMs, () => {
      if (dying) return;
      body.clearTint();
      playSfx('pop');
      for (let i = 0; i < radial; i += 1) {
        const angle = (Math.PI * 2 * i) / radial;
        spawnShot(
          body.x,
          body.y,
          Math.cos(angle) * BARRAGE_RADIAL_SPEED,
          Math.sin(angle) * BARRAGE_RADIAL_SPEED,
        );
      }
      // 螺旋層：發射角逐步推進，層間相位均分。
      const steps = Math.floor(VOIDRA.barrageDurationMs / SPIRAL_STEP_MS);
      for (let step = 0; step < steps; step += 1) {
        delay(step * SPIRAL_STEP_MS, () => {
          if (dying) return;
          for (let layer = 0; layer < spiralLayers; layer += 1) {
            const angle = step * 0.55 + (Math.PI * 2 * layer) / spiralLayers;
            spawnShot(
              body.x,
              body.y,
              Math.cos(angle) * SPIRAL_SPEED,
              Math.sin(angle) * SPIRAL_SPEED,
            );
          }
        });
      }
    });
  };

  const runCommand = (command: VoidraCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'pull':
        doPull(command.durationMs, PULL_P1_PX_PER_SEC);
        return;
      case 'ring':
        doRing(command.count);
        return;
      case 'claw':
        doClaw();
        return;
      case 'siphon':
        doSiphon(command.windowMs);
        return;
      case 'siphonDrain':
        resolveSiphonDrain();
        return;
      case 'wave':
        if (command.wave === 'pillar') doPillar();
        else dropShard();
        return;
      case 'overheat':
        doOverheat(command.windowMs);
        return;
      case 'survivalEnd':
        enterP3();
        return;
      case 'barrage':
        doBarrage(command.radial, command.spiralLayers);
        return;
      case 'crush':
        doPull(command.durationMs, VOIDRA.crushPullPxPerSec);
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  // P2 進場（生存段）：核心升頂、開轟炸、重置段內狀態。
  const enterSurvival = () => {
    hooks.setBombardment(
      ex
        ? {
            intervalMs: Math.round(BOMBARDMENT.intervalMs / EX_VOIDRA.bombardmentDensityMul),
            waveSize: BOMBARDMENT.waveSize,
          }
        : BOMBARDMENT,
    );
    heartDropped = false;
    playSfx('boss-roar', 0.8);
    scene.cameras.main.shake(160, 0.006);
  };

  // P3 進場（核心決戰）：收轟炸、清星屑、注入全場低重力（§81）。
  const enterP3 = () => {
    hooks.setBombardment(null);
    clearShards();
    hooks.setGravityScale(VOIDRA.p3GravityScale);
    emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: 'p3' });
    playSfx('boss-roar');
    scene.cameras.main.flash(320, 200, 180, 255);
  };

  const killProjectile = (obj: Phaser.GameObjects.GameObject) => {
    (obj as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  };

  const clearOrdnance = () => {
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
  };

  // 死亡冪等（§82）：defeated 由 FSM 單向鎖存，本序列僅執行一次；低重力/轟炸全數復原。
  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(body);
    clearOrdnance();
    clearShards();
    siphonUntilMs = 0;
    while (shieldOrbs.length > 0) shieldOrbs.pop()?.destroy();
    hooks.setBombardment(null);
    hooks.setGravityScale(null);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: body.x, y: body.y });
    delay(600, () => {
      scene.tweens.add({
        targets: body,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 420,
        ease: 'Back.easeIn',
      });
    });
  };

  const applyDamageInternal = (amount: number, source?: BossDamageSource) => {
    if (!active) return;
    // 實扣傷害（§113）：逆流爆盾時 FSM 以 max(來彈, 回傷) 結算，HUD 事件同口徑；
    // 爆盾限星彈命中（審查修復）——source 解讀收斂呈現層，FSM 收語義布林。
    let dealtDamage = amount;
    for (const event of fsm.takeDamage(amount, source === 'star')) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          scene.tweens.add({ targets: body, angle: 3, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: dealtDamage,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          if (event.phase === 'p2') enterSurvival();
          // 傷害驅動提前入 P3（過熱窗打穿 40%）：survivalEnd 不會再發，直接收斂。
          if (event.phase === 'p3') {
            hooks.setBombardment(null);
            clearShards();
            hooks.setGravityScale(VOIDRA.p3GravityScale);
            scene.cameras.main.flash(320, 200, 180, 255);
          }
          break;
        case 'minionDrop':
          minionHandlers.forEach((handler) => handler());
          break;
        // 逆流爆盾（§113 反制）：紫爆演出＋護盾環全清；傷害由後續 damaged 事件結算
        //（FSM 事件序保證 siphonBurst 先於 damaged，實扣口徑先行同步）。
        case 'siphonBurst':
          dealtDamage = Math.max(amount, STAR_SIPHON.backfireDamage);
          siphonUntilMs = 0;
          body.clearTint();
          playSfx('break', 0.8);
          scene.cameras.main.shake(90, 0.004);
          scene.tweens.add({
            targets: scene.add
              .image(body.x, body.y, 'fx-star')
              .setDisplaySize(60, 60)
              .setTint(STAR_SIPHON.tint)
              .setAlpha(0.9)
              .setDepth(73),
            alpha: 0,
            scale: 2.2,
            duration: 420,
            onComplete: (tween) => (tween.targets[0] as Phaser.GameObjects.Image).destroy(),
          });
          syncShieldOrbs();
          break;
        // 護盾層抵銷（§113）：零傷回饋——盾環閃爍收層，不發 BOSS_DAMAGED（HP 未變）。
        case 'shieldBlock':
          playSfx('metal', 0.7);
          scene.tweens.add({ targets: body, angle: 2, duration: 40, yoyo: true });
          syncShieldOrbs();
          break;
        case 'defeated':
          dieSequence();
          break;
        default: {
          const unhandled: never = event;
          throw new Error(`未知事件：${String(unhandled)}`);
        }
      }
    }
  };

  // 核心錨點（§82）：依階段/過熱窗導出，位置以 approachPoint 逼近（禁瞬移）。
  const anchorPoint = (): FlightPoint => {
    const sway = Math.sin(elapsedMs * SWAY_FREQ) * viewW() * SWAY_AMP_RATIO;
    const bob = Math.sin(elapsedMs * BOB_FREQ) * BOB_AMP_PX;
    if (fsm.phase === 'p2') {
      if (fsm.overheatActive) return { x: arenaCx(), y: ANCHOR_OVERHEAT_Y + bob };
      return { x: arenaCx() + sway, y: ANCHOR_TOP_Y + bob };
    }
    if (fsm.phase === 'p3') return { x: arenaCx() + sway, y: ANCHOR_P3_Y + bob };
    return { x: arenaCx() + sway, y: ANCHOR_P1_Y + bob };
  };

  // 入場：蝕星魔核自星空降臨（與墜落/升起型區隔——「天體降臨」語彙）。
  const introDescend = () => {
    body.setPosition(arenaCx(), -BODY_SIZE);
    scene.tweens.add({
      targets: body,
      y: ANCHOR_P1_Y,
      duration: 1000,
      ease: 'Sine.easeOut',
      onComplete: () => {
        playSfx('boss-slam');
        scene.cameras.main.shake(120, 0.006);
        introRoar();
      },
    });
  };

  const introRoar = () => {
    emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
    playSfx('boss-roar');
    scene.tweens.add({
      targets: body,
      scaleX: body.scaleX * 1.12,
      scaleY: body.scaleY * 1.1,
      duration: 170,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
    delay(INTRO_ROAR_MS, introReset);
  };

  const introReset = () => {
    const cam = scene.cameras.main;
    cam.pan(arenaCx(), VIEW.height / 2, INTRO_RESET_MS, 'Sine.easeInOut');
    cam.zoomTo(1, INTRO_RESET_MS, 'Sine.easeInOut');
    delay(INTRO_RESET_MS, () => {
      active = true;
      // EX 入場變色（§58 慣例）：緋紅呼吸循環作為變體識別基調。
      if (ex) {
        scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 900,
          yoyo: true,
          repeat: -1,
          onUpdate: (tween) => {
            if (dying) return;
            const v = tween.getValue() ?? 0;
            const mix = (a: number, b: number) => Math.round(a + (b - a) * v);
            body.setTint((mix(255, 216) << 16) | (mix(255, 75) << 8) | mix(255, 106));
          },
        });
      }
    });
  };

  return {
    spawn() {
      const cam = scene.cameras.main;
      const [red, green, blue] = INTRO_FADE_RGB;
      cam.fadeOut(INTRO_FADE_MS, red, green, blue);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.pan(arenaCx(), VIEW.height / INTRO_ZOOM / 2, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.zoomTo(INTRO_ZOOM, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.fadeIn(INTRO_FADE_MS + 140, red, green, blue);
        delay(INTRO_PUSH_MS * 0.5, introDescend);
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      applyDamageInternal(amount, source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      elapsedMs += deltaMs;
      // 距離帶餵送（§5 條件欄）。
      fsm.setTargetDistance(
        target ? Phaser.Math.Distance.Between(body.x, body.y, target.x, target.y) : null,
      );
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 核心逼近錨點（§64 慣例）：單 tick 位移受限，階段切換平滑滑移。
      const next = approachPoint({ x: body.x, y: body.y }, anchorPoint(), APPROACH_SPEED, deltaMs);
      body.setPosition(next.x, next.y);
      // P2 不可及帶（§82）：核心高於可打帶時停用受擊體（星彈穿過不消耗判定）。
      const reachable = fsm.phase !== 'p2' || body.y > ANCHOR_TOP_Y + 60;
      physBody.enable = reachable && !dying;
      // 牽引結算（P1 pull／P3 crush）：水平 positional drift 恆指向核心、
      // 上限低於玩家全速（交叉不變式 16，不與速度控制器對抗）。
      if (target && elapsedMs < pullUntilMs) {
        const direction = Math.sign(body.x - target.x);
        target.x += direction * pullStrength * (deltaMs / 1000);
      }
      // 星光虹吸吸流粒子（§113）：沿玩家→核心路徑生成、循流收斂；強度包絡淡入淡出。
      if (elapsedMs < siphonUntilMs && target) {
        if (elapsedMs - lastStreamAt >= STAR_SIPHON.streamParticleIntervalMs) {
          lastStreamAt = elapsedMs;
          const windowLeft = siphonUntilMs - elapsedMs;
          const strength = siphonStreamStrength(
            STAR_SIPHON.windowMs - windowLeft,
            STAR_SIPHON.windowMs,
          );
          const t = Math.random() * 0.55;
          const particle = scene.add
            .image(
              target.x + (body.x - target.x) * t,
              target.y - 16 + (body.y - (target.y - 16)) * t,
              'fx-star',
            )
            .setDisplaySize(14, 14)
            .setTint(STAR_SIPHON.tint)
            .setAlpha(0.35 + strength * 0.5)
            .setDepth(72);
          scene.tweens.add({
            targets: particle,
            x: body.x,
            y: body.y,
            alpha: 0,
            scale: 0.4,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => particle.destroy(),
          });
        }
      }
      // 護盾環軌道（§113）：層數真值在 FSM；環繞核心緩轉。
      shieldOrbs.forEach((orb, index) => {
        const angle = elapsedMs * 0.0028 + (Math.PI * 2 * index) / Math.max(1, shieldOrbs.length);
        orb.setPosition(
          body.x + Math.cos(angle) * (BODY_SIZE / 2 + 20),
          body.y + Math.sin(angle) * (BODY_SIZE / 2 + 20),
        );
      });
      // P2 段內固定愛心（§6.3）：16s 投放一次。
      if (fsm.phase === 'p2' && !heartDropped && fsm.survivalMs >= SURVIVAL_HEART_AT_MS) {
        heartDropped = true;
        hooks.dropSurvivalHeart();
      }
      // 星屑收集逐幀判定（pickups 幾何慣例）。
      for (const updater of shardUpdaters.values()) updater();
      // 裂核大窗視覺（P3 idle）：金紋呼吸提示輸出窗。
      if (fsm.phase === 'p3' && fsm.state === 'idle' && !ex) {
        const glow = Math.floor(elapsedMs / 260) % 2 === 0;
        if (glow) body.setTint(0xd8c8a0);
        else body.clearTint();
      }
      // 晶柱落地回收＋出界回收（anti-softlock §56 投射物壽命慣例）。
      shockwaves.getMatching('active', true).forEach((obj) => {
        const shock = obj as Phaser.Physics.Arcade.Sprite;
        if (shock.displayHeight >= PILLAR_H - 1 && shock.y >= GROUND_TOP - PILLAR_H / 2 + 6) {
          playSfx('break', 0.5);
          scene.cameras.main.shake(70, 0.003);
          killProjectile(shock);
        }
      });
      projectiles.getMatching('active', true).forEach((obj) => {
        const shot = obj as Phaser.Physics.Arcade.Sprite;
        if (
          shot.y > GROUND_TOP + 20 ||
          shot.y < -40 ||
          shot.x < arenaLeft() - 60 ||
          shot.x > arenaLeft() + viewW() + 60
        ) {
          killProjectile(shot);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      scene.tweens.killTweensOf(body);
      clearShards();
      while (shieldOrbs.length > 0) shieldOrbs.pop()?.destroy();
      hooks.setBombardment(null);
      hooks.setGravityScale(null);
      body.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
    },
    isActive() {
      return active;
    },
    // 場控收束型免暈（§82）：輸出窗來自僵直/過熱/裂核，下砸命中僅回彈免體傷。
    trySlamStun() {
      return false;
    },
    getBody() {
      return body;
    },
    getProjectiles() {
      return projectiles;
    },
    getShockwaves() {
      return shockwaves;
    },
    setTarget(next: { x: number; y: number } | null) {
      target = next;
    },
    onMinionDrop(handler: () => void) {
      minionHandlers.push(handler);
    },
    // 段起點重試（§82 anti-softlock）：P2/P3 死亡不回滾整場——彈幕/星屑/轟炸清場，
    // FSM 重置至該段起點；P1 死亡回 false 走一般敗北流程。
    trySegmentRespawn() {
      if (!active || dying) return false;
      if (fsm.phase === 'p1') return false;
      const segment = fsm.phase;
      clearOrdnance();
      clearShards();
      // 殘留 delayedCall 全清（審查修復）：死亡前排程的爪擊/晶柱/彈幕不得於新段憑空觸發。
      timers.forEach((timer) => timer.remove(false));
      timers.length = 0;
      pullUntilMs = 0;
      siphonUntilMs = 0;
      body.clearTint();
      fsm.resetToPhase(segment);
      // 護盾層隨段重試清空（§113），盾環同步收掉。
      syncShieldOrbs();
      if (segment === 'p2') {
        hooks.setGravityScale(null);
        enterSurvival();
      } else {
        hooks.setBombardment(null);
        hooks.setGravityScale(VOIDRA.p3GravityScale);
      }
      // HUD 血條同步段起點血量（damage 0 事件僅刷新讀值）。
      emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
        hp: fsm.hp,
        maxHp: fsm.maxHp,
        damage: 0,
      });
      return true;
    },
    // e2e 觀測（§83）：三段/生存段狀態可斷言。
    getDebugState() {
      return { phase: fsm.phase, state: fsm.state };
    },
  };
}
