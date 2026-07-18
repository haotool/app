import Phaser from 'phaser';
import { GRAVITY_Y, VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { BOSS, createBossFsm, type BossCommand } from '../logic/bossFsm';
import { playSfx } from '../audio/sfx';
import { burstSmall, landingDust, spawnTelegraph } from './fx';

// EX 變體選項與擊破分裂 hook（§58）：分裂生成走 GameScene 正式 spawn 管線。
export interface BossOptions {
  ex?: boolean;
  onSplit?: (x: number, y: number, count: number) => void;
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
  getVentLift?(
    x: number,
    y: number,
    vy: number,
    deltaMs: number,
    blockedUp: boolean,
  ): number | null;
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
const RAIN_TELEGRAPH_MS = 500;
const SLAM_WINDUP_MS = 350;
const DASH_WINDUP_MS = 300;
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

  const viewW = () => scene.scale.width;
  const sideX = (which: 'left' | 'right') =>
    which === 'left' ? SIDE_MARGIN_X : viewW() - SIDE_MARGIN_X;

  const sprite = scene.physics.add.sprite(sideX('right'), -BOSS_H, 'boss-idle');
  sprite.setDisplaySize(BOSS_W, BOSS_H);
  const baseScaleX = sprite.scaleX;
  const baseScaleY = sprite.scaleY;
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setImmovable(true);

  const projectiles = scene.physics.add.group({ maxSize: 16 });
  const shockwaves = scene.physics.add.group({ maxSize: 6, allowGravity: false });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 常駐果凍 wobble；slam / dash 期間暫停避免 scale 衝突。
  const wobble = scene.tweens.add({
    targets: sprite,
    scaleX: sprite.scaleX * 1.05,
    scaleY: sprite.scaleY * 0.94,
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
    startTintCycle({ r: 255, g: 255, b: 255 }, ENRAGE_TINT, 700);
  };

  // P3 進場演出（§30）：皇冠射出星環衝擊波（金色擴散環 + 星火），時停 0.3s 由 GameScene 接線。
  const startP3 = () => {
    sprite.setTexture('boss-enraged').setDisplaySize(BOSS_W, BOSS_H);
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
    // 池回收重用：追蹤彈殘留的 tint / 無重力 / homing 計時 / 反彈標記須復位。
    ball.clearTint();
    ball.setData('homingMs', 0);
    ball.setData('reflected', false);
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
        if (land.x >= 0 && land.x <= viewW()) {
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

  const doSlam = (quake: boolean) => {
    wobble.pause();
    const sf = fsm.speedFactor;
    // 前搖 0.35s：squash 蓄力 + 微紅 tint + 音效預告，之後才起跳。
    enrageTween?.pause();
    sprite.setTint(SLAM_WINDUP_TINT);
    playSfx('boss-slam');
    scene.tweens.add({
      targets: sprite,
      scaleX: baseScaleX * 1.18,
      scaleY: baseScaleY * 0.8,
      duration: SLAM_WINDUP_MS,
      ease: 'Quad.easeOut',
    });
    delay(SLAM_WINDUP_MS, () => {
      if (dying) return;
      if (enrageTween) enrageTween.resume();
      else sprite.clearTint();
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          {
            y: STAND_Y - 170,
            scaleX: baseScaleX,
            scaleY: baseScaleY,
            duration: 300 / sf,
            ease: 'Quad.easeOut',
          },
          { y: STAND_Y, duration: 180 / sf, ease: 'Quad.easeIn' },
          { scaleX: baseScaleX * 1.22, scaleY: baseScaleY * 0.78, duration: 90, yoyo: true },
        ],
        onComplete: () => {
          wobble.resume();
        },
      });
    });
    delay(SLAM_WINDUP_MS + 480 / sf, () => {
      if (dying) return;
      scene.cameras.main.shake(180, 0.008);
      spawnShockwave(1);
      spawnShockwave(-1);
      // P3 全場震落（§30）：站立玩家強制彈起由 GameScene 接線結算。
      if (quake) emitGameEvent(scene.events, GameEvents.BOSS_QUAKE, { x: sprite.x, y: sprite.y });
    });
  };

  const doDash = () => {
    wobble.pause();
    side = side === 'right' ? 'left' : 'right';
    const targetX = sideX(side);
    sprite.setFlipX(side === 'left');
    // 前搖 0.3s：面向衝刺側白閃兩次 + 原地抖動，之後才衝刺。
    flashWhite();
    delay(150, () => {
      if (!dying) flashWhite();
    });
    scene.tweens.add({
      targets: sprite,
      x: sprite.x + (targetX > sprite.x ? 6 : -6),
      duration: 25,
      yoyo: true,
      repeat: 5,
    });
    delay(DASH_WINDUP_MS, () => {
      if (dying) return;
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          { x: targetX, duration: 550 / fsm.speedFactor, ease: 'Sine.easeIn' },
          { scaleX: baseScaleX * 1.28, scaleY: baseScaleY * 0.76, duration: 110, yoyo: true },
        ],
        onComplete: () => {
          wobble.resume();
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
        doSlam(command.quake);
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
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: sprite.x, y: sprite.y });
    // 慢動作與星爆統一由 fx 系統的 BOSS_DEFEATED 監聽處理（單一權責）；600ms 對齊 fx slowMo 結束後淡出。
    delay(600, () => {
      scene.tweens.add({
        targets: sprite,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 420,
        ease: 'Back.easeIn',
      });
    });
  };

  const landFx = (shakeIntensity: number, withSquash: boolean) => {
    landingDust(scene, sprite.x, GROUND_TOP - 4);
    playSfx('boss-slam');
    scene.cameras.main.shake(150, shakeIntensity);
    if (!withSquash) return;
    scene.tweens.add({
      targets: sprite,
      scaleX: baseScaleX * 1.2,
      scaleY: baseScaleY * 0.78,
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
      targets: sprite,
      scaleX: baseScaleX * 1.14,
      scaleY: baseScaleY * 1.1,
      duration: 170,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
    delay(INTRO_ROAR_MS, introReset);
  };

  const introReset = () => {
    const cam = scene.cameras.main;
    cam.pan(viewW() / 2, VIEW.height / 2, INTRO_RESET_MS, 'Sine.easeInOut');
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
      // 推近焦點貼齊畫布右下（王座落點側）依當前視寬計算，確保取景不超出畫布邊界。
      const focusX = viewW() - viewW() / INTRO_ZOOM / 2;
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
            if (event.phase === 'p3') startP3();
            else startEnrage();
            emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
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
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
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
        if ((falling && ball.y > GROUND_TOP - 10) || ball.x < -40 || ball.x > viewW() + 40) {
          killProjectile(ball);
        }
      });
      shockwaves.getMatching('active', true).forEach((obj) => {
        const wave = obj as Phaser.Physics.Arcade.Sprite;
        if (wave.x < -60 || wave.x > viewW() + 60) killProjectile(wave);
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      enrageTween?.destroy();
      wobble.destroy();
      scene.tweens.killTweensOf(sprite);
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
    onMinionDrop(handler: () => void) {
      minionHandlers.push(handler);
    },
  };
}
