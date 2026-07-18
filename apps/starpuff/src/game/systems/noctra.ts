import Phaser from 'phaser';
import { GRAVITY_Y, VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { EX_NOCTRA, NOCTRA, createNoctraFsm, type NoctraCommand } from '../logic/noctraFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { spawnTelegraph } from './fx';

// 暗月蝠王 Noctra 呈現層（GAME_DESIGN §54）：與 systems/boss.ts 同 BossHandle 介面，
// GameScene 依 level.boss 品種擇一建立，事件契約（BOSS_*）完全共用。
// phase truth 一律由 logic/noctraFsm.ts 持有，本模組僅結算演出與物理。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 150;
const BODY_H = 110;
// 空中型（§54）：常態盤旋高度與側緣邊距。
// 難度根修（實測席稽核）：168 → 246——含 ±14 呼吸浮動下，單跳頂點星彈（y≈282）
// 恆在命中帶（|Δy| < 星半徑＋碰撞半高 ≈59）內，地面保底線（單跳點射）穩定成立；
// 拍翅為加成非必需。
const HOVER_Y = 246;
// 難度根修：130 → 190——收窄盤旋掃幅，牆側留出玩家可站的安全喘息帶（錨點打法成立）。
const SIDE_MARGIN_X = 190;
// 俯掠帶高度（§54 P3）：站立可躲（帶底 330 < 站立頂 ~360）、跳躍會撞。
const SWEEP_Y = 280;
// 招式預警時長：dive 落點標記、sweep 橫帶閃爍、bomb 落點標記提前量。
// 難度根修：dive 550 → 720、sweep 600 → 750（普通反應 250-400ms 可讀可躲）。
const DIVE_TELEGRAPH_MS = 720;
const SWEEP_TELEGRAPH_MS = 750;
const BOMB_PREDROP_MS = 300;
const BARRAGE_SPEED = 170;
const BOMB_TINT = 0x9f8fe8;
const BARRAGE_TINT = 0xc9b8ff;

// 入場演出（§54）：黑幕淡入 → 月色推近 → 蝠王自頂俯掠兩趟落定盤旋 → 吼叫 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1100;
const INTRO_ZOOM = 1.4;
const INTRO_ROAR_MS = 800;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [20, 16, 40] as const;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const P2_FROM: Rgb = { r: 255, g: 255, b: 255 };
const P2_TO: Rgb = { r: 216, g: 107, b: 123 };
const P3_FROM: Rgb = { r: 255, g: 217, b: 102 };
const P3_TO: Rgb = { r: 122, g: 111, b: 216 };

// 佔位材質：正式 sprite 缺件時以橢圓烘焙保底避免 runtime crash（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-noctra', 0x7a6fd8, BODY_W, BODY_H);
  bake('noctra-bomb', 0x9f8fe8, 18, 18);
}

export interface NoctraHooks {
  // 召喚 floaty（§54 P2）：由 GameScene 依場上現量夾限至 cap，走正式 spawn 管線。
  summonFloaty(cap: number): void;
}

export interface NoctraOptions {
  ex?: boolean;
}

export function createNoctra(
  scene: Phaser.Scene,
  hooks: NoctraHooks,
  options: NoctraOptions = {},
): BossHandle {
  ensureTextures(scene);

  const fsm = createNoctraFsm({ ex: options.ex === true });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let hoverMs = 0;
  // 盤旋/俯衝互斥：演出 tween 接管期間停用盤旋駕駛。
  let steering = true;
  // 俯衝落地 hit window（§58）：窗內頭頂下砸觸發長暈；召喚待決計時供雷化中斷取消。
  let slamWindowUntilMs = 0;
  let stunnedUntilMs = 0;
  let pendingSummon: Phaser.Time.TimerEvent | null = null;

  const viewW = () => scene.scale.width;

  const sprite = scene.physics.add.sprite(viewW() / 2, -BODY_H, 'boss-noctra');
  sprite.setDisplaySize(BODY_W, BODY_H);
  const baseScaleX = sprite.scaleX;
  const baseScaleY = sprite.scaleY;
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setImmovable(true);
  // 命中寬容：碰撞體縮至視覺 85%（翼展留寬容）。
  body.setSize(sprite.width * 0.85, sprite.height * 0.85);

  const projectiles = scene.physics.add.group({ maxSize: 20 });
  const shockwaves = scene.physics.add.group({ maxSize: 2, allowGravity: false });

  const delay = (ms: number, fn: () => void) => {
    timers.push(scene.time.delayedCall(ms, fn));
  };

  // 常駐翼拍律動；dive/sweep 期間暫停避免 scale 衝突。
  const wingbeat = scene.tweens.add({
    targets: sprite,
    scaleX: sprite.scaleX * 1.07,
    scaleY: sprite.scaleY * 0.92,
    duration: 480,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    paused: true,
  });

  let enrageTween: Phaser.Tweens.Tween | null = null;

  // 體色呼吸循環（§54 階段轉換 telegraph）：兩色往返插值，統一走 fx 慣例。
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

  const flashWhite = () => {
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

  const spawnBall = (x: number, y: number, tint: number): Phaser.Physics.Arcade.Sprite | null => {
    const ball = projectiles.get(x, y, 'noctra-bomb') as Phaser.Physics.Arcade.Sprite | null;
    if (!ball) return null;
    ball.enableBody(true, x, y, true, true);
    ball.setTint(tint);
    // 池回收重用：殼化反彈標記須復位。
    ball.setData('reflected', false);
    return ball;
  };

  // 盤旋投彈（§54 P1/P2）：沿盤旋航線逐顆投彈，落點預警先行。
  const launchBombs = (count: number) => {
    const stagger = 720 / count / fsm.speedFactor;
    for (let i = 0; i < count; i += 1) {
      delay(i * stagger, () => {
        if (dying) return;
        const dropX = sprite.x;
        const dropY = sprite.y + BODY_H / 2;
        // 自由落體時間解析解：預警持續至彈著。
        const fallMs = Math.sqrt((2 * (GROUND_TOP - dropY)) / GRAVITY_Y) * 1000;
        spawnTelegraph(scene, dropX, GROUND_TOP - 6, BOMB_PREDROP_MS + fallMs);
        delay(BOMB_PREDROP_MS, () => {
          if (dying) return;
          const bomb = spawnBall(dropX, dropY, BOMB_TINT);
          if (!bomb) return;
          (bomb.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
          bomb.setVelocity(Phaser.Math.Between(-30, 30), 40);
        });
      });
    }
  };

  // 俯衝（§54/§58）：前搖鎖定玩家落點（telegraph＋shake＋變色）→ 俯衝至地面帶 → 回升；
  // 落地瞬間開啟頭頂下砸長暈 hit window。
  const doDive = () => {
    wingbeat.pause();
    steering = false;
    const aimX = Phaser.Math.Clamp(target?.x ?? viewW() / 2, 60, viewW() - 60);
    spawnTelegraph(scene, aimX, GROUND_TOP - 6, DIVE_TELEGRAPH_MS + 300);
    flashWhite();
    shake();
    playSfx('boss-roar', 1.4);
    delay(DIVE_TELEGRAPH_MS, () => {
      if (dying) return;
      sprite.setFlipX(aimX < sprite.x);
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          {
            x: aimX,
            y: GROUND_TOP - 60,
            duration: 320 / fsm.speedFactor,
            ease: 'Quad.easeIn',
            onComplete: () => {
              playSfx('boss-slam');
              scene.cameras.main.shake(140, 0.007);
              slamWindowUntilMs = scene.time.now + NOCTRA.diveStunWindowMs;
            },
          },
          {
            y: HOVER_Y,
            duration: 420 / fsm.speedFactor,
            ease: 'Quad.easeOut',
            // 落地滯留（難度根修）：貼地 hold 給地面水平星彈明確輸出窗後才回升。
            delay: NOCTRA.diveHoldMs / fsm.speedFactor,
          },
        ],
        onComplete: () => {
          steering = true;
          wingbeat.resume();
        },
      });
    });
  };

  // 召喚（§54/§58 P2）：短促蓄勢後由 GameScene 依 cap 補場；蓄勢期可被雷化鏈電中斷。
  const doSummon = (cap: number) => {
    flashWhite();
    playSfx('charge');
    scene.tweens.add({
      targets: sprite,
      scaleX: baseScaleX * 1.15,
      scaleY: baseScaleY * 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    pendingSummon = scene.time.delayedCall(250, () => {
      pendingSummon = null;
      if (!dying) hooks.summonFloaty(cap);
    });
    timers.push(pendingSummon);
  };

  // 月蝕彈幕矩陣（§58 EX P3）：分列直落彈網逐波落下，每波隨機留缺口通道。
  const doEclipse = (cols: number, rows: number, gapCols: number) => {
    flashWhite();
    playSfx('starstorm', 0.9);
    for (let row = 0; row < rows; row += 1) {
      delay((row * EX_NOCTRA.eclipseRowDelayMs) / fsm.speedFactor, () => {
        if (dying) return;
        const gaps = new Set<number>();
        while (gaps.size < gapCols) gaps.add(Phaser.Math.Between(0, cols - 1));
        for (let col = 0; col < cols; col += 1) {
          if (gaps.has(col)) continue;
          const x = ((col + 0.5) * viewW()) / cols;
          spawnTelegraph(scene, x, GROUND_TOP - 6, 500);
          const ball = spawnBall(x, -14, BARRAGE_TINT);
          if (!ball) continue;
          (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
          ball.setVelocity(0, EX_NOCTRA.eclipseFallSpeed * fsm.speedFactor);
        }
      });
    }
  };

  // 狂暴彈幕（§54 P3）：全向放射彈環。
  const doBarrage = (count: number) => {
    flashWhite();
    playSfx('starstorm', 1.3);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const ball = spawnBall(sprite.x, sprite.y, BARRAGE_TINT);
      if (!ball) continue;
      (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      ball.setVelocity(Math.cos(angle) * BARRAGE_SPEED, Math.sin(angle) * BARRAGE_SPEED);
    }
  };

  // 全場俯掠（§54 P3）：橫帶預警閃爍後貼帶速掠全場；站立可躲、跳躍會撞。
  const doSweep = () => {
    wingbeat.pause();
    steering = false;
    const fromLeft = sprite.x < viewW() / 2;
    const startX = fromLeft ? -BODY_W / 2 : viewW() + BODY_W / 2;
    const endX = fromLeft ? viewW() + BODY_W / 2 : -BODY_W / 2;
    const band = scene.add
      .rectangle(viewW() / 2, SWEEP_Y, viewW(), BODY_H * 0.7, 0x9f8fe8, 0.16)
      .setDepth(58);
    scene.tweens.add({
      targets: band,
      alpha: { from: 0.35, to: 0.1 },
      duration: 150,
      yoyo: true,
      repeat: 3,
      onComplete: () => band.destroy(),
    });
    playSfx('boss-roar', 1.2);
    delay(SWEEP_TELEGRAPH_MS, () => {
      if (dying) return;
      sprite.setFlipX(!fromLeft);
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          { x: startX, y: SWEEP_Y, duration: 260 / fsm.speedFactor, ease: 'Sine.easeOut' },
          {
            x: endX,
            duration: 620 / fsm.speedFactor,
            ease: 'Sine.easeInOut',
            onStart: () => playSfx('flap', 0.7),
          },
          {
            x: viewW() / 2,
            y: HOVER_Y,
            duration: 420 / fsm.speedFactor,
            ease: 'Quad.easeOut',
          },
        ],
        onComplete: () => {
          steering = true;
          wingbeat.resume();
        },
      });
    });
  };

  const runCommand = (command: NoctraCommand) => {
    switch (command.kind) {
      case 'hover':
        return;
      case 'bomb':
        launchBombs(command.count);
        return;
      case 'dive':
        doDive();
        return;
      case 'summon':
        doSummon(command.cap);
        return;
      case 'barrage':
        doBarrage(command.count);
        return;
      case 'sweep':
        doSweep();
        return;
      case 'eclipse':
        doEclipse(command.cols, command.rows, command.gapCols);
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

  // 死亡冪等（§54）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(sprite);
    projectiles.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: sprite.x, y: sprite.y });
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

  // 入場：自頂俯掠兩趟落定盤旋位（空中型不落地，與果凍王三段落座區隔）。
  const introSwoop = () => {
    scene.tweens.chain({
      targets: sprite,
      tweens: [
        { x: viewW() * 0.22, y: HOVER_Y + 90, duration: 420, ease: 'Sine.easeInOut' },
        { x: viewW() * 0.75, y: HOVER_Y + 30, duration: 420, ease: 'Sine.easeInOut' },
        { x: viewW() / 2, y: HOVER_Y, duration: 360, ease: 'Quad.easeOut' },
      ],
      onComplete: introRoar,
    });
  };

  const introRoar = () => {
    emitGameEvent(scene.events, GameEvents.BOSS_SPAWNED, { maxHp: fsm.maxHp });
    scene.tweens.add({
      targets: scene.cameras.main,
      zoom: INTRO_ZOOM * 1.05,
      duration: 130,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: sprite,
      scaleX: baseScaleX * 1.16,
      scaleY: baseScaleY * 1.12,
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
      wingbeat.play();
      active = true;
      // EX 入場變色（§58）：緋紅呼吸循環作為變體識別基調。
      if (options.ex) startTintCycle({ r: 255, g: 255, b: 255 }, { r: 216, g: 75, b: 106 }, 900);
    });
  };

  return {
    spawn() {
      const cam = scene.cameras.main;
      const [red, green, blue] = INTRO_FADE_RGB;
      // 推近焦點貼齊畫布上緣（月空盤旋側）依當前視寬計算。
      const focusX = viewW() / 2;
      const focusY = VIEW.height / INTRO_ZOOM / 2;
      cam.fadeOut(INTRO_FADE_MS, red, green, blue);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.pan(focusX, focusY, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.zoomTo(INTRO_ZOOM, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.fadeIn(INTRO_FADE_MS + 140, red, green, blue);
        delay(INTRO_PUSH_MS * 0.5, introSwoop);
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      if (!active) return;
      // 雷化鏈電中斷召喚（§58）：FSM 裁決成功時取消待決召喚並播中斷演出。
      if (source === 'volt' && fsm.interruptSummon()) {
        pendingSummon?.remove(false);
        pendingSummon = null;
        playSfx('break');
        shake();
        scene.tweens.killTweensOf(sprite);
        sprite.setScale(baseScaleX, baseScaleY);
      }
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
            if (event.phase === 'p3') startTintCycle(P3_FROM, P3_TO, 420);
            else startTintCycle(P2_FROM, P2_TO, 700);
            emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
            break;
          case 'minionDrop':
            minionHandlers.forEach((handler) => handler());
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
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 盤旋駕駛：水平緩擺＋垂直呼吸浮動；演出 tween 接管期間讓位。
      // 難度根修：掃速 0.0009 → 0.0007——峰值橫移降至玩家走速以下（P1 約 208px/s），
      // 保持間距的走位真正可行（原值 267px/s 追過玩家 220px/s）。
      if (steering) {
        hoverMs += deltaMs * fsm.speedFactor;
        const span = viewW() / 2 - SIDE_MARGIN_X;
        sprite.x = viewW() / 2 + Math.sin(hoverMs * 0.0007) * span;
        sprite.y = HOVER_Y + Math.sin(hoverMs * 0.0021) * 14;
        sprite.setFlipX(Math.cos(hoverMs * 0.0007) < 0);
      }
      projectiles.getMatching('active', true).forEach((obj) => {
        const ball = obj as Phaser.Physics.Arcade.Sprite;
        const ballBody = ball.body as Phaser.Physics.Arcade.Body;
        const falling = ballBody.allowGravity && ballBody.velocity.y > 0;
        if (
          (falling && ball.y > GROUND_TOP - 10) ||
          ball.x < -40 ||
          ball.x > viewW() + 40 ||
          ball.y < -40 ||
          ball.y > VIEW.height + 40
        ) {
          killProjectile(ball);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      enrageTween?.destroy();
      wingbeat.destroy();
      scene.tweens.killTweensOf(sprite);
      projectiles.destroy(true);
      shockwaves.destroy(true);
      sprite.destroy();
    },
    isActive() {
      return active;
    },
    // 俯衝落地窗長暈（§58）：僅窗內頭頂命中觸發；窗外命中僅回彈不暈。
    trySlamStun() {
      if (!active || dying) return false;
      if (scene.time.now > slamWindowUntilMs || scene.time.now < stunnedUntilMs) return false;
      stunnedUntilMs = scene.time.now + NOCTRA.diveStunMs;
      fsm.stun(NOCTRA.diveStunMs);
      playSfx('metal', 0.7);
      // 長暈演出：凍結演出 tween、貼地昏沉搖擺，期滿回升盤旋。
      scene.tweens.killTweensOf(sprite);
      steering = false;
      wingbeat.pause();
      sprite.setTint(0xcfcfcf);
      scene.tweens.add({
        targets: sprite,
        angle: { from: -8, to: 8 },
        duration: 200,
        yoyo: true,
        repeat: Math.floor(NOCTRA.diveStunMs / 400),
      });
      delay(NOCTRA.diveStunMs, () => {
        if (dying) return;
        sprite.setAngle(0);
        if (enrageTween) enrageTween.resume();
        else sprite.clearTint();
        scene.tweens.add({
          targets: sprite,
          y: HOVER_Y,
          duration: 420,
          ease: 'Quad.easeOut',
          onComplete: () => {
            steering = true;
            wingbeat.resume();
          },
        });
      });
      return true;
    },
    getBody() {
      return sprite;
    },
    getProjectiles() {
      return projectiles;
    },
    // 介面對齊 boss.ts：Noctra 無地面震波，回傳空群組維持 GameScene 單一接線。
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
