import Phaser from 'phaser';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { SYRONA, createSyronaFsm, type SyronaCommand } from '../logic/syronaFsm';
import type { TideSpec } from '../logic/tide';
import { UPDRAFT, isInUpdraft, ventPhase, type UpdraftZone } from '../logic/updraft';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { FX_TEXTURES, ensureFxTextures, spawnTelegraph } from './fx';

// 熔糖窯后 Syrona 呈現層（GAME_DESIGN §74）：與 boss/noctra/prismix 共用 BossHandle。
// 場控型：本體半定點於右側王窯座，威脅來自地形改寫（潮汐/噴泉/滴落/糖漿波）；
// phase truth 一律由 logic/syronaFsm.ts 持有，本模組僅結算演出/幾何/物理。
// arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 170;
const BODY_H = 150;
const THRONE_Y = GROUND_TOP - BODY_H / 2;
// 王窯座位置：arena 右緣 20% 帶（半定點，僅輕微浮動不追打）。
const THRONE_X_RATIO = 0.8;
// 皇冠弱點帶（§74）：本體頂緣下 34px 內命中 ×2 傷（乘噴口升空可達）。
const CROWN_BAND_PX = 34;
const SYRUP_TINT = 0xe89040;
const DEEP_TINT = 0xa85828;
// arena 噴口 ×2（§74）：比例位、週期同 L13 噴口；超載期恆噴＋升托增強。
const VENT_X_RATIOS = [0.3, 0.58] as const;
const VENT_TOP_Y = 130;
const VENT_W = 96;
const VENT_PERIOD_MS = 2600;
const VENT_DUTY = 0.31;
// 超載升托（§74 P3）：更強升速上限，開放直達皇冠的垂直路線。
const OVERLOAD_MAX_RISE = -640;
// 浮台 ×3（§74 保底位）：比例位；y 依 SYRONA.arenaPlatformYs。
const PLATFORM_X_RATIOS = [0.22, 0.47, 0.7] as const;
const PLATFORM_W = 140;
// 噴泉柱（走 shockwaves 管線）與招式參數。
const FOUNTAIN_W = 34;
const FOUNTAIN_H = 130;
const FOUNTAIN_ACTIVE_MS = 620;
const FOUNTAIN_STEP_MS = 320;
const LOB_SPEED_X = 150;
const LOB_SPEED_Y = -340;
const DRIP_CEILING_Y = 46;
const DRIP_FALL_SPEED = 260;
const WAVE_SPEED = 250;
const WAVE_W = 46;
const WAVE_H = 56;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近王窯 → 窯座升起 → 咆哮 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [40, 24, 16] as const;

// 佔位材質：正式 sprite 缺件時以窯座圓體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('boss-syrona')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(SYRUP_TINT, 1);
    g.fillEllipse(BODY_W / 2, BODY_H / 2 + 12, BODY_W, BODY_H - 24);
    g.fillStyle(DEEP_TINT, 1);
    g.fillEllipse(BODY_W / 2, BODY_H - 30, BODY_W - 20, 46);
    g.generateTexture('boss-syrona', BODY_W, BODY_H);
    g.destroy();
  }
  if (!scene.textures.exists('syrona-shot')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xf0a860, 1);
    g.fillCircle(9, 9, 9);
    g.generateTexture('syrona-shot', 18, 18);
    g.destroy();
  }
}

export interface SyronaHooks {
  // 召喚 Bubbla（§74 P2）：由 GameScene 依場上現量夾限至 cap，走正式 spawn 管線。
  summonBubbla(cap: number): void;
  // 窯風三連（§75）：乘噴口升空期間命中 ×3——GameScene 餵彩蛋觸發器＋謝幕演出。
  onVentEgg(): void;
  // 潮汐控制（§74）：P2 入場啟動、P3 大沸騰調參——沿 GameScene 單一潮汐管線。
  startTide(spec: TideSpec): void;
  boilTide(spec: TideSpec): void;
}

export interface SyronaOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createSyrona(
  scene: Phaser.Scene,
  hooks: SyronaHooks,
  options: SyronaOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createSyronaFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  let overloadUntilMs = 0;
  // 窯風三連計數（§75 單一真值，沿 twin-finish 模式）：乘噴口升空期間命中累計。
  let ventHitCount = 0;
  let ventEggDone = false;

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;

  const body = scene.physics.add.sprite(arenaX(THRONE_X_RATIO), -BODY_H, 'boss-syrona');
  body.setDisplaySize(BODY_W, BODY_H);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.85, body.height * 0.85);

  const projectiles = scene.physics.add.group({ maxSize: 20 });
  const shockwaves = scene.physics.add.group({ maxSize: 10, allowGravity: false });

  // arena 噴口（§74）：幾何由呈現層依視寬動態佈建；供力沿 logic/updraft 純函式。
  const vents: UpdraftZone[] = VENT_X_RATIOS.map((ratio) => ({
    x: arenaX(ratio),
    topY: VENT_TOP_Y,
    w: VENT_W,
    periodMs: VENT_PERIOD_MS,
    dutyPct: VENT_DUTY,
  }));
  const ventColumns = vents.map((zone) => {
    const height = GROUND_TOP - zone.topY;
    return scene.add
      .rectangle(zone.x, zone.topY + height / 2, zone.w, height, 0xffe0c0, 0.05)
      .setDepth(-4);
  });
  const ventParticles = vents.map((zone) =>
    scene.add
      .particles(0, 0, FX_TEXTURES.dot, {
        x: { min: zone.x - zone.w / 2 + 8, max: zone.x + zone.w / 2 - 8 },
        y: GROUND_TOP - 6,
        speedY: { min: -230, max: -150 },
        speedX: { min: -8, max: 8 },
        scale: { start: 0.6, end: 0.15 },
        alpha: { start: 0.5, end: 0 },
        lifespan: { min: 800, max: 1300 },
        frequency: 120,
        quantity: 1,
        tint: [0xffffff, 0xffe0c0],
        maxAliveParticles: 10,
      })
      .setDepth(-3),
  );
  ventParticles.forEach((emitter) => emitter.stop());

  // arena 浮台（§74 保底位）：單向靜態平台；collider 由 GameScene 於 buildBoss 後接線
  //（getPlatforms 暴露）。
  const platforms = PLATFORM_X_RATIOS.map((ratio, i) => {
    const y = SYRONA.arenaPlatformYs[i] ?? 336;
    const platform = scene.add.rectangle(arenaX(ratio), y, PLATFORM_W, 16, 0xffd1b0, 0.95);
    scene.physics.add.existing(platform, true);
    const platformBody = platform.body as Phaser.Physics.Arcade.StaticBody;
    platformBody.checkCollision.down = false;
    platformBody.checkCollision.left = false;
    platformBody.checkCollision.right = false;
    return platform;
  });

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
    gravity: boolean,
  ): Phaser.Physics.Arcade.Sprite | null => {
    const shot = projectiles.get(x, y, 'syrona-shot') as Phaser.Physics.Arcade.Sprite | null;
    if (!shot) return null;
    shot.enableBody(true, x, y, true, true);
    shot.setTint(0xf0a860);
    (shot.body as Phaser.Physics.Arcade.Body).setAllowGravity(gravity);
    return shot;
  };

  // 糖漿噴泉（§74）：指定點依 order 順序噴發——冒泡 telegraph 0.8s 後噴柱升起。
  const doFountain = (order: readonly number[]) => {
    const count = order.length;
    order.forEach((slot, seq) => {
      const x = arenaX(0.14 + (0.72 * slot) / Math.max(1, count - 1));
      delay(seq * FOUNTAIN_STEP_MS, () => {
        if (dying) return;
        spawnTelegraph(scene, x, GROUND_TOP - 6, SYRONA.fountainTelegraphMs);
        delay(SYRONA.fountainTelegraphMs, () => {
          if (dying) return;
          const column = shockwaves.get(
            x,
            GROUND_TOP - FOUNTAIN_H / 2,
            '__WHITE',
          ) as Phaser.Physics.Arcade.Sprite | null;
          if (!column) return;
          column.enableBody(true, x, GROUND_TOP - FOUNTAIN_H / 2, true, true);
          column.setDisplaySize(FOUNTAIN_W, FOUNTAIN_H).setTint(SYRUP_TINT).setAlpha(0.9);
          column.setScale(column.scaleX, 0.2);
          playSfx('pop', 0.8);
          scene.tweens.add({
            targets: column,
            scaleY: FOUNTAIN_H / column.height,
            duration: 150,
            ease: 'Back.easeOut',
          });
          delay(FOUNTAIN_ACTIVE_MS, () => column.disableBody(true, true));
        });
      });
    });
  };

  // 焦糖射彈（§74 P1）：舉臂 telegraph 後拋物 ×count 朝玩家側散射。
  const doLob = (count: number) => {
    flashWhite();
    scene.tweens.add({ targets: body, angle: -6, duration: 160, yoyo: true });
    delay(SYRONA.lobTelegraphMs, () => {
      if (dying) return;
      playSfx('pop');
      const dir = (target?.x ?? arenaCx()) < body.x ? -1 : 1;
      for (let i = 0; i < count; i += 1) {
        const shot = spawnShot(body.x + dir * 40, body.y - 30, true);
        (shot?.body as Phaser.Physics.Arcade.Body | undefined)?.setVelocity(
          dir * (LOB_SPEED_X + i * 60),
          LOB_SPEED_Y - i * 30,
        );
      }
    });
  };

  // 熔糖滴落（§74 P2）：天花板預警光斑 0.7s → 直墜滴落彈；點位橫向均分。
  const doDrip = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      const x = arenaX(0.12 + (0.76 * i) / Math.max(1, count - 1));
      spawnTelegraph(scene, x, DRIP_CEILING_Y, SYRONA.dripTelegraphMs);
      delay(SYRONA.dripTelegraphMs, () => {
        if (dying) return;
        const drop = spawnShot(x, DRIP_CEILING_Y + 8, false);
        (drop?.body as Phaser.Physics.Arcade.Body | undefined)?.setVelocity(0, DRIP_FALL_SPEED);
      });
    }
    playSfx('zap', 0.6);
  };

  // 召喚 Bubbla（§74 P2）：吟唱抖動後由 GameScene 走正式 spawn 管線。
  const doSummon = (cap: number) => {
    scene.tweens.add({ targets: body, angle: 5, duration: 60, yoyo: true, repeat: 5 });
    playSfx('boss-roar', 0.6);
    delay(SYRONA.summonDurationMs * 0.6, () => {
      if (!dying) hooks.summonBubbla(cap);
    });
  };

  // 全場糖漿波（§74 P3）：邊緣起浪 telegraph 後單向橫越（跳越可躲）。
  const doWave = () => {
    const fromLeft = (target?.x ?? arenaCx()) > arenaCx();
    const startX = fromLeft ? arenaLeft() + 20 : arenaLeft() + viewW() - 20;
    const dir = fromLeft ? 1 : -1;
    spawnTelegraph(scene, startX, GROUND_TOP - 20, SYRONA.waveTelegraphMs);
    delay(SYRONA.waveTelegraphMs, () => {
      if (dying) return;
      playSfx('boss-slam', 0.7);
      const wave = shockwaves.get(
        startX,
        GROUND_TOP - WAVE_H / 2,
        '__WHITE',
      ) as Phaser.Physics.Arcade.Sprite | null;
      if (!wave) return;
      wave.enableBody(true, startX, GROUND_TOP - WAVE_H / 2, true, true);
      wave.setDisplaySize(WAVE_W, WAVE_H).setTint(DEEP_TINT).setAlpha(0.92);
      (wave.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * WAVE_SPEED);
      // 壽命 = 橫越全場時間＋緩衝（逾時必回收 §56）。
      delay((viewW() / WAVE_SPEED) * 1000 + 400, () => wave.disableBody(true, true));
    });
  };

  // 噴口超載（§74 P3）：期間噴口恆噴＋升托增強，開放直達皇冠的垂直輸出路線。
  const doOverload = (durationMs: number) => {
    overloadUntilMs = elapsedMs + durationMs;
    playSfx('spring', 0.8);
    ventColumns.forEach((column) => column.setFillStyle(0xffd966, 0.28));
  };

  const runCommand = (command: SyronaCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'fountain':
        doFountain(command.order);
        return;
      case 'lob':
        doLob(command.count);
        return;
      case 'drip':
        doDrip(command.count);
        return;
      case 'summon':
        doSummon(command.cap);
        return;
      case 'wave':
        doWave();
        return;
      case 'overload':
        doOverload(command.durationMs);
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

  // 死亡冪等（§74）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(body);
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    ventParticles.forEach((emitter) => emitter.stop());
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

  // 乘噴口判定（§75）：玩家位於任一噴口柱域內＝升空乘托中。
  const targetRidingVent = (): boolean => {
    if (!target) return false;
    return vents.some((zone) => isInUpdraft(target?.x ?? 0, target?.y ?? 0, zone, GROUND_TOP));
  };

  const applyDamageInternal = (amount: number, crown: boolean, source?: BossDamageSource) => {
    if (!active) return;
    if (source === 'volt' && fsm.interruptSummon()) {
      playSfx('break');
      scene.tweens.add({ targets: body, angle: 4, duration: 45, yoyo: true, repeat: 3 });
    }
    // 皇冠弱點（§74）：頂帶命中 ×2 傷。
    const finalAmount = crown ? amount * SYRONA.crownDamageMul : amount;
    // 窯風三連（§75）：乘噴口升空期間命中累計；滿 3 觸發彩蛋（單場一次）。
    if (!ventEggDone && targetRidingVent()) {
      ventHitCount += 1;
      if (ventHitCount >= 3) {
        ventEggDone = true;
        hooks.onVentEgg();
      }
    }
    for (const event of fsm.takeDamage(finalAmount)) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          scene.tweens.add({ targets: body, angle: 3, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: finalAmount,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          // 場控地形改寫（§74）：P2 潮汐入場、P3 大沸騰（週期縮短＋漲頂升高）。
          if (event.phase === 'p2') {
            hooks.startTide({
              maxY: SYRONA.tideMaxY,
              periodMs: SYRONA.tidePeriodMs,
              dutyPct: SYRONA.tideDutyPct,
            });
          } else if (event.phase === 'p3') {
            hooks.boilTide({
              maxY: SYRONA.tideMaxY + SYRONA.boilMaxYDeltaPx,
              periodMs: Math.round(
                SYRONA.tidePeriodMs * (ex ? SYRONA.boilPeriodMul * 0.75 : SYRONA.boilPeriodMul),
              ),
              dutyPct: SYRONA.tideDutyPct,
            });
          }
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
  };

  // 入場：王窯座自地底升起（與墜落型/降臨型區隔——窯體「築起」語彙）。
  const introRise = () => {
    body.setPosition(arenaX(THRONE_X_RATIO), GROUND_TOP + BODY_H);
    scene.tweens.add({
      targets: body,
      y: THRONE_Y,
      duration: 900,
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
      const focusX = arenaX(THRONE_X_RATIO);
      const focusY = VIEW.height / INTRO_ZOOM / 2;
      cam.fadeOut(INTRO_FADE_MS, red, green, blue);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        cam.pan(focusX, focusY, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.zoomTo(INTRO_ZOOM, INTRO_PUSH_MS, 'Sine.easeInOut');
        cam.fadeIn(INTRO_FADE_MS + 140, red, green, blue);
        delay(INTRO_PUSH_MS * 0.5, introRise);
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      applyDamageInternal(amount, false, source);
    },
    applyDamageAt(amount: number, x: number, y: number, source?: BossDamageSource) {
      void x;
      applyDamageInternal(amount, y <= body.y - BODY_H / 2 + CROWN_BAND_PX, source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      elapsedMs += deltaMs;
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 半定點浮動（場控型不追打）；散熱僵直期輕微前傾露芯。
      const bob = Math.sin(elapsedMs * 0.0024) * 5;
      body.y = THRONE_Y + bob;
      body.setFlipX((target?.x ?? body.x) < body.x);
      body.setRotation(fsm.state === 'idle' ? 0.06 : 0);
      // 噴口視覺同步（§74）：超載期恆噴金光；平時沿週期相位。
      const overloading = elapsedMs < overloadUntilMs;
      for (const [i, zone] of vents.entries()) {
        const phase = ventPhase(elapsedMs, zone);
        const erupting = overloading || phase === 'erupt';
        const column = ventColumns[i];
        const particles = ventParticles[i];
        if (!column || !particles) continue;
        if (overloading) column.setFillStyle(0xffd966, 0.28);
        else {
          column.setFillStyle(0xffe0c0, erupting ? 0.2 : phase === 'telegraph' ? 0.1 : 0.05);
        }
        if (erupting && !particles.emitting) particles.start();
        else if (!erupting && particles.emitting) particles.stop();
      }
      // 出界/落地回收（anti-softlock §56 投射物壽命慣例）。
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
      body.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
      ventColumns.forEach((column) => column.destroy());
      ventParticles.forEach((emitter) => emitter.destroy());
      platforms.forEach((platform) => platform.destroy());
    },
    isActive() {
      return active;
    },
    // 場控型免暈（§74）：輸出窗來自僵直（散熱/吟唱/波後），下砸命中僅回彈免體傷。
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
    // arena 噴口供力查詢（§74）：GameScene 逐幀委派（沿 stage updraft 結算慣例）。
    getVentLift(x: number, y: number, vy: number, deltaMs: number, blockedUp: boolean) {
      const overloading = elapsedMs < overloadUntilMs;
      for (const zone of vents) {
        if (!overloading && ventPhase(elapsedMs, zone) !== 'erupt') continue;
        if (!isInUpdraft(x, y, zone, GROUND_TOP)) continue;
        if (blockedUp) return vy;
        const next = vy - UPDRAFT.liftPxPerSec2 * (overloading ? 1.4 : 1) * (deltaMs / 1000);
        return Math.max(next, overloading ? OVERLOAD_MAX_RISE : UPDRAFT.maxRiseSpeed);
      }
      return null;
    },
    // arena 浮台（§74）：GameScene 接玩家 collider。
    getPlatforms() {
      return platforms;
    },
  };
}
