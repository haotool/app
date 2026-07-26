import Phaser from 'phaser';
import { resetTransientFlags } from '../core/poolFlags';
import { GRAVITY_Y, VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { BOSS, createBossFsm, type BossCommand } from '../logic/bossFsm';
import { JELLY_PATCH, jellyBounceVy, prunePatches, type JellyPatch } from '../logic/jellyPatch';
import { playSfx } from '../audio/sfx';
import { burstSmall, landingDust, spawnTelegraph } from './fx';
import { getVisualScale } from './visualScale';

// EX 變體選項與擊破分裂 hook（§58）：分裂生成走 GameScene 正式 spawn 管線。
export interface BossOptions {
  ex?: boolean;
  onSplit?: (x: number, y: number, count: number) => void;
  // 前室魔王關（§86 L4 retrofit）：arena 左緣（世界座標）；缺省 0（無前室）。
  arenaLeft?: () => number;
}

// 傷害來源（§57/§58）：volt＝雷化鏈電束（可中斷 Noctra 召喚）、reflect＝殼化反彈回傷。
export type BossDamageSource = 'star' | 'volt' | 'reflect';

export interface BossHandle {
  spawn(): void;
  applyDamage(amount: number, source?: BossDamageSource): void;
  update(deltaMs: number): void;
  destroy(): void;
  isActive(): boolean;
  getBody(): Phaser.GameObjects.GameObject;
  getProjectiles(): Phaser.Physics.Arcade.Group;
  getShockwaves(): Phaser.Physics.Arcade.Group;
  // 魔王頭頂 hit window（§58）：下砸命中頭頂時嘗試觸發暈眩，成功回 true（品種各自裁決）。
  trySlamStun(): boolean;
  // P3 追蹤彈目標（§30）：GameScene 注入玩家參照，與 enemies.setTarget 同模式。
  setTarget(target: { x: number; y: number } | null): void;
  onMinionDrop(handler: () => void): void;
  // 多本體魔王（§68 雙子）：星彈/接觸/下砸逐本體接線；未實作視為單本體（getBody）。
  getBodies?(): Phaser.Physics.Arcade.Sprite[];
  // 命中位置歸屬（§68 雙子獨立血條）：依最近存活本體結算受擊側；未實作走 applyDamage。
  applyDamageAt?(amount: number, x: number, y: number, source?: BossDamageSource): void;
  // 環繞護盾（§68 P3 碎晶盾）：可擊破的星彈屏障群；未實作視為無護盾。
  getShields?(): Phaser.Physics.Arcade.Group;
  // arena 噴口供力（§74 Syrona）：域內回傳結算後 vy、域外回 null；未實作視為無噴口。
  // rideHeld（W3 持鍵乘流）：跳躍鍵持按＝乘流意圖——P4 氣墊懸停僅持鍵時供力。
  getVentLift?(
    x: number,
    y: number,
    vy: number,
    deltaMs: number,
    blockedUp: boolean,
    rideHeld?: boolean,
  ): number | null;
  // 準星輔助模式（§54/W3）：皇冠唯一可傷期回 'off'——中心導向會把長程星彈
  // 拉出皇冠帶（W3 真值取證）；未實作＝'center' 既有行為。
  aimAssistMode?(): 'center' | 'off';
  // arena 場控浮台（§74 Syrona）：GameScene 接玩家 collider；未實作視為無浮台。
  getPlatforms?(): Phaser.GameObjects.Rectangle[];
  // 段起點重試（§82 Voidra）：玩家死亡時嘗試段內重試（P2/P3 不回滾整場），
  // 成功回 true（呈現層已自清並重置 FSM）；未實作或 P1 期走一般敗北流程。
  trySegmentRespawn?(): boolean;
  // e2e 觀測（§83 v11 觀察項收尾）：FSM 階段/招式即時值；未實作回 null。
  getDebugState?(): { phase: string; state: string } | null;
}

const GROUND_TOP = VIEW.height - 80;
const BOSS_W = 150;
const BOSS_H = 130;
const STAND_Y = GROUND_TOP - BOSS_H / 2;
// 單屏佈局邊距（§28）：左右落點依當前視寬計算，禁硬編 854。
const SIDE_MARGIN_X = 110;
const ENRAGE_TINT = { r: 255, g: 107, b: 107 } as const;
// P3 狂暴皇冠（§30）：體色金紫交替閃爍；追蹤彈緩速跟蹤 2s 後直線加速。
const P3_GOLD = { r: 255, g: 217, b: 102 } as const;
const P3_PURPLE = { r: 155, g: 123, b: 216 } as const;
const P3_FLICKER_MS = 420;
const HOMING_TRACK_SPEED = 120;
const HOMING_STRAIGHT_SPEED = 300;
const HOMING_TINT = 0xffd966;
// 招式預警時長：rain 落點標記、slam 蓄力前搖、dash 閃白抖動。
// #809：dash 前搖 300→600ms——500ms 反應玩家對貼身衝撞不可讀（<600ms 可讀性紅線），
// 貼牆角情境的「必中」體感主因之一；閃白由兩拍改三拍填滿加長窗。
const RAIN_TELEGRAPH_MS = 500;
const SLAM_WINDUP_MS = 350;
const DASH_WINDUP_MS = 600;
const SLAM_WINDUP_TINT = 0xff9d9d;

// 入場運鏡（§17）：黑幕淡入 → 推近王座 1.2s → 三段彈跳落座 → 吼叫 → 相機復位後開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.45;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [24, 18, 34] as const;
// 三段彈跳落座：首段自空中墜落，後兩段遞減回彈；每段落地觸發震屏+塵埃+音效。
const INTRO_BOUNCES = [
  { apexOffset: 0, riseMs: 0, fallMs: 460, shake: 0.012 },
  { apexOffset: 120, riseMs: 250, fallMs: 230, shake: 0.009 },
  { apexOffset: 52, riseMs: 180, fallMs: 170, shake: 0.006 },
] as const;

// 佔位材質：正式 sprite 由美術 stream 交付，缺件時以圓形烘焙保底避免 runtime crash。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-idle', 0x9b7bd8, BOSS_W, BOSS_H);
  bake('boss-enraged', 0xd86b7b, BOSS_W, BOSS_H);
  bake('boss-jelly-ball', 0xffb3c7, 20, 20);
  bake('boss-shockwave', 0xb69df0, 60, 16);
  // 果凍地塊（§5 果凍回彈）：粉色半透明橢圓，正式 sprite 缺件時保底。
  bake('boss-jelly-patch', 0xffb3c7, JELLY_PATCH.halfWidthPx * 2, 26);
}

export function createBoss(scene: Phaser.Scene, options: BossOptions = {}): BossHandle {
  ensureTextures(scene);

  const fsm = createBossFsm({ ex: options.ex === true });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let side: 'left' | 'right' = 'right';
  let target: { x: number; y: number } | null = null;
  // 頭頂命中短暈（§58）：暈眩窗內不重複觸發。
  let stunUntilMs = 0;
  // 果凍回彈（§5）：P2 起踩踏落點果凍化 3s，玩家踩上經 getVentLift 結算彈起。
  let jellyPatches: JellyPatch[] = [];
  const patchSprites = new Map<JellyPatch, Phaser.GameObjects.Image>();
  let jellyBounceCooldownMs = 0;

  const viewW = () => scene.scale.width;
  // 前室魔王關（§86）：全部世界座標計算平移 arena 左緣（無前室＝0，行為零變）。
  const arenaLeft = () => options.arenaLeft?.() ?? 0;
  const sideX = (which: 'left' | 'right') =>
    arenaLeft() + (which === 'left' ? SIDE_MARGIN_X : viewW() - SIDE_MARGIN_X);

  const sprite = scene.physics.add.sprite(sideX('right'), -BOSS_H, 'boss-idle');
  sprite.setDisplaySize(BOSS_W, BOSS_H);
  // 物理/視覺縮放解耦（§77 根治）：wobble/擠壓/怒吼脈動/死亡收縮全走 fx 代理，
  // 物理箱恆為基準；texture 切換後 rebase 重錨。
  const vscale = getVisualScale(scene);
  vscale.register(sprite);
  const fxScale = vscale.fx(sprite);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setImmovable(true);

  const projectiles = scene.physics.add.group({ maxSize: 16 });
  const shockwaves = scene.physics.add.group({ maxSize: 6, allowGravity: false });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 常駐果凍 wobble（fx 代理，物理箱不動）；slam / dash 期間暫停避免 fx 衝突。
  const wobble = scene.tweens.add({
    targets: fxScale,
    sx: 1.05,
    sy: 0.94,
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    paused: true,
  });

  let enrageTween: Phaser.Tweens.Tween | null = null;

  interface Rgb {
    r: number;
    g: number;
    b: number;
  }

  // 體色呼吸循環：兩色間往返插值；P2 白→紅、P3 金→紫共用。
  const startTintCycle = (from: Rgb, to: Rgb, durationMs: number) => {
    enrageTween?.destroy();
    const mix = (a: number, b: number, v: number) => Math.round(a + (b - a) * v);
    enrageTween = scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: durationMs,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const v = tween.getValue() ?? 0;
        sprite.setTint(
          (mix(from.r, to.r, v) << 16) | (mix(from.g, to.g, v) << 8) | mix(from.b, to.b, v),
        );
      },
    });
  };

  const startEnrage = () => {
    sprite.setTexture('boss-enraged').setDisplaySize(BOSS_W, BOSS_H);
    vscale.rebase(sprite);
    startTintCycle({ r: 255, g: 255, b: 255 }, ENRAGE_TINT, 700);
  };

  // 果凍狂潮（§8.2 W3）：全地板果凍化——週期全場重鋪（patch 壽命 3s、
  // 重鋪 2.2s 覆蓋連續），玩家強制彈跳作戰沿 §5 果凍回彈既有機制。
  let frenzyRepaveAccMs = 0;
  const paveFrenzyFloor = () => {
    const step = 90;
    for (let x = arenaLeft() + step / 2; x < arenaLeft() + viewW(); x += step) {
      spawnJellyPatch(x);
    }
  };
  const startFrenzy = () => {
    sprite.setTexture('boss-enraged').setDisplaySize(BOSS_W, BOSS_H);
    vscale.rebase(sprite);
    startTintCycle({ r: 255, g: 176, b: 208 }, { r: 255, g: 120, b: 168 }, 360);
    playSfx('boss-roar', 1.3);
    scene.cameras.main.flash(320, 255, 176, 208);
    scene.cameras.main.shake(200, 0.007);
    paveFrenzyFloor();
    // 狂潮小條重灌（HUD 換刻度，沿 Prismix P4 慣例）。
    emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
      hp: fsm.hp,
      maxHp: fsm.maxHp,
      damage: 0,
    });
  };

  // P3 進場演出（§30）：皇冠射出星環衝擊波（金色擴散環 + 星火），時停 0.3s 由 GameScene 接線。
  const startP3 = () => {
    sprite.setTexture('boss-enraged').setDisplaySize(BOSS_W, BOSS_H);
    vscale.rebase(sprite);
    startTintCycle(P3_GOLD, P3_PURPLE, P3_FLICKER_MS);
    const crownX = sprite.x;
    const crownY = sprite.y - BOSS_H * 0.55;
    const ring = scene.add
      .circle(crownX, crownY, 26, 0xffd966, 0)
      .setStrokeStyle(6, 0xffd966, 0.95)
      .setDepth(92);
    scene.tweens.add({
      targets: ring,
      scale: 7,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    burstSmall(scene, crownX, crownY, 0xffd966);
  };

  const flashWhite = () => {
    // 暫停紅暈呼吸避免 onUpdate 覆蓋白閃 tint。
    enrageTween?.pause();
    sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    delay(90, () => {
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      if (enrageTween) enrageTween.resume();
      else sprite.clearTint();
    });
  };

  const shake = () => {
    scene.tweens.add({ targets: sprite, angle: 4, duration: 45, yoyo: true, repeat: 3 });
  };

  // 拋物線落地時間解析解，反推彈幕落點與飛行時間。
  const rainLanding = (x0: number, y0: number, vx: number, vy: number) => {
    const t = (-vy + Math.sqrt(vy * vy + 2 * GRAVITY_Y * (GROUND_TOP - y0))) / GRAVITY_Y;
    return { x: x0 + vx * t, flightMs: t * 1000 };
  };

  const spawnBall = (x: number, y: number): Phaser.Physics.Arcade.Sprite | null => {
    const ball = projectiles.get(x, y, 'boss-jelly-ball') as Phaser.Physics.Arcade.Sprite | null;
    if (!ball) return null;
    ball.enableBody(true, x, y, true, true);
    // 池回收重用：追蹤彈殘留的 tint / 無重力 / homing 計時須復位；
    // 互動旗標（reflected/tideDeflected 等）走 poolFlags 單點復位。
    ball.clearTint();
    ball.setData('homingMs', 0);
    resetTransientFlags(ball);
    (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    return ball;
  };

  const launchRain = (count: number) => {
    const stagger = 660 / count / fsm.speedFactor;
    for (let i = 0; i < count; i += 1) {
      delay(i * stagger, () => {
        if (dying) return;
        // 先抽定軌道並於落點顯示預警標記，0.5s 後才發射；標記持續閃爍至彈著。
        const startX = sprite.x;
        const startY = sprite.y - BOSS_H / 2;
        const vx = Phaser.Math.Between(60, 230) * (Math.random() < 0.5 ? -1 : 1);
        const vy = Phaser.Math.Between(-520, -340);
        const land = rainLanding(startX, startY, vx, vy);
        if (land.x >= arenaLeft() && land.x <= arenaLeft() + viewW()) {
          spawnTelegraph(scene, land.x, GROUND_TOP - 6, RAIN_TELEGRAPH_MS + land.flightMs);
        }
        delay(RAIN_TELEGRAPH_MS, () => {
          if (dying) return;
          const ball = spawnBall(startX, startY);
          ball?.setVelocity(vx, vy);
        });
      });
    }
  };

  // P3 追蹤彈（§30）：金色彈上拋散開後緩速跟蹤玩家 2s，到期沿航向直線加速。
  const launchHomingRain = (count: number) => {
    const stagger = 660 / count / fsm.speedFactor;
    for (let i = 0; i < count; i += 1) {
      delay(i * stagger, () => {
        if (dying) return;
        const ball = spawnBall(sprite.x, sprite.y - BOSS_H / 2);
        if (!ball) return;
        ball.setTint(HOMING_TINT);
        ball.setData('homingMs', BOSS.homingTrackMs);
        const body = ball.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-260, -160));
      });
    }
  };

  const spawnShockwave = (directionX: 1 | -1) => {
    const wave = shockwaves.get(
      sprite.x + directionX * BOSS_W * 0.5,
      GROUND_TOP - 8,
      'boss-shockwave',
    ) as Phaser.Physics.Arcade.Sprite | null;
    if (!wave) return;
    wave.enableBody(true, sprite.x + directionX * BOSS_W * 0.5, GROUND_TOP - 8, true, true);
    wave.setVelocity(directionX * 320 * fsm.speedFactor, 0);
  };

  // 果凍地塊生成（§5 果凍回彈）：踩踏落點地面果凍化 3s，壽命內緩慢淡出。
  const spawnJellyPatch = (x: number) => {
    const patch: JellyPatch = { x, createdAtMs: scene.time.now };
    jellyPatches.push(patch);
    const visual = scene.add
      .image(x, GROUND_TOP - 8, 'boss-jelly-patch')
      .setAlpha(0.65)
      .setDepth(40);
    patchSprites.set(patch, visual);
    scene.tweens.add({
      targets: visual,
      alpha: 0.2,
      scaleY: 0.55,
      duration: JELLY_PATCH.lifetimeMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        visual.destroy();
        patchSprites.delete(patch);
      },
    });
  };

  const doSlam = (quake: boolean, jelly: boolean) => {
    wobble.pause();
    const sf = fsm.speedFactor;
    // 前搖 0.35s：squash 蓄力 + 微紅 tint + 音效預告，之後才起跳。
    enrageTween?.pause();
    sprite.setTint(SLAM_WINDUP_TINT);
    playSfx('boss-slam');
    scene.tweens.add({
      targets: fxScale,
      sx: 1.18,
      sy: 0.8,
      duration: SLAM_WINDUP_MS,
      ease: 'Quad.easeOut',
    });
    delay(SLAM_WINDUP_MS, () => {
      if (dying) return;
      if (enrageTween) enrageTween.resume();
      else sprite.clearTint();
      // 位移走 sprite、擠壓走 fx 代理（§77 解耦）：起跳期回復基準、著地擠壓回彈。
      scene.tweens.add({
        targets: fxScale,
        sx: 1,
        sy: 1,
        duration: 300 / sf,
        ease: 'Quad.easeOut',
      });
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          { y: STAND_Y - 170, duration: 300 / sf, ease: 'Quad.easeOut' },
          { y: STAND_Y, duration: 180 / sf, ease: 'Quad.easeIn' },
        ],
        onComplete: () => {
          scene.tweens.add({
            targets: fxScale,
            sx: 1.22,
            sy: 0.78,
            duration: 90,
            yoyo: true,
            onComplete: () => {
              wobble.resume();
            },
          });
        },
      });
    });
    delay(SLAM_WINDUP_MS + 480 / sf, () => {
      if (dying) return;
      scene.cameras.main.shake(180, 0.008);
      spawnShockwave(1);
      spawnShockwave(-1);
      // 果凍回彈（§5）：P2 起踩踏落點果凍化。
      if (jelly) spawnJellyPatch(sprite.x);
      // P3 全場震落（§30）：站立玩家強制彈起由 GameScene 接線結算。
      if (quake) emitGameEvent(scene.events, GameEvents.BOSS_QUAKE, { x: sprite.x, y: sprite.y });
    });
  };

  const doDash = () => {
    wobble.pause();
    side = side === 'right' ? 'left' : 'right';
    const targetX = sideX(side);
    sprite.setFlipX(side === 'left');
    // 前搖 0.6s（#809）：面向衝刺側白閃三拍 + 原地抖動填滿窗，之後才衝刺。
    flashWhite();
    delay(200, () => {
      if (!dying) flashWhite();
    });
    delay(400, () => {
      if (!dying) flashWhite();
    });
    scene.tweens.add({
      targets: sprite,
      x: sprite.x + (targetX > sprite.x ? 6 : -6),
      duration: 25,
      yoyo: true,
      repeat: 11,
    });
    delay(DASH_WINDUP_MS, () => {
      if (dying) return;
      scene.tweens.add({
        targets: sprite,
        x: targetX,
        duration: 550 / fsm.speedFactor,
        ease: 'Sine.easeIn',
        onComplete: () => {
          // 到位擠壓走 fx 代理（§77 解耦）。
          scene.tweens.add({
            targets: fxScale,
            sx: 1.28,
            sy: 0.76,
            duration: 110,
            yoyo: true,
            onComplete: () => {
              wobble.resume();
            },
          });
        },
      });
    });
  };

  const runCommand = (command: BossCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'rain':
        if (command.homing) launchHomingRain(command.count);
        else launchRain(command.count);
        return;
      case 'slam':
        doSlam(command.quake, command.jelly);
        return;
      case 'dash':
        doDash();
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  const killProjectile = (obj: Phaser.GameObjects.GameObject) => {
    (obj as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  };

  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(sprite);
    vscale.killFxTweens(sprite);
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: sprite.x, y: sprite.y });
    // 慢動作與星爆統一由 fx 系統的 BOSS_DEFEATED 監聽處理（單一權責）；600ms 對齊 fx slowMo 結束後淡出。
    delay(600, () => {
      scene.tweens.add({ targets: fxScale, sx: 0, sy: 0, duration: 420, ease: 'Back.easeIn' });
      scene.tweens.add({ targets: sprite, alpha: 0, duration: 420, ease: 'Back.easeIn' });
    });
  };

  const landFx = (shakeIntensity: number, withSquash: boolean) => {
    landingDust(scene, sprite.x, GROUND_TOP - 4);
    playSfx('boss-slam');
    scene.cameras.main.shake(150, shakeIntensity);
    if (!withSquash) return;
    scene.tweens.add({
      targets: fxScale,
      sx: 1.2,
      sy: 0.78,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  };

  const introDrop = () => {
    const steps: Phaser.Types.Tweens.TweenBuilderConfig[] = [];
    INTRO_BOUNCES.forEach((bounce, index) => {
      if (bounce.riseMs > 0) {
        steps.push({
          targets: sprite,
          y: STAND_Y - bounce.apexOffset,
          duration: bounce.riseMs,
          ease: 'Quad.easeOut',
        });
      }
      const isLast = index === INTRO_BOUNCES.length - 1;
      steps.push({
        targets: sprite,
        y: STAND_Y,
        duration: bounce.fallMs,
        ease: 'Quad.easeIn',
        onComplete: () => landFx(bounce.shake, !isLast),
      });
    });
    scene.tweens.chain({ tweens: steps, onComplete: introRoar });
  };

  // 吼叫漣漪：BOSS_SPAWNED 於此發出（boss-roar 音效與震屏由事件綁定驅動），再疊 zoom 脈動。
  const introRoar = () => {
    emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
    scene.tweens.add({
      targets: scene.cameras.main,
      zoom: INTRO_ZOOM * 1.06,
      duration: 130,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: fxScale,
      sx: 1.14,
      sy: 1.1,
      duration: 170,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
    delay(INTRO_ROAR_MS, introReset);
  };

  const introReset = () => {
    const cam = scene.cameras.main;
    cam.pan(arenaLeft() + viewW() / 2, VIEW.height / 2, INTRO_RESET_MS, 'Sine.easeInOut');
    cam.zoomTo(1, INTRO_RESET_MS, 'Sine.easeInOut');
    delay(INTRO_RESET_MS, () => {
      wobble.play();
      active = true;
      // EX 入場變色（§58）：緋紅呼吸循環作為變體識別基調（P2/P3 轉換色照常覆蓋）。
      if (options.ex) startTintCycle({ r: 255, g: 255, b: 255 }, { r: 216, g: 75, b: 106 }, 900);
    });
  };

  return {
    spawn() {
      const cam = scene.cameras.main;
      const [red, green, blue] = INTRO_FADE_RGB;
      // 推近焦點貼齊 arena 右下（王座落點側）依當前視寬計算，確保取景不超出 arena 邊界。
      const focusX = arenaLeft() + viewW() - viewW() / INTRO_ZOOM / 2;
      const focusY = VIEW.height - VIEW.height / INTRO_ZOOM / 2;
      cam.fadeOut(INTRO_FADE_MS, red, green, blue);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.pan(focusX, focusY, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.zoomTo(INTRO_ZOOM, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.fadeIn(INTRO_FADE_MS + 140, red, green, blue);
        delay(INTRO_PUSH_MS, introDrop);
      });
    },
    applyDamage(amount: number) {
      if (!active) return;
      for (const event of fsm.takeDamage(amount)) {
        switch (event.kind) {
          case 'damaged':
            flashWhite();
            shake();
            emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
              hp: event.hp,
              maxHp: fsm.maxHp,
              damage: amount,
            });
            break;
          case 'phase':
            if (event.phase === 'p4') startFrenzy();
            else if (event.phase === 'p3') startP3();
            else startEnrage();
            emitGameEvent(scene.events, GameEvents.BOSS_PHASE, {
              phase: event.phase,
              // 狂潮段果凍粉條色（§8.2 血條結構：終段獨立小條）。
              ...(event.phase === 'p4' ? { barTint: 0xff8ab0 } : {}),
            });
            break;
          case 'minionDrop':
            minionHandlers.forEach((handler) => handler());
            break;
          case 'defeated':
            dieSequence();
            break;
          case 'split':
            // EX 擊破分裂（§58）：於魔王位置生成小果凍，走 GameScene 正式 spawn 管線。
            options.onSplit?.(sprite.x, sprite.y, event.count);
            break;
          default: {
            const unhandled: never = event;
            throw new Error(`未知事件：${String(unhandled)}`);
          }
        }
      }
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      // 距離帶餵送（§5 條件欄）：dash 僅遠距帶啟用。
      fsm.setTargetDistance(
        target ? Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y) : null,
      );
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 果凍狂潮（§8.2 W3）：全地板果凍化週期重鋪（壽命 3s、間隔 2.2s 覆蓋連續）。
      if (fsm.phase === 'p4') {
        frenzyRepaveAccMs += deltaMs;
        if (frenzyRepaveAccMs >= 2200) {
          frenzyRepaveAccMs = 0;
          paveFrenzyFloor();
        }
      }
      // 果凍地塊壽命清理與彈起冷卻。
      jellyBounceCooldownMs = Math.max(0, jellyBounceCooldownMs - deltaMs);
      jellyPatches = prunePatches(jellyPatches, scene.time.now);
      projectiles.getMatching('active', true).forEach((obj) => {
        const ball = obj as Phaser.Physics.Arcade.Sprite;
        const body = ball.body as Phaser.Physics.Arcade.Body;
        // P3 追蹤彈：跟蹤期逐幀導向玩家；到期沿當前航向直線加速（§30）。
        const homingMs = (ball.getData('homingMs') as number | undefined) ?? 0;
        if (homingMs > 0) {
          const remaining = homingMs - deltaMs;
          ball.setData('homingMs', Math.max(0, remaining));
          if (remaining > 0 && target) {
            scene.physics.moveTo(ball, target.x, target.y, HOMING_TRACK_SPEED);
          } else {
            const heading = Math.atan2(body.velocity.y, body.velocity.x);
            body.setVelocity(
              Math.cos(heading) * HOMING_STRAIGHT_SPEED,
              Math.sin(heading) * HOMING_STRAIGHT_SPEED,
            );
          }
        }
        const falling = body.velocity.y > 0;
        if (
          (falling && ball.y > GROUND_TOP - 10) ||
          ball.x < arenaLeft() - 40 ||
          ball.x > arenaLeft() + viewW() + 40
        ) {
          killProjectile(ball);
        }
      });
      shockwaves.getMatching('active', true).forEach((obj) => {
        const wave = obj as Phaser.Physics.Arcade.Sprite;
        if (wave.x < arenaLeft() - 60 || wave.x > arenaLeft() + viewW() + 60) killProjectile(wave);
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      enrageTween?.destroy();
      wobble.destroy();
      scene.tweens.killTweensOf(sprite);
      vscale.unregister(sprite);
      patchSprites.forEach((visual) => visual.destroy());
      patchSprites.clear();
      jellyPatches = [];
      projectiles.destroy(true);
      shockwaves.destroy(true);
      sprite.destroy();
    },
    isActive() {
      return active;
    },
    // 頭頂命中短暈（§58）：任何時點命中頭頂皆可觸發；暈眩窗內防連續重觸。
    trySlamStun() {
      if (!active || dying || scene.time.now < stunUntilMs) return false;
      stunUntilMs = scene.time.now + BOSS.slamStunMs;
      fsm.stun(BOSS.slamStunMs);
      playSfx('metal', 0.7);
      // 暈眩演出：灰化＋昏沉搖擺，期滿復原（enrage 呼吸循環讓位後回復）。
      enrageTween?.pause();
      sprite.setTint(0xcfcfcf);
      scene.tweens.add({
        targets: sprite,
        angle: { from: -6, to: 6 },
        duration: 180,
        yoyo: true,
        repeat: Math.floor(BOSS.slamStunMs / 360),
      });
      delay(BOSS.slamStunMs, () => {
        if (dying) return;
        sprite.setAngle(0);
        if (enrageTween) enrageTween.resume();
        else sprite.clearTint();
      });
      return true;
    },
    getBody() {
      return sprite;
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
    // 果凍回彈（§5）：玩家踩上活性果凍地塊經既有 getVentLift 管線彈起（非傷害），
    // GameScene 逐幀委派結算零接線變更；彈起後短冷卻防連續重觸。
    getVentLift(x: number, y: number, vy: number) {
      if (!active || dying || jellyBounceCooldownMs > 0) return null;
      const bounce = jellyBounceVy(jellyPatches, scene.time.now, x, y, GROUND_TOP, vy);
      if (bounce === null) return null;
      jellyBounceCooldownMs = JELLY_PATCH.cooldownMs;
      playSfx('spring');
      return bounce;
    },
    onMinionDrop(handler: () => void) {
      minionHandlers.push(handler);
    },
    // 段起點重試（W3 終局，沿 PM 裁決 A 同構）：P4 果凍狂潮死亡不整場重打——
    // 進度保留（狂潮小條不回灌）；P1-P3 回 false 走一般敗北流程（抵達狂潮的
    // 耐力驗收保留）。取證：high bot 每命抵達 P4 時殘血 1-2、無檢查點下 17%。
    trySegmentRespawn() {
      if (!active || dying) return false;
      if (fsm.phase !== 'p4') return false;
      // 殘留彈幕/衝擊波/果凍地塊/延時全清（死亡前排程不得於新命憑空觸發）。
      projectiles.getMatching('active', true).forEach(killProjectile);
      shockwaves.getMatching('active', true).forEach(killProjectile);
      timers.forEach((timer) => timer.remove(false));
      timers.length = 0;
      patchSprites.forEach((visual) => visual.destroy());
      patchSprites.clear();
      jellyPatches = [];
      // 白閃/暈眩延時可能被清：復原 tint 模式並重啟狂潮呼吸循環。
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      sprite.setAngle(0);
      enrageTween?.resume();
      fsm.resetToPhase('p4');
      // 全地板果凍化即刻重鋪（新命自新一輪鋪面起跳，重生喘息窗一致）。
      frenzyRepaveAccMs = 0;
      paveFrenzyFloor();
      emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
        hp: fsm.hp,
        maxHp: fsm.maxHp,
        damage: 0,
      });
      emitGameEvent(scene.events, GameEvents.BOSS_SEGMENT_RETRY, { semantics: 'kept' });
      return true;
    },
    // e2e/audit 觀測（§83）：招式序列熵探針依此取樣（#813 去背板驗收）。
    getDebugState() {
      return { phase: fsm.phase, state: fsm.state };
    },
  };
}
