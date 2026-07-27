import Phaser from 'phaser';
import { acquirePooled } from '../core/poolFlags';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { TransformForm } from '../core/types';
import { approachPoint } from '../logic/noctraFlight';
import { MARIDELLA, createMaridellaFsm, type MaridellaCommand } from '../logic/maridellaFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { FX_TEXTURES, ensureFxTextures, spawnTelegraph } from './fx';
import { getVisualScale } from './visualScale';

// 潮汐女王 Maridella 呈現層（GAME_DESIGN §122）：與 boss/noctra/prismix/syrona/voidra
// 共用 BossHandle。懸浮場控型：女王優雅懸浮於中高帶（approachPoint 逼近錨點，
// §64 慣例禁座標直寫），威脅來自潮線改道（水流推移）、海嘯階梯（缺口牆）與
// 深海月蝕（三水球依序環爆）；phase truth 由 logic/maridellaFsm.ts 持有。
// arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 160;
const BODY_H = 140;
// 懸浮帶：單跳星彈可打帶（§63 慣例，體底 320 落於可及幾何）；玩家亦可自底下走過。
const HOVER_Y = 250;
const APPROACH_SPEED = 300;
const SWAY_FREQ = 0.0006;
const SWAY_AMP_RATIO = 0.14;
const BOB_FREQ = 0.0021;
const BOB_AMP_PX = 10;
const AQUA_TINT = 0x6ac8e8;
const DEEP_TINT = 0x3a78b0;
// 潮線改道：地面帶判定高（腳踏地面帶才受推移）；潮化免推（§119 穩控優勢）。
const CURRENT_BAND_Y = GROUND_TOP - 60;
// 水滴彈幕拋物初速。
const DROPLET_SPEED_X = 140;
const DROPLET_SPEED_Y = -320;
// 海嘯階梯：牆體橫移速度；缺口幾何由 gapLow 決定（低缺口貼地走廊、高缺口跳躍帶）。
const WAVE_SPEED = 240;
const WAVE_TOP_Y = 90;
const WAVE_LOW_GAP_TOP = 298;
const WAVE_HIGH_GAP_TOP = 208;
// 深海月蝕：水球軌道半徑與環爆彈速；暗場覆蓋維持 telegraph 可讀（認知紅線）。
const ORB_RADIUS_PX = 90;
const ORB_SIZE = 30;
const ORB_DETONATE_STEP_MS = 900;
const RING_SPEED = 175;
const ECLIPSE_OVERLAY_ALPHA = 0.32;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近潮心 → 女王自水面升起 → 咆哮 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [14, 26, 40] as const;

// 佔位材質：正式 sprite 缺件時以潮水藍圓體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-maridella', AQUA_TINT, BODY_W, BODY_H);
  bake('boss-maridella-enraged', DEEP_TINT, BODY_W, BODY_H);
  if (!scene.textures.exists('maridella-drop')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x9ad8f0, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('maridella-drop', 16, 16);
    g.destroy();
  }
  if (!scene.textures.exists('maridella-arrow')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xbfe8f8, 1);
    g.fillTriangle(0, 0, 0, 18, 22, 9);
    g.generateTexture('maridella-arrow', 22, 18);
    g.destroy();
  }
}

export interface MaridellaHooks {
  // 潮湧召喚 foamy（§122 P2）：GameScene 依場上現量夾限至 cap，走正式 spawn 管線；
  // 泡泡上浮兼具渡牆輔助＝威脅同時是資源（孢子味＝潮化供給）。
  summonFoamy(cap: number): void;
  // 潮化穩控（§119 形態優勢）：潮化期間水流推移不作用；形態真值由 player 單點供給。
  playerForm(): TransformForm | null;
}

export interface MaridellaOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createMaridella(
  scene: Phaser.Scene,
  hooks: MaridellaHooks,
  options: MaridellaOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createMaridellaFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  // 潮線改道狀態：方向與迄點；telegraph 期不推移（箭頭先行）。
  let currentDir: 1 | -1 = 1;
  let currentUntilMs = 0;
  // 月蝕水球（視覺體，爆裂時轉環形彈）。
  const orbs = new Set<Phaser.GameObjects.Image>();

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;

  const body = scene.physics.add.sprite(arenaCx(), -BODY_H, 'boss-maridella');
  body.setDisplaySize(BODY_W, BODY_H);
  // 物理/視覺縮放解耦（§77 根治）：脈動/死亡收縮走 fx 代理，物理箱恆為基準。
  const vscale = getVisualScale(scene);
  vscale.register(body);
  const fxScale = vscale.fx(body);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.85, body.height * 0.85);

  const projectiles = scene.physics.add.group({ maxSize: 26, allowGravity: false });
  const shockwaves = scene.physics.add.group({ maxSize: 10, allowGravity: false });

  // 潮流地面帶視覺（恆駐低透明，推移期加亮）＋月蝕暗場覆蓋（P3，置於角色層之下
  // 保 telegraph 與本體可讀——暗場是氛圍不是資訊遮蔽）。
  const currentBand = scene.add
    .rectangle(arenaCx(), GROUND_TOP - 18, viewW(), 36, AQUA_TINT, 0.06)
    .setDepth(-3);
  const eclipseOverlay = scene.add
    .rectangle(arenaCx(), VIEW.height / 2, viewW() + 80, VIEW.height, 0x0a1430, 0)
    .setDepth(-2);
  const moon = scene.add.circle(arenaX(0.82), 120, 40, 0xd8ecff, 0).setDepth(-2);

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
    const shot = acquirePooled(projectiles, x, y, 'maridella-drop');
    if (!shot) return null;
    shot.enableBody(true, x, y, true, true);
    shot.setTexture('maridella-drop');
    shot.setDisplaySize(16, 16);
    shot.setTint(0x9ad8f0);
    (shot.body as Phaser.Physics.Arcade.Body).setAllowGravity(gravity);
    return shot;
  };

  // 潮線改道（P1+）：方向箭頭提前流動 telegraph → 地面帶水流推移玩家（潮化免推）。
  const doCurrent = (dir: 1 | -1, holdMs: number) => {
    currentDir = dir;
    playSfx('inhale', 0.4);
    // 方向箭頭 ×4 沿地面帶流動（telegraph 期即預告方向）。
    for (let i = 0; i < 4; i += 1) {
      const startRatio = dir === 1 ? 0.1 + i * 0.2 : 0.9 - i * 0.2;
      const arrow = scene.add
        .image(arenaX(startRatio), GROUND_TOP - 24, 'maridella-arrow')
        .setAlpha(0)
        .setFlipX(dir === -1)
        .setDepth(-1);
      scene.tweens.add({
        targets: arrow,
        alpha: { from: 0.9, to: 0 },
        x: arrow.x + dir * 90,
        duration: MARIDELLA.currentTelegraphMs + holdMs * 0.4,
        ease: 'Sine.easeOut',
        onComplete: () => arrow.destroy(),
      });
    }
    delay(MARIDELLA.currentTelegraphMs, () => {
      if (dying) return;
      currentUntilMs = elapsedMs + holdMs;
      currentBand.setFillStyle(AQUA_TINT, 0.18);
      playSfx('pop', 0.6);
    });
  };

  // 水滴彈幕（P1+）：舉臂 telegraph → 拋物 ×count 朝玩家側散射（沿 Syrona lob 慣例）。
  const doDroplet = (count: number) => {
    flashWhite();
    scene.tweens.add({ targets: body, angle: -6, duration: 160, yoyo: true });
    delay(MARIDELLA.dropletTelegraphMs, () => {
      if (dying) return;
      playSfx('pop');
      const dir = (target?.x ?? arenaCx()) < body.x ? -1 : 1;
      for (let i = 0; i < count; i += 1) {
        const shot = spawnShot(body.x + dir * 36, body.y - 20, true);
        (shot?.body as Phaser.Physics.Arcade.Body | undefined)?.setVelocity(
          dir * (DROPLET_SPEED_X + i * 55),
          DROPLET_SPEED_Y - i * 25,
        );
      }
    });
  };

  // 海嘯階梯（P2+）：起浪側 telegraph → 留缺口的波浪牆橫越全場——低缺口貼地可走、
  // 高缺口跳＋拍翅可穿（缺口 ≥102px 恆容本體，anti-softlock 由 FSM 測試守門）。
  const doWave = (fromLeft: boolean, gapLow: boolean) => {
    const startX = fromLeft ? arenaLeft() + 24 : arenaLeft() + viewW() - 24;
    const dir = fromLeft ? 1 : -1;
    spawnTelegraph(scene, startX, GROUND_TOP - 60, MARIDELLA.waveTelegraphMs);
    delay(MARIDELLA.waveTelegraphMs, () => {
      if (dying) return;
      playSfx('boss-slam', 0.7);
      // 牆體切兩段留缺口：gapLow＝上段（貼地走廊）；gapHigh＝上下兩段（跳躍帶）。
      const segments: { top: number; bottom: number }[] = gapLow
        ? [{ top: WAVE_TOP_Y, bottom: WAVE_LOW_GAP_TOP }]
        : [
            { top: WAVE_TOP_Y, bottom: WAVE_HIGH_GAP_TOP },
            { top: WAVE_HIGH_GAP_TOP + MARIDELLA.waveGapPx, bottom: GROUND_TOP },
          ];
      for (const segment of segments) {
        const height = segment.bottom - segment.top;
        const wall = acquirePooled(shockwaves, startX, segment.top + height / 2, '__WHITE');
        if (!wall) continue;
        wall.enableBody(true, startX, segment.top + height / 2, true, true);
        wall.setDisplaySize(44, height).setTint(DEEP_TINT).setAlpha(0.9);
        (wall.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * WAVE_SPEED);
        // 壽命 = 橫越全場時間＋緩衝（逾時必回收 §56）。
        delay((viewW() / WAVE_SPEED) * 1000 + 500, () => wall.disableBody(true, true));
      }
    });
  };

  // 潮湧召喚（P2）：吟唱抖動後由 GameScene 走正式 spawn 管線（雷化鏈電可斷召 §58）。
  const doSummon = (cap: number) => {
    scene.tweens.add({ targets: body, angle: 5, duration: 60, yoyo: true, repeat: 5 });
    playSfx('boss-roar', 0.6);
    delay(MARIDELLA.summonDurationMs * 0.6, () => {
      if (!dying) hooks.summonFoamy(cap);
    });
  };

  // 深海月蝕（P3）：水球依序繞行 → 每球爆裂前閃爍 telegraph → 環形放射彈。
  const doMoonorb = (count: number) => {
    playSfx('zap', 0.6);
    for (let i = 0; i < count; i += 1) {
      const orb = scene.add
        .image(body.x, body.y, FX_TEXTURES.dot)
        .setDisplaySize(ORB_SIZE, ORB_SIZE)
        .setTint(0x9ad8f0)
        .setAlpha(0.95)
        .setDepth(3);
      orb.setData('orbIndex', i);
      orb.setData('orbCount', count);
      orb.setData('orbBornMs', elapsedMs);
      orbs.add(orb);
      const detonateAt = (i + 1) * ORB_DETONATE_STEP_MS;
      // 爆裂前閃爍 telegraph（≥600ms 可讀性紅線）。
      delay(detonateAt - MARIDELLA.moonorbTelegraphMs, () => {
        if (dying || !orb.active) return;
        scene.tweens.add({
          targets: orb,
          alpha: { from: 0.95, to: 0.3 },
          duration: 120,
          yoyo: true,
          repeat: Math.floor(MARIDELLA.moonorbTelegraphMs / 240),
        });
      });
      delay(detonateAt, () => {
        if (dying || !orb.active) return;
        const { x, y } = orb;
        orbs.delete(orb);
        orb.destroy();
        playSfx('boss-slam', 0.8);
        // 環形衝擊波：全向放射彈 ×moonorbRingShots（無重力等速）。
        for (let shotIndex = 0; shotIndex < MARIDELLA.moonorbRingShots; shotIndex += 1) {
          const angle = (Math.PI * 2 * shotIndex) / MARIDELLA.moonorbRingShots;
          const shot = spawnShot(x, y, false);
          (shot?.body as Phaser.Physics.Arcade.Body | undefined)?.setVelocity(
            Math.cos(angle) * RING_SPEED,
            Math.sin(angle) * RING_SPEED,
          );
        }
      });
    }
  };

  const runCommand = (command: MaridellaCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'current':
        doCurrent(command.dir, command.holdMs);
        return;
      case 'droplet':
        doDroplet(command.count);
        return;
      case 'wave':
        doWave(command.fromLeft, command.gapLow);
        return;
      case 'summon':
        doSummon(command.cap);
        return;
      case 'moonorb':
        doMoonorb(command.count);
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

  const clearOrbs = () => {
    for (const orb of orbs) orb.destroy();
    orbs.clear();
  };

  // 死亡冪等（§74 慣例）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(body);
    vscale.killFxTweens(body);
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    clearOrbs();
    currentBand.setFillStyle(AQUA_TINT, 0.06);
    // 月蝕暗場隨擊破散去（星光回歸語彙）。
    scene.tweens.add({ targets: [eclipseOverlay, moon], fillAlpha: 0, alpha: 0, duration: 600 });
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: body.x, y: body.y });
    delay(600, () => {
      scene.tweens.add({ targets: fxScale, sx: 0, sy: 0, duration: 420, ease: 'Back.easeIn' });
      scene.tweens.add({ targets: body, alpha: 0, duration: 420, ease: 'Back.easeIn' });
    });
  };

  const applyDamageInternal = (amount: number, source?: BossDamageSource) => {
    if (!active) return;
    // 雷化斷召（§58 慣例）：鏈電命中吟唱中的女王立即中斷召喚。
    if (source === 'volt' && fsm.interruptSummon()) {
      playSfx('break');
      scene.tweens.add({ targets: body, angle: 4, duration: 45, yoyo: true, repeat: 3 });
    }
    for (const event of fsm.takeDamage(amount)) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          scene.tweens.add({ targets: body, angle: 3, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: amount,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          if (event.phase === 'p2') {
            // 狂暴換裝（§17 慣例）：P2 起換 enraged 立繪（顯示尺寸重錨＋vscale 基準回寫）。
            body.setTexture('boss-maridella-enraged').setDisplaySize(BODY_W, BODY_H);
            vscale.rebase(body);
            playSfx('boss-roar', 1.1);
            scene.cameras.main.flash(280, 150, 210, 255);
          } else if (event.phase === 'p3') {
            // 深海月蝕入場：背景轉暗＋水月升起（氛圍暗場，telegraph 亮度不受影響）。
            playSfx('boss-roar', 1.3);
            scene.cameras.main.flash(320, 90, 140, 220);
            scene.cameras.main.shake(200, 0.007);
            scene.tweens.add({
              targets: eclipseOverlay,
              fillAlpha: ECLIPSE_OVERLAY_ALPHA,
              duration: 900,
            });
            moon.setAlpha(0);
            scene.tweens.add({ targets: moon, alpha: 0.85, y: 96, duration: 1200 });
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

  // 懸浮錨點（§64 慣例）：相位導出目標、速度上限逼近——接管交還必為連續飛行。
  const anchorPoint = () => ({
    x: arenaCx() + Math.sin(elapsedMs * SWAY_FREQ) * viewW() * SWAY_AMP_RATIO,
    y: HOVER_Y + Math.sin(elapsedMs * BOB_FREQ) * BOB_AMP_PX,
  });

  // 入場：潮汐女王自潮面升起（與滑入/降臨型區隔——「湧升」語彙）。
  const introRise = () => {
    body.setPosition(arenaCx(), GROUND_TOP + BODY_H);
    scene.tweens.add({
      targets: body,
      y: HOVER_Y,
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
      targets: fxScale,
      sx: 1.12,
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
      const focusX = arenaCx();
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
      applyDamageInternal(amount, source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      elapsedMs += deltaMs;
      // 距離帶餵送（§111.1 條件欄）。
      fsm.setTargetDistance(
        target ? Phaser.Math.Distance.Between(body.x, body.y, target.x, target.y) : null,
      );
      const command = fsm.tick(deltaMs);
      if (command) runCommand(command);
      // 懸浮駕駛：一律 approachPoint 逼近錨點（§64 慣例禁座標直寫）。
      const next = approachPoint(
        { x: body.x, y: body.y },
        anchorPoint(),
        APPROACH_SPEED * fsm.speedFactor,
        deltaMs,
      );
      body.setPosition(next.x, next.y);
      body.setFlipX((target?.x ?? body.x) < body.x);
      body.setRotation(fsm.state === 'idle' ? 0.04 : 0);
      // 潮線推移結算：地面帶內水平 positional drift（恆低於玩家全速，交叉不變式 16）；
      // 潮化免推（§119 穩控）——零傷推移，非傷害管線。
      if (target && elapsedMs < currentUntilMs) {
        if (target.y > CURRENT_BAND_Y && hooks.playerForm() !== 'tide') {
          target.x += currentDir * MARIDELLA.currentPushPxPerSec * (deltaMs / 1000);
        }
      } else if (currentUntilMs > 0 && elapsedMs >= currentUntilMs) {
        currentUntilMs = 0;
        currentBand.setFillStyle(AQUA_TINT, 0.06);
      }
      // 月蝕水球繞行（視覺體，錨定本體軌道）。
      for (const orb of orbs) {
        const index = (orb.getData('orbIndex') as number) ?? 0;
        const count = (orb.getData('orbCount') as number) ?? 1;
        const born = (orb.getData('orbBornMs') as number) ?? elapsedMs;
        const angle = ((Math.PI * 2) / count) * index + (elapsedMs - born) * 0.0024;
        orb.setPosition(
          body.x + Math.cos(angle) * ORB_RADIUS_PX,
          body.y + Math.sin(angle) * ORB_RADIUS_PX,
        );
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
      // 海嘯牆出界回收。
      shockwaves.getMatching('active', true).forEach((obj) => {
        const wave = obj as Phaser.Physics.Arcade.Sprite;
        if (wave.x < arenaLeft() - 120 || wave.x > arenaLeft() + viewW() + 120) {
          killProjectile(wave);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      scene.tweens.killTweensOf(body);
      vscale.unregister(body);
      body.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
      clearOrbs();
      currentBand.destroy();
      eclipseOverlay.destroy();
      moon.destroy();
    },
    isActive() {
      return active;
    },
    // 懸浮場控型免暈（§74 慣例）：輸出窗來自 idle 僵直，下砸命中僅回彈免體傷。
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
    // e2e 觀測（§83 慣例）：FSM 階段/招式即時值。
    getDebugState() {
      return { phase: fsm.phase, state: fsm.state };
    },
  };
}
