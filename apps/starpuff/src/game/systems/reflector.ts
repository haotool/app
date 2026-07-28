import Phaser from 'phaser';
import { acquirePooled } from '../core/poolFlags';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import { approachPoint } from '../logic/noctraFlight';
import { shadowActive, shadowSpawnX, stepShadowX, stepShadowY } from '../logic/mirrorShadow';
import { REFLECTOR, createReflectorFsm, type ReflectorCommand } from '../logic/reflectorFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { ensureFxTextures, spawnTelegraph } from './fx';
import { getVisualScale } from './visualScale';

// 鏡界館長 Reflector 呈現層（GAME_DESIGN §123）：與 boss/noctra/prismix/syrona/voidra
// 共用 BossHandle。懸浮鏡界型：館長優雅懸浮於中高帶（approachPoint 逼近錨點，§64 慣例
// 禁座標直寫），威脅來自鏡面回彈（固定射線提前顯示）、假噗噗分身（§112.3 鏡影管線
// 泛化）與全景反射（鏡板折射自身彈幕）；phase truth 由 logic/reflectorFsm.ts 持有。
// arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 160;
const BODY_H = 140;
// 懸浮帶：單跳星彈可打帶（§63 慣例）；玩家亦可自底下走過。
const HOVER_Y = 250;
const APPROACH_SPEED = 300;
const SWAY_FREQ = 0.0006;
const SWAY_AMP_RATIO = 0.13;
const BOB_FREQ = 0.0021;
const BOB_AMP_PX = 9;
const SILVER_TINT = 0xd8dcf0;
const ENRAGED_TINT = 0xb0a8e0;
// 折射光束：鎖定射線後的長彈體。
const BEAM_SPEED = 460;
const BEAM_W = 84;
const BEAM_H = 14;
// 稜光碎片扇（P1/P3 共用彈體）。
const SHARD_SPEED = 235;
const SHARD_FAN_VY = 85;
// 鏡面回彈：回彈彈體速度（沿固定射線；提前顯示的光線即彈道）。
const REBOUND_SPEED = 300;
const REBOUND_LIFE_MS = 2400;
// 假噗噗分身：銀紫鏡影（§112.3 語彙）。
const CLONE_SIZE = 44;
const CLONE_TINT = 0xc8d0f0;
// 全景反射：頂部鏡板帶（折返一次的反射面）與鏡板視覺。
const PANEL_BAND_Y = 96;
const PANEL_H = 14;
const RAY_LENGTH = 620;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近鏡壇 → 館長自鏡光中現形 → 咆哮 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [26, 26, 40] as const;

// 佔位材質：正式 sprite 缺件時以鏡銀圓體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-reflector', SILVER_TINT, BODY_W, BODY_H);
  bake('boss-reflector-enraged', ENRAGED_TINT, BODY_W, BODY_H);
}

export interface ReflectorHooks {
  // 假噗噗分身鏡影錨（§112.3 泛化）：玩家 sprite 位置由 GameScene 的 player 供給
  //（分身水平反向移動、垂直速度上限跟隨）。
  playerPos(): { x: number; y: number } | null;
}

export interface ReflectorOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createReflector(
  scene: Phaser.Scene,
  hooks: ReflectorHooks,
  options: ReflectorOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createReflectorFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  // 鏡面回彈射線（開鏡時鎖定朝玩家方位，窗內固定不修正——提前顯示即反制）。
  let rayAngles: number[] = [];
  let rayGfx: Phaser.GameObjects.Graphics | null = null;
  // 全景鏡板（P3 招式期間顯示；折返判定以 PANEL_BAND_Y 為準）。
  let panelGfx: Phaser.GameObjects.Graphics | null = null;
  let panelUntilMs = 0;
  // 假噗噗分身（§112.3 鏡影管線泛化為多具）。
  const clones: Phaser.Physics.Arcade.Sprite[] = [];
  const cloneSpawnAt: number[] = [];

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;
  const clampArenaX = (x: number, inset: number) =>
    Phaser.Math.Clamp(x, arenaLeft() + inset, arenaLeft() + viewW() - inset);

  const body = scene.physics.add.sprite(arenaCx(), -BODY_H, 'boss-reflector');
  body.setDisplaySize(BODY_W, BODY_H);
  // 物理/視覺縮放解耦（§77 根治）：脈動/死亡收縮走 fx 代理，物理箱恆為基準。
  const vscale = getVisualScale(scene);
  vscale.register(body);
  const fxScale = vscale.fx(body);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.85, body.height * 0.85);

  const projectiles = scene.physics.add.group({ maxSize: 28, allowGravity: false });
  const shockwaves = scene.physics.add.group({ maxSize: 10, allowGravity: false });
  // 分身雙掛 shields（星彈 1 發即破）＋ shockwaves（觸傷），沿 §112.3 工程接點。
  const shields = scene.physics.add.group({ maxSize: 6, allowGravity: false });

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

  const killProjectile = (obj: Phaser.GameObjects.GameObject) => {
    (obj as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  };

  // 場上存活回彈數（上限夾限用；呈現層事實）。
  const aliveRebounds = (): number =>
    projectiles.getMatching('active', true).filter((obj) => {
      return (obj as Phaser.Physics.Arcade.Sprite).getData('rebound') === true;
    }).length;

  // 稜光彈體共用生成（碎片/光束/回彈）。
  const spawnBolt = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    tint: number,
    w: number,
    h: number,
  ): Phaser.Physics.Arcade.Sprite | null => {
    const bolt = acquirePooled(projectiles, x, y, 'fx-star');
    if (!bolt) return null;
    bolt.enableBody(true, x, y, true, true);
    bolt.setTexture('fx-star');
    bolt.setDisplaySize(w, h);
    bolt.setTint(tint);
    bolt.setAlpha(0.95);
    bolt.setRotation(Math.atan2(vy, vx));
    const boltBody = bolt.body as Phaser.Physics.Arcade.Body;
    boltBody.setAllowGravity(false);
    boltBody.setVelocity(vx, vy);
    return bolt;
  };

  // 折射光束：鎖定射線 telegraph（線體漸亮）後沿線發射長彈體。
  const doBeam = () => {
    const aimX = target?.x ?? arenaCx();
    const aimY = target?.y ?? GROUND_TOP - 30;
    const angle = Math.atan2(aimY - body.y, aimX - body.x);
    drawRays([angle], REFLECTOR.beamTelegraphMs, 0x9ec4ff);
    playSfx('zap', 0.6);
    delay(REFLECTOR.beamTelegraphMs, () => {
      if (dying) return;
      playSfx('zap', 1.1);
      spawnBolt(
        body.x,
        body.y,
        Math.cos(angle) * BEAM_SPEED,
        Math.sin(angle) * BEAM_SPEED,
        0x9ec4ff,
        BEAM_W,
        BEAM_H,
      );
    });
  };

  // 稜光碎片扇：玩家側三發扇形。
  const doShard = () => {
    flashWhite();
    const direction = (target?.x ?? arenaCx()) < body.x ? -1 : 1;
    spawnTelegraph(scene, body.x + direction * 60, body.y, REFLECTOR.shardTelegraphMs);
    delay(REFLECTOR.shardTelegraphMs, () => {
      if (dying) return;
      playSfx('flap', 1.2);
      const tints = [0xff9ec4, 0xffd966, 0xb09ae8] as const;
      for (let i = 0; i < 3; i += 1) {
        spawnBolt(
          body.x + direction * 40,
          body.y,
          direction * SHARD_SPEED,
          (i - 1) * SHARD_FAN_VY,
          tints[i] ?? 0xffffff,
          18,
          12,
        );
      }
    });
  };

  // 反射射線顯示（提前預告＝反制）：開鏡/光束共用線體視覺，durationMs 後自清。
  const drawRays = (angles: number[], durationMs: number, tint: number) => {
    rayGfx?.destroy();
    const gfx = scene.add.graphics().setDepth(58);
    gfx.lineStyle(3, tint, 0.7);
    for (const angle of angles) {
      gfx.lineBetween(
        body.x,
        body.y,
        body.x + Math.cos(angle) * RAY_LENGTH,
        body.y + Math.sin(angle) * RAY_LENGTH,
      );
    }
    rayGfx = gfx;
    scene.tweens.add({
      targets: gfx,
      alpha: { from: 0.25, to: 0.85 },
      duration: 220,
      yoyo: true,
      repeat: Math.max(0, Math.floor(durationMs / 440) - 1),
      onComplete: () => {
        if (rayGfx === gfx) rayGfx = null;
        gfx.destroy();
      },
    });
  };

  // 開鏡（主題）：telegraph 期先顯示固定反射射線（回彈方向提前可讀），窗內星彈命中
  // 生成沿線回彈；窗滿接閃光弱點窗（受擊 ×2）——風險與獎勵耦合。
  const doMirror = (windowMs: number, dualRay: boolean) => {
    const aimX = target?.x ?? arenaCx();
    const aimY = target?.y ?? GROUND_TOP - 30;
    const angle = Math.atan2(aimY - body.y, aimX - body.x);
    // EX 雙射線交錯（質性差分）：主射線＋水平鏡射線。
    rayAngles = dualRay ? [angle, Math.PI - angle] : [angle];
    drawRays(rayAngles, REFLECTOR.mirrorTelegraphMs + windowMs, 0xf0f4ff);
    playSfx('metal', 1.2);
    body.setTint(0xf0f4ff);
    delay(REFLECTOR.mirrorTelegraphMs + windowMs, () => {
      if (dying) return;
      // 閃光弱點窗：鏡光爆閃（真體露弱點——受擊 ×2 由 applyDamage 讀 FSM 窗）。
      body.clearTint();
      playSfx('reveal', 1.1);
      scene.cameras.main.flash(200, 240, 244, 255);
      scene.tweens.add({
        targets: fxScale,
        sx: 1.1,
        sy: 1.08,
        duration: 180,
        yoyo: true,
        repeat: Math.max(0, Math.floor(REFLECTOR.flashWindowMs / 360) - 1),
      });
    });
  };

  // 鏡面回彈生成（applyDamage 星彈命中時經 FSM 節流觸發）：沿固定射線、場上上限夾限。
  const spawnRebound = () => {
    if (aliveRebounds() >= REFLECTOR.reboundCap) return;
    for (const angle of rayAngles) {
      const bolt = spawnBolt(
        body.x,
        body.y,
        Math.cos(angle) * REBOUND_SPEED,
        Math.sin(angle) * REBOUND_SPEED,
        0xf0f4ff,
        18,
        18,
      );
      if (!bolt) continue;
      bolt.setData('rebound', true);
      bolt.setData('reboundUntil', elapsedMs + REBOUND_LIFE_MS);
    }
    playSfx('metal', 0.9);
  };

  // 假噗噗分身（§112.3 泛化多具）：玩家鏡影自 arena 中線鏡射位現身，
  // 雙掛 shields（1 發星彈即破）＋shockwaves（觸傷 1）。
  const doClone = (cap: number) => {
    spawnTelegraph(scene, arenaCx(), HOVER_Y - 60, REFLECTOR.cloneTelegraphMs);
    playSfx('reveal', 0.8);
    delay(REFLECTOR.cloneTelegraphMs, () => {
      if (dying) return;
      const alive = clones.filter((clone) => clone.active).length;
      for (let i = alive; i < cap; i += 1) {
        spawnCloneAt(i);
      }
    });
  };

  const spawnCloneAt = (slot: number) => {
    const player = hooks.playerPos();
    let clone = clones[slot];
    if (!clone) {
      const texture = scene.textures.exists('hero-idle') ? 'hero-idle' : 'fx-star';
      clone = scene.physics.add.sprite(arenaCx(), HOVER_Y, texture);
      clone.setDisplaySize(CLONE_SIZE, CLONE_SIZE);
      clone.setTint(CLONE_TINT).setAlpha(0.78).setDepth(56);
      clone.setData('shadow', true);
      const cloneBody = clone.body as Phaser.Physics.Arcade.Body;
      cloneBody.setAllowGravity(false);
      cloneBody.setSize(clone.width * 0.8, clone.height * 0.8);
      clones[slot] = clone;
    }
    if (!shockwaves.contains(clone)) {
      shockwaves.add(clone);
      shields.add(clone);
    }
    const spawnX = clampArenaX(
      shadowSpawnX(arenaCx(), player?.x ?? arenaCx()) + (slot - 0.5) * 90,
      40,
    );
    clone.enableBody(true, spawnX, player?.y ?? GROUND_TOP - 40, true, true);
    clone.setDisplaySize(CLONE_SIZE, CLONE_SIZE).setTint(CLONE_TINT).setAlpha(0.78);
    (clone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    cloneSpawnAt[slot] = scene.time.now;
  };

  // 全景反射（P3）：頂部三鏡板顯形 → 放射稜光彈幕，觸頂帶折返一次（遠場密度加倍
  // ＝近身輸出優勢）；鏡板僅折射自身彈幕，玩家星彈不受影響（anti-softlock）。
  const doPanorama = (count: number) => {
    playSfx('boss-roar', 0.6);
    panelUntilMs = elapsedMs + REFLECTOR.panoramaTelegraphMs + 2600;
    drawPanels();
    for (const ratio of [0.2, 0.5, 0.8]) {
      spawnTelegraph(scene, arenaX(ratio), PANEL_BAND_Y, REFLECTOR.panoramaTelegraphMs);
    }
    delay(REFLECTOR.panoramaTelegraphMs, () => {
      if (dying) return;
      playSfx('zap', 1.3);
      for (let i = 0; i < count; i += 1) {
        // 上半扇形放射：折返後覆蓋地面帶（重合直射不可讀，故僅上扇）。
        const angle = -Math.PI * (0.15 + (0.7 * i) / Math.max(1, count - 1));
        const bolt = spawnBolt(
          body.x,
          body.y - 20,
          Math.cos(angle) * SHARD_SPEED,
          Math.sin(angle) * SHARD_SPEED,
          0xd0b8ff,
          16,
          12,
        );
        bolt?.setData('refract', true);
      }
    });
  };

  const drawPanels = () => {
    panelGfx?.destroy();
    const gfx = scene.add.graphics().setDepth(57);
    gfx.fillStyle(0xf0f4ff, 0.35);
    for (const ratio of [0.2, 0.5, 0.8]) {
      gfx.fillRect(
        arenaX(ratio) - viewW() * 0.12,
        PANEL_BAND_Y - PANEL_H / 2,
        viewW() * 0.24,
        PANEL_H,
      );
    }
    panelGfx = gfx;
  };

  const runCommand = (command: ReflectorCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'beam':
        doBeam();
        return;
      case 'shard':
        doShard();
        return;
      case 'mirror':
        doMirror(command.windowMs, command.dualRay);
        return;
      case 'clone':
        doClone(command.cap);
        return;
      case 'panorama':
        doPanorama(command.count);
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  // 死亡冪等（§74 慣例）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    scene.tweens.killTweensOf(body);
    vscale.killFxTweens(body);
    rayGfx?.destroy();
    rayGfx = null;
    panelGfx?.destroy();
    panelGfx = null;
    projectiles.getMatching('active', true).forEach(killProjectile);
    for (const clone of clones) clone.disableBody(true, true);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: body.x, y: body.y });
    delay(600, () => {
      scene.tweens.add({ targets: fxScale, sx: 0, sy: 0, duration: 420, ease: 'Back.easeIn' });
      scene.tweens.add({ targets: body, alpha: 0, duration: 420, ease: 'Back.easeIn' });
    });
  };

  const applyDamageInternal = (amount: number, source?: BossDamageSource) => {
    if (!active) return;
    // 鏡面回彈（§123 主題）：開鏡窗內星彈命中→沿固定射線生成回彈（FSM 節流＋上限）。
    // anti-softlock 自證：回彈不影響下方 takeDamage 全額結算——基礎星彈恆有效。
    if (source === 'star' && fsm.tryRebound()) spawnRebound();
    // 閃光弱點窗（「鏡面閃光時露弱點」）：窗內受擊 ×2。
    const effective = fsm.isFlashWindow() ? amount * REFLECTOR.flashDamageMul : amount;
    for (const event of fsm.takeDamage(effective)) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          scene.tweens.add({ targets: body, angle: 3, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: effective,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          // 狂暴換裝（§17 慣例）：P2 起換 enraged 立繪（顯示尺寸重錨＋vscale 基準回寫）。
          if (event.phase === 'p2') {
            body.setTexture('boss-reflector-enraged').setDisplaySize(BODY_W, BODY_H);
            vscale.rebase(body);
            playSfx('boss-roar', 1.1);
            scene.cameras.main.flash(280, 220, 224, 255);
          } else if (event.phase === 'p3') {
            playSfx('boss-roar', 1.3);
            scene.cameras.main.flash(320, 200, 208, 255);
            scene.cameras.main.shake(200, 0.007);
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

  // 入場：館長自鏡光中降臨（鏡塔語彙——光束匯聚後現形）。
  const introDescend = () => {
    body.setPosition(arenaCx(), -BODY_H);
    scene.tweens.add({
      targets: body,
      y: HOVER_Y,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        playSfx('metal');
        scene.cameras.main.shake(120, 0.005);
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
            // 開鏡/閃光著色期讓位（窗期視覺優先）。
            if (fsm.isMirrorWindow() || fsm.isFlashWindow()) return;
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
        delay(INTRO_PUSH_MS * 0.5, introDescend);
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
      // 懸浮駕駛（§64 慣例）：正弦漂移錨點＋approachPoint 速度上限逼近。
      const anchorX = arenaCx() + Math.sin(elapsedMs * SWAY_FREQ) * viewW() * SWAY_AMP_RATIO;
      const anchorY = HOVER_Y + Math.sin(elapsedMs * BOB_FREQ) * BOB_AMP_PX;
      const next = approachPoint(
        { x: body.x, y: body.y },
        { x: anchorX, y: anchorY },
        APPROACH_SPEED * fsm.speedFactor,
        deltaMs,
      );
      body.setPosition(next.x, next.y);
      body.setFlipX((target?.x ?? body.x) < body.x);
      // 開鏡窗著色（EX 呼吸循環讓位見 introReset guard）。
      if (fsm.isMirrorWindow()) body.setTint(0xf0f4ff);
      // 分身驅動（§112.3）：水平反向移動＋垂直速度上限跟隨；壽命期滿消散。
      const player = hooks.playerPos();
      for (let i = 0; i < clones.length; i += 1) {
        const clone = clones[i];
        if (!clone?.active) continue;
        if (!shadowActive(cloneSpawnAt[i] ?? -1, scene.time.now)) {
          clone.disableBody(true, true);
          continue;
        }
        if (player) {
          const lastX = (clone.getData('lastPlayerX') as number | undefined) ?? player.x;
          clone.x = clampArenaX(stepShadowX(clone.x, player.x - lastX), 20);
          clone.y = stepShadowY(clone.y, player.y, deltaMs);
          clone.setData('lastPlayerX', player.x);
        }
        clone.setAlpha(0.6 + Math.sin(elapsedMs * 0.008 + i) * 0.18);
      }
      // 全景鏡板：招式期滿自清。
      if (panelGfx && elapsedMs >= panelUntilMs) {
        panelGfx.destroy();
        panelGfx = null;
      }
      // 彈體驅動：折返（refract 一次）、回彈壽命（§56 逾時必回收）、出界回收。
      projectiles.getMatching('active', true).forEach((obj) => {
        const bolt = obj as Phaser.Physics.Arcade.Sprite;
        const boltBody = bolt.body as Phaser.Physics.Arcade.Body;
        if (bolt.getData('refract') === true && bolt.y <= PANEL_BAND_Y) {
          // 鏡板折返一次：垂直反向（折射語彙），第二次觸帶不再折返。
          bolt.setData('refract', false);
          boltBody.setVelocity(boltBody.velocity.x, Math.abs(boltBody.velocity.y));
          bolt.setTint(0xf0f4ff);
          playSfx('metal', 0.5);
        }
        if (
          bolt.getData('rebound') === true &&
          elapsedMs >= ((bolt.getData('reboundUntil') as number) ?? 0)
        ) {
          killProjectile(bolt);
          return;
        }
        if (
          bolt.y > GROUND_TOP + 40 ||
          bolt.y < -60 ||
          bolt.x < arenaLeft() - 80 ||
          bolt.x > arenaLeft() + viewW() + 80
        ) {
          killProjectile(bolt);
        }
      });
    },
    destroy() {
      timers.forEach((timer) => timer.remove(false));
      scene.tweens.killTweensOf(body);
      vscale.unregister(body);
      body.destroy();
      rayGfx?.destroy();
      panelGfx?.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
      shields.destroy(true);
      for (const clone of clones) clone.destroy();
    },
    isActive() {
      return active;
    },
    // 頭頂 hit window（§58）：下砸命中頭頂觸發短暈（近身窗反制之一）。
    trySlamStun() {
      if (!active || dying) return false;
      const stunned = fsm.stun(REFLECTOR.slamStunMs);
      if (stunned) {
        scene.tweens.add({ targets: body, angle: -10, duration: 120, yoyo: true, repeat: 2 });
      }
      return stunned;
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
    // 分身屏障（§112.3 工程接點）：1 發星彈即破走既有 shields 管線。
    getShields() {
      return shields;
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
