import Phaser from 'phaser';
import { acquirePooled } from '../core/poolFlags';
import { VIEW } from '../core/config';
import { GameEvents, emitGameEvent } from '../core/events';
import type { TransformForm } from '../core/types';
import { approachPoint } from '../logic/noctraFlight';
import {
  GRAVION,
  blackholePull,
  createGravionFsm,
  type GravionCommand,
  type GravityDirection,
} from '../logic/gravionFsm';
import { playSfx } from '../audio/sfx';
import type { BossDamageSource, BossHandle } from './boss';
import { createBossStagecraft, preloadBossStagecraft } from './bossStagecraft';
import { ensureFxTextures, spawnTelegraph } from './fx';
import { getVisualScale } from './visualScale';

// 引力侯爵 Gravion 呈現層（GAME_DESIGN §123）：與 boss/noctra/prismix/syrona/voidra
// 共用 BossHandle。懸浮引力型：侯爵懸浮於中高帶（approachPoint 逼近錨點，§64 慣例
// 禁座標直寫），威脅來自重力切換（全場方向力場——箭頭預告、位移力非傷害）、軌道
// 星體（可擊破屏障公轉）與黑洞壓縮（側牆＋中央黑洞彎折星彈）；phase truth 由
// logic/gravionFsm.ts 持有。arena 幾何全數依動態視寬比例佈建（§28 禁硬編 854）。

const GROUND_TOP = VIEW.height - 80;
const BODY_W = 150;
const BODY_H = 140;
// 懸浮帶：單跳星彈可打帶（§63 慣例）；玩家亦可自底下走過。
const HOVER_Y = 250;
const APPROACH_SPEED = 300;
const SWAY_FREQ = 0.0005;
const SWAY_AMP_RATIO = 0.12;
const BOB_FREQ = 0.002;
const BOB_AMP_PX = 10;
const VOID_TINT = 0x8a6ae0;
const DEEP_TINT = 0x5a48a8;
// 蝕星彈：瞄準彈與放射彈幕共用彈體。
const BOLT_SPEED = 240;
const RING_SPEED = 185;
// 軌道星體：黑色星體視覺尺寸（公轉幾何常數取 gravionFsm SSOT）。
const ORB_SIZE = 34;
// 黑洞壓縮側牆：滑入/退場時長。
const WALL_SLIDE_MS = 600;
// 中央黑洞（P3 常駐）：視覺錨位（高帶——平射星彈帶僅邊緣受彎，近身輸出照常）。
const HOLE_Y = 130;
// 重力場地面帶判定（down 向僅對空中玩家有感；貼地由地面 collider 吸收）。
const AIRBORNE_MAX_Y = 350;

// 入場運鏡（§17 慣例）：黑幕淡入 → 推近黑洞外環 → 侯爵自虛空滑入 → 咆哮 → 復位開戰。
const INTRO_FADE_MS = 280;
const INTRO_PUSH_MS = 1200;
const INTRO_ZOOM = 1.42;
const INTRO_ROAR_MS = 820;
const INTRO_RESET_MS = 550;
const INTRO_FADE_RGB = [18, 14, 34] as const;

// 佔位材質：正式 sprite 缺件時以虛空紫圓體烘焙保底（同 boss.ts 慣例）。
function ensureTextures(scene: Phaser.Scene): void {
  const bake = (key: string, color: number, w: number, h: number): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  bake('boss-gravion', VOID_TINT, BODY_W, BODY_H);
  bake('boss-gravion-enraged', DEEP_TINT, BODY_W, BODY_H);
  if (!scene.textures.exists('gravion-orb')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2a2438, 1);
    g.fillCircle(ORB_SIZE / 2, ORB_SIZE / 2, ORB_SIZE / 2 - 1);
    g.lineStyle(3, 0x8a6ae0, 0.9);
    g.strokeCircle(ORB_SIZE / 2, ORB_SIZE / 2, ORB_SIZE / 2 - 2);
    g.generateTexture('gravion-orb', ORB_SIZE, ORB_SIZE);
    g.destroy();
  }
}

export interface GravionHooks {
  // 中央黑洞彎折（§123 P3）：玩家星彈群由 GameScene 的 player 供給——域內長彈道
  // 被吸偏（近身/中距輸出不受影響）。
  playerStars(): Phaser.Physics.Arcade.Group;
  // 引力化抗性（§119 gravityFlipImmune W3 消費）：重力切換力場對引力化免效；
  // 形態真值由 player 單點供給。
  playerForm(): TransformForm | null;
}

export interface GravionOptions {
  ex?: boolean;
  // 前室魔王關（§69）：arena 左緣由 GameScene 注入（前室寬），佈局禁硬編視寬。
  arenaLeft(): number;
}

export function createGravion(
  scene: Phaser.Scene,
  hooks: GravionHooks,
  options: GravionOptions,
): BossHandle {
  ensureTextures(scene);
  ensureFxTextures(scene);

  const ex = options.ex === true;
  const fsm = createGravionFsm({ ex });
  const minionHandlers: (() => void)[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  let active = false;
  let dying = false;
  let target: { x: number; y: number } | null = null;
  let elapsedMs = 0;
  // 重力切換力場：方向與迄點；telegraph 期不施力（箭頭先行，切換瞬間不得直接命中）。
  let fieldDirection: GravityDirection | null = null;
  let fieldUntilMs = 0;
  // 軌道星體公轉相位（星體本體掛 shields 群組，位置由本相位逐幀導出）。
  let orbAngleBase = 0;
  // 中央黑洞（P3 常駐）視覺。
  let holeGfx: Phaser.GameObjects.Container | null = null;

  const viewW = () => scene.scale.width;
  const arenaLeft = () => options.arenaLeft();
  const arenaX = (ratio: number) => arenaLeft() + viewW() * ratio;
  const arenaCx = () => arenaLeft() + viewW() / 2;

  const body = scene.physics.add.sprite(arenaCx(), -BODY_H, 'boss-gravion');
  body.setDisplaySize(BODY_W, BODY_H);
  // 物理/視覺縮放解耦（§77 根治）：脈動/死亡收縮走 fx 代理，物理箱恆為基準。
  const vscale = getVisualScale(scene);
  vscale.register(body);
  const fxScale = vscale.fx(body);
  const physBody = body.body as Phaser.Physics.Arcade.Body;
  physBody.setAllowGravity(false);
  physBody.setImmovable(true);
  physBody.setSize(body.width * 0.85, body.height * 0.85);

  // 動畫組背景補載＋演出件（§127）：前室廊道即補載窗口，缺圖以 base 立繪降級。
  preloadBossStagecraft(scene, 'gravion');
  const stagecraft = createBossStagecraft(scene, body, {
    kind: 'gravion',
    bodyW: BODY_W,
    bodyH: BODY_H,
  });

  const projectiles = scene.physics.add.group({ maxSize: 24, allowGravity: false });
  const shockwaves = scene.physics.add.group({ maxSize: 10, allowGravity: false });
  // 軌道星體（§123）：可擊破星彈屏障走既有 shields 管線（§68 碎晶盾同構），
  // 觸傷由呈現層雙掛 shockwaves。
  const shields = scene.physics.add.group({ maxSize: 8, allowGravity: false });

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

  const spawnBolt = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    tint: number,
  ): Phaser.Physics.Arcade.Sprite | null => {
    const bolt = acquirePooled(projectiles, x, y, 'fx-star');
    if (!bolt) return null;
    bolt.enableBody(true, x, y, true, true);
    bolt.setTexture('fx-star');
    bolt.setDisplaySize(18, 18);
    bolt.setTint(tint);
    bolt.setAlpha(0.95);
    bolt.setRotation(Math.atan2(vy, vx));
    const boltBody = bolt.body as Phaser.Physics.Arcade.Body;
    boltBody.setAllowGravity(false);
    boltBody.setVelocity(vx, vy);
    return bolt;
  };

  // 重力切換（主題）：場景箭頭預告 telegraph → 全場方向力場（位移力非傷害——
  // 切換瞬間不得直接命中不變式由「力場零傷害」承擔）。
  const doGswitch = (direction: GravityDirection, fieldMs: number) => {
    playSfx('boss-roar', 0.5);
    drawDirectionArrows(direction);
    delay(GRAVION.gswitchTelegraphMs, () => {
      if (dying) return;
      playSfx('zap', 0.7);
      fieldDirection = direction;
      fieldUntilMs = elapsedMs + fieldMs;
      scene.cameras.main.shake(140, 0.004);
    });
  };

  // 方向箭頭預告：沿力場方向漂移的三枚箭頭（telegraph 期滿自毀）。
  const drawDirectionArrows = (direction: GravityDirection) => {
    const angle =
      direction === 'left'
        ? Math.PI
        : direction === 'right'
          ? 0
          : direction === 'up'
            ? -Math.PI / 2
            : Math.PI / 2;
    for (const ratio of [0.3, 0.5, 0.7]) {
      const arrow = scene.add
        .triangle(arenaX(ratio), 210, 0, -14, 22, 0, 0, 14, 0xb09ae8, 0.9)
        .setDepth(58)
        .setRotation(angle);
      scene.tweens.add({
        targets: arrow,
        x: arrow.x + Math.cos(angle) * 60,
        y: arrow.y + Math.sin(angle) * 60,
        alpha: { from: 0.4, to: 1 },
        duration: GRAVION.gswitchTelegraphMs / 2,
        yoyo: true,
        onComplete: () => arrow.destroy(),
      });
    }
  };

  // 蝕星彈（P1/P2）：鎖定玩家位置三連射（發射時各自取樣，非追蹤）。
  const doOrbshot = () => {
    flashWhite();
    spawnTelegraph(scene, body.x, body.y + BODY_H * 0.4, GRAVION.orbshotTelegraphMs);
    delay(GRAVION.orbshotTelegraphMs, () => {
      if (dying) return;
      for (let i = 0; i < 3; i += 1) {
        delay(i * 200, () => {
          if (dying) return;
          const aimX = target?.x ?? arenaCx();
          const aimY = target?.y ?? GROUND_TOP - 30;
          const angle = Math.atan2(aimY - body.y, aimX - body.x);
          playSfx('pop', 0.8);
          spawnBolt(
            body.x,
            body.y,
            Math.cos(angle) * BOLT_SPEED,
            Math.sin(angle) * BOLT_SPEED,
            0x8a6ae0,
          );
        });
      }
    });
  };

  // 場上存活軌道星體數。
  const aliveOrbs = (): number => shields.countActive(true);

  // 軌道星體（P2）：telegraph 後補滿至上限——黑色星體繞侯爵公轉（旋轉間隙可讀），
  // 星彈可擊破（shields 管線）＋觸傷（shockwaves 雙掛）。
  const doOrbit = (cap: number) => {
    spawnTelegraph(scene, body.x, body.y - BODY_H * 0.5, GRAVION.orbitTelegraphMs);
    playSfx('reveal', 0.7);
    delay(GRAVION.orbitTelegraphMs, () => {
      if (dying) return;
      const missing = cap - aliveOrbs();
      for (let i = 0; i < missing; i += 1) {
        const orb = acquirePooled(shields, body.x, body.y, 'gravion-orb');
        if (!orb) continue;
        orb.enableBody(true, body.x, body.y, true, true);
        orb.setTexture('gravion-orb');
        orb.setDisplaySize(ORB_SIZE, ORB_SIZE);
        orb.setAlpha(0.95);
        // 公轉槽位相位：均分圓周（間隙恆定可讀）。
        orb.setData('orbSlot', findFreeOrbSlot());
        if (!shockwaves.contains(orb)) shockwaves.add(orb);
        (orb.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      }
      playSfx('metal', 0.8);
    });
  };

  // 空槽位：均分 orbCap 個槽，取未被存活星體占用的最小槽。
  const findFreeOrbSlot = (): number => {
    const used = new Set<number>();
    for (const child of shields.getChildren()) {
      if (child.active)
        used.add((child as Phaser.Physics.Arcade.Sprite).getData('orbSlot') as number);
    }
    for (let slot = 0; slot < fsm.orbCap; slot += 1) {
      if (!used.has(slot)) return slot;
    }
    return 0;
  };

  // 黑洞壓縮（P3）：雙側牆滑入（各覆蓋 crushWallRatio，中央走廊恆開 anti-softlock）
  // → 駐留 → 退場；牆體觸傷走 shockwaves 管線。
  const doCrush = (holdMs: number) => {
    playSfx('boss-slam', 0.6);
    const wallW = viewW() * GRAVION.crushWallRatio;
    for (const side of [-1, 1] as const) {
      const startX = side < 0 ? arenaLeft() - wallW / 2 : arenaLeft() + viewW() + wallW / 2;
      const goalX = side < 0 ? arenaLeft() + wallW / 2 : arenaLeft() + viewW() - wallW / 2;
      spawnTelegraph(scene, goalX, GROUND_TOP - 60, GRAVION.crushTelegraphMs);
      delay(GRAVION.crushTelegraphMs, () => {
        if (dying) return;
        const wall = acquirePooled(shockwaves, startX, VIEW.height / 2, '__WHITE');
        if (!wall) return;
        wall.enableBody(true, startX, VIEW.height / 2, true, true);
        wall.setDisplaySize(wallW, VIEW.height).setTint(0x2a2438).setAlpha(0.82);
        (wall.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        playSfx('metal', 0.9);
        scene.tweens.add({
          targets: wall,
          x: goalX,
          duration: WALL_SLIDE_MS,
          ease: 'Sine.easeIn',
          onComplete: () => {
            scene.cameras.main.shake(90, 0.004);
            delay(holdMs, () => {
              if (!wall.active) return;
              scene.tweens.add({
                targets: wall,
                x: startX,
                duration: WALL_SLIDE_MS,
                ease: 'Sine.easeIn',
                onComplete: () => wall.disableBody(true, true),
              });
            });
          },
        });
      });
    }
  };

  // 蝕星彈幕（P3）：全向放射彈環。
  const doBarrage = (count: number) => {
    flashWhite();
    spawnTelegraph(scene, body.x, body.y, GRAVION.barrageTelegraphMs);
    delay(GRAVION.barrageTelegraphMs, () => {
      if (dying) return;
      playSfx('zap', 1.2);
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count;
        spawnBolt(
          body.x,
          body.y,
          Math.cos(angle) * RING_SPEED,
          Math.sin(angle) * RING_SPEED,
          0xb09ae8,
        );
      }
    });
  };

  // 三招分鏡映射（§127）：本體發招類接 move 幀組（orbshot/orbit 為星體軌道機制，
  // 沿用既有 telegraph 演出）；分鏡窗＝該招既有 telegraph 時長，時序零改變。
  const runCommand = (command: GravionCommand) => {
    switch (command.kind) {
      case 'idle':
        return;
      case 'gswitch':
        stagecraft.moveCinematic(1, GRAVION.gswitchTelegraphMs);
        doGswitch(command.direction, command.fieldMs);
        return;
      case 'orbshot':
        doOrbshot();
        return;
      case 'orbit':
        doOrbit(command.cap);
        return;
      case 'crush':
        stagecraft.moveCinematic(2, GRAVION.crushTelegraphMs);
        doCrush(command.holdMs);
        return;
      case 'barrage':
        stagecraft.moveCinematic(3, GRAVION.barrageTelegraphMs);
        doBarrage(command.count);
        return;
      default: {
        const unhandled: never = command;
        throw new Error(`未知指令：${String(unhandled)}`);
      }
    }
  };

  // 中央黑洞（P3 常駐）：暗核＋吸積環視覺；彎折玩家星彈於 update 逐幀結算。
  const spawnBlackhole = () => {
    if (holeGfx) return;
    const core = scene.add.circle(0, 0, 26, 0x14101f, 1);
    const ringA = scene.add.circle(0, 0, 40, 0x8a6ae0, 0).setStrokeStyle(3, 0x8a6ae0, 0.8);
    const ringB = scene.add.circle(0, 0, 54, 0xb09ae8, 0).setStrokeStyle(2, 0xb09ae8, 0.5);
    holeGfx = scene.add.container(arenaCx(), HOLE_Y, [ringB, ringA, core]).setDepth(57);
    scene.tweens.add({
      targets: [ringA, ringB],
      scale: { from: 0.85, to: 1.1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  };

  // 死亡冪等（§74 慣例）：defeated 由 FSM 單向鎖存，本序列僅執行一次。
  const dieSequence = () => {
    dying = true;
    active = false;
    fieldDirection = null;
    stagecraft.playDeath();
    scene.tweens.killTweensOf(body);
    vscale.killFxTweens(body);
    holeGfx?.destroy();
    holeGfx = null;
    projectiles.getMatching('active', true).forEach(killProjectile);
    shockwaves.getMatching('active', true).forEach(killProjectile);
    shields.getMatching('active', true).forEach(killProjectile);
    emitGameEvent(scene.events, GameEvents.BOSS_DEFEATED, { x: body.x, y: body.y });
    delay(600, () => {
      scene.tweens.add({ targets: fxScale, sx: 0, sy: 0, duration: 420, ease: 'Back.easeIn' });
      scene.tweens.add({ targets: body, alpha: 0, duration: 420, ease: 'Back.easeIn' });
    });
  };

  const applyDamageInternal = (amount: number, source?: BossDamageSource) => {
    if (!active) return;
    void source;
    for (const event of fsm.takeDamage(amount)) {
      switch (event.kind) {
        case 'damaged':
          flashWhite();
          stagecraft.hitFlash();
          scene.tweens.add({ targets: body, angle: 3, duration: 45, yoyo: true, repeat: 2 });
          emitGameEvent(scene.events, GameEvents.BOSS_DAMAGED, {
            hp: event.hp,
            maxHp: fsm.maxHp,
            damage: amount,
          });
          break;
        case 'phase':
          emitGameEvent(scene.events, GameEvents.BOSS_PHASE, { phase: event.phase });
          // 狂暴轉段（§17/§127）：P2 播轉段幀序後落 enraged（換裝語義不變，
          // 顯示尺寸與 vscale 基準由 stagecraft 換幀單點回寫）；P3 黑洞常駐顯形。
          if (event.phase === 'p2') {
            stagecraft.phaseTransition('p2');
            playSfx('boss-roar', 1.1);
            scene.cameras.main.flash(280, 170, 150, 230);
          } else if (event.phase === 'p3') {
            stagecraft.phaseTransition('p3');
            playSfx('boss-roar', 1.3);
            scene.cameras.main.flash(320, 140, 120, 220);
            scene.cameras.main.shake(200, 0.007);
            spawnBlackhole();
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

  // 入場：侯爵自上方虛空滑入（黑洞外環語彙——星體下沉降臨）；
  // entry 四幀鋪在既有節拍（下沉→定位→咆哮→起勢），時序零改變（§127）。
  const introDescend = () => {
    stagecraft.entryFrame(1);
    body.setPosition(arenaCx(), -BODY_H);
    scene.tweens.add({
      targets: body,
      y: HOVER_Y,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        stagecraft.entryFrame(2);
        playSfx('boss-slam');
        scene.cameras.main.shake(120, 0.006);
        introRoar();
      },
    });
  };

  const introRoar = () => {
    stagecraft.entryFrame(3);
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
    stagecraft.entryFrame(4);
    const cam = scene.cameras.main;
    cam.pan(arenaCx(), VIEW.height / 2, INTRO_RESET_MS, 'Sine.easeInOut');
    cam.zoomTo(1, INTRO_RESET_MS, 'Sine.easeInOut');
    delay(INTRO_RESET_MS, () => {
      active = true;
      stagecraft.endEntry();
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
        delay(INTRO_PUSH_MS * 0.5, introDescend);
      });
    },
    applyDamage(amount: number, source?: BossDamageSource) {
      applyDamageInternal(amount, source);
    },
    update(deltaMs: number) {
      if (!active || dying) return;
      elapsedMs += deltaMs;
      stagecraft.idleBreath(deltaMs);
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
      // 重力切換力場結算：全場 positional drift（恆低於玩家全速，交叉不變式 16）；
      // 引力化抗性免效（§119 gravityFlipImmune W3 消費）。
      if (fieldDirection && elapsedMs < fieldUntilMs) {
        if (target && hooks.playerForm() !== 'gravity') {
          const step = GRAVION.gswitchDriftPxPerSec * (deltaMs / 1000);
          if (fieldDirection === 'left') target.x -= step;
          else if (fieldDirection === 'right') target.x += step;
          else if (fieldDirection === 'up' && target.y > GRAVION.gswitchLiftTopY) {
            target.y -= step;
          } else if (fieldDirection === 'down' && target.y < AIRBORNE_MAX_Y) {
            target.y += step;
          }
        }
      } else {
        fieldDirection = null;
      }
      // 軌道星體公轉：相位推進＋槽位均分（位置導出寫入——星體為屏障非自主體）。
      orbAngleBase += deltaMs * GRAVION.orbAngularPerMs * fsm.speedFactor;
      const orbTotal = fsm.orbCap;
      for (const child of shields.getChildren()) {
        if (!child.active) continue;
        const orb = child as Phaser.Physics.Arcade.Sprite;
        const slot = (orb.getData('orbSlot') as number) ?? 0;
        const angle = orbAngleBase + (Math.PI * 2 * slot) / orbTotal;
        orb.setPosition(
          body.x + Math.cos(angle) * GRAVION.orbRadiusPx,
          body.y + Math.sin(angle) * GRAVION.orbRadiusPx,
        );
        orb.setRotation(angle);
      }
      // 中央黑洞（P3）：彎折玩家飛行中星彈（域內長彈道吸偏；近身/中距不受影響）。
      if (holeGfx) {
        const holeX = holeGfx.x;
        const holeY = holeGfx.y;
        for (const child of hooks.playerStars().getChildren()) {
          if (!child.active) continue;
          const star = child as Phaser.Physics.Arcade.Sprite;
          const starBody = star.body as Phaser.Physics.Arcade.Body;
          const bent = blackholePull(
            star.x,
            star.y,
            starBody.velocity.x,
            starBody.velocity.y,
            holeX,
            holeY,
            deltaMs,
          );
          starBody.setVelocity(bent.vx, bent.vy);
        }
      }
      // 彈體出界回收（§56）。
      projectiles.getMatching('active', true).forEach((obj) => {
        const bolt = obj as Phaser.Physics.Arcade.Sprite;
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
      stagecraft.destroy();
      scene.tweens.killTweensOf(body);
      vscale.unregister(body);
      body.destroy();
      holeGfx?.destroy();
      projectiles.destroy(true);
      shockwaves.destroy(true);
      shields.destroy(true);
    },
    isActive() {
      return active;
    },
    // 懸浮場控型免暈（§74 慣例）：下砸命中僅回彈免體傷（FSM 恆回 false）。
    trySlamStun() {
      if (!active || dying) return false;
      return fsm.stun(0);
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
    // 軌道星體屏障（§68 碎晶盾同構）：星彈擊破走既有 shields 管線。
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
